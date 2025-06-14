# bun-dts

An extremely fast Bun plugin for generating and bundling TypeScript declaration files.

[![npm version](https://img.shields.io/npm/v/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)
[![npm downloads](https://img.shields.io/npm/dm/bun-dts.svg?style=flat-square)](https://www.npmjs.com/package/bun-dts)

| Name                 | Duration | Relative Speed       |
| -------------------- | -------- | -------------------- |
| bun-dts              | 21ms     | 1x (fastest)         |
| bun-plugin-dts       | 5285ms   | 251.7x slower        |
| dts-bundle-generator | 4997ms   | 237.0x slower        |

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

Without splitting:
```
dist/
├── index.d.ts     # 50KB (includes shared types)
└── cli.d.ts       # 45KB (duplicates shared types)
```

With splitting:
```
dist/
├── index.d.ts     # 15KB (imports from chunk)
├── cli.d.ts       # 10KB (imports from chunk)
└── chunk-abc123.d.ts  # 30KB (shared types)
```

This creates chunk files for shared types, and entry point files import from these chunks as needed. This is enabled by default if `splitting` is enabled in the Bun build config.

### Minification

You can minify the generated declaration files to reduce their size:

```ts
dts({ minify: true });
```

When enabled, minification will preserve public (exported) API names while minifying internal type names to reduce file size. This is particularly useful for large declaration files or multiple medium to large declaration files, which can reduce your bundle size significantly.

#### Example

Original:

```typescript
interface ComplexType<T extends string> {
	id: T;
	metadata: {
		version: number
		tags: string[]
		createdAt: Date
	};
	transform: <U>(input: U) => Promise<ComplexType<U extends string ? U : T>>;
}
type UnionType = string | number | ComplexType<"default">;
declare function processData<T extends UnionType>(input: T, options?: {
	validate?: boolean
	timeout?: number
}): Promise<ComplexType<Extract<T, string>> | null>;
export { processData, UnionType, ComplexType };
```

Minified:

```typescript
interface t<T extends string> {
	id: T;
	metadata: {
		version: number
		tags: string[]
		createdAt: Date
	};
	transform: <U>(input: U) => Promise<t<U extends string ? U : T>>;
}
type n = string | number | t<"default">;
declare function e<T extends n>(input: T, options?: {
	validate?: boolean
	timeout?: number
}): Promise<t<Extract<T, string>> | null>;
export { e as processData, n as UnionType, t as ComplexType };
```

## Options

| Option                    | Type                                              | Description                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`                   | `string \| string[]`                              | Custom entry points to use instead of the ones from the build config. Can be a string, array of strings, or glob patterns that resolve to files.                                                |
| `preferredTsConfigPath`   | `string`                                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`                 | `boolean \| (string \| RegExp)[]`                 | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `cwd`                     | `string`                                          | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                                            |
| `splitting`               | `boolean`                                         | Whether to split declaration files when multiple entrypoints share types. Enabled by default if splitting is enabled in the Bun build config.                                                   |
| `minify`                  | `boolean`                                         | Controls the minification of generated declaration files. When `true`, minifies internal type names while preserving public (exported) API names.                                             |
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
