import type { IsolatedDeclarationsOptions } from "oxc-transform";

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
