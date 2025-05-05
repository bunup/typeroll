import type _Bun from "bun";

type Bun = typeof _Bun;
export type BuildOptions = Parameters<Bun["build"]>[0];
export type BunPlugin = Exclude<BuildOptions["plugins"], undefined>[number];
export type BunPluginBuild = Parameters<BunPlugin["setup"]>[0];

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
     */
    entry?: string[];
};
