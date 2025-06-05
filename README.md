# bun-dts

An extremely fast Bun plugin for generating and bundling TypeScript declaration files.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

| Name                 | Duration    |
| -------------------- | ----------- |
| **bun-dts**          | **21.95ms** |
| bun-plugin-dts       | 5.28s       |
| dts-bundle-generator | 4.99s       |

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

### Entry Points

The plugin supports flexible entry point configuration:

```ts
// Use build config's entrypoints (default)
dts();

// Single entry
dts({ entry: 'src/api.ts' });

// Multiple entries
dts({ entry: ['src/index.ts', 'src/utils.ts'] });

// Glob patterns (requires allowGlobs option)
dts({ allowGlobs: true, entry: ['src/**/*.ts', '!src/**/*.test.ts'] });
```

### Declaration Splitting

When `splitting` is enabled, shared types across entrypoints are extracted to separate `.d.ts` files to reduce duplication:

```ts
dts({ splitting: true });
```

This creates chunk files for shared types, and entry point files import from these chunks as needed. This is enabled by default if `splitting` is enabled in the Bun build config.

## Options

| Option                    | Type                                              | Description                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`                   | `string \| string[]`                              | Custom entry points to use instead of the ones from the build config. Can be a string, array of strings, or glob patterns that resolve to files.                                                |
| `preferredTsConfigPath`   | `string`                                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`                 | `boolean \| (string \| RegExp)[]`                 | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `cwd`                     | `string`                                          | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                                            |
| `splitting`               | `boolean`                                         | Whether to split declaration files when multiple entrypoints share types. Enabled by default if splitting is enabled in the Bun build config.                                                   |
| `allowGlobs`              | `boolean`                                         | Whether to allow glob patterns in the entry points. When enabled, you can use patterns like `src/**/*.ts`.                                                                                      |
| `onDeclarationsGenerated` | `(result: OnDeclarationsGeneratedResult) => void` | Callback function that is invoked when declaration files are generated.                                                                                                                         |

## Programmatic Usage

Use the `generateDts` function directly for more control:

```ts
import { generateDts } from 'bun-dts';

const result = await generateDts(['src/index.ts']);

for (const file of result.files) {
	await Bun.write(`dist/${file.outputPath}`, file.dts);
}
```

### Error Handling

```ts
import { generateDts, logIsolatedDeclarationErrors } from 'bun-dts';

const result = await generateDts(['src/index.ts']);

if (result.errors.length > 0) {
	logIsolatedDeclarationErrors(result.errors);
	process.exit(1);
} else {
	for (const file of result.files) {
		await Bun.write(`dist/${file.outputPath}`, file.dts);
	}
}
```

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is upto **200-300x faster** than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts offers many more cool features built-in.

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
