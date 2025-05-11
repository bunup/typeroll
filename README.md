# bun-dts

A Bun plugin that generates and bundles TypeScript declaration files (.d.ts) into a single file in **under 10 milliseconds**.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Features

- 📦 Generate and bundle TypeScript declaration files (.d.ts) into a single file
- 🔍 Selective external module resolution
- 🚪 Custom entry points support
- ⚡ Seamless integration with Bun's build pipeline
- 🚀 Blazing fast performance (upto **100x faster** than alternatives)

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
			warnInsteadOfError: true,
		}),
	],
});
```

### Entry Option Examples

```ts
// Single entry point
dts({
	entry: 'src/index.ts',
});

// Multiple entry points
dts({
	entry: ['src/index.ts', 'src/other.ts'],
});

// Named entry points (custom output paths)
dts({
	entry: {
		api: 'src/api/v1/index.ts', // Outputs to dist/api.d.ts
		'nested/types': 'src/types.ts', // Outputs to dist/nested/types.d.ts
	},
});
```

## Options

| Option                   | Type                                                           | Description                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferredTsConfigPath`  | `string`                                                       | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`                | `boolean \| (string \| RegExp)[]`                              | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `entry`                  | `string \| string[] \| Record<string, string>`                 | Custom entry points to use instead of the ones from the build config. Can be a single entry point, multiple entry points, or named entry points with custom output paths.                       |
| `warnInsteadOfError`     | `boolean`                                                      | Show warnings instead of errors for isolatedDeclarations issues. When true, the build will not fail on isolatedDeclarations errors. Defaults to `false`.                                        |
| `cwd`                    | `string`                                                       | The directory where the plugin will look for the `tsconfig.json` file and `node_modules`. By default, the build config's root or the current working directory will be used.                    |
| `onDeclarationGenerated` | `(filePath: string, content: string) => void \| Promise<void>` | Callback function that is called when a declaration file is generated with the path and content of the file.                                                                                    |

## Understanding isolatedDeclarations

bun-dts uses TypeScript's [isolatedDeclarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations) feature to generate accurate type declarations. This approach verifies that each file's public API can be described using only its explicit imports and exports, without relying on implicit type relationships.

### Why It Matters

Traditional type declaration generation requires the TypeScript compiler to analyze your entire codebase to infer return types and other type information, which is computationally expensive and slow. The isolatedDeclarations approach eliminates this overhead by requiring explicit type annotations on exported items.

### Benefits

- **Faster declaration generation**: Eliminates the need for whole-program analysis
- **More accurate types**: Types are exactly what you define, not inferred
- **Improved encapsulation**: Ensures your module boundaries are clear and well-defined
- **Better maintainability**: Prevents unexpected type dependencies between modules
- **Enhanced modularity**: Makes your library more reliable for consumerss

### Recommendation

To catch isolatedDeclarations errors early in your development process (rather than at build time), enable the option in your tsconfig.json:

```json
{
	"compilerOptions": {
		"declaration": true,
		"isolatedDeclarations": true
	}
}
```

This will help you identify and fix potential declaration issues in your editor before running the build.

For more details about isolatedDeclarations, refer to [TypeScript's explanation on isolatedDeclarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations).

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is upto **100x faster** than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts offers many more cool features built-in.

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
