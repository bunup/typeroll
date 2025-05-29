import { dts } from '../src'

console.time('build')

await Bun.build({
	entrypoints: ['project/index.ts'],
	outdir: 'test/dist',
	plugins: [dts()],
})

console.timeEnd('build')
