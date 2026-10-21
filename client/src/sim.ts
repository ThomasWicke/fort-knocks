// Headless shots for balance work (the M5 harness starts here): fire one ammo type at a fort over a grid of angles
// and powers, tap the way a good player would, and measure what each shot did. No DOM; runs anywhere physics does.
import { MATERIALS, makeDraw, type Piece } from './fort';
import { botAim, botFort, botTap } from './bot';
import { MODES, roundAmmo, type Rules } from './modes';
import { makeSchedule } from './ammo';
import { AMMO, CRUSH, type Ammo } from './ammo';
import { MAX_PULL, Range, STEP, TAPE, type Repair } from './range';

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
export function shotAt(fort: Piece[], ammo: Ammo, deg: number, power: number, tap = goodTap, repair?: Repair): ShotResult {
  const r = new Range(fort, 'green');
  r.settle(3);
  if (repair) { r.repair(repair); r.settle(1); }
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
export function sweep(fort: Piece[], ammo: Ammo, repair?: Repair, degs = range(15, 75, 15), powers = [0.8, 0.85, 0.9, 0.95, 1]): ShotResult[] {
  const out: ShotResult[] = [];
  for (const d of degs) for (const p of powers) out.push(shotAt(fort, ammo, d, p, goodTap, repair));
  return out;
}
/** The strongest tape use: every plushie taped to the piece it stands on (in blueprint coordinates). */
export function tapePlushies(fort: Piece[]): Repair {
  const tapes: Repair['tapes'] = [];
  fort.forEach((p, i) => {
    if (p.type !== 'plush') return;
    const j = fort.findIndex(q => q !== p && Math.abs(q.y + q.h - p.y) < 0.05 && q.x < p.x + p.w && p.x < q.x + q.w);
    if (j >= 0) tapes.push([i, j, p.x + p.w / 2, p.y]);
  });
  return { patches: [], tapes: tapes.slice(0, TAPE.perRepair) };
}
export function setTear(n: number): void { TAPE.tear = n; }
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

// ---------- whole matches, bot against bot (H7: how often a tie decides it; H12: dominant forts) ----------
export interface MatchResult { standing: [number, number]; destroyed: [number, number]; winner: 0 | 1 | -1; tiebreak: boolean; volleys: number }

/** One Siege (or a Best of Three round) between two bot forts from the same draw: blue shoots, then green, each volley. */
export function simMatch(rules: Rules, rng: () => number): MatchResult | null {
  const mode = MODES[rules], draw = makeDraw(rng), budget = mode.budgets[0];
  const forts = [botFort(draw, budget, rng), botFort(draw, budget, rng)];
  if (!forts[0] || !forts[1]) return null;
  const ranges = [new Range(forts[0], 'blue'), new Range(forts[1], 'green')];
  for (const r of ranges) r.settle(3);
  const schedule = rules === 'rounds' ? roundAmmo(mode.shots[0], rng) : makeSchedule(rng);
  let lava = 0, v = 0;
  for (v = 1; v <= mode.volleys; v++) {
    for (const shooter of [0, 1]) {
      const target = ranges[1 - shooter];
      for (const ammo of schedule[v - 1]) {
        const { pull, at } = botAim(target, ammo, rng);
        target.fire(pull, ammo);
        for (let t = 0; t < 8 && target.state === 'flight'; t += STEP) { for (const r of ranges) r.tick(STEP, lava); botTap(target, at); }
      }
      for (let i = 0; i < 180 && !target.quiet(); i++) for (const r of ranges) r.tick(STEP, lava);
    }
    if (mode.lava === 'volley' && v < mode.volleys) { lava++; for (let i = 0; i < 60; i++) for (const r of ranges) r.tick(STEP, lava); }
    if (ranges.some(r => r.standing() === 0)) break;
  }
  const st: [number, number] = [ranges[0].standing(), ranges[1].standing()], d: [number, number] = [ranges[1].destruction(), ranges[0].destruction()];
  for (const r of ranges) r.world.destroy();
  const winner = st[0] !== st[1] ? (st[0] > st[1] ? 0 : 1) : d[0] !== d[1] ? (d[0] > d[1] ? 0 : 1) : -1;
  return { standing: st, destroyed: d, winner, tiebreak: st[0] === st[1], volleys: Math.min(v, mode.volleys) };
}
export function simMatches(n: number, rules: Rules = 'siege') {
  let seed = 12345; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rs = Array.from({ length: n }, () => simMatch(rules, rng)).filter((r): r is MatchResult => !!r);
  const share = (f: (r: MatchResult) => boolean) => Math.round((rs.filter(f).length / rs.length) * 100);
  return {
    matches: rs.length,
    tiebreakPct: share(r => r.tiebreak), drawPct: share(r => r.winner === -1), wipePct: share(r => r.standing.includes(0)),
    bluePct: share(r => r.winner === 0), earlyEndPct: share(r => r.volleys < MODES[rules].volleys),
    meanStanding: Math.round((rs.reduce((n, r) => n + r.standing[0] + r.standing[1], 0) / rs.length / 2) * 10) / 10,
  };
}
/** Balance knobs for experiments (dev only). */
export function knobs(k: { plushDensity?: number; crush?: number; plushFriction?: number }): void {
  if (k.plushDensity) MATERIALS.plush.density = k.plushDensity;
  if (k.plushFriction) MATERIALS.plush.friction = k.plushFriction;
  if (k.crush) CRUSH.momentum = k.crush;
}
