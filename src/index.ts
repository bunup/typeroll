import { generateDts } from "./core";
import type { BunPlugin, GenerateDtsOptions } from "./types";

export function dts(options: GenerateDtsOptions = {}): BunPlugin {
    return {
        name: "dts",
        async setup(build) {
            await generateDts(build, options);
        },
    };
}

export type { GenerateDtsOptions } from "./types";

class User {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
}

class Student extends User {
    sayHello(): void {
        console.log(
            `Hello, my name is ${this.name} and I am ${this.age} years old.`,
        );
    }
}

export { Student };

export default Student;
