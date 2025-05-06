import { existsSync } from "node:fs";
import { type LoadConfigResult, loadConfig } from "coffi";

export const JS_REGEX: RegExp = /\.[cm]?js$/;
export const TS_REGEX: RegExp = /\.[cm]?ts$/;

export function ensureTypeScriptFile(path: string | null): string | null {
    return path && TS_REGEX.test(path) ? path : null;
}

export function returnPathIfExists(path: string): string | null {
    return existsSync(path) ? path : null;
}

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

export function getShortFilePath(filePath: string, maxLength = 3): string {
    const fileParts = filePath.split("/");
    const shortPath = fileParts.slice(-maxLength).join("/");
    return shortPath;
}
