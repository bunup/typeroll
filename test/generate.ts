import { generateDts, logIsolatedDeclarationErrors } from "../src";

console.time("generateDts");
const { dts, errors } = await generateDts("project/index.ts");
console.timeEnd("generateDts");

if (errors.length > 0) {
    logIsolatedDeclarationErrors(errors);
    process.exit(1);
}

await Bun.write("test/dist/index.d.ts", dts);
