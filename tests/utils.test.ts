import { describe, expect, it } from 'bun:test'
import {
	cleanPath,
	getDeclarationExtension,
	getExtension,
	replaceExtension,
} from '../src/utils'

describe('utils', () => {
	describe('getDeclarationExtension', () => {
		it('should return the correct extension for .mjs', () => {
			expect(getDeclarationExtension('.mjs')).toBe('.d.mts')
		})

		it('should return the correct extension for .cjs', () => {
			expect(getDeclarationExtension('.cjs')).toBe('.d.cts')
		})

		it('should return the correct extension for .js', () => {
			expect(getDeclarationExtension('.js')).toBe('.d.ts')
		})
	})

	describe('getExtension', () => {
		it('should return the extension for a file path', () => {
			expect(getExtension('file.js')).toBe('.js')
		})

		it('should return the full extension for files with multiple dots', () => {
			expect(getExtension('file.d.ts')).toBe('.ts')
		})

		it('should return empty string for files without extension', () => {
			expect(getExtension('file')).toBe('')
		})

		it('should return empty string for empty input', () => {
			expect(getExtension('')).toBe('')
		})
	})

	describe('replaceExtension', () => {
		it('should replace the extension of a file', () => {
			expect(replaceExtension('file.js', '.ts')).toBe('file.ts')
		})

		it('should add the extension if file has no extension', () => {
			expect(replaceExtension('file', '.ts')).toBe('file.ts')
		})

		it('should work with paths', () => {
			expect(cleanPath(replaceExtension('path/to/file.js', '.ts'))).toBe(
				'path/to/file.ts',
			)
		})

		it("should add a dot if extension doesn't have one", () => {
			expect(replaceExtension('file.js', 'ts')).toBe('file.ts')
		})

		it('should return the input if path is falsy', () => {
			expect(replaceExtension('', '.ts')).toBe('')
		})
	})
})
