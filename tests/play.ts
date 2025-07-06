import { generateDts } from '../src'

console.time('build')
const result = await generateDts(['tests/fixtures/index.ts'], {
	minify: true,
})
console.log(result.files[0].dts)
console.timeEnd('build')
