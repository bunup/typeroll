import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: [
		'project/src/index.ts',
		'project/src/main.ts',
		'project/src/client/index.ts',
	],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	splitting: true,
	plugins: [dts()],
})
console.timeEnd('build')
