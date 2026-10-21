// Crayon effects: the kid's imagination drawn over the real layer (docs/style.md, the two layers). Jittered wax
// strokes, no outlines, and they "boil": the wobble is redrawn about 12 times a second.
// Effects are timed in physics steps of their range, so slow motion slows them too.
import { P } from './draw';

export type FxKind = 'hit' | 'puff' | 'splash' | 'smoke' | 'scatter' | 'drill' | 'rip';
export interface Fx { kind: FxKind; x: number; y: number; at: number; r?: number }
export const FX_LIFE: Record<FxKind, number> = { hit: 30, puff: 50, splash: 48, smoke: 40, scatter: 24, drill: 30, rip: 36 };

/** A seeded random, so a stroke keeps its shape for one boil frame and gets a new wobble on the next. */
function rand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
}
/** A wax-crayon line: a few passes of a slightly wobbling stroke. */
function crayonLine(c: CanvasRenderingContext2D, pts: [number, number][], col: string, w: number, r: () => number): void {
  c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    c.lineWidth = w * (pass ? 0.6 : 1); c.globalAlpha = pass ? 0.9 : 0.75;
    c.beginPath();
    pts.forEach(([x, y], i) => { const jx = x + (r() - 0.5) * w * 0.9, jy = y + (r() - 0.5) * w * 0.9; i ? c.lineTo(jx, jy) : c.moveTo(jx, jy); });
    c.stroke();
  }
  c.globalAlpha = 1;
}

/** Draw one effect at screen position (px, py); k = px per cell, age = steps since it started, boil = the boil clock. */
export function drawFx(c: CanvasRenderingContext2D, f: Fx, px: number, py: number, k: number, age: number, boil: number): void {
  const t = age / FX_LIFE[f.kind], r = rand(Math.floor(boil * 4) * 7919 + Math.floor(f.x * 100) * 31 + f.at);
  if (t >= 1) return;
  c.save(); c.translate(px, py);
  const fade = 1 - t;
  if (f.kind === 'hit') {   // an impact star: spikes in yellow over orange
    const n = 9, R = k * (0.5 + t * 0.6);
    for (const [col, s] of [[P.lava, 1], [P.toyYellow, 0.65]] as const) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = (i % 2 ? 0.45 : 1) * R * s * (0.85 + r() * 0.3); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      c.globalAlpha = fade; crayonLine(c, pts, col, Math.max(2, k * 0.12), r);
    }
  } else if (f.kind === 'puff' || f.kind === 'smoke') {   // stuffing (white) or crayon smoke (grey): rising clouds
    const col = f.kind === 'puff' ? '#FFFFFF' : '#8A8290', edge = f.kind === 'puff' ? '#D8D2C8' : '#6B6370';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + r() * 0.4, d = k * (0.25 + t * 0.9), cx = Math.cos(a) * d, cy = Math.sin(a) * d * 0.7 - t * k * 0.6, rr = k * (0.22 + 0.1 * (1 - t));
      c.globalAlpha = fade * 0.9; c.fillStyle = col; c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill();
      c.globalAlpha = fade * 0.6; c.strokeStyle = edge; c.lineWidth = 1.5; c.beginPath(); c.arc(cx + (r() - 0.5) * 2, cy + (r() - 0.5) * 2, rr, 0, Math.PI * 2); c.stroke();
    }
  } else if (f.kind === 'splash') {   // a blue crayon ring and flying drops
    const R = (f.r ?? 2.4) * k * (0.3 + 0.7 * Math.sqrt(t));
    const ring: [number, number][] = [];
    for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; ring.push([Math.cos(a) * R, Math.sin(a) * R * 0.75]); }
    c.globalAlpha = fade; crayonLine(c, ring, '#5DA9E9', Math.max(2.5, k * 0.14), r);
    c.fillStyle = '#5DA9E9';
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, d = R * (0.5 + 0.6 * ((i * 37) % 10) / 10); c.globalAlpha = fade; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.75 + t * t * k * 1.5, Math.max(2, k * 0.08), 0, Math.PI * 2); c.fill(); }
  } else if (f.kind === 'scatter') {   // speed lines where the jacks fan out
    for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3, d0 = k * 0.3, d1 = k * (0.8 + t); c.globalAlpha = fade; crayonLine(c, [[Math.cos(a) * d0, Math.sin(a) * d0], [Math.cos(a) * d1, Math.sin(a) * d1]], P.graphite, 2, r); }
  } else if (f.kind === 'rip') {   // tape tearing: a pale zigzag flying apart
    for (const s of [-1, 1]) { const d = k * (0.2 + t * 0.6); c.globalAlpha = fade; crayonLine(c, [[s * d, -k * 0.1], [s * (d + k * 0.15), k * 0.08], [s * (d + k * 0.3), -k * 0.06]], '#D9C79A', 3, r); }
  } else if (f.kind === 'drill') {   // dust spinning off the drilling top
    for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1, y = (i - 1.5) * k * 0.25; c.globalAlpha = fade; crayonLine(c, [[s * k * 0.45, y], [s * k * (0.9 + t * 0.5), y - k * 0.2]], P.wood2, 2.5, r); }
  }
  c.restore();
}
