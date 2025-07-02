#!/usr/bin/env bun

import fs from 'node:fs/promises'
import path from 'node:path'
import cac from 'cac'
import pc from 'picocolors'
import { version } from '../package.json'
import { logIsolatedDeclarationErrors } from './isolated-decl-logger'
import { formatFileSize } from './utils'

const cli = cac()

async function main() {
	cli
		.command(
			'[...entrypoints]',
			'Generate TypeScript declaration (.d.ts) files from your source code',
			{
				ignoreOptionDefaultValue: true,
			},
		)
		.option(
			'-o, --outDir <outDir>',
			'Directory where declaration files will be written',
			{
				default: 'dist',
			},
		)
		.option(
			'-s, --splitting',
			'Enable code splitting to avoid duplicating shared types across multiple entry points',
			{
				default: false,
			},
		)
		.option(
			'-m, --minify',
			'Enable all minification options to reduce declaration file size',
			{
				default: false,
			},
		)
		.option(
			'-mj, --minify-jsdoc',
			'Remove JSDoc comments from declaration files',
			{
				default: false,
			},
		)
		.option(
			'-mw, --minify-whitespace',
			'Remove unnecessary whitespace and newlines from declaration files',
			{
				default: false,
			},
		)
		.option(
			'-mi, --minify-identifiers',
			'Shorten internal type variable names to reduce file size',
			{
				default: false,
			},
		)
		.option(
			'-c, --clean',
			'Remove existing files from output directory before generating new declarations',
			{
				default: true,
			},
		)
		.option(
			'-ra, --resolve-all',
			'Resolve and include all external type dependencies in the output',
			{
				default: false,
			},
		)
		.option(
			'-r, --resolve <resolve>',
			'Resolve specific external type dependencies (comma-separated package names)',
		)
		.action(async (entrypoints, options) => {
			const { generateDts } = await import('./generate')

			const outDir = options.outDir ?? 'dist'
			const clean = options.clean ?? true
			const resolve = options.resolveAll
				? true
				: options.resolve
					? ensureArray(options.resolve)
					: false

			const startTime = performance.now()

			const result = await generateDts(entrypoints, {
				splitting: options.splitting,
				minify:
					typeof options.minify === 'boolean'
						? options.minify
						: {
								jsDoc: options.minifyJSDoc,
								whitespace: options.minifyWhitespace,
								identifiers: options.minifyIdentifiers,
							},
				resolve,
			})

			if (clean) {
				await fs.rm(outDir, { recursive: true, force: true })
			}

			if (result.errors.length > 0) {
				logIsolatedDeclarationErrors(result.errors, {
					shouldExit: true,
				})
			}

			for (const file of result.files) {
				console.log(
					`${pc.green('✓')} ${pc.gray(outDir)}/${file.outputPath} ${pc.green(
						formatFileSize(file.dts.length),
					)}`,
				)
				await Bun.write(path.join(outDir, file.outputPath), file.dts)
			}

			const endTime = performance.now()
			console.log(
				`${pc.green('✓')} Build completed in ${pc.green(
					`${(endTime - startTime).toFixed()}ms`,
				)}`,
			)
		})

	cli.help()

	cli.version(version)

	cli.parse(Bun.argv, { run: false })
	await cli.runMatchedCommand()
}

function ensureArray(value: unknown): string[] {
	if (typeof value === 'string') {
		return value.split(',')
	}
	return []
}

main()
