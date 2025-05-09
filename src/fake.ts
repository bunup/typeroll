import oxc, {
    type Node,
    type Directive,
    type ExpressionStatement,
    type Statement,
} from "oxc-parser";
import { isolatedDeclaration } from "oxc-transform";
import {
    getName,
    hasDefaultExportModifier,
    hasExportModifier,
    isDefaultReExport,
    isExportAllDeclaration,
    isImportDeclaration,
    isReExportStatement,
} from "./ast";

function dtsToFakeJs(dtsContent: string): string {
    const parseResult = oxc.parseSync("temp.d.ts", dtsContent, {
        sourceType: "module",
        lang: "ts",
    });

    const program = parseResult.program;
    const prevNames = new Set<string>();
    const result = [];

    for (const statement of program.body) {
        let statementText = dtsContent.substring(
            statement.start,
            statement.end,
        );

        const name = getName(statement, dtsContent);

        if (name) {
            prevNames.add(name);
        }

        const isDefaultExport = hasDefaultExportModifier(
            statement,
            statementText,
        );
        const isExported = hasExportModifier(statement, statementText);

        if (isDefaultExport) {
            result.push(`export { ${name} as default };`);
            if (isDefaultReExport(statement)) {
                continue;
            }
        }

        if (
            isImportDeclaration(statement) ||
            isExportAllDeclaration(statement) ||
            isReExportStatement(statement)
        ) {
            result.push(jsifyImportExport(statement, dtsContent));
            continue;
        }

        if (isExported) {
            statementText = statementText
                .replace(/\bexport\s+default\s+/g, "")
                .replace(/\bexport\s+/g, "");
        }

        const tokens = tokenizeText(statementText, prevNames);

        const exportPrefix = isExported && !isDefaultExport ? "export " : "";
        result.push(`${exportPrefix}var ${name} = [${tokens.join(", ")}];`);
    }

    return result.join("\n");
}

function fakeJsToDts(fakeJsContent: string): string {
    const parseResult = oxc.parseSync("temp.js", fakeJsContent, {
        sourceType: "module",
        lang: "js",
    });

    const program = parseResult.program;
    const resultParts = [];

    for (const node of program.body) {
        if (
            isImportDeclaration(node) ||
            isExportAllDeclaration(node) ||
            isReExportStatement(node)
        ) {
            resultParts.push(
                fakeJsContent.substring(node.start, node.end).trim(),
            );
            continue;
        }

        if (node.type === "ExpressionStatement") {
            const namespaceDecl = handleNamespace(node);
            if (namespaceDecl) {
                resultParts.push(namespaceDecl);
                continue;
            }
        }

        if (node.type === "VariableDeclaration") {
            for (const declaration of node.declarations) {
                if (declaration.init?.type === "ArrayExpression") {
                    const dtsContent = processTokenArray(declaration.init);
                    if (dtsContent) {
                        resultParts.push(dtsContent);
                    }
                }
            }
        }
    }

    return isolatedDeclaration("final.d.ts", resultParts.join("\n")).code;
}

function jsifyImportExport(
    node: Directive | Statement,
    source: string,
): string {
    const text = source.substring(node.start, node.end);
    return text
        .replace(/import\s+type\s+/g, "import ")
        .replace(/export\s+type\s+/g, "export ")
        .replace(
            /(import|export)\s*{([^}]*)}/g,
            (_, keyword, names) =>
                `${keyword} {${names.replace(/type\s+/g, "")}}`,
        );
}

function tokenizeText(text: string, prevNames: Set<string>): string[] {
    const tokens = [];
    const tokenRegex =
        /(\s+|\/\/.*?(?:\n|$)|\/\*[\s\S]*?\*\/|[a-zA-Z_$][a-zA-Z0-9_$]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[(){}\[\],.;:]|=>|&&|\|\||[=!<>]=?|\+\+|--|[-+*/%&|^!~?]|\.{3}|::|\.)/g;

    let match: RegExpExecArray | null;
    while (true) {
        match = tokenRegex.exec(text);
        if (match === null) break;

        const token = match[0];

        if (/^[A-Z]/.test(token) || prevNames.has(token)) {
            tokens.push(token);
        } else {
            const processedToken = token
                .replace(/\n/g, "\\n")
                .replace(/\t/g, "\\t");
            tokens.push(JSON.stringify(processedToken));
        }
    }

    return tokens;
}

function processTokenArray(arrayLiteral: Node): string | null {
    if (arrayLiteral.type !== "ArrayExpression") {
        return null;
    }

    const tokens = [];

    for (const element of arrayLiteral.elements) {
        if (element?.type === "Literal" && typeof element.value === "string") {
            const processedValue = element.value
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\r/g, "\r");
            tokens.push(processedValue);
        } else if (element?.type === "Identifier") {
            tokens.push(element.name);
        }
    }

    return tokens.join("");
}

function handleNamespace(stmt: Directive | ExpressionStatement): string | null {
    const expr = stmt.expression;

    if (
        !expr ||
        expr.type !== "CallExpression" ||
        expr.callee?.type !== "Identifier" ||
        expr.callee.name !== "__export" ||
        expr.arguments?.length !== 2 ||
        expr.arguments[0].type !== "Identifier" ||
        expr.arguments[1].type !== "ObjectExpression"
    ) {
        return null;
    }

    const namespaceName = expr.arguments[0].name;
    const properties = expr.arguments[1].properties
        .filter((prop) => prop.type === "Property")
        .map((prop) => (prop.key?.type === "Identifier" ? prop.key.name : null))
        .filter(Boolean);

    if (properties.length === 0) {
        return null;
    }

    return `declare namespace ${namespaceName} {\n  export { ${properties.join(", ")} };\n}`;
}

export { dtsToFakeJs, fakeJsToDts };
