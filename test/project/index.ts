/**
 * Sums two numbers
 */
export function sum(a: number, b: number): Promise<number> {
	return Promise.resolve(a + b)
}

export * from './add'
export * from './cosa'
export * from './utils'
