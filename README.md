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

const { dts } = await generateDts('src/index.ts');
await Bun.write('dist/index.d.ts', dts);
```

### Error Handling

```ts
import { generateDts, logIsolatedDeclarationErrors } from 'bun-dts';

const { dts, errors } = await generateDts('src/index.ts');

if (errors.length > 0) {
	logIsolatedDeclarationErrors(errors);
	process.exit(1);
} else {
	await Bun.write('dist/index.d.ts', dts);
}
```

## Options

| Option                  | Type                              | Description                                                                                                                                                                                     |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferredTsConfigPath` | `string`                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`               | `boolean \| (string \| RegExp)[]` | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `cwd`                   | `string`                          | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                                            |

### Custom Entry Points

By default, the plugin uses your build configuration's `entrypoints`. You can override this with the `entry` option:

```ts
// Single entry
dts({ entry: 'src/api.ts' });

// Multiple entries
dts({ entry: ['src/index.ts', 'src/utils.ts'] });

// Named entries with custom output paths
dts({
	entry: {
		api: 'src/api/index.ts', // → dist/api.d.ts
		'types/core': 'src/core.ts', // → dist/types/core.d.ts
	},
});
```

### Plugin-Only Options

| Option               | Type                                           | Description                                                                                                                                                |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`              | `string \| string[] \| Record<string, string>` | Custom entry points to use instead of the ones from the build config. Can be a single file, array of files, or object mapping output names to input paths. |

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is upto **100x faster** than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts offers many more cool features built-in.

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
