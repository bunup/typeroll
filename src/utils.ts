import { existsSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { type LoadConfigResult, loadConfig } from 'coffi'
import { isCI, isDevelopment } from 'std-env'
import { TS_RE } from './re'

export function ensureArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value]
}

export function isTypeScriptFile(path: string | null): boolean {
	if (!path) return false
	return TS_RE.test(path)
}

export function returnPathIfExists(path: string): string | null {
	return existsSync(path) ? path : null
}

export async function loadTsConfig(
	cwd: string,
	preferredPath: string | undefined,
): Promise<LoadConfigResult<Record<string, unknown>>> {
	const config = await loadConfig<Record<string, unknown>>({
		name: 'tsconfig',
		extensions: ['.json'],
		preferredPath,
		cwd,
	})

	return config
}

export function getShortFilePath(filePath: string, maxLength = 3): string {
	const fileParts = filePath.split('/')
	const shortPath = fileParts.slice(-maxLength).join('/')
	return shortPath
}

export function generateRandomString(length = 10): string {
	return Array.from({ length }, () =>
		String.fromCharCode(97 + Math.floor(Math.random() * 26)),
	).join('')
}

export function isDev(): boolean {
	return isDevelopment || !isCI
}

export function isNullOrUndefined(value: unknown): value is undefined | null {
	return value === undefined || value === null
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

export function getDeclarationExtension(ext: string): string {
	if (ext === '.mjs') return '.d.mts'
	if (ext === '.cjs') return '.d.cts'
	return '.d.ts'
}

export function getExtension(filePath: string): string {
	if (!filePath) return ''

	const ext = extname(filePath)
	return ext
}
