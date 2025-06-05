import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: [
		'tests/fixtures/index.ts',
		'tests/fixtures/main.ts',
		'tests/fixtures/client/index.ts',
	],
	format: 'esm',
	outdir: 'tests/dist',
	packages: 'external',
	splitting: true,
	plugins: [dts()],
})
console.timeEnd('build')
