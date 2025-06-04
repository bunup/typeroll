import type { BunPlugin } from 'bun'
import { generateDts } from './generate'
import { logIsolatedDeclarationErrors } from './isolated-decl-error'
import type { DtsPluginOptions, Naming } from './types'
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
			const { entry, ...generateDtsOptions } = options

			build.onStart(async () => {
				const results = await generateDts(
					ensureArray(entry ?? build.config.entrypoints),
					{
						cwd: build.config.root,
						splitting: build.config.splitting,
						naming: build.config.naming as Naming,
						...generateDtsOptions,
					},
				)

				options.onDeclarationsGenerated?.({
					buildConfig: build.config,
					results,
				})

				for (const result of results) {
					if (result.errors.length > 0) {
						logIsolatedDeclarationErrors(result.errors, {
							shouldExit: true,
						})
					}

					await Bun.write(
						`${build.config.outdir}/${result.outputPath}`,
						result.dts,
					)
				}
			})
		},
	}
}
