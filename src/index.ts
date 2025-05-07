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

export * from "./fake";
