import { defineConfig } from 'bunup';
import { report } from 'bunup/plugins';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true
  },
  minify: true,
  plugins: [report()],
});
