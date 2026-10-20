import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// box2d3-wasm's entry picks between a threaded ("deluxe") and a plain ("compat") build at runtime, and the threaded
// one can't be bundled. We only use compat (no SharedArrayBuffer needed), so point the import straight at it.
const box2dCompat = fileURLToPath(new URL('./node_modules/box2d3-wasm/build/dist/es/compat/Box2D.compat.mjs', import.meta.url));

export default defineConfig({
  root: 'client',
  resolve: { alias: [{ find: /^box2d3-wasm$/, replacement: box2dCompat }] },
  server: { host: true, port: 5180 },   // host: a phone on the same Wi-Fi can open it
  preview: { host: true, port: 5180 },
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022' },
  optimizeDeps: { exclude: ['box2d3-wasm'] },   // keep its wasm loader intact
});
