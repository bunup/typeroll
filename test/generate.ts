import fs from "node:fs";
import { generateDts } from "../src";

const start = performance.now();

const result = await generateDts("src/index.ts");

const end = performance.now();

fs.writeFileSync("test/dist/index.d.ts", result);

console.log(`Time taken: ${end - start} milliseconds`);
