# bun-dts

An extremely fast Bun plugin for generating and bundling TypeScript declaration files (.d.ts) in **under 10 milliseconds**.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Features

- 📦 Generates and bundles TypeScript declaration files (.d.ts) into a single file
- 🔧 Native Bun plugin integration
- 🔍 Selective external module resolution
- ⚡ Blazing fast performance (up to **100x faster** than alternatives)
- 🚀 Seamless integration with Bun's build system
- 🎯 Support for code splitting with shared type extraction

## Installation

```bash
bun add -d bun-dts
```

## Plugin Usage

Use the `dts()` plugin in your Bun build configuration to automatically generate and bundle TypeScript declaration files.

```ts
import { dts } from 'bun-dts';

await Bun.build({
	entrypoints: ['src/index.ts'],
	outdir: 'dist',
	plugins: [dts()],
});
```

That's it, now running the build will output a dts file in `dist/index.d.ts`.

The declaration file extension matches your JavaScript output format:

- `.js` output → `.d.ts` declarations
- `.mjs` output → `.d.mts` declarations
- `.cjs` output → `.d.cts` declarations

## Programmatic Usage

Use the `generateDts` function directly for more control:

```ts
import { generateDts } from 'bun-dts';

const results = await generateDts(['src/index.ts']);

for (const result of results) {
	await Bun.write(`dist/${result.outputPath}`, result.dts);
}
```

### Error Handling

```ts
import { generateDts, logIsolatedDeclarationErrors } from 'bun-dts';

const results = await generateDts(['src/index.ts']);

for (const result of results) {
	if (result.errors.length > 0) {
		logIsolatedDeclarationErrors(result.errors);
		process.exit(1);
	} else {
		await Bun.write(`dist/${result.outputPath}`, result.dts);
	}
}
```

## Options

### Plugin Options

| Option                  | Type                              | Description                                                                                                                                                                                     |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`                 | `string \| string[]`              | Custom entry points to use instead of the ones from the build config. Can be a string, array of strings, or glob patterns that resolve to files.                                               |
| `preferredTsConfigPath` | `string`                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`               | `boolean \| (string \| RegExp)[]` | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `cwd`                   | `string`                          | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                                            |
| `splitting`             | `boolean`                         | Whether to split declaration files when multiple entrypoints share types. Enabled by default if splitting is enabled in the Bun build config.                                                   |

### Entry Points

The plugin supports flexible entry point configuration:

```ts
// Use build config's entrypoints (default)
dts()

// Single entry
dts({ entry: 'src/api.ts' })

// Multiple entries
dts({ entry: ['src/index.ts', 'src/utils.ts'] })

// Glob patterns
dts({ allowGlobs: true, entry: ['src/**/*.ts', '!src/**/*.test.ts'] })
```

### Declaration Splitting

When `splitting` is enabled, shared types across entrypoints are extracted to separate `.d.ts` files to reduce duplication:

```ts
dts({ splitting: true })
```

This creates chunk files for shared types, and entry point files import from these chunks as needed. This is enabled by default if `splitting` is enabled in the Bun build config.


## API Reference

### `generateDts(entrypoints, options?)`

**Parameters:**
- `entrypoints` (`string[]`) - Array of entry point file paths or glob patterns
- `options` (`GenerateDtsOptions`) - Configuration options

**Returns:** `Promise<GenerateDtsResult[]>`

### `GenerateDtsResult`

Each result object contains:

```ts
type GenerateDtsResult = {
	kind: 'entry-point' | 'chunk'
	entry: string | undefined        // Only for entry-point kind
	chunkFileName: string | undefined // Only for chunk kind
	outputPath: string              // Relative path for saving
	dts: string                     // Generated declaration content
	errors: IsolatedDeclarationError[]
}
```

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is upto **100x faster** than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts offers many more cool features built-in.

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
