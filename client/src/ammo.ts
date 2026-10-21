// The four ammo types (docs/04-systems.md §5). Each is a different verb (orthogonal differentiation, Harvey Smith),
// each has one tap-in-flight ability except the marble, and each has one material it's best against:
// marble → dominoes and direct plushie hits, jacks → card tents, spinning top → block towers, water balloon → books.
// All four leave the launcher at the same speed, so the aim preview means the same thing for every one.
import { P, drawMarble } from './draw';

export type Ammo = 'marble' | 'jacks' | 'top' | 'balloon';
export const AMMO_ORDER: Ammo[] = ['marble', 'jacks', 'top', 'balloon'];

export interface AmmoSpec { name: string; tap: string | null; r: number; density: number; friction: number; restitution: number }
export const AMMO: Record<Ammo, AmmoSpec> = {
  // the pure skill shot: dense and hard, the only one that crushes a plushie on its own
  marble: { name: 'Marble', tap: null, r: 0.3, density: 4, friction: 0.3, restitution: 0.2 },
  // a bundle, lighter than the marble; a tap fans it out into four jacks that snag on light pieces
  jacks: { name: 'Jacks', tap: 'scatter', r: 0.3, density: 3, friction: 0.5, restitution: 0.1 },
  // a tap stops it dead and it drills straight down, shoving everything aside
  top: { name: 'Spinning top', tap: 'drill down', r: 0.33, density: 4, friction: 0.4, restitution: 0.1 },
  // big and soft: it bursts on the first touch (or on a tap), a push wave that soaks what it reaches
  balloon: { name: 'Water balloon', tap: 'burst', r: 0.42, density: 1.2, friction: 0.9, restitution: 0.05 },
};

export const JACK = { arm: 0.22, thick: 0.05, density: 4, spread: [-0.24, -0.08, 0.08, 0.24], speed: [1.0, 1.03, 0.98, 1.02] };
export const DRILL = { speed: 6, maxT: 1.0, spin: 40 };
export const SPLASH = { radius: 2.6, impulse: 3.5, wetFriction: 0.12 };
/** Crush rule: a plushie hit directly with at least this momentum (mass × approach speed) is out.
 *  A marble at about three quarters of full power, hitting directly (04-systems §13 said 60%; tuned with sim.ts). */
export const CRUSH = { momentum: 14 };   // 12 at first; raised with the heavier plushies (sim.ts match runs)

/** The Siege's ammo schedule: three volleys of two, every type at least once, never the same type twice in a volley.
 *  The same for both players, and known while building (so builders can read it: H14). */
export function makeSchedule(rng: () => number): Ammo[][] {
  for (;;) {
    const bag = [...AMMO_ORDER, AMMO_ORDER[Math.floor(rng() * 4)], AMMO_ORDER[Math.floor(rng() * 4)]];
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    const v = [bag.slice(0, 2), bag.slice(2, 4), bag.slice(4, 6)];
    if (v.every(([a, b]) => a !== b)) return v;
  }
}

// ---------- drawing (real layer: flat fill, shade, ink outline). Centred on the origin, r in px. ----------
export function drawAmmo(c: CanvasRenderingContext2D, kind: Ammo, r: number, phase = 0): void {
  if (kind === 'marble') return drawMarble(c, r);
  if (kind === 'jacks') { for (const [dx, dy, a] of [[-0.35, 0.2, 0.3], [0.35, 0.15, 1.2], [0, -0.3, 2.1]]) { c.save(); c.translate(dx * r, dy * r); c.rotate(a); drawJack(c, r * 0.75); c.restore(); } return; }
  if (kind === 'top') return drawTop(c, r, phase);
  return drawBalloon(c, r, phase);
}

/** One jack: three crossed arms with ball tips. r = arm length in px. */
export function drawJack(c: CanvasRenderingContext2D, r: number): void {
  const tips: [number, number][] = [];
  for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; tips.push([Math.cos(a) * r, Math.sin(a) * r], [-Math.cos(a) * r, -Math.sin(a) * r * 0.55]); }
  c.lineCap = 'round';
  c.strokeStyle = P.ink; c.lineWidth = Math.max(3, r * 0.34);
  for (const [x, y] of tips) { c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke(); }
  c.strokeStyle = '#C9CED8'; c.lineWidth = Math.max(1.5, r * 0.18);
  for (const [x, y] of tips) { c.beginPath(); c.moveTo(0, 0); c.lineTo(x, y); c.stroke(); }
  c.lineWidth = 1.4; c.strokeStyle = P.ink;
  tips.forEach(([x, y], i) => { c.fillStyle = i % 2 ? P.toyRed : '#C9CED8'; c.beginPath(); c.arc(x, y, Math.max(2, r * 0.2), 0, Math.PI * 2); c.fill(); c.stroke(); });
}

/** The spinning top: a striped cone under a cap, with a little handle. phase spins the stripes. */
export function drawTop(c: CanvasRenderingContext2D, r: number, phase = 0): void {
  const body = new Path2D();
  body.moveTo(-r, -r * 0.15); body.quadraticCurveTo(-r * 0.95, r * 0.45, 0, r * 1.05); body.quadraticCurveTo(r * 0.95, r * 0.45, r, -r * 0.15);
  body.quadraticCurveTo(0, -r * 0.55, -r, -r * 0.15); body.closePath();
  c.fillStyle = P.toyYellow; c.fill(body);
  c.save(); c.clip(body);
  const cols = [P.toyRed, P.blue, P.toyRed, P.cream];
  for (let i = -3; i < 6; i++) { const x = ((i + (phase % 1)) * r) / 1.6 - r; c.fillStyle = cols[(i + 8) % 4]; c.fillRect(x, -r, r * 0.3, r * 2.2); }
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(r * 0.35, -r, r, r * 2.2);
  c.restore();
  c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke(body);
  const h = new Path2D(); h.rect(-r * 0.14, -r * 0.95, r * 0.28, r * 0.6);
  c.fillStyle = P.wood; c.fill(h); c.stroke(h);
}

/** The water balloon: a blue drop with a knot, squashing as it wobbles. */
export function drawBalloon(c: CanvasRenderingContext2D, r: number, phase = 0): void {
  const sx = 1 + Math.sin(phase * 9) * 0.07, sy = 1 - Math.sin(phase * 9) * 0.07;
  c.save(); c.scale(sx, sy);
  const b = new Path2D(); b.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  c.fillStyle = '#5DA9E9'; c.fill(b);
  c.save(); c.clip(b); c.fillStyle = 'rgba(30,70,140,0.22)'; c.beginPath(); c.arc(r * 0.45, r * 0.45, r, 0, Math.PI * 2); c.fill(); c.restore();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.4, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); c.fill();
  c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke(b);
  const k = new Path2D(); k.moveTo(-r * 0.95, -r * 0.05); k.lineTo(-r * 1.3, -r * 0.25); k.lineTo(-r * 1.3, r * 0.15); k.closePath();
  c.fillStyle = '#3F86C8'; c.fill(k); c.stroke(k);
  c.restore();
}
