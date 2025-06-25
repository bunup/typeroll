import { generateDtsBundle } from 'dts-bundle-generator'
import pc from 'picocolors'
import { generateDts } from '../src'

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
		name: 'typeroll',
		fn: () => generateDts(['bench/project/index.ts']),
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
		case 'typeroll':
			return pc.cyan
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
