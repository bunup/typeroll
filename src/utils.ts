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

export const something = "something";

export interface Something {
    something: string;
}
