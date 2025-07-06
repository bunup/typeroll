# typeroll

[![npm version](https://img.shields.io/npm/v/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)
[![npm downloads](https://img.shields.io/npm/dm/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)

A blazing-fast `.d.ts` bundler written in Bun, designed to generate and merge TypeScript declarations from an entry point into a single `index.d.ts`—ready for publishing to npm.

Typeroll powers [Bunup's TypeScript declarations feature](https://bunup.dev/docs/guide/typescript-declarations). Learn more at [bunup.dev](https://bunup.dev/).

## How It Works

`typeroll` compiles `.d.ts` files into synthetic JavaScript modules ("FakeJS") where all type-level entities are serialized into token arrays. Identifiers within these arrays are preserved as **live variable references**, not strings. This design allows Bun’s bundler to treat types as analyzable, treeshakeable bindings. Only *used* identifiers are preserved during bundling, while unused ones are eliminated — a process impossible with static `.d.ts` concatenation alone.

The FakeJS modules are then passed through Bun's bundler, where splitting and minification are fully supported. When splitting is enabled, shared types between entrypoints are extracted into discrete chunks, allowing type reuse without duplication. Because identifiers are actual symbols, Bun can apply deterministic name mangling, including across chunk boundaries, while retaining the correct reference graph.

Post-bundling, each output chunk is rehydrated: token arrays are reassembled into valid `.d.ts` declarations by analyzing the resulting AST and restoring original type syntax. This bidirectional transformation ensures compatibility with complex type graphs while enabling aggressive optimizations at the module level.

The result is a fully bundled `.d.ts` file (or split graph of files) that maintains semantic integrity, supports tree-shaking, respects module boundaries, and minimizes size — without relying on TypeScript's emit pipeline.
