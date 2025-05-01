# ⚡️ lightning-dts

Lightning-fast TypeScript .d.ts generator and bundler with sourcemap support and ability to resolve types from node_modules, all at blazing speed.

## 📊 Benchmarks

| Tool                 | Execution Time | Comparison     |
| -------------------- | -------------- | -------------- |
| **lightning-dts**    | 0.86ms         | baseline       |
| rolldown-plugin-dts  | 45.92ms        | 53.61x slower  |
| dts-bundle-generator | 716.68ms       | 834.51x slower |

_Benchmarks run on identical code with sourcemap generation enabled_

## ✨ Features

- **Ultra-Fast**: Generate TypeScript declaration files at lightning speed
- **Bundling**: Not just generation, bundles all declarations into a single `.d.ts` file ready to ship
- **Sourcemaps**: Full sourcemap support for better debugging with the same speed
- **Node Module Resolution**: Seamlessly resolves types from node_modules
- **Configurable**: Customize with TSConfig options

## 📦 Installation

```bash
# npm
npm install lightning-dts --save-dev

# yarn
yarn add lightning-dts --dev

# pnpm
pnpm add lightning-dts -D
```

## 🚀 Usage

```typescript
import { generateDts } from 'lightning-dts';

// Basic usage
const result = generateDts('./src/index.ts');

// With options
const result = generateDts('./src/index.ts', {
	rootDir: './src',
	sourcemap: true,
	stripInternal: true,
	tsconfig: {
		/* your parsed tsconfig */
	},
});

// Access the generated declaration
console.log(result.code);

// Access sourcemap if enabled
console.log(result.map);

// Handle any errors
if (result.errors.length > 0) {
	console.error(result.errors);
}
```

## 🔧 API

### `generateDts(entryFilePath, options?)`

Generates and bundles TypeScript declaration files.

#### Parameters

- `entryFilePath`: Path to the entry TypeScript file
- `options`: (Optional) Configuration options
  - `rootDir`: Root directory of the project (default: `process.cwd()`)
  - `tsconfig`: Custom parsed TSConfig (default: `{}`)
  - `sourcemap`: Generate sourcemap (default: `false`)
  - `stripInternal`: Remove declarations marked as `@internal` (default: `false`)

#### Returns

```typescript
{
  code: string;     // The generated .d.ts content
  errors: Error[];  // Any errors encountered during generation
  map?: SourceMap;  // Sourcemap (if enabled)
}
```

## ❤️ Contributing

For guidelines on contributing, please read the [contributing guide](../../CONTRIBUTING.md).
