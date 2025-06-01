export function add(a: number, b: number): number
export function add(a: string, b: string): string
export function add(a: number | string, b: number | string): number | string {
	if (typeof a === 'number' && typeof b === 'number') {
		return a + b
	}
	if (typeof a === 'string' && typeof b === 'string') {
		return a + b
	}
	throw new Error(
		'Arguments must be of the same type (either numbers or strings)',
	)
}
