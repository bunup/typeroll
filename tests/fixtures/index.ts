import type { ReturnType } from './utils'

/**
 * Returns a test value of type ReturnType.
 * @returns {ReturnType} The test value.
 */
export function test(): ReturnType {
	return 1
}

/**
 * Adds two numbers and returns the result.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of a and b.
 */
export function add(a: number, b: number): number {
	return a + b
}

/**
 * A sample exported type for demonstration.
 */
export type SampleType = {
	id: number
	name: string
}

/**
 * Returns a sample object of type SampleType.
 * @returns {SampleType} The sample object.
 */
export function getSample(): SampleType {
	return { id: 1, name: 'Sample' }
}

export type { ReturnType }
