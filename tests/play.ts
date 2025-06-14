import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: ['funcs/index.ts'],
	format: 'esm',
	outdir: 'tests/dist',
	packages: 'external',
	splitting: true,
	plugins: [dts()],
})
console.timeEnd('build')
