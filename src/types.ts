import type _Bun from "bun";

type Arrayable<T> = T | T[];

type Bun = typeof _Bun;

export type BuildOptions = Parameters<Bun["build"]>[0];
export type BunPlugin = Exclude<BuildOptions["plugins"], undefined>[number];
export type BunPluginBuild = Parameters<BunPlugin["setup"]>[0];

export type Entry = Arrayable<string> | Record<string, string>;
export type Resolve = boolean | (string | RegExp)[];

/**
 * Options for generating declaration files
 */
export type GenerateDtsOptions = {
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
    /**
     * Custom entry points to use instead of the ones from the build config
     * Can be a string, array of strings, or an object mapping output names to input paths
     *
     * @example
     * // Single entry point
     * entry: "src/index.ts"
     *
     * @example
     * // Multiple entry points
     * entry: ["src/index.ts", "src/other.ts"]
     *
     * @example
     * // Named entry points (custom output paths)
     * entry: {
     *   "api": "src/api/v1/index.ts",   // Outputs to dist/api.d.ts
     *   "nested/types": "src/types.ts"  // Outputs to dist/nested/types.d.ts
     * }
     */
    entry?: Entry;
    /**
     * Show warnings instead of errors for isolatedDeclarations issues
     * When true, the build will not fail on isolatedDeclarations errors
     * @default false
     */
    warnInsteadOfError?: boolean;
    /**
     * The directory where the plugin will look for the `tsconfig.json` file and `node_modules`
     * By default, the build config's root or the current working directory will be used
     */
    cwd?: string;
    /**
     * Callback function that is called when a declaration file is generated
     * @param filePath The path to the generated declaration file
     * @param content The content of the generated declaration file
     */
    onDeclarationGenerated?: (
        filePath: string,
        content: string,
    ) => void | Promise<void>;
};
