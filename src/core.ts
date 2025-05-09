import { isolatedDeclaration } from "oxc-transform";
import pc from "picocolors";
import { resolveTsImportPath } from "ts-import-resolver";
import {
    getResolvedNaming,
    normalizeEntryToProcessableEntries,
    tempPathToDtsPath,
} from "./entry";
import { dtsToFakeJs, fakeJsToDts } from "./fake";
import {
    type IsolatedDeclarationError,
    logIsolatedDeclarationError,
} from "./isolated-decl-error";
import { createResolver } from "./resolver";
import type { BunPluginBuild, GenerateDtsOptions } from "./types";
import { NODE_MODULES_REGEX, loadTsConfig } from "./utils";

export async function generateDts(
    build: BunPluginBuild,
    options: GenerateDtsOptions = {},
): Promise<void> {
    const { preferredTsConfigPath, resolve, entry } = options;
    const rootDir = build.config.root ?? process.cwd();

    const tsconfig = await loadTsConfig(rootDir, preferredTsConfigPath);

    const resolver = createResolver({
        tsconfig: tsconfig.filepath,
        cwd: rootDir,
        resolveOption: resolve,
    });

    const errors: IsolatedDeclarationError[] = [];

    const processableEntries = entry
        ? normalizeEntryToProcessableEntries(entry)
        : normalizeEntryToProcessableEntries(build.config.entrypoints);

    const buildResults = await Promise.all(
        processableEntries.map(async (entry) => {
            return await Bun.build({
                entrypoints: [entry.fullPath],
                outdir: build.config.outdir,
                format: "esm",
                external: build.config.external,
                target: "node",
                splitting: false,
                naming: getResolvedNaming(
                    build.config.naming,
                    entry.customOutputBasePath,
                ),
                plugins: [
                    {
                        name: "fake-js",
                        setup(build) {
                            build.onResolve({ filter: /.*/ }, (args) => {
                                if (!NODE_MODULES_REGEX.test(args.importer)) {
                                    const resolved = resolveTsImportPath({
                                        importer: args.importer,
                                        path: args.path,
                                        rootDir,
                                        tsconfig: tsconfig.config,
                                    });

                                    if (resolved) {
                                        return { path: resolved };
                                    }
                                }

                                const resolvedByCustomResolver = resolver(
                                    args.path,
                                    args.importer,
                                );

                                if (resolvedByCustomResolver) {
                                    return { path: resolvedByCustomResolver };
                                }

                                return {
                                    path: args.path,
                                    external: true,
                                };
                            });

                            build.onLoad({ filter: /\.ts$/ }, async (args) => {
                                const sourceText = await Bun.file(
                                    args.path,
                                ).text();
                                const declarationResult = isolatedDeclaration(
                                    args.path,
                                    sourceText,
                                );

                                for (const error of declarationResult.errors) {
                                    errors.push({
                                        error,
                                        file: args.path,
                                        content: sourceText,
                                    });
                                }

                                const fakeJsContent = dtsToFakeJs(
                                    declarationResult.code,
                                );

                                return {
                                    loader: "js",
                                    contents: fakeJsContent,
                                };
                            });
                        },
                    },
                ],
            });
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
