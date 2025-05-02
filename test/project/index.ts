import type { Alternative } from "oxc-parser";
import type { ResolveTsImportPathOptions } from "ts-import-resolver";

/**
 * Sums two numbers
 */
export function sum(a: number, b: number): Promise<number> {
    return Promise.resolve(a + b);
}

export * from "./add";
export * from "./cosa";
export * from "./utils";

export type AnotherType = {
    name: string;
    age: number;
} & Alternative &
    ResolveTsImportPathOptions;
