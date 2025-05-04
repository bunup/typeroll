import { isolatedDeclaration } from "oxc-transform";
import ts from "typescript";
import { builtInTypes } from "./constants";

const DUMMY_DTS_PATH = "file.d.ts";
const DUMMY_JS_PATH = "file.js";

// DTS to Fake JS conversion
export function dtsToFakeJs(content: string): string {
    const sourceFile = ts.createSourceFile(
        DUMMY_DTS_PATH,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    return sourceFile.statements
        .map((node) => {
            if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
                return jsifyImportExport(node, sourceFile);
            }
            return convertDeclarationToFakeJs(node, sourceFile);
        })
        .filter(Boolean)
        .join("\n\n");
}

function jsifyImportExport(node: ts.Node, sourceFile: ts.SourceFile): string {
    let text = node.getText(sourceFile);
    text = text.replace(/import\s+type\s+/, "import ");
    text = text.replace(/export\s+type\s+/, "export ");
    return text.replace(
        /(import|export)\s*\{([^}]*)\}/g,
        (_, keyword, names) => `${keyword} {${names.replace(/type\s+/g, "")}}`,
    );
}

function convertDeclarationToFakeJs(
    node: ts.Node,
    sourceFile: ts.SourceFile,
): string {
    const nodeText = sourceFile.text.substring(
        node.getFullStart(),
        node.getEnd(),
    );
    const escapedText = escapeString(removeExport(nodeText));
    const name = getName(node, sourceFile);
    const refs = getTypesReferences(node, sourceFile, name);
    const isDefault = isDefaultExported(node);
    const exportPrefix = isExported(node) && !isDefault ? "export " : "";
    const varName = name || `__decl_${Math.random().toString(36).slice(2, 8)}`;

    const declaration = `${exportPrefix}var ${varName} = ["${escapedText}"${refs.length ? `, ${refs.join(", ")}` : ""}];`;

    if (isDefault && name) {
        return `${declaration}\nexport { ${name} as default };`;
    }

    return declaration;
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

function getName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    if (
        (ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isClassDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isFunctionDeclaration(node)) &&
        node.name
    ) {
        return node.name.getText(sourceFile);
    }
    if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
        return node.name.getText(sourceFile);
    }
    return null;
}

function isExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    if (!modifiers) return false;

    return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function isDefaultExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    if (!modifiers) return false;

    return (
        modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
        modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    );
}

function getTypesReferences(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    selfName: string | null,
): string[] {
    const refs = new Set<string>();

    const visitor = (node: ts.Node): void => {
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
            const name = node.typeName.getText(sourceFile);
            if (!builtInTypes.has(name)) {
                refs.add(name);
            }
        } else if (ts.isQualifiedName(node) && ts.isIdentifier(node.left)) {
            refs.add(node.left.getText(sourceFile));
        } else if (ts.isHeritageClause(node)) {
            for (const type of node.types) {
                if (ts.isIdentifier(type.expression)) {
                    refs.add(type.expression.getText(sourceFile));
                } else if (
                    ts.isPropertyAccessExpression(type.expression) &&
                    ts.isIdentifier(type.expression.expression)
                ) {
                    refs.add(type.expression.expression.getText(sourceFile));
                }
            }
        } else if (ts.isTypeQueryNode(node) && ts.isIdentifier(node.exprName)) {
            refs.add(node.exprName.getText(sourceFile));
        }

        ts.forEachChild(node, visitor);
    };

    try {
        visitor(node);

        if (selfName) {
            refs.delete(selfName);
        }

        return Array.from(refs);
    } catch (error) {
        console.error("Error in getTypesReferences:", error);
        return [];
    }
}

// Fake JS to DTS conversion
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
                if (
                    ts.isImportDeclaration(stmt) ||
                    ts.isExportDeclaration(stmt)
                ) {
                    return stmt.getText(sourceFile);
                }
                return extractFragment(stmt);
            })
            .filter(Boolean);

        const dts = fragments.join("\n").trim();
        const treeShaken = isolatedDeclaration(DUMMY_DTS_PATH, dts).code;

        return treeShaken;
    } catch (error) {
        console.error("Error parsing JS:", error);
        return "";
    }
}

function extractFragment(statement: ts.Node): string | null {
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
