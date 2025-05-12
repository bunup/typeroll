import { AbstractWorker } from "bun";
import { A } from "./a";

export class B extends A {}

export { AbstractWorker };

type User = {
    /**
     * @description The name of the user
     */
    name: string;
    /**
     * @description The age of the user
     */
    age: number;
};

/**
 * Hello world
 */
export const sum = (a: number, b: number): number => a + b;

export const user: User = {
    name: "John",
    age: 20,
};
