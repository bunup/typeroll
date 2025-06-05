import dtsPlugin from 'bun-plugin-dts'
import { generateDtsBundle } from 'dts-bundle-generator'
import pc from 'picocolors'
import { dts } from '../src'

type Benchmark = {
	name: string
	fn: () => unknown | Promise<unknown>
}

type Result = {
	name: string
	duration: number
	success: boolean
	error?: string
}

const benchmark = async (name: string, fn: Benchmark['fn']) => {
	const start = performance.now()
	try {
		const result = await fn()
		const duration = performance.now() - start
		return { name, duration, success: true, result }
	} catch (error) {
		const duration = performance.now() - start
		return { name, duration, success: false, error: error.message }
	}
}

const benchmarks: Benchmark[] = [
	{
		name: 'bun-dts',
		fn: () =>
			Bun.build({
				entrypoints: ['bench/project/index.ts'],
				format: 'esm',
				outdir: 'bench/dist/bun-dts',
				plugins: [dts()],
			}),
	},
	{
		name: 'bun-plugin-dts',
		fn: () =>
			Bun.build({
				entrypoints: ['bench/project/index.ts'],
				format: 'esm',
				outdir: 'bench/dist/bun-plugin-dts',
				plugins: [dtsPlugin()],
			}),
	},
	{
		name: 'dts-bundle-generator',
		fn: () =>
			generateDtsBundle([
				{
					filePath: 'bench/project/index.ts',
				},
			]),
	},
]

const getBundlerColor = (name: string) => {
	switch (name) {
		case 'bun-dts':
			return pc.cyan
		case 'bun-plugin-dts':
			return pc.magenta
		case 'dts-bundle-generator':
			return pc.yellow
		default:
			return pc.white
	}
}

const results: Result[] = []
for (const { name, fn } of benchmarks) {
	const result = await benchmark(name, fn)
	results.push(result)

	const colorFn = getBundlerColor(name)

	if (result.success) {
		console.log(colorFn(`${name}: ${result.duration.toFixed(2)}ms`))
	} else {
		console.log(pc.red(`${name}: Failed (${result.duration.toFixed(2)}ms)`))
		console.log(pc.gray(`   Error: ${result.error}`))
	}
}

const outputPath = 'bench/result.json'
const output = results.map(({ name, duration }) => ({
	name,
	duration: Math.round(duration * 100) / 100,
}))

await Bun.write(outputPath, JSON.stringify(output, null, 2))

const fastest = results
	.filter((r) => r.success)
	.sort((a, b) => a.duration - b.duration)[0]
if (fastest) {
	console.log(`\n\nFastest: ${fastest.name} (${fastest.duration.toFixed(2)}ms)`)
}
