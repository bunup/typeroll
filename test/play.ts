import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: ['project/index.ts'],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	plugins: [
		dts({
			resolve: true,
		}),
	],
})
console.timeEnd('build')
