import { beforeEach, describe, expect, test } from 'bun:test'
import { cleanProjectDir, createProject, runGenerateDts } from './utils'

describe('Minify', () => {
	beforeEach(() => {
		cleanProjectDir()
	})

	test('should minify code', async () => {
		createProject({
			'src/index.ts': `
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: true,
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"declare function e(a:number,b:number):number;export{e as calculate};"`,
		)
	})

	test('should minify code with namespace exports', async () => {
		createProject({
			'src/index.ts': `
				export * as a from './a'
				export * as b from './b'
			`,
			'src/a.ts': `
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
			'src/b.ts': `
				export function sum(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: true,
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"declare namespace u{export{n as calculate};}declare function n(a:number,b:number):number;declare namespace m{export{b as sum};}declare function b(a:number,b:number):number;export{m as b,u as a};"`,
		)
	})

	test('should minify code with jsdoc', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: true,
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"declare function e(a:number,b:number):number;export{e as calculate};"`,
		)
	})

	test('should only minify jsDoc when only jsDoc option is enabled', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				jsDoc: true,
				whitespace: false,
				identifiers: false,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(`
		  "declare function calculate(a: number, b: number): number;
		  export { calculate };
		  "
		`)
	})

	test('should only minify whitespace when only whitespace option is enabled', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				jsDoc: false,
				whitespace: true,
				identifiers: false,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"/** * @param a - The first number * @param b - The second number * @returns The sum of a and b */ declare function calculate(a:number,b:number):number;export{calculate};"`,
		)
	})

	test('should only minify identifiers when only identifiers option is enabled', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				jsDoc: false,
				whitespace: false,
				identifiers: true,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(`
		  "/**
		  * @param a - The first number
		  * @param b - The second number
		  * @returns The sum of a and b
		  */
		  declare function n(a: number, b: number): number;
		  export { n as calculate };
		  "
		`)
	})

	test('should handle combinations of minify options', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export function calculate(a: number, b: number): number {
					return a + b
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				jsDoc: true,
				whitespace: true,
				identifiers: false,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"declare function calculate(a:number,b:number):number;export{calculate};"`,
		)
	})

	test('should properly minify complex type structures', async () => {
		createProject({
			'src/index.ts': `
				export type ComplexType<T extends string | number, U = unknown> = {
					[K in keyof T]: T[K] extends object ? ComplexType<T[K], U> : T[K] | U
				}

				export interface GenericInterface<T extends Record<string, any>> {
					data: T
					meta: {
						created: Date
						modified: Date
						version: number
					}
				}

				export function processData<T>(input: ComplexType<T>): GenericInterface<T> {
					return { data: input as any, meta: { created: new Date(), modified: new Date(), version: 1 } }
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: true,
		})

		expect(files[0].dts).toMatchInlineSnapshot(
			`"type e<T extends string|number,U=unknown>={[K in keyof T]:T[K] extends object ? e<T[K],U>:T[K]|U};interface t<T extends Record<string,any>>{data:T;meta:{created:Date modified:Date version:number};}declare function n<T>(input:e<T>):t<T>;export{n as processData,t as GenericInterface,e as ComplexType};"`,
		)
	})

	test('should preserve exported public API names when minifying identifiers', async () => {
		createProject({
			'src/index.ts': `
				export type PublicType = string | number

				export interface PublicInterface {
					id: string
					value: PublicType
				}

				type PrivateType = { _internal: boolean }

				export function publicFunction(input: PublicInterface): PrivateType {
					return { _internal: true }
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				identifiers: true,
				whitespace: false,
				jsDoc: false,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(`
		  "type e = string | number;
		  interface n {
		  	id: string;
		  	value: e;
		  }
		  type t = {
		  	_internal: boolean
		  };
		  declare function r(input: n): t;
		  export { r as publicFunction, e as PublicType, n as PublicInterface };
		  "
		`)
	})

	test('should remove inner jsdocs', async () => {
		createProject({
			'src/index.ts': `
				/**
				 * @param a - The first number
				 * @param b - The second number
				 * @returns The sum of a and b
				 */
				export type Test = {
					/**
					 * @param a - The first number
					 * @param b - The second number
					 * @returns The sum of a and b
					 */
					calculate(a: number, b: number): number
				}
			`,
		})

		const files = await runGenerateDts(['src/index.ts'], {
			minify: {
				identifiers: false,
				whitespace: false,
				jsDoc: true,
			},
		})

		expect(files[0].dts).toMatchInlineSnapshot(`
		  "type Test = {
		  	calculate(a: number, b: number): number
		  };
		  export { Test };
		  "
		`)
	})
})
