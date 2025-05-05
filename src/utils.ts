import { type LoadConfigResult, loadConfig } from "coffi";

export async function loadTsConfig(
    rootDir: string,
    preferredPath: string | undefined,
): Promise<LoadConfigResult<Record<string, unknown>>> {
    const config = await loadConfig<Record<string, unknown>>({
        name: "tsconfig",
        extensions: [".json"],
        preferredPath,
        cwd: rootDir,
    });

    return config;
}

export function randomId(): string {
    return Math.random().toString(36).substring(2, 15);
}

export function getDeclarationExtension(ext: string): string {
    if (ext === "mjs") return ".d.mts";
    if (ext === "cjs") return ".d.cts";
    return ".d.ts";
}
