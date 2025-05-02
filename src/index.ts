import {
    type IsolatedDeclarationsOptions,
    type IsolatedDeclarationsResult,
    isolatedDeclaration,
} from "oxc-transform";
import { bundleTs } from "./bundle";

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
export type GenerateDtsResult = IsolatedDeclarationsResult;

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
    const {
        rootDir = process.cwd(),
        preferredTsConfigPath,
        resolve,
        ...isolatedDeclarationOptions
    } = options;

    const bundle = await bundleTs(entryFilePath, {
        rootDir,
        preferredTsConfigPath: options.preferredTsConfigPath,
        resolve: options.resolve,
    });

    const result = isolatedDeclaration(
        entryFilePath,
        bundle,
        isolatedDeclarationOptions,
    );

    return result;
}

export default generateDts;
