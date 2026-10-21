// Headless shots for balance work (the M5 harness starts here): fire one ammo type at a fort over a grid of angles
// and powers, tap the way a good player would, and measure what each shot did. No DOM; runs anywhere physics does.
import type { Piece } from './fort';
import { AMMO, type Ammo } from './ammo';
import { MAX_PULL, Range, STEP } from './range';

export interface ShotResult { deg: number; power: number; out: number; crushed: number; lost: number; share: number }

/** A good player's tap: jacks scatter a few cells before the fort, the top drills over a plushie, the balloon bursts beside one. */
export function goodTap(r: Range): void {
  const f = r.flight, a = r.ammoAt();
  if (!f || !a || f.tapped || !AMMO[f.ammo].tap) return;
  const pl = r.plushTargets();
  const go = f.ammo === 'jacks' ? a.x > -3.5
    : f.ammo === 'top' ? pl.some(p => Math.abs(a.x - p.x) < 0.35 && a.y > p.y + 0.5)
    : pl.some(p => Math.hypot(a.x - p.x, a.y - p.y) < 1.4);
  if (go) r.ability();
}

/** One shot at a freshly settled fort; runs until the fort is quiet (at most 6 s after the shot ends). */
export function shotAt(fort: Piece[], ammo: Ammo, deg: number, power: number, tap = goodTap): ShotResult {
  const r = new Range(fort, 'green');
  r.settle(3);
  const th = (deg * Math.PI) / 180, m = power * MAX_PULL;
  const before = r.standing();
  r.fire({ x: Math.cos(th) * m, y: Math.sin(th) * m }, ammo);
  let t = 0;
  while (r.state === 'flight' && t < 8) { r.tick(STEP, 0); tap(r); t += STEP; }
  for (let i = 0; i < 360 && !r.quiet(); i++) r.tick(STEP, 0);
  const shot = r.shots[0], res = { deg, power, out: before - r.standing(), crushed: shot.crushed?.length ?? 0, lost: shot.lost, share: r.destruction() };
  r.world.destroy();
  return res;
}

/** The grid used for balance: 15 angles × 5 powers. */
export function sweep(fort: Piece[], ammo: Ammo, degs = range(15, 75, 15), powers = [0.8, 0.85, 0.9, 0.95, 1]): ShotResult[] {
  const out: ShotResult[] = [];
  for (const d of degs) for (const p of powers) out.push(shotAt(fort, ammo, d, p));
  return out;
}
function range(a: number, b: number, n: number): number[] { return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)); }

/** Summary of a sweep: how often a shot takes out at least one plushie, two or more, the mean share knocked off. */
export function summarise(rs: ShotResult[]): { shots: number; anyOut: number; twoPlus: number; crushes: number; meanShare: number } {
  return {
    shots: rs.length,
    anyOut: rs.filter(r => r.out >= 1).length,
    twoPlus: rs.filter(r => r.out >= 2).length,
    crushes: rs.reduce((n, r) => n + r.crushed, 0),
    meanShare: Math.round((rs.reduce((n, r) => n + r.share, 0) / rs.length) * 1000) / 10,
  };
}
