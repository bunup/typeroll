import { generateDts } from '../src'

const result = await generateDts(['cool.tes.ts'])

console.log(result.files.map((file) => file.pathInfo))
