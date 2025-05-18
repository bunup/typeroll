import fs from "node:fs/promises";
import { createFakeJsPlugin } from "./fakejs-plugin";
import { fakeJsToDts } from "./fakejs-utils";
import {
    type IsolatedDeclarationError,
    logIsolatedDeclErrors,
} from "./isolated-decl-error";
import type { GenerateDtsOptions } from "./types";
import { loadTsConfig } from "./utils";

const TEMP_DIR = ".bun-dts";

export async function generateDts(
    entry: string,
    options: GenerateDtsOptions = {},
): Promise<string> {
    const { preferredTsConfigPath, resolve, warnInsteadOfError } = options;
    const cwd = options.cwd ?? process.cwd();

    const tsconfig = await loadTsConfig(cwd, preferredTsConfigPath);

    const errors: IsolatedDeclarationError[] = [];

    const { fakeJsPlugin, getErrors } = createFakeJsPlugin({
        cwd,
        tsconfig: {
            filepath: tsconfig.filepath,
            config: tsconfig.config,
        },
        resolveOption: resolve,
    });

    const result = await Bun.build({
        entrypoints: [`${cwd}/${entry}`],
        outdir: TEMP_DIR,
        format: "esm",
        target: "node",
        splitting: false,
        plugins: [fakeJsPlugin],
    });

    const pluginErrors = getErrors();

    if (pluginErrors.length > 0) {
        errors.push(...pluginErrors);
    }

    const output = result.outputs[0];

    const bundledFakeJsPath = output.path;
    const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text();

    try {
        await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch {}

    const dtsContent = fakeJsToDts(bundledFakeJsContent);

    if (errors.length > 0) {
        logIsolatedDeclErrors(errors, warnInsteadOfError ?? false);
    }

    return dtsContent;
}

export type { GenerateDtsOptions };
