import type { BunPlugin } from "bun";
import { generateDts } from "../generate";
import {
    type IsolatedDeclarationError,
    logIsolatedDeclarationErrors,
} from "../isolated-decl-error";
import type { DtsPluginOptions } from "../types";
import { getOutputDtsPath, normalizeEntry } from "./utils";

/**
 * A bun plugin that generates TypeScript declaration files (.d.ts) for your entrypoints.
 *
 * @param options - Configuration options for the dts plugin
 */
export function dts(options: DtsPluginOptions = {}): BunPlugin {
    return {
        name: "dts",
        async setup(build) {
            const { entry, warnInsteadOfError, ...generateDtsOptions } =
                options;

            const entries = normalizeEntry(entry ?? build.config.entrypoints);

            const allErrors: IsolatedDeclarationError[] = [];

            for (const entry of entries) {
                const { dts, errors } = await generateDts(entry.fullPath, {
                    cwd: build.config.root,
                    ...generateDtsOptions,
                });

                allErrors.push(...errors);

                const outputPath = await getOutputDtsPath(entry, build.config);

                await Bun.write(outputPath, dts);
            }

            if (allErrors.length > 0) {
                logIsolatedDeclarationErrors(allErrors, {
                    shouldExit: true,
                    warnInsteadOfError,
                });
            }
        },
    };
}
