import { basename, dirname, extname, join } from 'node:path'
import type { BuildConfig } from 'bun'
import type { Entry } from '../types'
import { DEFAULT_NAMING_STRING, DEFAULT_OUTPUT_DIR } from './constants'

export function getExtension(filePath: string): string {
	if (!filePath) return ''

	const ext = extname(filePath)
	return ext
}

export function replaceExtension(path: string, extension: string): string {
	if (!path) return path

	const normalizedExtension = extension.startsWith('.')
		? extension
		: `.${extension}`

	if (!path.includes('.')) {
		return `${path}${normalizedExtension}`
	}

	const dir = dirname(path)
	const fileNameWithoutExt = basename(path, extname(path))

	return join(dir, `${fileNameWithoutExt}${normalizedExtension}`)
}

function getNamingString(naming: BuildConfig['naming']): string {
	if (typeof naming === 'string') return naming
	if (typeof naming === 'object' && naming.entry) return naming.entry
	return DEFAULT_NAMING_STRING
}

function getDeclarationExtension(ext: string): string {
	if (ext === '.mjs') return '.d.mts'
	if (ext === '.cjs') return '.d.cts'
	return '.d.ts'
}

export async function getOutputDtsPath(
	entry: NormalizedEntry,
	buildConfig: BuildConfig,
): Promise<string> {
	const { fullPath, outputBasePath } = entry

	if (outputBasePath) {
		const namingString = getNamingString(buildConfig.naming)
		if (namingString) {
			return namingString
				.replaceAll('[dir]', buildConfig.outdir ?? DEFAULT_OUTPUT_DIR)
				.replaceAll('[name]', outputBasePath)
				.replace(/\.([^.]+)$/, (_, ext) => getDeclarationExtension(ext))
		}
	}

	const { outputs } = await Bun.build({
		root: buildConfig.root,
		naming: buildConfig.naming,
		outdir: buildConfig.outdir,
		format: buildConfig.format,
		entrypoints: [fullPath],
	})

	const output = outputs.find((output) => output.kind === 'entry-point')

	if (!output) {
		throw new Error(`No output found for entry: ${entry}`)
	}

	return replaceExtension(
		output.path,
		getDeclarationExtension(getExtension(output.path)),
	)
}

type NormalizedEntry = {
	fullPath: string
	outputBasePath: string | null
}

export function normalizeEntry(entry: Entry): NormalizedEntry[] {
	if (typeof entry === 'string')
		return [{ fullPath: entry, outputBasePath: null }]

	if (typeof entry === 'object' && !Array.isArray(entry))
		return Object.entries(entry).map(([name, path]) => ({
			fullPath: path,
			outputBasePath: name,
		}))

	return entry.map((entry) => ({
		fullPath: entry,
		outputBasePath: null,
	}))
}
