import { dts } from "../src";

await Bun.build({
    entrypoints: ["project/index.ts", "project/a.ts"],
    naming: {
        entry: "[dir]/[name].cjs.js",
    },
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
