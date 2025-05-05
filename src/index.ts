import { createDtsPlugin } from "./plugin";
import type { BunPlugin, GenerateDtsOptions } from "./types";

export function dts(options: GenerateDtsOptions = {}): BunPlugin {
    return createDtsPlugin(options);
}

export type { GenerateDtsOptions } from "./types";
