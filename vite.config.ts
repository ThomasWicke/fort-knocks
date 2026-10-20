import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: { host: true, port: 5180 },   // host: a phone on the same Wi-Fi can open it
  preview: { host: true, port: 5180 },
  build: { outDir: '../dist', emptyOutDir: true, target: 'es2022' },
  optimizeDeps: { exclude: ['box2d3-wasm'] },   // keep its wasm loader intact
});
