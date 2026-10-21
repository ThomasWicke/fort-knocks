// The bot (M5): it builds a legal fort from the real toy box, aims at a plushie with human-sized errors, taps
// its ammo's ability at a sensible moment and tapes its plushies down in repairs. Shared by the game and sim.ts.
import { CARD_T, MIN_PLUSH_Y, PLUSHIES, PLUSH_H, PLUSH_W, RUG_W, TRAY, decorate, fits, problems, priceOf, turned, type Draw, type Piece, type TrayKind } from './fort';
import { AMMO, type Ammo } from './ammo';
import { MAX_PULL, Range, aimAt, type Pull } from './range';

// ---------- building ----------
// A recipe lifts one plushie to at least the minimum height: pieces relative to the tower's left edge, and where the
// plushie stands. The bot picks one per tower from what the box holds, then uses what's left on extras.
interface Part { kind: TrayKind; turn?: boolean; dx: number; dy: number }
interface Recipe { w: number; parts: Part[]; top: number; plushDx: number }
const RECIPES: Recipe[] = [
  { w: 1, parts: [{ kind: 'block', dx: 0, dy: 0 }], top: 1, plushDx: 0 },
  { w: 2, parts: [{ kind: 'long', dx: 0, dy: 0 }], top: 1, plushDx: 0.5 },
  { w: 2, parts: [{ kind: 'arch', dx: 0, dy: 0 }], top: 1, plushDx: 0.5 },
  { w: 3, parts: [{ kind: 'book', dx: 0, dy: 0 }, { kind: 'book', dx: 0, dy: 0.5 }], top: 1, plushDx: 1 },
  { w: 2, parts: [{ kind: 'domino', turn: true, dx: 0, dy: 0 }, { kind: 'domino', turn: true, dx: 0, dy: 0.75 }], top: 1.5, plushDx: 0.5 },
  { w: 1, parts: [{ kind: 'block', dx: 0, dy: 0 }, { kind: 'block', dx: 0, dy: 1 }], top: 2, plushDx: 0 },
  { w: 1, parts: [{ kind: 'long', turn: true, dx: 0, dy: 0 }], top: 2, plushDx: 0 },
  { w: 2, parts: [{ kind: 'domino', dx: 0, dy: 0 }, { kind: 'domino', dx: 1.25, dy: 0 }, { kind: 'card', dx: 0, dy: 2 }], top: 2 + CARD_T, plushDx: 0.5 },
  { w: 2, parts: [{ kind: 'arch', dx: 0, dy: 0 }, { kind: 'block', dx: 0.5, dy: 1 }], top: 2, plushDx: 0.5 },
  { w: 3, parts: [{ kind: 'block', dx: 0, dy: 0 }, { kind: 'block', dx: 2, dy: 0 }, { kind: 'book', dx: 0, dy: 1 }, { kind: 'block', dx: 1, dy: 1.5 }], top: 2.5, plushDx: 1 },
  { w: 1, parts: [{ kind: 'block', dx: 0, dy: 0 }, { kind: 'block', dx: 0, dy: 1 }, { kind: 'block', dx: 0, dy: 2 }], top: 3, plushDx: 0 },
  { w: 1, parts: [{ kind: 'long', turn: true, dx: 0, dy: 0 }, { kind: 'block', dx: 0, dy: 2 }], top: 3, plushDx: 0 },
  { w: 2, parts: [{ kind: 'long', dx: 0, dy: 0 }, { kind: 'long', turn: true, dx: 0.5, dy: 1 }], top: 3, plushDx: 0.5 },
];
const piece = (kind: TrayKind, turn: boolean, x: number, y: number, i: number): Piece => {
  const base = { ...TRAY[kind].make(), x, y } as Piece;
  return decorate(turn ? turned(base) ?? base : base, i);
};

/** A legal fort from this toy box that stands up when the physics switches on, or null. No budget since playtest 3:
 *  the bot uses what the box holds. */
export function botFort(draw: Draw, rng: () => number): Piece[] | null {
  const best: Piece[][] = [];
  for (let attempt = 0; attempt < 60 && best.length < 4; attempt++) {
    const left = { ...draw }, pieces: Piece[] = [];
    const take = (kind: TrayKind) => { if (left[kind] <= 0) return false; left[kind]--; return true; };
    // three towers, one per third of the rug, so their open-sky funnels stay clear of each other
    let ok = true;
    for (let z = 0; z < 3 && ok; z++) {
      const zone = { x0: z * (RUG_W / 3), w: RUG_W / 3 };
      const options = RECIPES.filter(r => r.w <= zone.w && r.parts.every(p => left[p.kind] >= r.parts.filter(q => q.kind === p.kind).length));
      if (!options.length) { ok = false; break; }
      const r = options[Math.floor(rng() * options.length)];
      const x = Math.round((zone.x0 + rng() * (zone.w - r.w)) * 2) / 2;
      for (const p of r.parts) { take(p.kind); pieces.push(piece(p.kind, !!p.turn, x + p.dx, p.dy, pieces.length)); }
      pieces.push({ type: 'plush', x: x + r.plushDx, y: r.top, w: PLUSH_W, h: PLUSH_H, plush: PLUSHIES[z] });
    }
    if (!ok) continue;
    // the rest of the box: pieces in front of and between the towers (cover, and something to knock off)
    for (let tries = 0; tries < 40; tries++) {
      const kinds = (Object.keys(left) as TrayKind[]).filter(k => left[k] > 0);
      if (!kinds.length) break;
      const kind = kinds[Math.floor(rng() * kinds.length)], p = piece(kind, rng() < 0.3, 0, 0, pieces.length);
      p.x = Math.round(rng() * (RUG_W - p.w) * 2) / 2;
      p.y = groundAt(p, pieces);
      const trial = [...pieces, p];
      if (!fits(p, pieces) || hasProblems(trial)) continue;
      if (take(kind)) pieces.push(p);
    }
    if (hasProblems(pieces) || !stands(pieces)) continue;
    best.push(pieces);
  }
  if (!best.length) return null;
  // the standing candidate that uses the most of the box
  return best.sort((a, b) => cost(b) - cost(a))[0];
}
const cost = (f: Piece[]) => f.reduce((n, p) => n + priceOf(p), 0);
const hasProblems = (f: Piece[]) => { const p = problems(f); return p.lowPlushies.length > 0 || p.blocked.length > 0 || p.missing > 0; };
/** Where a piece rests if dropped at its x: on the highest piece under it. */
function groundAt(p: Piece, others: Piece[]): number {
  let top = 0;
  for (const o of others) if (o.x < p.x + p.w - 1e-6 && p.x < o.x + o.w - 1e-6) top = Math.max(top, o.y + o.h);
  return top;
}
/** The settle test: three seconds of physics, and every plushie still above the minimum height. */
function stands(f: Piece[]): boolean {
  const r = new Range(f, 'green');
  r.settle(3);
  const ok = r.standing() === 3 && r.plushTargets().every(t => t.y - PLUSH_H / 2 > MIN_PLUSH_Y - 0.3);
  r.world.destroy();
  return ok;
}

// ---------- shooting ----------
/** How good the bot is: error in power (share) and angle (radians), both ± half this. */
export const BOT_SKILL = { power: 0.18, angle: 0.16 };   // ±9% power, ±4.6°: people shoot less precisely than the first bot (0.14, 0.12)
/** Where the bot aims: a random standing plushie. The top is lobbed high so it arrives above its target and drills
 *  down; the rest come in at a middle angle. */
export function botAim(range: Range, ammo: Ammo, rng: () => number, skill = BOT_SKILL): { pull: Pull; at: { x: number; y: number } } {
  const aims = range.plushTargets(), t = aims.length ? aims[Math.floor(rng() * aims.length)] : { x: 5, y: 3 };
  const [lo, span] = ammo === 'top' ? [56, 14] : [32, 26], aimY = ammo === 'top' ? t.y + 1.6 : t.y;
  let p: Pull | null = null;
  for (let tries = 0; tries < 8 && !p; tries++) p = aimAt(t.x + (rng() - 0.5) * 0.6, aimY + (rng() - 0.3) * 0.6, lo + rng() * span);
  p ??= { x: 1.4, y: 1.0 };
  const ang = Math.atan2(p.y, p.x) + (rng() - 0.5) * skill.angle, mag = Math.min(MAX_PULL, Math.hypot(p.x, p.y) * (1 + (rng() - 0.5) * skill.power));
  return { pull: { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag }, at: { x: t.x, y: t.y } };
}
/** The bot's tap: jacks scatter just before the fort, the top drills over its target, the popper pops right beside it. */
export function botTap(range: Range, plan: { x: number; y: number } | null): void {
  const a = range.ammoAt(), f = range.flight;
  if (!plan || !a || !f || f.tapped || !AMMO[f.ammo].tap) return;
  const go = f.ammo === 'jacks' ? a.x > plan.x - 4.5
    : f.ammo === 'top' ? Math.abs(a.x - plan.x) < 0.35 && a.y > plan.y + 0.5
    : f.ammo === 'popper' ? Math.hypot(a.x - plan.x, a.y - plan.y) < 0.9
    : Math.hypot(a.x - plan.x, a.y - plan.y) < 1.4;
  if (go) range.ability();
}
