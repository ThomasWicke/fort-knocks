import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// box2d3-wasm's entry picks between a threaded ("deluxe") and a plain ("compat") build at runtime, and the threaded
// one can't be bundled. We only use compat (no SharedArrayBuffer needed), so point the import straight at it.
const box2dCompat = fileURLToPath(new URL('./node_modules/box2d3-wasm/build/dist/es/compat/Box2D.compat.mjs', import.meta.url));

// Which build played a game (the game log stores it): the commit, plus "+" for uncommitted changes.
const git = (cmd: string) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); } catch { return ''; } };
const app = (git('rev-parse --short HEAD') || 'unknown') + (git('status --porcelain') ? '+' : '');

export default defineConfig({
  define: { __APP__: JSON.stringify(app) },
  root: 'client',
  resolve: { alias: [{ find: /^box2d3-wasm$/, replacement: box2dCompat }] },
  server: { host: true, port: 5180 },   // host: a phone on the same Wi-Fi can open it
  preview: { host: true, port: 5180 },
  build: {
    outDir: '../dist', emptyOutDir: true, target: 'es2022',
    rollupOptions: { input: { main: fileURLToPath(new URL('./client/index.html', import.meta.url)), games: fileURLToPath(new URL('./client/games.html', import.meta.url)) } },
  },
  optimizeDeps: { exclude: ['box2d3-wasm'] },   // keep its wasm loader intact
});
