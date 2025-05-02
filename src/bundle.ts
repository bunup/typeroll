import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import {
    ExportExportNameKind,
    ExportImportNameKind,
    type StaticImport,
    parseSync,
} from "oxc-parser";
import { resolveTsImportPath } from "ts-import-resolver";
import type { GenerateDtsOptions } from ".";

interface ExportInfo {
    name: string;
    isType: boolean;
}

/**
 * bundles a typescript file to a single file that will be passed to the oxc-transform isolateddeclaration function
 *
 * 1. tracking exports from all modules
 * 2. inlining imported and re-exported files recursively
 * 3. removing all export keywords from non-entry files
 * 4. transforming re-exports in entry file to reference inlined code, eg:
 *    - export { name } from './mod' → export { name }; (since 'name' is already defined from inlining)
 *    - export type { type } from './mod' → export type { type }; (since 'type' is already defined from inlining)
 *    - export * from './mod' → export { func, var }; export type { interface, type }; (listing all exports from that module, values first, then types)
 *
 * with this trick, we got a single typescript file with all dependencies inlined,
 * no imports, and only entry file exports preserved.
 */

export function bundleTs(
    entryFilePath: string,
    options: GenerateDtsOptions = {},
): string {
    const rootDir = options.rootDir ?? process.cwd();
    const tsconfig = options.tsconfig ?? {};

    const fileCache = new Map<string, string>();
    const parseCache = new Map<string, ReturnType<typeof parseSync>>();
    const moduleExports = new Map<string, ExportInfo[]>();
    const processedFiles = new Set<string>();

    function getContent(filePath: string): string {
        const absPath = path.resolve(filePath);
        if (!fileCache.has(absPath)) {
            fileCache.set(absPath, fs.readFileSync(absPath, "utf8"));
        }
        return fileCache.get(absPath) ?? "";
    }

    function getParsed(filePath: string): ReturnType<typeof parseSync> {
        const absPath = path.resolve(filePath);
        if (!parseCache.has(absPath)) {
            const content = getContent(absPath);
            parseCache.set(absPath, parseSync(absPath, content));
        }
        return parseCache.get(absPath) ?? parseSync(absPath, "");
    }

    function resolveImport(
        importPath: string,
        importer: string,
    ): string | null {
        const resolved = resolveTsImportPath({
            path: importPath,
            importer,
            tsconfig,
            rootDir,
        });

        if (
            !resolved ||
            (!resolved.endsWith(".ts") && !resolved.endsWith(".tsx"))
        ) {
            return null;
        }

        return path.resolve(resolved);
    }

    function getExports(filePath: string): ExportInfo[] {
        const absPath = path.resolve(filePath);

        if (moduleExports.has(absPath)) {
            return moduleExports.get(absPath) ?? [];
        }

        moduleExports.set(absPath, []); // prevent circular dependencies

        const parsed = getParsed(absPath);
        const exports: ExportInfo[] = [];

        for (const exp of parsed.module.staticExports) {
            const isReExport = exp.entries.some((entry) => entry.moduleRequest);

            if (isReExport) {
                for (const entry of exp.entries) {
                    if (!entry.moduleRequest) continue;

                    const modulePath = entry.moduleRequest.value;
                    const resolvedPath = resolveImport(modulePath, absPath);
                    if (!resolvedPath) continue;

                    if (
                        entry.importName.kind ===
                        ExportImportNameKind.AllButDefault
                    ) {
                        exports.push(...getExports(resolvedPath));
                    } else if (
                        entry.importName.kind === ExportImportNameKind.Name &&
                        entry.exportName.kind === ExportExportNameKind.Name &&
                        entry.exportName.name
                    ) {
                        exports.push({
                            name: entry.exportName.name,
                            isType: entry.isType,
                        });
                    }
                }
            } else {
                for (const entry of exp.entries) {
                    if (
                        entry.exportName.kind === ExportExportNameKind.Name &&
                        entry.exportName.name
                    ) {
                        exports.push({
                            name: entry.exportName.name,
                            isType: entry.isType,
                        });
                    }
                }
            }
        }

        moduleExports.set(absPath, exports);
        return exports;
    }

    function processFile(filePath: string, isEntry = false): string {
        const absPath = path.resolve(filePath);

        if (processedFiles.has(absPath) && !isEntry) {
            return "";
        }

        processedFiles.add(absPath);

        const content = getContent(absPath);
        const parsed = getParsed(absPath);
        const ms = new MagicString(content);

        if (parsed.program.hashbang) {
            ms.remove(0, parsed.program.hashbang.end);
        }

        getExports(absPath);

        function isNamespaceImport(
            imp: StaticImport,
            content: string,
        ): string | null {
            const importText = content.substring(imp.start, imp.end);
            const match = importText.match(/import\s+\*\s+as\s+(\w+)\s+from/);
            return match?.[1] ?? null;
        }

        for (const imp of parsed.module.staticImports) {
            const importPath = imp.moduleRequest.value;
            const resolvedPath = resolveImport(importPath, absPath);
            if (!resolvedPath) continue;

            const importedContent = processFile(resolvedPath);

            if (importedContent.trim()) {
                ms.appendLeft(imp.start, `${importedContent}\n`);
            }

            // handle namespace imports
            const namespaceName = isNamespaceImport(imp, content);

            if (namespaceName) {
                const moduleExportsList = getExports(resolvedPath);
                const valueExports = moduleExportsList
                    .filter((e) => !e.isType)
                    .map((e) => e.name);
                const typeExports = moduleExportsList
                    .filter((e) => e.isType)
                    .map((e) => e.name);

                let namespaceDecl = `namespace ${namespaceName} {\n`;

                if (valueExports.length > 0) {
                    namespaceDecl += `  export { ${valueExports.join(", ")} };\n`;
                }

                if (typeExports.length > 0) {
                    namespaceDecl += `  export type { ${typeExports.join(", ")} };\n`;
                }

                namespaceDecl += "}";

                ms.overwrite(imp.start, imp.end, namespaceDecl);
            } else {
                ms.remove(imp.start, imp.end);
            }
        }

        // process exports
        for (const exp of parsed.module.staticExports) {
            const isReExport = exp.entries.some((entry) => entry.moduleRequest);

            if (isReExport) {
                if (!isEntry) {
                    ms.remove(exp.start, exp.end);
                }

                for (const entry of exp.entries) {
                    if (!entry.moduleRequest) continue;

                    const modulePath = entry.moduleRequest.value;
                    const resolvedPath = resolveImport(modulePath, absPath);
                    if (!resolvedPath) continue;

                    const reExportedContent = processFile(resolvedPath);
                    if (reExportedContent.trim()) {
                        ms.appendLeft(exp.start, `${reExportedContent}\n`);
                    }
                }
            } else if (!isEntry) {
                const exportText = content.substring(exp.start, exp.end);
                ms.overwrite(
                    exp.start,
                    exp.end,
                    exportText.replace(/^export\s+/, ""),
                );
            }
        }

        return ms.toString();
    }

    function transformReExports(content: string): string {
        const parsed = parseSync(entryFilePath, content);
        const ms = new MagicString(content);

        // track already exported names to avoid duplication
        const exportedValues = new Set<string>();
        const exportedTypes = new Set<string>();

        for (const exp of parsed.module.staticExports) {
            if (!exp.entries.some((entry) => entry.moduleRequest)) {
                // for direct exports (not re-exports), track them
                for (const entry of exp.entries) {
                    if (
                        entry.exportName.kind === ExportExportNameKind.Name &&
                        entry.exportName.name
                    ) {
                        if (entry.isType) {
                            exportedTypes.add(entry.exportName.name);
                        } else {
                            exportedValues.add(entry.exportName.name);
                        }
                    }
                }
                continue;
            }

            const replacements: string[] = [];

            for (const entry of exp.entries) {
                if (!entry.moduleRequest) continue;

                const modulePath = entry.moduleRequest.value;
                const resolvedPath = resolveImport(modulePath, entryFilePath);
                if (!resolvedPath) continue;

                if (
                    entry.importName.kind === ExportImportNameKind.AllButDefault
                ) {
                    // handle wildcard exports
                    const exports = moduleExports.get(resolvedPath) || [];

                    // filter out already exported values
                    const values = exports.filter(
                        (e) => !e.isType && !exportedValues.has(e.name),
                    );

                    // filter out already exported types
                    const types = exports.filter(
                        (e) => e.isType && !exportedTypes.has(e.name),
                    );

                    // add to tracking sets
                    for (const e of values) {
                        exportedValues.add(e.name);
                    }
                    for (const e of types) {
                        exportedTypes.add(e.name);
                    }

                    if (values.length) {
                        replacements.push(
                            `export { ${values.map((e) => e.name).join(", ")} };`,
                        );
                    }

                    if (types.length) {
                        replacements.push(
                            `export type { ${types.map((e) => e.name).join(", ")} };`,
                        );
                    }
                } else if (
                    entry.importName.kind === ExportImportNameKind.Name &&
                    entry.exportName.kind === ExportExportNameKind.Name &&
                    entry.importName.name &&
                    entry.exportName.name
                ) {
                    const importName = entry.importName.name;
                    const exportName = entry.exportName.name;

                    // check if this export already exists
                    const isAlreadyExported = entry.isType
                        ? exportedTypes.has(exportName)
                        : exportedValues.has(exportName);

                    if (!isAlreadyExported) {
                        // track this export
                        if (entry.isType) {
                            exportedTypes.add(exportName);
                        } else {
                            exportedValues.add(exportName);
                        }

                        replacements.push(
                            `export ${entry.isType ? "type " : ""}{ ${importName}${
                                importName !== exportName
                                    ? ` as ${exportName}`
                                    : ""
                            } };`,
                        );
                    }
                }
            }

            if (replacements.length) {
                ms.overwrite(exp.start, exp.end, replacements.join("\n"));
            } else {
                // if all exports were already handled, remove this export statement completely
                ms.remove(exp.start, exp.end);
            }
        }

        return ms.toString();
    }

    const inlinedContent = processFile(entryFilePath, true);
    return transformReExports(inlinedContent);
}
