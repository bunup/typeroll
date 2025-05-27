import fs from 'node:fs/promises'
import { createFakeJsPlugin } from './fakejs-plugin'
import { fakeJsToDts } from './fakejs-utils'
import type { IsolatedDeclarationError } from './isolated-decl-error'
import type { GenerateDtsOptions, GenerateDtsResult } from './types'
import { generateRandomString, loadTsConfig } from './utils'

/**
 * Generate a declaration file for a given entry point
 * @param entry - The entry point to generate a declaration file for
 * @param options - The options for generating the declaration file
 * @returns The generated declaration file and any errors that occurred
 */
export async function generateDts(
	entry: string,
	options: GenerateDtsOptions = {},
): Promise<GenerateDtsResult> {
	const { preferredTsConfigPath, resolve } = options
	const cwd = options.cwd ?? process.cwd()

	const tempOutDir = `${cwd}/.bun-dts-${generateRandomString()}`

	const tsconfig = await loadTsConfig(cwd, preferredTsConfigPath)

	const errors: IsolatedDeclarationError[] = []

	const { fakeJsPlugin, getErrors } = createFakeJsPlugin({
		cwd,
		tsconfig: {
			filepath: tsconfig.filepath,
			config: tsconfig.config,
		},
		resolveOption: resolve,
	})

	const result = await Bun.build({
		entrypoints: [`${cwd}/${entry}`],
		outdir: tempOutDir,
		format: 'esm',
		target: 'node',
		splitting: false,
		plugins: [fakeJsPlugin],
	})

	const pluginErrors = getErrors()

	if (pluginErrors.length > 0) {
		errors.push(...pluginErrors)
	}

	const output = result.outputs[0]

	const bundledFakeJsPath = output.path
	const bundledFakeJsContent = await Bun.file(bundledFakeJsPath).text()

	try {
		await fs.rm(tempOutDir, { recursive: true, force: true })
	} catch {}

	const dtsContent = fakeJsToDts(bundledFakeJsContent)

	return { dts: dtsContent, errors }
}
