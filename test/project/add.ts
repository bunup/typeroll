export type MultiplyOptions = {
    async?: boolean;
};

function subtract(a: number, b: number): number {
    return a - b;
}

export async function multiply(
    a: number,
    b: number,
    options?: MultiplyOptions,
): Promise<number> {
    if (options?.async) {
        return new Promise((resolve) => setTimeout(() => resolve(a * b), 1000));
    }
    return Promise.resolve(a * b);
}

export * from "./cosa";
