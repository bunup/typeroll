import { dts } from "../src";

const start = performance.now();

await Bun.build({
    entrypoints: ["project/index.ts"],
    plugins: [
        dts({
            resolve: true,
        }),
    ],
    target: "node",
    external: [
        "oxc-transform",
        "oxc-resolver",
        "typescript",
        "ts-import-resolver",
        "oxc-parser",
        "bun-dts",
        "elysia",
        "bun",
        "publint",
        "unplugin-unused",
    ],
    outdir: "test/dist",
});

console.log(`Time taken: ${performance.now() - start}ms`);
