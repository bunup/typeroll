import type { BuildOptions, Entry } from "../types";

type ProcessableEntry = {
    fullPath: string;
    outputBasePath: string | null;
};

function getTempNaming(naming: string): string {
    const randomId = Math.random().toString(36).substring(2, 10);
    const lastExtIndex = naming.lastIndexOf(".");
    if (lastExtIndex === -1) return naming;

    const beforeExt = naming.substring(0, lastExtIndex);
    const extension = naming.substring(lastExtIndex);

    const extMatch = extension.match(/\.(js|mjs|cjs|\[ext\])$/);
    if (!extMatch) return naming;

    return `${beforeExt}-dts-fake-${randomId}${extension}`;
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
        return [{ fullPath: entry, outputBasePath: null }];

    if (typeof entry === "object" && !Array.isArray(entry))
        return Object.entries(entry).map(([name, path]) => ({
            fullPath: path,
            outputBasePath: name,
        }));

    return entry.map((entry) => ({
        fullPath: entry,
        outputBasePath: null,
    }));
}

export function getResolvedNaming(
    buildConfigNaming: BuildOptions["naming"],
    outputBasePath: string | null,
): BuildOptions["naming"] {
    const naming =
        typeof buildConfigNaming === "string"
            ? buildConfigNaming
            : buildConfigNaming?.entry;

    return getTempNaming(naming ?? `[dir]/${outputBasePath || "[name]"}.js`);
}
