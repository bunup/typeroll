import { generateDts } from '../src'

console.time('build')
const result = await generateDts(['tests/fixtures/index.ts'])
console.log(result)
console.timeEnd('build')
