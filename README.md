# bun-dts

A Bun plugin to generate and bundle TypeScript declaration files (.d.ts) into a single file for your projects.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Features

- 📦 Generate and bundle TypeScript declaration files (.d.ts) into a single file
- 🔍 Selective external module resolution
- 🚪 Custom entry points support
- ⚡ Seamless integration with Bun's build pipeline
- 🚀 Blazing fast performance (100x faster than alternatives)

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

## Options

| Option                  | Type                              | Description                                                                                                                                                                                     |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferredTsConfigPath` | `string`                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`               | `boolean \| (string \| RegExp)[]` | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `entry`                 | `string[]`                        | Custom entry points to use instead of the ones from the build config.                                                                                                                           |
| `warnInsteadOfError`    | `boolean`                         | Show warnings instead of errors for isolatedDeclarations issues. When true, the build will not fail on isolatedDeclarations errors. Defaults to `false`.                                        |

## Understanding isolatedDeclarations

bun-dts uses TypeScript's isolatedDeclarations feature to generate accurate type declarations. This approach verifies that each file's public API can be described using only its explicit imports and exports, without relying on implicit type relationships.

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

bun-dts is 100x faster than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts can resolve types from node_modules.

## License

[MIT](https://github.com/arshad-yaseen/bun-dts/blob/main/LICENSE) © [Arshad Yaseen](https://arshadyaseen.com)
