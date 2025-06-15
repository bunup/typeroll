import type { BunPlugin } from 'bun'
import { generateDts } from './generate'
import { logIsolatedDeclarationErrors } from './isolated-decl-error'
import type { DtsPluginOptions, Naming } from './options'
import { ensureArray } from './utils'

/**
 * A bun plugin that generates TypeScript declaration files (.d.ts) for your entrypoints.
 *
 * @param options - Configuration options for the dts plugin
 */
export function dts(options: DtsPluginOptions = {}): BunPlugin {
	return {
		name: 'dts',
		setup(build) {
			const { entry, splitting, ...generateDtsOptions } = options

			build.onStart(async () => {
				const result = await generateDts(
					ensureArray(entry ?? build.config.entrypoints),
					{
						cwd: build.config.root,
						naming: build.config.naming as Naming,
						...generateDtsOptions,
						splitting: splitting ?? build.config.splitting,
					},
				)

				options.onDeclarationsGenerated?.({
					buildConfig: build.config,
					result,
				})

				if (result.errors.length > 0) {
					logIsolatedDeclarationErrors(result.errors, {
						shouldExit: true,
					})
				}

				for (const file of result.files) {
					await Bun.write(`${build.config.outdir}/${file.outputPath}`, file.dts)
				}
			})
		},
	}
}
