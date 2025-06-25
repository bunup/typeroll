# typeroll

[![npm version](https://img.shields.io/npm/v/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)
[![npm downloads](https://img.shields.io/npm/dm/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)

An extremely fast TypeScript declaration file generator and bundler for modern libraries.

| Tool                  | Time    | Relative Speed  |
|-----------------------|---------|-----------------|
| **typeroll**          | 21ms    | baseline        |
| dts-bundle-generator  | 4997ms  | 237x slower     |

## Features

- 🚀 **Blazing Fast** - 237x faster than alternatives  
- 📦 **Single File** - Bundle to one clean declaration file  
- ✂️ **Code Splitting** - Optimize shared type declarations  
- 🔧 **Minification** - Reduce declaration file size  

## Quick Start

Try typeroll instantly without installation:

```bash
bunx typeroll src/index.ts
```

That's it! Your declaration files will be generated in the dist folder.

## Installation

Install as a dev dependency:

```bash
bun add -d typeroll
```

## CLI Usage

Add to your project scripts or run directly:

```bash
bunx typeroll [...entrypoints] [options]
```

Examples:
```bash
bunx typeroll src/index.ts               		# Single entry
bunx typeroll src/index.ts src/cli.ts    		# Multiple entrypoints
bunx typeroll "src/**/*.ts"              		# Glob pattern for all .ts files in src
bunx typeroll "src/**/*.ts" "!src/**/*.test.ts" # Include all .ts but exclude test files
bunx typeroll src/index.ts --minify      		# Minify output
bunx typeroll src/index.ts --splitting   		# Enable code splitting
```

## Command-Line Options

| Option                             | Description                                                             |
|-------------------------------------|-------------------------------------------------------------------------|
| `-o, --outDir <dir>`                | Output directory (default: `dist`)                                      |
| `-s, --splitting`                   | Enable code splitting for shared types                                  |
| `-m, --minify`                      | Enable all minification options                                         |
| `-mj, --minify-jsdoc`               | Remove JSDoc comments                                                   |
| `-mw, --minify-whitespace`          | Remove whitespace/newlines                                              |
| `-mi, --minify-identifiers`         | Shorten internal type variable names                                    |
| `-c, --clean`                       | Clean output directory before build (default: `true`)                   |
| `-ra, --resolve-all`                | Resolve & include all external type dependencies                        |
| `-r, --resolve <list>`              | Resolve only specified dependencies (comma-separated)                   |

## Declaration Splitting

When `--splitting` is enabled, **shared types** are factored out into separate chunks to avoid duplication:

```
dist/
├── index.d.ts         # ~15KB, imports from chunk
├── cli.d.ts           # ~10KB, imports from chunk
└── chunk-abc123.d.ts  # ~30KB, shared types
```

Instead of duplicating types between multiple entry files, shared code is chunked!

```bash
typeroll src/index.ts src/cli.ts --splitting
```
or
```ts
await generateDts(['src/index.ts', 'src/cli.ts'], { splitting: true });
```

## Minification

Reduce your declaration file size while **preserving all exported names**:

```bash
typeroll src/index.ts --minify
```

Or via API:
```ts
await generateDts(['src/index.ts'], { minify: true });
```

#### Example (before & after):

<details>
<summary><b>Original</b></summary>

```ts
type DeepPartial<T> = { [P in keyof T]? : DeepPartial<T[P]> };
interface Response<T> {
  data: T;
  error?: string;
  meta?: Record<string, unknown>;
}
declare function fetchData<T>(url: string, options?: RequestInit): Promise<Response<T>>;
export { fetchData, Response, DeepPartial };
```
</details>

<details>
<summary><b>Minified</b></summary>

```ts
type e<T>={[P in keyof T]?:e<T[P]>};
interface t<T>{data:T;error?:string;meta?:Record<string,unknown>;}
declare function r<T>(url:string,options?:RequestInit):Promise<t<T>>;
export{r as fetchData,t as Response,e as DeepPartial};
```
</details>


## Programmatic Usage

Use the API for more control:

```ts
import { generateDts } from 'typeroll';

const result = await generateDts(['src/index.ts']);

for (const file of result.files) {
  await Bun.write(`dist/${file.outputPath}`, file.dts);
}
```

### Error Handling

```ts
import { generateDts, logErrors } from 'typeroll';

const result = await generateDts(['src/index.ts']);

if (result.errors.length > 0) {
  logErrors(result.errors, {
	shouldExit: true
  });
} else {
  for (const file of result.files) {
    await Bun.write(`dist/${file.outputPath}`, file.dts);
  }
}
```

## ❤️ Contributing

We love [contributions](CONTRIBUTING.md)!
Help improve typeroll—submit bugs, request features, or open pull requests.
