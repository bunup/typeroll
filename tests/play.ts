import { generateDts } from '../src'

const res = await generateDts(['index.global.ts'])

console.log(res.files)
