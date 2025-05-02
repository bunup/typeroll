import fs from "node:fs";
import { generateDts } from "../dist";

const start = performance.now();

const result = generateDts("test/project/index.ts");

const end = performance.now();

fs.writeFileSync("test/result.d.ts", result.code);

console.log(`Time taken: ${end - start} milliseconds`);
