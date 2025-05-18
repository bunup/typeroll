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
     * Show warnings instead of errors for isolatedDeclarations issues
     * When true, the build will not fail on isolatedDeclarations errors
     * @default false
     */
    warnInsteadOfError?: boolean;
    /**
     * The directory where the plugin will look for the `tsconfig.json` file and `node_modules`
     * By default, the current working directory will be used
     */
    cwd?: string;
};
