import { isolatedDeclaration } from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs } from "./fake/dts-to-fake-js";
import { fakeJsToDts } from "./fake/fake-js-to-dts";
import {
    type IsolatedDeclarationError,
    logIsolatedDeclarationError,
} from "./isolated-decl-error";
import { createResolver } from "./resolver";
import type { BunPluginBuild, GenerateDtsOptions } from "./types";
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

    const errors: IsolatedDeclarationError[] = [];

    const result = await Bun.build({
        entrypoints: entry ?? build.config.entrypoints,
        outdir: build.config.outdir,
        format: "esm",
        target: "node",
        packages: "external",
        splitting: false,
        naming: naming.replace(/\.(js|mjs|cjs|\[ext\])/g, `${tempName}.$1`),
        plugins: [
            {
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

    const bundledFakeJsPath = result.outputs[0].path;
    const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text();

    await Bun.file(bundledFakeJsPath).delete();

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
            process.exit(1);
        }
    }

    const dtsContent = fakeJsToDts(bundledFakeJsContent);

    const finalDtsPath = bundledFakeJsPath.replace(tempFilePattern, (_, ext) =>
        getDeclarationExtension(ext),
    );

    await Bun.write(finalDtsPath, dtsContent);
}
