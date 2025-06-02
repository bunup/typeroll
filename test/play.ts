import { dts } from '../src'

Bun.build({
	entrypoints: ['project/index.ts'],
	format: 'esm',
	outdir: 'test/dist',
	packages: 'external',
	plugins: [dts()],
})
