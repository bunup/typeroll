import type {
    Comment,
    Declaration,
    Directive,
    ExportDefaultDeclaration,
    ExportNamedDeclaration,
    Node,
    Statement,
} from "oxc-parser";

export function isImportDeclaration(node: Node): boolean {
    return node.type === "ImportDeclaration";
}

export function isExportAllDeclaration(node: Node): boolean {
    return node.type === "ExportAllDeclaration";
}

export function isReExportStatement(node: Node): boolean {
    return node.type === "ExportNamedDeclaration" && !node.declaration;
}

export function hasExportModifier(node: Node, text: string): boolean {
    return node.type.startsWith("Export") || text.trim().startsWith("export");
}

export function hasDefaultExportModifier(node: Node, text: string): boolean {
    return (
        node.type === "ExportDefaultDeclaration" ||
        text.trim().startsWith("export default")
    );
}

export function isDefaultReExport(node: Node): boolean {
    return (
        node.type === "ExportDefaultDeclaration" &&
        node.declaration?.type === "Identifier"
    );
}

export function getName(
    node:
        | Directive
        | Statement
        | ExportDefaultDeclaration
        | ExportNamedDeclaration
        | Declaration,
    source: string,
): string | null {
    if (!node) return null;

    if (node.type === "ExportNamedDeclaration" && node.declaration) {
        return getName(node.declaration as Declaration, source);
    }

    if (node.type === "ExportDefaultDeclaration" && node.declaration) {
        if (node.declaration.type === "Identifier") {
            return node.declaration.name;
        }
        return getName(node.declaration as Declaration, source);
    }

    switch (node.type) {
        case "TSInterfaceDeclaration":
        case "TSTypeAliasDeclaration":
        case "ClassDeclaration":
        case "TSEnumDeclaration":
        case "FunctionDeclaration":
        case "TSDeclareFunction":
            if (node.id && node.id.type === "Identifier") {
                return node.id.name;
            }
            break;

        case "TSModuleDeclaration":
            if (node.id) {
                if (node.id.type === "Identifier") {
                    return node.id.name;
                }
                if (
                    node.id.type === "Literal" &&
                    typeof node.id.value === "string"
                ) {
                    return node.id.value;
                }
            }
            break;

        case "VariableDeclaration": {
            const declarations = node.declarations;
            if (
                declarations?.length === 1 &&
                declarations[0].id?.type === "Identifier"
            ) {
                return declarations[0].id.name;
            }
            break;
        }
    }
    return null;
}

export function getAssociatedComment(
    statement: Statement,
    comments: Comment[],
): string | null {
    const comment = comments.find(
        (comment) => comment.end + 1 === statement.start,
    );

    if (!comment) {
        return null;
    }

    return comment.type === "Block"
        ? `/*${comment.value}*/`
        : comment.type === "Line"
          ? `//${comment.value}`
          : null;
}
