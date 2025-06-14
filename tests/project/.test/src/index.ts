/**
 * Process a string value
 * @param value - The string to process
 * @returns The processed string in uppercase
 */
export function processValue(value: string): string
/**
 * Process a numeric value
 * @param value - The number to process
 * @returns The doubled number
 */
export function processValue(value: number): number
/**
 * Process a boolean value
 * @param value - The boolean to process
 * @returns The inverted boolean
 */
export function processValue(value: boolean): boolean
export function processValue(
	value: string | number | boolean,
): string | number | boolean {
	if (typeof value === 'string') {
		return value.toUpperCase()
	}
	if (typeof value === 'number') {
		return value * 2
	}
	return !value
}

export function createItem(name: string): { name: string }
export function createItem(
	id: number,
	name: string,
): { id: number; name: string }
export function createItem(nameOrId: string | number, name?: string): any {
	if (typeof nameOrId === 'string') {
		return { name: nameOrId }
	}
	return { id: nameOrId, name }
}
