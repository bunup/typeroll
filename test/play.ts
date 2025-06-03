import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: ['funcs/index.ts'],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	plugins: [dts()],
})
console.timeEnd('build')
