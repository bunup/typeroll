import { dts } from '../src'

console.time('build')

await Bun.build({
	entrypoints: ['test/fixtures/index.ts'],
	outdir: 'test/dist',
	plugins: [dts()],
})

console.timeEnd('build')
