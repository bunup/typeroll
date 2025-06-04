import { describe, expect, it } from 'bun:test'
import { getDeclarationExtension } from '../src/utils'

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
})
