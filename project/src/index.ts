export * from 'oxc-resolver'
export * from 'oxc-transform'

import { type ReturnType, cool } from './utils'

/**
 * @description This is a test function
 * @param a - The first number
 * @param b - The second number
 * @returns The sum of the two numbers
 */
type SumOptions = {
	/**
	 * @description The first number
	 */
	a: number
	/**
	 * @description The second number
	 */
	b: number
}

/**
 * @description This is a test function
 * @param a - The first number
 * @param b - The second number
 * @returns The sum of the two numbers
 */
export function sum({ a, b }: SumOptions): number {
	return a + b
}

export function index() {
	return cool(1, 2)
}
