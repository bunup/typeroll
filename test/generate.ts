import { dts } from "../src";

const start = performance.now();

await Bun.build({
    entrypoints: ["src/index.ts"],
    plugins: [dts()],
    target: "node",
    external: [
        "oxc-transform",
        "oxc-resolver",
        "typescript",
        "ts-import-resolver",
    ],
    outdir: "test/dist",
});

console.log(`Time taken: ${performance.now() - start}ms`);
