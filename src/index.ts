import {
    type IsolatedDeclarationsOptions,
    isolatedDeclaration,
} from "oxc-transform";
import { resolveTsImportPath } from "ts-import-resolver";
import { dtsToFakeJs, fakeJsToDts } from "./fake";
import { createResolver } from "./resolver";
import { loadTsConfig } from "./utils";

export type Resolve = boolean | (string | RegExp)[];

/**
 * Options for generating declaration files
 */
export type GenerateDtsOptions = {
    /**
     * Root directory of the project
     * @default process.cwd()
     */
    rootDir?: string;
    /**
     * Path to the preferred tsconfig.json file
     * By default, the closest tsconfig.json file will be used
     */
    preferredTsConfigPath?: string;
    /**
     * Controls which external modules should be resolved
     * - `true` to resolve all external modules
     * - Array of strings or RegExp to match specific modules
     * - `false` or `undefined` to disable external resolution
     */
    resolve?: Resolve;
} & IsolatedDeclarationsOptions;

/**
 * Result of the declaration file generation
 */
export type GenerateDtsResult = string;

/**
 * Generates TypeScript declaration files (.d.ts) from TypeScript source files
 *
 * @param entryFilePath - Path to the entry TypeScript file
 * @param options - Options for declaration generation
 * @returns Promise resolving to the generated declaration result
 *
 * @example
 * ```ts
 * const result = await generateDts('src/index.ts', {
 *   rootDir: process.cwd(),
 *   resolve: true
 * });
 *
 * fs.writeFileSync('dist/index.d.ts', result.code);
 * ```
 */
export async function generateDts(
    entryFilePath: string,
    options: GenerateDtsOptions = {},
): Promise<GenerateDtsResult> {
    const { rootDir = process.cwd(), preferredTsConfigPath, resolve } = options;

    const tsconfig = await loadTsConfig(rootDir, preferredTsConfigPath);

    const resolver = createResolver({
        tsconfig: tsconfig.filepath,
        cwd: rootDir,
        resolveOption: resolve,
    });

    await Bun.build({
        entrypoints: [entryFilePath],
        outdir: "./dist",
        format: "esm",
        splitting: false,
        plugins: [
            {
                name: "bun-plugin-typescript",
                setup(build) {
                    build.onResolve({ filter: /.*/ }, (args) => {
                        const resolved = resolveTsImportPath({
                            importer: args.importer,
                            path: args.path,
                            rootDir: args.resolveDir,
                            tsconfig: null,
                        });

                        if (!resolved) {
                            const resolved = resolver(args.path, args.importer);
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
                        const dts = isolatedDeclaration(args.path, text);
                        return {
                            loader: "js",
                            contents: dtsToFakeJs(dts.code),
                        };
                    });
                },
            },
        ],
    });

    const result = await Bun.file("./dist/index.js").text();

    return fakeJsToDts(result);
}
