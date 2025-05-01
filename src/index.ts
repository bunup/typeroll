import {
	isolatedDeclaration,
	type IsolatedDeclarationsOptions,
	type OxcError,
	type SourceMap,
} from 'oxc-transform'
import { bundleTs } from './bundle'

export type GenerateDtsOptions = {
	rootDir?: string
	tsconfig?: Record<string, any>
} & IsolatedDeclarationsOptions

export type GenerateDtsResult = {
	code: string
	errors: Array<OxcError>
	map?: SourceMap
}

export function generateDts(
	entryFilePath: string,
	options: GenerateDtsOptions = {},
): GenerateDtsResult {
	const rootDir = options.rootDir ?? process.cwd()
	const tsconfig = options.tsconfig ?? {}

	const bundle = bundleTs(entryFilePath, { rootDir, tsconfig })

	const result = isolatedDeclaration(entryFilePath, bundle, {
		sourcemap: options.sourcemap,
		stripInternal: options.stripInternal,
	})

	return {
		code: result.code,
		errors: result.errors,
		map: result.map,
	}
}

export default generateDts
