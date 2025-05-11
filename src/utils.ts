import { existsSync } from "node:fs";
import { type LoadConfigResult, loadConfig } from "coffi";

export const JS_REGEX: RegExp = /\.[cm]?js$/;
export const TS_REGEX: RegExp = /\.[cm]?ts$/;
export const NODE_MODULES_REGEX: RegExp = /node_modules/;

export function ensureTypeScriptFile(path: string | null): string | null {
    return path && TS_REGEX.test(path) ? path : null;
}

export function returnPathIfExists(path: string): string | null {
    return existsSync(path) ? path : null;
}

export async function loadTsConfig(
    cwd: string,
    preferredPath: string | undefined,
): Promise<LoadConfigResult<Record<string, unknown>>> {
    const config = await loadConfig<Record<string, unknown>>({
        name: "tsconfig",
        extensions: [".json"],
        preferredPath,
        cwd,
    });

    return config;
}

export function getShortFilePath(filePath: string, maxLength = 3): string {
    const fileParts = filePath.split("/");
    const shortPath = fileParts.slice(-maxLength).join("/");
    return shortPath;
}
