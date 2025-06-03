import { build } from 'tsdown'
import { dts } from '../src'

console.time('build')
await Bun.build({
	entrypoints: ['project/index.ts'],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	plugins: [dts()],
})
console.timeEnd('build')

// console.time('tsdown')
// await build({
// 	entry: 'project/index.ts',
// 	format: 'esm',
// 	outDir: 'test/dist',
// 	dts: true,
// })
// console.timeEnd('tsdown')
