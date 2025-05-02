import fs from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { ResolverFactory } from "oxc-resolver";
import type { Resolve } from ".";
import { JS_REGEX, ensureTypeScriptFile, returnPathIfExists } from "./utils";

export interface Options {
    cwd: string;
    tsconfig: string | null;
    resolveOption: Resolve | undefined;
}
export type Resolver = (id: string, importer?: string) => string | null;

export function createResolver({
    tsconfig,
    cwd = process.cwd(),
    resolveOption,
}: Options): Resolver {
    const resolver = new ResolverFactory({
        mainFields: ["types", "typings", "module", "main"],
        conditionNames: ["types", "typings", "import", "require"],
        extensions: [".d.ts", ".d.mts", ".d.cts", ".ts", ".mts", ".cts"],
        tsconfig: tsconfig
            ? { configFile: tsconfig, references: "auto" }
            : undefined,
    });

    const resolutionCache = new Map<string, string | null>();

    return (importSource: string, importer?: string): string | null => {
        // skip bun types for now
        if (importSource === "bun") return null;

        const cacheKey = `${importSource}:${importer || ""}`;

        if (resolutionCache.has(cacheKey)) {
            return resolutionCache.get(cacheKey) || null;
        }

        let shouldResolve = false;

        if (resolveOption) {
            // e.g., if oxc-resolver re-exports @oxc-project/types, we'll resolve it without needing to explicitly specify @oxc-project/types in the resolve option
            if (isImportSourceReExportedFromImporter(importSource, importer)) {
                shouldResolve = true;
            } else if (typeof resolveOption === "boolean") {
                shouldResolve = resolveOption;
            } else if (Array.isArray(resolveOption)) {
                shouldResolve = resolveOption.some((resolver) => {
                    if (typeof resolver === "string") {
                        return resolver === importSource;
                    }
                    return resolver.test(importSource);
                });
            }
        }

        if (!shouldResolve) {
            resolutionCache.set(cacheKey, null);
            return null;
        }

        const directory = importer ? dirname(importer) : cwd;

        const resolution = resolver.sync(directory, importSource);
        if (!resolution.path) {
            resolutionCache.set(cacheKey, null);
            return null;
        }
        const resolved = resolution.path;

        // if the resolved path is a js file, check for corresponding d.ts files
        if (JS_REGEX.test(resolved)) {
            const dts =
                returnPathIfExists(resolved.replace(JS_REGEX, ".d.ts")) ||
                returnPathIfExists(resolved.replace(JS_REGEX, ".d.mts")) ||
                returnPathIfExists(resolved.replace(JS_REGEX, ".d.cts"));

            const result = ensureTypeScriptFile(dts);
            resolutionCache.set(cacheKey, result);
            return result;
        }

        const result = ensureTypeScriptFile(resolved);
        resolutionCache.set(cacheKey, result);
        return result;
    };
}

function isImportSourceReExportedFromImporter(
    importSource: string,
    importer: string | undefined,
) {
    if (!importer) return false;
    const content = fs.readFileSync(importer, "utf8");
    // export * from "module" or export { ... } from "module"
    const reExportRegex = new RegExp(
        `export\\s*(\\*|\\{[^}]*\\})\\s*from\\s*['"](${importSource})['"]`,
        "g",
    );
    return reExportRegex.test(content);
}
