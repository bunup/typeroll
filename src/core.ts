import pc from "picocolors";
import { fakeJsToDts } from "./fake";
import {
    getResolvedNaming,
    normalizeEntryToProcessableEntries,
    tempPathToDtsPath,
} from "./helpers/entry";
import {
    type IsolatedDeclarationError,
    logIsolatedDeclarationError,
} from "./helpers/isolated-decl-error";
import { createFakeJsResolver } from "./plugins/fake-js-resolver";
import type { BunPluginBuild, GenerateDtsOptions } from "./types";
import { loadTsConfig } from "./utils";

export async function generateDts(
    build: BunPluginBuild,
    options: GenerateDtsOptions = {},
): Promise<void> {
    const { preferredTsConfigPath, resolve, entry } = options;
    const cwd = options.cwd ?? build.config.root ?? process.cwd();

    const tsconfig = await loadTsConfig(cwd, preferredTsConfigPath);

    const errors: IsolatedDeclarationError[] = [];

    const processableEntries = entry
        ? normalizeEntryToProcessableEntries(entry)
        : normalizeEntryToProcessableEntries(build.config.entrypoints);

    const buildResults = await Promise.all(
        processableEntries.map(async (entry) => {
            const { fakeJsResolver, getErrors } = createFakeJsResolver({
                cwd,
                tsconfig: {
                    filepath: tsconfig.filepath,
                    config: tsconfig.config,
                },
                resolveOption: resolve,
            });

            console.log(
                getResolvedNaming(build.config.naming, entry.outputBasePath),
            );

            const result = await Bun.build({
                root: build.config.root,
                entrypoints: [entry.fullPath],
                outdir: build.config.outdir,
                format: "esm",
                external: build.config.external,
                target: "node",
                splitting: false,
                naming: getResolvedNaming(
                    build.config.naming,
                    entry.outputBasePath,
                ),
                plugins: [fakeJsResolver],
            });

            const pluginErrors = getErrors();

            if (pluginErrors.length > 0) {
                errors.push(...pluginErrors);
            }

            return result;
        }),
    );

    for (const result of buildResults) {
        for (const output of result.outputs) {
            if (output.kind !== "entry-point") {
                continue;
            }

            const bundledFakeJsPath = output.path;
            const bundledFakeJsContent =
                await Bun.file(bundledFakeJsPath).text();

            try {
                await Bun.file(bundledFakeJsPath).delete();
            } catch {}

            const dtsContent = fakeJsToDts(bundledFakeJsContent);

            const finalDtsPath = tempPathToDtsPath(bundledFakeJsPath);

            if (options.onDeclarationGenerated) {
                await options.onDeclarationGenerated(finalDtsPath, dtsContent);
            }

            await Bun.write(finalDtsPath, dtsContent);
        }
    }

    if (errors.length > 0) {
        let hasSeverityError = false;
        for (const error of errors) {
            if (error.error.severity === "Error") {
                hasSeverityError = true;
            }

            logIsolatedDeclarationError(
                error,
                options.warnInsteadOfError ?? false,
            );
        }

        if (hasSeverityError && !options.warnInsteadOfError) {
            console.log(
                `\n\n${pc.cyan("Learn more:")} ${pc.underline("https://github.com/arshad-yaseen/bun-dts?tab=readme-ov-file#understanding-isolateddeclarations")}\n\n`,
            );
            process.exit(1);
        }
    }
}
