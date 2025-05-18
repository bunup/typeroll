import { generateDts } from "../src";

console.time("generateDts");
const dts = await generateDts("project/index.ts");
console.timeEnd("generateDts");

await Bun.write("test/dist/index.d.ts", dts);
