import { generateJsonSchema } from "../jc";
import path from "node:path";

const sourceFile = path.join(__dirname, "../src/types.ts");
const sourceContent = await Bun.file(sourceFile).text();
const typeName = "GenerateDtsOptions";

console.log(generateJsonSchema(sourceFile, sourceContent, typeName));
