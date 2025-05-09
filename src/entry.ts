import type { BuildOptions, Entry } from "./types";

type ProcessableEntry = {
    fullPath: string;
    customOutputBasePath: string | null;
};

function getTempNaming(naming: string): string {
    const randomId = Math.random().toString(36).substring(2, 10);
    return naming.replace(
        /\.(js|mjs|cjs|\[ext\])/g,
        `-dts-fake-${randomId}.$1`,
    );
}

export function tempPathToDtsPath(tempPath: string): string {
    return tempPath.replace(/-dts-fake-[a-z0-9]+\.([cm]?js)$/, (_, ext) =>
        getDeclarationExtension(ext),
    );
}

function getDeclarationExtension(ext: string): string {
    if (ext === "mjs") return ".d.mts";
    if (ext === "cjs") return ".d.cts";
    return ".d.ts";
}

export function normalizeEntryToProcessableEntries(
    entry: Entry,
): ProcessableEntry[] {
    if (typeof entry === "string")
        return [{ fullPath: entry, customOutputBasePath: null }];

    if (typeof entry === "object" && !Array.isArray(entry))
        return Object.entries(entry).map(([name, path]) => ({
            fullPath: path as string,
            customOutputBasePath: name,
        }));

    return entry.map((entry) => ({
        fullPath: entry,
        customOutputBasePath: null,
    }));
}

export function getResolvedNaming(
    buildConfigNaming: BuildOptions["naming"],
    customOutputBasePath: string | null,
): BuildOptions["naming"] {
    const naming =
        typeof buildConfigNaming === "string"
            ? buildConfigNaming
            : buildConfigNaming?.entry;

    return getTempNaming(
        naming ?? `[dir]/${customOutputBasePath || "[name]"}.js`,
    );
}
