import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: ['tests/fixtures/index.ts'],
	format: 'esm',
	outdir: 'tests/dist',
	packages: 'external',
	plugins: [
		dts({
			resolve: true,
		}),
	],
})
console.timeEnd('build')
