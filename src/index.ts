export {
    logIsolatedDeclarationErrors,
    type LogIsolatedDeclarationErrorsOptions,
    type IsolatedDeclarationError,
} from "./isolated-decl-error";

export type {
    GenerateDtsOptions,
    GenerateDtsResult,
    DtsPluginOptions,
} from "./types";

export { generateDts } from "./generate";
export { dts } from "./plugin";
