import type { BuildConfig } from 'bun'
import type { IsolatedDeclarationError } from './isolated-decl-error'

export type Resolve = boolean | (string | RegExp)[]

export type Naming =
	| string
	| {
			entry: string
			chunk: string
	  }

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
	/**
	 * Customizes the generated file names
	 * Defaults to './[dir]/[name].[ext]'
	 *
	 * Supports the following tokens:
	 * - [name] - The name of the entrypoint file, without the extension
	 * - [ext] - The extension of the generated bundle
	 * - [hash] - A hash of the bundle contents
	 *
	 * Can be a string template or an object with separate templates for entry points and chunks
	 *
	 * @example
	 * naming: "[dir]/[name]-[hash].[ext]"
	 *
	 * @example
	 * naming: {
	 *   entry: "[dir]/[name].[ext]",
	 *   chunk: "[name]-[hash].[ext]",
	 * }
	 */
	naming?: Naming
	/**
	 * Whether to split declaration files when multiple entrypoints import the same files,
	 * modules, or share types. When enabled, shared types will be extracted to separate
	 * .d.ts files, and other declaration files will import these shared files.
	 *
	 * This helps reduce bundle size by preventing duplication of type definitions
	 * across multiple entrypoints.
	 */
	splitting?: boolean
	/**
	 * Whether to allow globs in the entrypoints
	 */
	allowGlobs?: boolean
}

/**
 * Result of the generateDts function
 */
export type GenerateDtsResult = {
	/**
	 * The kind of declaration file.
	 * - 'entry-point': The declaration file for an entry point
	 * - 'chunk': A declaration file created when code splitting is enabled
	 */
	kind: 'entry-point' | 'chunk'
	/**
	 * The entry point that was used to generate the declaration file.
	 *
	 * This will only be available if the kind is 'entry-point' and not for chunk declaration files.
	 */
	entry: string | undefined
	/**
	 * If the kind is 'chunk', this is the name of the chunk file.
	 */
	chunkFileName: string | undefined

	/**
	 * The output path of the declaration file relative to the output directory.
	 * This is the directory where you want to save the declaration file.
	 * When saving the declaration file, you should use this path to save it
	 * in the output directory you decide.
	 *
	 * This is particularly useful when splitting is enabled, as some declaration
	 * files import chunk files. Saving to this path ensures the import paths
	 * are correct.
	 *
	 * This is the recommended approach when saving declaration files to the
	 * output directory.
	 *
	 * @example
	 * await Bun.write(`dist/${result.outputPath}`, result.dts)
	 */
	outputPath: string
	/**
	 * The generated declaration file
	 */
	dts: string
	/**
	 * The errors that occurred during the generation
	 */
	errors: IsolatedDeclarationError[]
}

/**
 * Result object passed to the onDeclarationsGenerated callback
 */
export type OnDeclarationsGeneratedResult = {
	/**
	 * The Bun build configuration at the time of generation
	 */
	buildConfig: BuildConfig
	/**
	 * The generated declaration files with their relevant information
	 */
	results: GenerateDtsResult[]
}

/**
 * Options for the dts plugin
 */
export type DtsPluginOptions = {
	/**
	 * The entry points to generate declaration files for
	 * Can be a string, array of strings
	 */
	entry?: string | string[]
	/**
	 * Whether to log isolated declaration warnings to the console
	 */
	logIsolatedDeclarationWarnings?: boolean
	/**
	 * Callback function that is invoked when declaration files are generated.
	 * This function receives the generated declaration results.
	 *
	 * @param results The array of generated declaration results
	 */
	onDeclarationsGenerated?: (result: OnDeclarationsGeneratedResult) => void
} & GenerateDtsOptions
