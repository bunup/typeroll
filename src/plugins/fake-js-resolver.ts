import type { BunPlugin } from "bun";
import { isolatedDeclaration } from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs } from "../fake";
import type { IsolatedDeclarationError } from "../isolated-decl-error";
import { createResolver } from "../resolver";
import type { Resolve } from "../types";
import { NODE_MODULES_REGEX } from "../utils";

export interface FakeJsResolverPluginOptions {
    rootDir: string;
    tsconfig: {
        filepath: string | null;
        config: Record<string, unknown> | null;
    };
    resolveOption?: Resolve;
}

export function createFakeJsResolver(options: FakeJsResolverPluginOptions): {
    fakeJsResolver: BunPlugin;
    getErrors: () => IsolatedDeclarationError[];
} {
    const { rootDir, tsconfig, resolveOption } = options;
    const collectedErrors: IsolatedDeclarationError[] = [];

    const resolver = createResolver({
        tsconfig: tsconfig.filepath,
        cwd: rootDir,
        resolveOption,
    });

    const fakeJsResolver: BunPlugin = {
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
            });
        },
    };

    return {
        fakeJsResolver,
        getErrors: () => collectedErrors,
    };
}
