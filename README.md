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
// Enable all minification strategies
dts({ minify: true });

// Fine-grained control over minification
dts({
  minify: {
    jsDoc: true,      // Remove JSDoc comments
    whitespace: true, // Remove unnecessary whitespace
    identifiers: true // Shorten internal identifiers while preserving public API names
  }
});
```

Example output comparison:

```typescript
// Original (6.7KB for example)
interface ApiClientOptions {
	/** The base URL for API requests */
	baseUrl: string;
	/** Request timeout in milliseconds */
	timeout?: number;
}
export { ApiClientOptions };

// Minified (807B)
interface t{baseUrl:string;timeout?:number;}export{t as ApiClientOptions};
```

#### Recommended for production

```ts
dts({ minify: { identifiers: true } });
```

If you are publishing your package to npm, you can minify only the identifiers to reduce the size of the declaration file. When you minify whitespace, the JSDoc comments become ineffective, and removing JSDoc comments would degrade the developer experience since TypeScript packages typically have JSDoc comments to describe the API.

## Options

| Option                    | Type                                              | Description                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry`                   | `string \| string[]`                              | Custom entry points to use instead of the ones from the build config. Can be a string, array of strings, or glob patterns that resolve to files.                                                |
| `preferredTsConfigPath`   | `string`                                          | Path to the preferred tsconfig.json file. By default, the closest tsconfig.json file will be used.                                                                                              |
| `resolve`                 | `boolean \| (string \| RegExp)[]`                 | Controls which external modules should be resolved. `true` to resolve all external modules, an array of strings or RegExp to match specific modules, or `false` to disable external resolution. |
| `cwd`                     | `string`                                          | The directory where the generator will look for the `tsconfig.json` file and `node_modules`. By default, the current working directory will be used.                                            |
| `splitting`               | `boolean`                                         | Whether to split declaration files when multiple entrypoints share types. Enabled by default if splitting is enabled in the Bun build config.                                                   |
| `minify`                  | `boolean \| MinifyOptions`                        | Controls the minification of generated declaration files. When `true`, applies all minification strategies. When an object, allows fine-grained control over specific minification strategies.  |
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
