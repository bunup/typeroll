import { isolatedDeclaration } from "oxc-transform";
import ts from "typescript";

const DUMMY_JS_PATH = "file.js";

export function fakeJsToDts(content: string): string {
    try {
        const sourceFile = ts.createSourceFile(
            DUMMY_JS_PATH,
            content,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.JS,
        );

        const fragments = sourceFile.statements
            .map((stmt) => {
                // preserve import and export statements
                if (
                    ts.isImportDeclaration(stmt) ||
                    ts.isExportDeclaration(stmt)
                ) {
                    return stmt.getText(sourceFile);
                }

                if (ts.isExpressionStatement(stmt)) {
                    const namespaceDeclaration = handleNamespace(stmt);
                    if (namespaceDeclaration) {
                        return namespaceDeclaration;
                    }
                }

                return extractOriginalDeclaration(stmt);
            })
            .filter(Boolean);

        const dts = fragments.join("\n").trim();
        const treeShaken = isolatedDeclaration(DUMMY_JS_PATH, dts).code;

        return treeShaken;
    } catch (error) {
        console.error("Error parsing JS:", error);
        return "";
    }
}

// when namespace import is used (eg, import * as utils from './utils'), Build.build will convert it to something like this:
// var __export ...
// var exports_utils = {};
// __export(exports_utils, {
//     something: () => something,
//     loadTsConfig: () => loadTsConfig,
//     Something: () => Something
//   });
// export { exports_utils as utils }
//
// we need to convert it to a namespace declaration:
// declare namespace exports_utils {
//   export { something, loadTsConfig };
// }
function handleNamespace(stmt: ts.ExpressionStatement): string | null {
    const expr = stmt.expression;
    if (
        ts.isCallExpression(expr) &&
        ts.isIdentifier(expr.expression) &&
        expr.expression.text === "__export"
    ) {
        const args = expr.arguments;
        if (
            args.length === 2 &&
            ts.isIdentifier(args[0]) &&
            ts.isObjectLiteralExpression(args[1])
        ) {
            const namespaceName = args[0].text;
            const properties = args[1].properties
                .filter(ts.isPropertyAssignment)
                .map((prop) => {
                    if (ts.isIdentifier(prop.name)) {
                        return prop.name.text;
                    }
                    return null;
                })
                .filter(Boolean);

            if (properties.length) {
                return `declare namespace ${namespaceName} {\n  export { ${properties.join(", ")} };\n}`;
            }
        }
    }
    return null;
}

function extractOriginalDeclaration(statement: ts.Node): string | null {
    if (!ts.isVariableStatement(statement)) return null;

    for (const decl of statement.declarationList.declarations) {
        const init = decl.initializer;

        if (
            !init ||
            !ts.isArrayLiteralExpression(init) ||
            !init.elements.length
        )
            continue;

        const element = init.elements[0];

        if (ts.isStringLiteral(element)) return element.text;
        if (ts.isNoSubstitutionTemplateLiteral(element)) return element.text;
        if (ts.isTemplateExpression(element) && element.head)
            return element.head.text;
    }

    return null;
}
