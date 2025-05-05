import { isolatedDeclaration } from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs } from "./fake/dts-to-fake-js";
import { fakeJsToDts } from "./fake/fake-js-to-dts";
import { createResolver } from "./resolver";
import type { BunPlugin, BunPluginBuild, GenerateDtsOptions } from "./types";
import { getDeclarationExtension, loadTsConfig, randomId } from "./utils";

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

    const defaultNaming = "[dir]/[name].js";
    const configNaming = build.config.naming;
    const entryNaming =
        typeof configNaming === "string" ? configNaming : configNaming?.entry;
    const naming = entryNaming ?? defaultNaming;

    const tempName = `-${randomId()}-dts-fake`;
    const tempFilePattern = new RegExp(`${tempName}\\.([cm]?js)$`);

    const result = await Bun.build({
        entrypoints: entry ?? build.config.entrypoints,
        outdir: build.config.outdir,
        format: "esm",
        target: "node",
        packages: "external",
        splitting: false,
        naming: naming.replace(/\.(js|mjs|cjs|\[ext\])/g, `${tempName}.$1`),
        plugins: [createFakeJsPlugin(resolver)],
    });

    const bundledFakeJsPath = result.outputs[0].path;
    const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text();
    const dtsContent = fakeJsToDts(bundledFakeJsContent);

    const finalDtsPath = bundledFakeJsPath.replace(tempFilePattern, (_, ext) =>
        getDeclarationExtension(ext),
    );

    await Bun.write(finalDtsPath, dtsContent);
    await Bun.file(bundledFakeJsPath).delete();
}

export function createFakeJsPlugin(
    resolver: ReturnType<typeof createResolver>,
): BunPlugin {
    return {
        name: "fake-js",
        setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
                const resolved = resolveTsImportPath({
                    importer: args.importer,
                    path: args.path,
                    rootDir: args.resolveDir,
                    tsconfig: null,
                });

                if (resolved) {
                    return { path: resolved };
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
                const sourceText = await Bun.file(args.path).text();
                const declarationResult = isolatedDeclaration(
                    args.path,
                    sourceText,
                );
                const fakeJsContent = dtsToFakeJs(declarationResult.code);

                return {
                    loader: "js",
                    contents: fakeJsContent,
                };
            });
        },
    };
}
