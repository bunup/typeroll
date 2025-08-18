# typeroll

[![npm version](https://img.shields.io/npm/v/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)
[![npm downloads](https://img.shields.io/npm/dm/typeroll.svg?style=flat-square)](https://www.npmjs.com/package/typeroll)

A blazing-fast `.d.ts` bundler written in Bun, designed to generate and merge TypeScript declarations from an entry point into a single `index.d.ts`.

Typeroll powers [Bunup's TypeScript declarations feature](https://bunup.dev/docs/guide/typescript-declarations). Learn more at [bunup.dev](https://bunup.dev/).

## How It Works

`typeroll` generates `.d.ts` files from TypeScript sources using **TypeScript isolated declarations** via `oxc-transform`.

Once `.d.ts` files are generated, `typeroll` compiles them into synthetic JavaScript modules ("FakeJS"), where all type-level constructs are converted into token arrays. Identifiers within these arrays are preserved as **live variable references**, not strings, enabling Bun's bundler to track usage, apply tree-shaking, and perform name mangling safely.

The FakeJS modules are then bundled by Bun. When **splitting** is enabled, shared types between entrypoints are factored into chunks, reducing duplication. Since type references remain symbolic, Bun is free to mangle names across modules without breaking linkage, even under aggressive minification.

After bundling, each output chunk is **rehydrated**: the token arrays are parsed and reassembled into clean `.d.ts` declarations. This round-trip transformation preserves structure and semantics while allowing the bundler to optimize the intermediate graph as if it were runtime code.

The final result is a set of treeshaken, optionally split, and minified `.d.ts` files, emitted without using TypeScript's own emit pipeline.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

We welcome all contributions, big or small! Whether you're fixing bugs, adding features, improving documentation, or sharing feedback, your input helps make typeroll better for everyone.
