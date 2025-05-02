/**
 * Sums two numbers
 */
export declare function sum(a: number, b: number): Promise<number>;
type MultiplyOptions = {
    async?: boolean;
};
declare function subtract(a: number, b: number): number;
declare function multiply(
    a: number,
    b: number,
    options?: MultiplyOptions,
): Promise<number>;
declare function cosa(): Promise<string>;
export { multiply, cosa };
export type { MultiplyOptions };
declare function subtract(a: number, b: number): number;
export { subtract };
