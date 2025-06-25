## Understanding isolatedDeclarations

typeroll uses TypeScript's [isolatedDeclarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations) feature to generate accurate type declarations. This approach verifies that each file's public API can be described using only its explicit imports and exports, without relying on implicit type relationships.

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
