import { existsSync } from 'node:fs'
import { type LoadConfigResult, loadConfig } from 'coffi'
import { isCI, isDevelopment } from 'std-env'

export const JS_REGEX: RegExp = /\.[cm]?jsx?$/
export const TS_REGEX: RegExp = /\.[cm]?tsx?$|\.d\.[cm]?ts$/
export const NODE_MODULES_REGEX: RegExp = /node_modules/

export function isTypeScriptFile(path: string | null): boolean {
	if (!path) return false
	return TS_REGEX.test(path)
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
