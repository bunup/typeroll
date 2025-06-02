import type { IsolatedDeclarationError } from './isolated-decl-error'

type Arrayable<T> = T | T[]

export type Resolve = boolean | (string | RegExp)[]

/**
 * Options for generating declaration file
 */
export type GenerateDtsOptions = {
	/**
	 * Path to the preferred tsconfig.json file
	 * By default, the closest tsconfig.json file will be used
	 */
	preferredTsConfigPath?: string
	/**
	 * Controls which external modules should be resolved
	 * - `true` to resolve all external modules
	 * - Array of strings or RegExp to match specific modules
	 * - `false` or `undefined` to disable external resolution
	 */
	resolve?: Resolve
	/**
	 * The directory where the plugin will look for the `tsconfig.json` file and `node_modules`
	 * By default, the current working directory will be used
	 */
	cwd?: string
}

/**
 * Result of the generateDts function
 */
export type GenerateDtsResult = {
	/**
	 * The generated declaration file
	 */
	dts: string
	/**
	 * The errors that occurred during the generation
	 */
	errors: IsolatedDeclarationError[]
}

export type Entry = Arrayable<string> | Record<string, string>

/**
 * Options for the dts plugin
 */
export type DtsPluginOptions = {
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
	entry?: Entry
} & GenerateDtsOptions
