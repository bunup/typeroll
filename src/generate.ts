import fs from 'node:fs/promises'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { isolatedDeclaration } from 'oxc-transform'
import { resolveTsImportPath } from 'ts-import-resolver'
import type { IsolatedDeclarationError } from './error-logger'
import { dtsToFakeJs, fakeJsToDts } from './fake-js'
import { handleBunBuildLogs } from './logger'
import type {
	GenerateDtsOptions,
	GenerateDtsResult,
	GenerateDtsResultFile,
} from './options'
import { NODE_MODULES_RE } from './re'
import { createResolver } from './resolver'
import {
	cleanPath,
	deleteExtension,
	generateRandomString,
	getDeclarationExtension,
	getExtension,
	getFilesFromGlobs,
	isTypeScriptFile,
	loadTsConfig,
	replaceExtension,
} from './utils'

/**
 * Generate a declaration file for a given entry point
 * @param entrypoints - The entry points to generate a declaration file for.
 * Supports glob patterns (e.g. "src/**\/*.ts") and exclude patterns (e.g. "!src/**\/*.test.ts")
 * @param options - The options for generating the declaration file
 * @returns The generated declaration file and any errors that occurred
 */
export async function generateDts(
	entrypoints: string[],
	options: GenerateDtsOptions = {},
): Promise<GenerateDtsResult> {
	const { preferredTsConfigPath, resolve } = options
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()

	const tempOutDir = path.resolve(
		path.join(cwd, `.typeroll-${generateRandomString()}`),
	)

	const nonAbsoluteEntrypoints = entrypoints.filter(
		(entrypoint) => !path.isAbsolute(entrypoint),
	)

	const resolvedEntrypoints = await getFilesFromGlobs(
		nonAbsoluteEntrypoints,
		cwd,
	)

	const absoluteEntrypoints = entrypoints.filter((entrypoint) =>
		path.isAbsolute(entrypoint),
	)

	if (![...resolvedEntrypoints, ...absoluteEntrypoints].length) {
		throw new Error(
			'The dts entrypoints you provided do not exist. Please make sure the entrypoints point to valid files.',
		)
	}

	const tsconfig = await loadTsConfig(cwd, preferredTsConfigPath)

	const collectedErrors: IsolatedDeclarationError[] = []

	const resolver = createResolver({
		tsconfig: tsconfig.filepath,
		cwd,
		resolveOption: resolve,
	})

	const fakeJsPlugin: BunPlugin = {
		name: 'fake-js',
		setup(build) {
			build.onResolve({ filter: /.*/ }, (args) => {
				if (!NODE_MODULES_RE.test(args.importer)) {
					const resolved = resolveTsImportPath({
						importer: args.importer,
						path: args.path,
						cwd,
						tsconfig: tsconfig.config,
					})

					if (resolved && isTypeScriptFile(resolved)) {
						return { path: resolved }
					}
				}

				const resolvedFromNodeModules = resolver(args.path, args.importer)

				if (resolvedFromNodeModules) {
					return { path: resolvedFromNodeModules }
				}

				return {
					path: args.path,
					external: true,
				}
			})

			build.onLoad(
				{ filter: /\.(ts|tsx|d\.ts|d\.mts|d\.cts)$/ },
				async (args) => {
					const sourceText = await Bun.file(args.path).text()
					const declarationResult = isolatedDeclaration(args.path, sourceText)

					if (!collectedErrors.some((e) => e.file === args.path)) {
						for (const error of declarationResult.errors) {
							collectedErrors.push({
								error,
								file: args.path,
								content: sourceText,
							})
						}
					}

					const fakeJsContent = await dtsToFakeJs(declarationResult.code)

					return {
						loader: 'js',
						contents: fakeJsContent,
					}
				},
			)
		},
	}

	const result = await Bun.build({
		entrypoints: [
			...resolvedEntrypoints.map((entry) =>
				path.resolve(path.join(cwd, entry)),
			),
			...absoluteEntrypoints,
		],
		outdir: tempOutDir,
		format: 'esm',
		target: 'node',
		splitting: options.splitting,
		plugins: [fakeJsPlugin],
		throw: false,
		packages: 'external',
		minify: options.minify,
	})

	handleBunBuildLogs(result.logs)

	try {
		const outputs = result.outputs.filter(
			(output) => output.kind === 'chunk' || output.kind === 'entry-point',
		)

		const bundledFiles: GenerateDtsResultFile[] = []

		for (const output of outputs) {
			const bundledFakeJsPath = output.path
			const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text()

			const dtsContent = isolatedDeclaration(
				'treeshake.d.ts',
				await fakeJsToDts(bundledFakeJsContent),
			)

			const entrypoint =
				output.kind === 'entry-point'
					? entrypoints[bundledFiles.length]
					: undefined

			const chunkFileName =
				output.kind === 'chunk'
					? replaceExtension(
							path.basename(output.path),
							getDeclarationExtension(getExtension(output.path)),
						)
					: undefined

			const outputPath = cleanPath(
				replaceExtension(
					cleanPath(output.path).replace(`${cleanPath(tempOutDir)}/`, ''),
					getDeclarationExtension(getExtension(output.path)),
				),
			)

			bundledFiles.push({
				kind: output.kind === 'entry-point' ? 'entry-point' : 'chunk',
				entrypoint,
				chunkFileName,
				outputPath,
				dts: dtsContent.code,
				pathInfo: {
					outputPathWithoutExtension: deleteExtension(outputPath),
					ext: getExtension(outputPath),
				},
			})
		}

		return {
			files: bundledFiles,
			errors: collectedErrors,
		}
	} catch (error) {
		console.error(error)
		return {
			files: [],
			errors: collectedErrors,
		}
	} finally {
		await fs.rm(tempOutDir, { recursive: true, force: true })
	}
}
