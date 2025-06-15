import { generateDts } from '../src'

const result = await generateDts(['src/index.ts'])

console.log(result.files.map((file) => file.pathInfo))
