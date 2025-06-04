import fs from 'node:fs/promises'
import path from 'node:path'
import type { BunPlugin } from 'bun'
import { isolatedDeclaration } from 'oxc-transform'
import { resolveTsImportPath } from 'ts-import-resolver'
import { dtsToFakeJs, fakeJsToDts } from './fake-js'
import type { IsolatedDeclarationError } from './isolated-decl-error'
import { handleBunBuildLogs } from './logger'
import { NODE_MODULES_RE } from './re'
import { createResolver } from './resolver'
import type { GenerateDtsOptions, GenerateDtsResult } from './types'
import {
	cleanPath,
	generateRandomString,
	getDeclarationExtension,
	getExtension,
	isTypeScriptFile,
	loadTsConfig,
	replaceExtension,
} from './utils'

/**
 * Generate a declaration file for a given entry point
 * @param entrypoints - The entry points to generate a declaration file for
 * @param options - The options for generating the declaration file
 * @returns The generated declaration file and any errors that occurred
 */
export async function generateDts(
	entrypoints: string[],
	options: GenerateDtsOptions = {},
): Promise<GenerateDtsResult[]> {
	const { preferredTsConfigPath, resolve } = options
	const cwd = options.cwd ?? process.cwd()

	const tempOutDir = path.resolve(
		path.join(cwd, `.bun-dts-${generateRandomString()}`),
	)

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

					for (const error of declarationResult.errors) {
						collectedErrors.push({
							error,
							file: args.path,
							content: sourceText,
						})
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
		entrypoints: entrypoints.map((entry) => path.join(cwd, entry)),
		outdir: tempOutDir,
		format: 'esm',
		target: 'node',
		splitting: options.splitting,
		plugins: [fakeJsPlugin],
		naming: options.naming,
		throw: false,
		packages: 'external',
		minify: {
			whitespace: true,
			syntax: true,
		},
	})

	handleBunBuildLogs(result.logs)

	const outputs = result.outputs.filter(
		(output) => output.kind === 'chunk' || output.kind === 'entry-point',
	)
	const results: GenerateDtsResult[] = []

	for (const output of outputs) {
		const bundledFakeJsPath = output.path
		const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text()

		const dtsContent = isolatedDeclaration(
			'treeshake.d.ts',
			await fakeJsToDts(bundledFakeJsContent),
		)

		results.push({
			kind: output.kind === 'entry-point' ? 'entry-point' : 'chunk',
			entry:
				output.kind === 'entry-point' ? entrypoints[results.length] : undefined,
			chunkFileName:
				output.kind === 'chunk'
					? path.basename(output.path).replace('.js', '.d.ts')
					: undefined,
			outputPath: cleanPath(
				replaceExtension(
					cleanPath(output.path).replace(`${cleanPath(tempOutDir)}/`, ''),
					getDeclarationExtension(getExtension(output.path)),
				),
			),
			dts: dtsContent.code,
			errors: collectedErrors,
		})
	}

	try {
		await fs.rm(tempOutDir, { recursive: true, force: true })
	} catch {}

	return results
}
