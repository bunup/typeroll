import type { BunPlugin } from "bun";
import { isolatedDeclaration } from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs } from "./fakejs-utils";
import type { IsolatedDeclarationError } from "./isolated-decl-error";
import { createResolver } from "./resolver";
import type { Resolve } from "./types";
import { NODE_MODULES_REGEX, isTypeScriptFile } from "./utils";

export interface FakeJsPluginOptions {
    cwd: string;
    tsconfig: {
        filepath: string | null;
        config: Record<string, unknown> | null;
    };
    resolveOption?: Resolve;
}

export function createFakeJsPlugin(options: FakeJsPluginOptions): {
    fakeJsPlugin: BunPlugin;
    getErrors: () => IsolatedDeclarationError[];
} {
    const { cwd, tsconfig, resolveOption } = options;
    const collectedErrors: IsolatedDeclarationError[] = [];

    const resolver = createResolver({
        tsconfig: tsconfig.filepath,
        cwd,
        resolveOption,
    });

    const fakeJsPlugin: BunPlugin = {
        name: "fake-js",
        setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
                if (!NODE_MODULES_REGEX.test(args.importer)) {
                    const resolved = resolveTsImportPath({
                        importer: args.importer,
                        path: args.path,
                        cwd,
                        tsconfig: tsconfig.config,
                    });

                    if (resolved && isTypeScriptFile(resolved)) {
                        return { path: resolved };
                    }
                }

                const resolvedFromNodeModules = resolver(
                    args.path,
                    args.importer,
                );

                if (resolvedFromNodeModules) {
                    return { path: resolvedFromNodeModules };
                }

                return {
                    path: args.path,
                    external: true,
                };
            });

            build.onLoad(
                { filter: /\.(ts|tsx|d\.ts|d\.mts|d\.cts)$/ },
                async (args) => {
                    const sourceText = await Bun.file(args.path).text();
                    const declarationResult = isolatedDeclaration(
                        args.path,
                        sourceText,
                    );

                    for (const error of declarationResult.errors) {
                        collectedErrors.push({
                            error,
                            file: args.path,
                            content: sourceText,
                        });
                    }

                    const fakeJsContent = dtsToFakeJs(declarationResult.code);

                    return {
                        loader: "js",
                        contents: fakeJsContent,
                    };
                },
            );
        },
    };

    return {
        fakeJsPlugin,
        getErrors: () => collectedErrors,
    };
}
