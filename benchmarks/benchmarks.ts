import path from "node:path";
import { generateDtsBundle } from "dts-bundle-generator";
import { build } from "rolldown";
import { dts as rolldownDts } from "rolldown-plugin-dts";
import { rollup } from "rollup";
import { dts as rollupDts } from "rollup-plugin-dts";
import { generateDts } from "../dist/index.js";

const ENTRY_FILE = "test/project/index.ts";
const DEFAULT_ITERATIONS = 5;

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
};

type BenchmarkFn = () => Promise<void> | void;
interface BenchmarkConfig {
    name: string;
    run: BenchmarkFn;
    color: keyof typeof COLORS;
}

function formatTime(ms: number): string {
    return ms < 1000 ? `${ms.toFixed(2)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function formatRatio(ratio: number): string {
    return ratio < 1
        ? `${(1 / ratio).toFixed(2)}x faster`
        : `${ratio.toFixed(2)}x slower`;
}

function log(message: string, color?: keyof typeof COLORS): void {
    console.log(color ? `${COLORS[color]}${message}${COLORS.reset}` : message);
}

async function benchmark(
    config: BenchmarkConfig,
    iterations: number,
): Promise<number> {
    log(`\nBenchmarking ${config.name} (${iterations} iterations)`, "bright");

    log(`Warming up ${config.name}...`, config.color);
    await config.run();

    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await config.run();
        const end = performance.now();
        const elapsed = end - start;

        times.push(elapsed);
        log(`  Run ${i + 1}: ${formatTime(elapsed)}`, config.color);
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    log(`  Average: ${formatTime(average)}`, config.color);

    return average;
}

const benchmarks: BenchmarkConfig[] = [
    {
        name: "rolldown-plugin-dts",
        color: "cyan",
        run: async () => {
            await build({
                input: ENTRY_FILE,
                write: false,
                output: {
                    dir: "./dist",
                    format: "esm",
                },
                plugins: [
                    rolldownDts({
                        sourcemap: true,
                    }),
                ],
            });
        },
    },
    {
        name: "generateDts",
        color: "green",
        run: () => {
            generateDts(ENTRY_FILE, {
                sourcemap: true,
            });
        },
    },
    {
        name: "dts-bundle-generator",
        color: "yellow",
        run: () => {
            const entryFilePath = path.resolve(ENTRY_FILE);
            generateDtsBundle([
                {
                    filePath: entryFilePath,
                    output: {
                        noBanner: true,
                    },
                },
            ]);
        },
    },
    {
        name: "rollup-plugin-dts",
        color: "magenta",
        run: () => {
            rollup({
                input: ENTRY_FILE,
                output: {
                    file: "./dist/index.d.ts",
                    format: "esm",
                },
                plugins: [rollupDts()],
            });
        },
    },
];

async function runBenchmarks(iterations = DEFAULT_ITERATIONS): Promise<void> {
    log("\n🚀 TYPESCRIPT DECLARATION BENCHMARKS 🚀\n", "bright");
    log(`Entry file: ${ENTRY_FILE}`);
    log(`Iterations: ${iterations}`);

    const results: Record<string, number> = {};

    for (const config of benchmarks) {
        results[config.name] = await benchmark(config, iterations);
    }

    log("\n📊 RESULTS 📊", "bright");

    const fastestName = Object.entries(results).reduce(
        (fastest, [name, time]) => (time < fastest[1] ? [name, time] : fastest),
        ["", Number.POSITIVE_INFINITY],
    )[0];

    Object.entries(results)
        .sort((a, b) => a[1] - b[1])
        .forEach(([name, time], index) => {
            const config = benchmarks.find((b) => b.name === name);
            if (!config) {
                throw new Error(`Benchmark config not found for ${name}`);
            }

            const icon =
                index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : "  ";
            const comparisonText =
                name === fastestName
                    ? "(baseline)"
                    : formatRatio(time / results[fastestName]);

            log(
                `${icon} ${name}: ${formatTime(time)} ${comparisonText}`,
                config.color,
            );
        });
}

runBenchmarks();
