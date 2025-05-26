# bun-dts

An extremely fast Bun plugin for generating TypeScript declaration files (.d.ts) in **under 10 milliseconds**.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

## Features

- 📦 Bundles TypeScript declaration files (.d.ts) into a single file
- 🔧 Native Bun plugin integration
- 🔍 Selective external module resolution
- ⚡ Blazing fast performance (up to **100x faster** than alternatives)
- 🚀 Seamless integration with Bun's build system

## Installation

```bash
bun add -d bun-dts
```

## Plugin Usage

Use the `dts()` plugin in your Bun build configuration to automatically generate TypeScript declaration files.

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
| `warnInsteadOfError` | `boolean`                                      | Show warnings instead of errors for isolatedDeclarations issues. When true, the build will not fail on isolatedDeclarations errors. Default: `false`       |

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

## Comparison with [bun-plugin-dts](https://github.com/wobsoriano/bun-plugin-dts)

bun-dts is upto **100x faster** than bun-plugin-dts, significantly reducing your build times. Additionally, bun-dts offers many more cool features built-in.

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).

We welcome contributions from the community to enhance capabilities and make it even more powerful.
