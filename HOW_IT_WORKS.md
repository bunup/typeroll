# How bun-dts Works

bun-dts is a tool for bundling TypeScript declaration files (`.d.ts`) using a clever source transformation approach that bypasses TypeScript compiler limitations. This document explains the technical process.

## Overview

Traditional TypeScript declaration bundling relies on the TypeScript compiler, which has limitations for complex projects. bun-dts takes a different approach:

1. Convert `.d.ts` files to fake JavaScript
2. Let Bun bundle this JavaScript (applying tree-shaking)
3. Convert the bundled JavaScript back to a single `.d.ts` file

## Core Technique: Fake JS + Rehydration

### Phase 1: Transform .d.ts to Fake JavaScript

Using `dtsToFakeJs`, the function:
- Strips export/import modifiers
- Converts `.d.ts` declarations into JavaScript var assignments, wrapping each declaration in a string:
  ```js
  var Foo = ["type Foo = {...}", Bar, Baz];
  ```
- Tracks type references in the array to prevent tree-shaking from removing them, This is a smart hack to preserve the full type graph without executing any logic.

### Phase 2: Bundle with Bun

Bun's build API bundles the fake JavaScript efficiently:
- Applies tree-shaking, retaining only referenced types
- Merges all declarations (as strings) into a single output JS file

### Phase 3: Transform Back to .d.ts

Using `fakeJsToDts`, the function:
- Parses the bundled fake JS
- Extracts the original type declaration strings
- Reconstructs them into valid `.d.ts` content

### Result

- ✅ A fully bundled `.d.ts`
- ✅ Tree-shaken (only used types)
- ✅ Fast, thanks to Bun
- ✅ No TypeScript compiler emit phase
