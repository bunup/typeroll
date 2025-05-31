import type { BunPlugin } from 'bun'
import { generateDts } from '../generate'
import { logIsolatedDeclarationErrors } from '../isolated-decl-error'
import type { DtsPluginOptions } from '../types'
import { getOutputDtsPath, normalizeEntry } from './utils'

/**
 * A bun plugin that generates TypeScript declaration files (.d.ts) for your entrypoints.
 *
 * @param options - Configuration options for the dts plugin
 */
export function dts(options: DtsPluginOptions = {}): BunPlugin {
	return {
		name: 'dts',
		async setup(build) {
			const { entry, warnInsteadOfError, ...generateDtsOptions } = options

			const entries = normalizeEntry(entry ?? build.config.entrypoints)

			for (const entry of entries) {
				const { dts, errors } = await generateDts(entry.fullPath, {
					cwd: build.config.root,
					...generateDtsOptions,
				})

				if (errors.length > 0) {
					logIsolatedDeclarationErrors(errors, {
						shouldExit: true,
						warnInsteadOfError,
					})
				}

				const outputPath = await getOutputDtsPath(entry, build.config)

				await Bun.write(outputPath, dts)
			}
		},
	}
}
