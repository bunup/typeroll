import { generateDts } from '../src'

console.time('build')
const result = await generateDts(
	['tests/fixtures/index.ts', 'tests/fixtures/main.ts'],
	{
		splitting: true,
		minify: true,
	},
)
for (const file of result.files) {
	await Bun.write(`dist/${file.outputPath}`, file.dts)
}
console.timeEnd('build')
