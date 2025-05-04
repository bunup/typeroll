import { isolatedDeclaration } from "oxc-transform";
import ts from "typescript";

const DUMMY_DTS_PATH = "file.d.ts";
const DUMMY_JS_PATH = "file.js";

export function dtsToFakeJs(content: string): string {
    const sourceFile = ts.createSourceFile(
        DUMMY_DTS_PATH,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    return sourceFile.statements
        .map((node) => processNode(node, sourceFile))
        .filter(Boolean)
        .join("\n\n");
}

function processNode(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        return cleanImportExport(node, sourceFile);
    }
    return encodeDeclaration(node, sourceFile);
}

function cleanImportExport(node: ts.Node, sourceFile: ts.SourceFile): string {
    let text = node.getText(sourceFile);
    text = text.replace(/import\s+type\s+/, "import ");
    text = text.replace(/export\s+type\s+/, "export ");
    return text.replace(
        /(import|export)\s*\{([^}]*)\}/g,
        (_, keyword, names) => `${keyword} {${names.replace(/type\s+/g, "")}}`,
    );
}

function encodeDeclaration(node: ts.Node, sourceFile: ts.SourceFile): string {
    const nodeText = sourceFile.text.substring(
        node.getFullStart(),
        node.getEnd(),
    );
    const escapedText = escapeString(removeExport(nodeText));
    const name = getName(node, sourceFile);
    const refs = getReferences(node, sourceFile, name);
    const exportPrefix = shouldExport(node) ? "export " : "";
    const varName = name || `__decl_${Math.random().toString(36).slice(2, 8)}`;

    return `${exportPrefix}var ${varName} = ["${escapedText}"${refs.length ? `, ${refs.join(", ")}` : ""}];`;
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

function getReferences(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    selfName: string | null,
): string[] {
    const refs = new Set<string>();

    function visit(n: ts.Node): void {
        if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) {
            refs.add(n.typeName.getText(sourceFile));
        } else if (
            ts.isPropertyAccessExpression(n) &&
            ts.isIdentifier(n.expression)
        ) {
            refs.add(n.expression.getText(sourceFile));
        } else if (ts.isQualifiedName(n) && ts.isIdentifier(n.left)) {
            refs.add(n.left.getText(sourceFile));
        } else if (ts.isHeritageClause(n)) {
            for (const type of n.types) {
                if (ts.isIdentifier(type.expression)) {
                    refs.add(type.expression.getText(sourceFile));
                }
            }
        } else if (ts.isIdentifier(n) && !isDeclarationName(n)) {
            refs.add(n.getText(sourceFile));
        }
        ts.forEachChild(n, visit);
    }

    visit(node);
    if (selfName) refs.delete(selfName);
    return Array.from(refs);
}

function isDeclarationName(node: ts.Node): boolean {
    const parent = node.parent;
    if (!parent) return false;

    const declarationTypes = [
        ts.isInterfaceDeclaration,
        ts.isTypeAliasDeclaration,
        ts.isClassDeclaration,
        ts.isFunctionDeclaration,
        ts.isMethodDeclaration,
        ts.isPropertyDeclaration,
        ts.isParameter,
        ts.isEnumDeclaration,
        ts.isModuleDeclaration,
    ];

    return declarationTypes.some(
        (check) => check(parent) && "name" in parent && parent.name === node,
    );
}

function shouldExport(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    if (!modifiers) return false;

    const hasExport = modifiers.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );
    const hasDeclare = modifiers.some(
        (m) => m.kind === ts.SyntaxKind.DeclareKeyword,
    );

    return hasExport || (hasDeclare && !ts.isVariableStatement(node));
}

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
        // final treeshaking using oxc isolatedDeclaration, even though bun will do it
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
