import { generateDts } from '../src'

console.time('bun-dts')

await generateDts('project/index.ts')

console.timeEnd('bun-dts')
