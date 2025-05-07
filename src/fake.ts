import { parseSync } from "oxc-parser";
import type {
    Declaration,
    Directive,
    ExportDefaultDeclaration,
    ExportNamedDeclaration,
    ExpressionStatement,
    Node,
    Statement,
} from "oxc-parser";
import { isolatedDeclaration } from "oxc-transform";

const DUMMY_DTS_PATH = "file.d.ts";
const DUMMY_JS_PATH = "file.js";
const builtInTypes: Set<string> = new Set([
    "string",
    "number",
    "boolean",
    "any",
    "unknown",
    "never",
    "object",
    "void",
    "undefined",
    "null",
    "this",
    "true",
    "false",
    "bigint",
    "symbol",
    "Promise",
    "Record",
    "Array",
    "ReadonlyArray",
    "Map",
    "Set",
    "Date",
    "RegExp",
    "Function",
    "Error",
]);

export function dtsToFakeJs(content: string): string {
    try {
        const { program } = parseSync(DUMMY_DTS_PATH, content, { lang: "ts" });
        return program.body
            .map((node) => {
                if (
                    node.type === "ImportDeclaration" ||
                    node.type === "ExportAllDeclaration" ||
                    (node.type === "ExportNamedDeclaration" &&
                        !node.declaration)
                )
                    return jsifyImportExport(node, content);
                return convertDeclarationToFakeJs(node, content);
            })
            .filter(Boolean)
            .join("\n\n");
    } catch (error) {
        console.error("Error parsing .d.ts:", error);
        return "";
    }
}

export function fakeJsToDts(content: string): string {
    try {
        const { program } = parseSync(DUMMY_JS_PATH, content, { lang: "ts" });
        const fragments = program.body
            .map((stmt) => {
                if (
                    stmt.type === "ImportDeclaration" ||
                    stmt.type === "ExportAllDeclaration" ||
                    (stmt.type === "ExportNamedDeclaration" &&
                        (!stmt.declaration ||
                            stmt.declaration.type !== "VariableDeclaration"))
                )
                    return content.substring(stmt.start, stmt.end);

                if (stmt.type === "ExpressionStatement") {
                    const namespaceDecl = handleNamespace(stmt);
                    if (namespaceDecl) return namespaceDecl;
                }

                return extractOriginalDeclaration(stmt);
            })
            .filter(Boolean);

        return isolatedDeclaration(DUMMY_JS_PATH, fragments.join("\n").trim())
            .code;
    } catch (error) {
        console.error("Error parsing JS:", error);
        return "";
    }
}

function jsifyImportExport(node: Directive | Statement, source: string) {
    const text = source.substring(node.start, node.end);
    return text
        .replace(/import\s+type\s+/g, "import ")
        .replace(/export\s+type\s+/g, "export ")
        .replace(
            /(import|export)\s*{([^}]*)}/g,
            (_, kw, names) => `${kw} {${names.replace(/type\s+/g, "")}}`,
        );
}

function convertDeclarationToFakeJs(
    node: Directive | Statement,
    source: string,
) {
    const nodeText = source.substring(node.start, node.end);
    const escapedText = escapeString(removeExport(nodeText));
    const name = getName(node, source);
    const refs = name ? getTypesReferences(node, name) : [];
    const isDefault = isDefaultExported(node);
    const exportPrefix = isExported(node) && !isDefault ? "export " : "";
    const varName = name || `__decl_${Math.random().toString(36).slice(2, 8)}`;

    const declaration = `${exportPrefix}var ${varName} = ["${escapedText}"${refs.length ? `, ${refs.join(", ")}` : ""}];`;

    return isDefault && name
        ? `${declaration}\nexport { ${name} as default };`
        : declaration;
}

function handleNamespace(stmt: Directive | ExpressionStatement) {
    const expr = stmt.expression;
    if (
        expr?.type === "CallExpression" &&
        expr.callee?.type === "Identifier" &&
        expr.callee.name === "__export" &&
        expr.arguments?.length === 2 &&
        expr.arguments[0].type === "Identifier" &&
        expr.arguments[1].type === "ObjectExpression"
    ) {
        const namespaceName = expr.arguments[0].name;
        const properties = expr.arguments[1].properties
            .filter((prop) => prop.type === "Property")
            .map((prop) =>
                prop.key?.type === "Identifier" ? prop.key.name : null,
            )
            .filter(Boolean);

        if (properties.length)
            return `declare namespace ${namespaceName} {\n  export { ${properties.join(", ")} };\n}`;
    }
    return null;
}

function extractOriginalDeclaration(statement: Directive | Statement) {
    const finalStatement =
        statement.type === "ExportNamedDeclaration" && statement.declaration
            ? statement.declaration
            : statement;

    if (finalStatement.type === "VariableDeclaration") {
        for (const decl of finalStatement.declarations) {
            const init = decl.init;
            if (
                !init ||
                init.type !== "ArrayExpression" ||
                !init.elements?.length
            )
                continue;

            const element = init.elements[0];
            if (!element) continue;

            if (element.type === "Literal" && typeof element.value === "string")
                return element.value;

            if (
                element.type === "TemplateLiteral" &&
                element.quasis?.length > 0
            )
                return (
                    element.quasis[0].value.raw ||
                    element.quasis[0].value.cooked
                );
        }
    }
    return null;
}

function escapeString(str: string): string {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

function removeExport(text: string): string {
    return text.replace(/export\s+default\s+/, "").replace(/export\s+/, "");
}

function getName(
    node:
        | Directive
        | Statement
        | ExportDefaultDeclaration
        | ExportNamedDeclaration
        | Declaration,
    source: string,
): string | null {
    if (!node) return null;

    if (node.type === "ExportNamedDeclaration" && node.declaration)
        return getName(node.declaration as Declaration, source);

    if (node.type === "ExportDefaultDeclaration" && node.declaration) {
        if (node.declaration.type === "Identifier")
            return node.declaration.name;
        return getName(node.declaration as Declaration, source);
    }

    switch (node.type) {
        case "TSInterfaceDeclaration":
        case "TSTypeAliasDeclaration":
        case "ClassDeclaration":
        case "TSEnumDeclaration":
        case "FunctionDeclaration":
        case "TSDeclareFunction":
            if (node.id && node.id.type === "Identifier") return node.id.name;
            break;

        case "TSModuleDeclaration":
            if (node.id) {
                if (node.id.type === "Identifier") return node.id.name;
                if (
                    node.id.type === "Literal" &&
                    typeof node.id.value === "string"
                )
                    return node.id.value;
            }
            break;

        case "VariableDeclaration": {
            const decls = node.declarations;
            if (
                decls &&
                decls.length === 1 &&
                decls[0].id &&
                decls[0].id.type === "Identifier"
            )
                return decls[0].id.name;
            break;
        }
    }
    return null;
}

function isExported(node: Directive | Statement): boolean {
    return (
        node &&
        (node.type === "ExportNamedDeclaration" ||
            node.type === "ExportDefaultDeclaration")
    );
}

function isDefaultExported(node: Directive | Statement): boolean {
    return node && node.type === "ExportDefaultDeclaration";
}

function getTypesReferences(
    node: Directive | Statement,
    selfName?: string,
): string[] {
    const refs = new Set<string>();
    function visitNode(node: Node) {
        if (!node || typeof node !== "object") return;

        if (
            node.type === "TSTypeReference" &&
            node.typeName &&
            node.typeName.type === "Identifier"
        ) {
            const name = node.typeName.name;
            if (name && !builtInTypes.has(name)) {
                refs.add(name);
            }
        } else if (node.type === "ClassBody" && node.body) {
            refs.add(node.body.map((b) => b.type).join(", "));
        }

        const nodeKeys = Object.keys(node) as Array<keyof Node>;
        for (const key of nodeKeys) {
            const value = node[key];
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item && typeof item === "object") {
                        visitNode(item as Node);
                    }
                }
            } else if (value && typeof value === "object") {
                visitNode(value as Node);
            }
        }
    }

    try {
        visitNode(node);
        if (selfName) refs.delete(selfName);
        return Array.from(refs);
    } catch (error) {
        console.error("Error in getTypesReferences:", error);
        return [];
    }
}
