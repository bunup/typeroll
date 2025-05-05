# bun-dts

A Bun plugin to generate and bundle TypeScript declaration files (.d.ts) into a single file for your projects.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Installation

```bash
bun add -d bun-dts
```

## Usage

### Basic Usage

Add the plugin to your build configuration:

```ts
import { dts } from 'bun-dts';

await Bun.build({
	entrypoints: ['./src/index.ts'],
	outdir: './dist',
	plugins: [dts()],
});
```

This will generate a `index.d.ts` file alongside your `index.js` in the output directory (`./dist`).

### Advanced Usage

```ts
import { dts } from 'bun-dts';

await Bun.build({
	entrypoints: ['./src/index.ts'],
	outdir: './dist',
	plugins: [
		dts({
			preferredTsConfigPath: './tsconfig.build.json',
			resolve: ['react', 'react-dom', /^@myorg\/.*/],
		}),
	],
});
```

## Options

| Option                  | Type                              | Description                                                                                                                                                                                     |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferredTsConfigPath` | `string`                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`               | `boolean \| (string \| RegExp)[]` | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `entry`                 | `string[]`                        | Custom entry points to use instead of the ones from the build config.                                                                                                                           |

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is 10x faster than bun-plugin-dts, significantly reducing your build times.

## License

[MIT](https://github.com/arshad-yaseen/bun-dts/blob/main/LICENSE) © [Arshad Yaseen](https://arshadyaseen.com)
