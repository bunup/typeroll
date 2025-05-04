import ts from "typescript";

export const builtInTypes: Set<string> = new Set([
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

export function escapeString(str: string): string {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

export function removeExport(text: string): string {
    return text.replace(/export\s+default\s+/, "").replace(/export\s+/, "");
}

// get the name of the node
// eg, `interface Something { something: string; }` will return `Something`
export function getName(
    node: ts.Node,
    sourceFile: ts.SourceFile,
): string | null {
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
    if (ts.isVariableStatement(node)) {
        const declarations = node.declarationList.declarations;
        if (declarations.length === 1 && declarations[0].name) {
            return declarations[0].name.getText(sourceFile);
        }
    }
    return null;
}

export function isExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    if (!modifiers) return false;

    return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

export function isDefaultExported(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    if (!modifiers) return false;

    return (
        modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
        modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    );
}

// get the types references used in the node
// eg, `declare function something(a: A, b: B): C;` will return `[A, B, C]`
export function getTypesReferences(
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
