import ts from "typescript";
import {
    escapeString,
    getName,
    getTypesReferences,
    isDefaultExported,
    isExported,
    removeExport,
} from "./utils";

const DUMMY_DTS_PATH = "file.d.ts";

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
