import { extname } from "node:path";
import process from "node:process";
import { ResolverFactory } from "oxc-resolver";
import { dirname } from "pathe";
import type { Resolve } from ".";

export interface Options {
    cwd?: string;
    tsconfig?: string | null;
    resolveOption?: Resolve;
}
export type Resolver = (id: string, importer?: string) => string | null;

export function createResolver({
    tsconfig,
    cwd = process.cwd(),
    resolveOption,
}: Options = {}): Resolver {
    const resolver = new ResolverFactory({
        mainFields: ["types", "typings", "module", "main"],
        conditionNames: ["types", "typings", "import", "require"],
        extensions: [
            ".d.ts",
            ".d.mts",
            ".d.cts",
            ".ts",
            ".mts",
            ".cts",
            ".tsx",
            ".js",
            ".mjs",
            ".cjs",
            ".jsx",
        ],
        extensionAlias: {
            ".js": [".d.ts", ".ts", ".tsx", ".js", ".jsx"],
            ".jsx": [".d.ts", ".ts", ".tsx", ".jsx", ".js"],
            ".mjs": [".d.mts", ".mts", ".mjs"],
            ".cjs": [".d.cts", ".cts", " .cjs"],

            ".ts": [".d.ts", ".ts", ".tsx", ".js", ".jsx"],
            ".tsx": [".d.ts", ".tsx", ".ts", ".js", ".jsx"],
            ".mts": [".d.mts", ".mts", ".mjs"],
            ".cts": [".d.cts", ".cts", ".cjs"],
        },
        tsconfig: tsconfig
            ? { configFile: tsconfig, references: "auto" }
            : undefined,
    });

    const resolutionCache = new Map<string, string | null>();

    return (id: string, importer?: string): string | null => {
        // skip bun types for now
        if (id === "bun") return null;

        const cacheKey = `${id}:${importer || ""}`;

        if (resolutionCache.has(cacheKey)) {
            return resolutionCache.get(cacheKey) || null;
        }

        let shouldResolve = false;

        if (resolveOption !== undefined) {
            if (typeof resolveOption === "boolean") {
                shouldResolve = resolveOption;
            } else if (Array.isArray(resolveOption)) {
                shouldResolve = resolveOption.some((resolver) => {
                    if (typeof resolver === "string") {
                        return resolver === id;
                    }
                    return resolver.test(id);
                });
            }
        }

        if (!shouldResolve) {
            resolutionCache.set(cacheKey, null);
            return null;
        }

        const directory = importer ? dirname(importer) : cwd;

        const resolution = resolver.sync(directory, id);
        if (!resolution.path) return null;
        const resolved = resolution.path;
        return ensureValue(resolved);
    };
}

const ALLOW_EXTENSIONS = [
    ".js",
    ".cjs",
    ".mjs",
    ".jsx",
    ".ts",
    ".cts",
    ".mts",
    ".tsx",
    ".json",
];

function ensureValue(value: string | null): string | null {
    return value && ALLOW_EXTENSIONS.includes(extname(value)) ? value : null;
}
