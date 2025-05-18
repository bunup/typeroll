import type { IsolatedDeclarationError } from "./isolated-decl-error";

export type Resolve = boolean | (string | RegExp)[];

/**
 * Options for generating declaration file
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
     * The directory where the plugin will look for the `tsconfig.json` file and `node_modules`
     * By default, the current working directory will be used
     */
    cwd?: string;
};

/**
 * Result of the generateDts function
 */
export type GenerateDtsResult = {
    /**
     * The generated declaration file
     */
    dts: string;
    /**
     * The errors that occurred during the generation
     */
    errors: IsolatedDeclarationError[];
};
