import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  target: "es2020",
  external: ["react", "react-dom", /^@mui\//, /^@emotion\//],
  // esbuild drops module-level directives when bundling; re-add it so the
  // component works in Next.js App Router server components without a wrapper.
  banner: { js: '"use client";' },
});
