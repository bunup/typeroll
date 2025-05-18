# bun-dts

A TypeScript declaration file (.d.ts) generator for Bun that bundles types into a single file in **under 10 milliseconds**.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Features

- 📦 Generate and bundle TypeScript declaration files (.d.ts) into a single file
- 🔍 Selective external module resolution
- ⚡ Seamless integration with Bun's ecosystem
- 🚀 Blazing fast performance (upto **100x faster** than alternatives)

## Installation

```bash
bun add -d bun-dts
```

## Usage

### Basic Usage

Use the `generateDts` function to create declaration files:

```ts
import { generateDts } from 'bun-dts';

// Generate a declaration file from an entry point
const dts = await generateDts('./src/index.ts');

// Write the generated declarations to a file
await Bun.write('./dist/index.d.ts', dts);
```

### Advanced Usage

```ts
import { generateDts } from 'bun-dts';

const dts = await generateDts('./src/index.ts', {
	preferredTsConfigPath: './tsconfig.build.json',
	resolve: ['react', 'react-dom', /^@myorg\/.*/],
	warnInsteadOfError: true,
	cwd: process.cwd(),
});

await Bun.write('./dist/index.d.ts', dts);
```

## Options

| Option                   | Type                        | Description                                                                                                                                                                                     |
| ------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preferredTsConfigPath`  | `string`                    | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`                | `boolean \| (string \| RegExp)[]` | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `warnInsteadOfError`     | `boolean`                   | Show warnings instead of errors for isolatedDeclarations issues. When true, the build will not fail on isolatedDeclarations errors. Defaults to `false`.                                        |
| `cwd`                    | `string`                    | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                    |

## Understanding isolatedDeclarations

bun-dts uses TypeScript's [isolatedDeclarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations) feature to generate accurate type declarations. This approach verifies that each file's public API can be described using only its explicit imports and exports, without relying on implicit type relationships.

### Why It Matters

Traditional type declaration generation requires the TypeScript compiler to analyze your entire codebase to infer return types and other type information, which is computationally expensive and slow. The isolatedDeclarations approach eliminates this overhead by requiring explicit type annotations on exported items.

### Benefits

- **Faster declaration generation**: Eliminates the need for whole-program analysis
- **More accurate types**: Types are exactly what you define, not inferred
- **Improved encapsulation**: Ensures your module boundaries are clear and well-defined
- **Better maintainability**: Prevents unexpected type dependencies between modules
- **Enhanced modularity**: Makes your library more reliable for consumers

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

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
