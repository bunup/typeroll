import { isolatedDeclaration } from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs } from "./fake/dts-to-fake-js";
import { fakeJsToDts } from "./fake/fake-js-to-dts";
import { createResolver } from "./resolver";
import type { BunPlugin, GenerateDtsOptions } from "./types";
import { loadTsConfig } from "./utils";

export function dts(options: GenerateDtsOptions = {}): BunPlugin {
    return {
        name: "dts",
        async setup(build) {
            const { preferredTsConfigPath, resolve, entry } = options;
            const rootDir = build.config.root ?? process.cwd();

            const tsconfig = await loadTsConfig(rootDir, preferredTsConfigPath);

            const resolver = createResolver({
                tsconfig: tsconfig.filepath,
                cwd: rootDir,
                resolveOption: resolve,
            });

            const naming =
                (typeof build.config.naming === "string"
                    ? build.config.naming
                    : build.config.naming?.entry) ?? "[dir]/[name].js";

            const result = await Bun.build({
                entrypoints: entry ?? build.config.entrypoints,
                outdir: build.config.outdir,
                format: "esm",
                target: "node",
                packages: "external",
                splitting: false,
                naming: naming.replace(
                    /\.(js|mjs|cjs|\[ext\])/g,
                    "-dts-fake-js-temp.$1",
                ),
                plugins: [
                    {
                        name: "core",
                        setup(build) {
                            build.onResolve({ filter: /.*/ }, (args) => {
                                const resolved = resolveTsImportPath({
                                    importer: args.importer,
                                    path: args.path,
                                    rootDir: args.resolveDir,
                                    tsconfig: null,
                                });

                                if (!resolved) {
                                    const resolved = resolver(
                                        args.path,
                                        args.importer,
                                    );
                                    if (!resolved) {
                                        return {
                                            path: args.path,
                                            external: true,
                                        };
                                    }
                                    return { path: resolved };
                                }

                                return { path: resolved };
                            });

                            build.onLoad({ filter: /\.ts$/ }, async (args) => {
                                const text = await Bun.file(args.path).text();
                                const dts = isolatedDeclaration(
                                    args.path,
                                    text,
                                );
                                return {
                                    loader: "js",
                                    contents: dtsToFakeJs(dts.code),
                                };
                            });
                        },
                    },
                ],
            });

            const outputPath = result.outputs[0].path;

            const outputContent = await Bun.file(outputPath).text();

            const dts = fakeJsToDts(outputContent);

            const dtsOutputPath = outputPath.replace(
                /-dts-fake-js-temp\.([cm]?js)$/,
                (_, ext) => {
                    if (ext === "mjs") return ".d.mts";
                    if (ext === "cjs") return ".d.cts";
                    return ".d.ts";
                },
            );

            await Bun.write(dtsOutputPath, dts);

            await Bun.file(outputPath).delete();
        },
    };
}
