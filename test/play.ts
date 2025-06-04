import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: [
		'project/index.ts',
		'project/main.ts',
		'project/client/index.ts',
	],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	splitting: true,
	plugins: [dts()],
})
console.timeEnd('build')
