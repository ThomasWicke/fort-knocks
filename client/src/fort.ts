// Pieces, materials, the toy box, the build rules and the forts the bot can build.
// Units: 1 cell = 1 m; x from the rug's left edge, y up from the rug top. Numbers from docs/04-systems.md.
import type { BodySpec, Material, Shape } from './physics';

export type PieceType = 'block' | 'long' | 'arch' | 'tri' | 'bookLie' | 'bookStand' | 'domStand' | 'domLie' | 'cardFlat' | 'cardTent' | 'plush';
export type Family = 'card' | 'domino' | 'block' | 'book' | 'plush';
export type Paint = 'toyRed' | 'toyYellow' | 'wood' | 'cream' | 'bookOx' | 'bookMustard' | 'bookPlum';
export type Plushie = 'brumm' | 'hoppel' | 'socke';

export interface Piece {
  type: PieceType;
  x: number; y: number;          // lower-left corner of the piece's box
  w: number; h: number;
  paint?: Paint; sym?: 'circle' | 'triangle' | 'star'; pips?: [number, number]; plush?: Plushie;
}

export const MATERIALS: Record<Family | 'marble' | 'floor', Material> = {
  card: { density: 1.0, friction: 0.45, restitution: 0.02 },
  domino: { density: 0.6, friction: 0.6, restitution: 0.05 },
  block: { density: 1.0, friction: 0.8, restitution: 0.05 },
  book: { density: 2.0, friction: 0.8, restitution: 0.02 },
  plush: { density: 1.4, friction: 0.9, restitution: 0.0 },   // bean-filled: mass 2, twice a block (was 0.5 × 1 cell; sim.ts). 1.4 since the body is 1 × 1.4
  marble: { density: 4.0, friction: 0.3, restitution: 0.2 },   // was 8: one shot swept all three plushies off (playtest 1)
  floor: { density: 0, friction: 0.8, restitution: 0 },
};

export const familyOf = (t: PieceType): Family =>
  t === 'cardFlat' || t === 'cardTent' ? 'card' : t === 'domStand' || t === 'domLie' ? 'domino' : t === 'bookLie' || t === 'bookStand' ? 'book' : t === 'plush' ? 'plush' : 'block';

export const CARD_T = 0.12;   // physics thickness of a card; drawn thinner

// ---------- the toy box ----------
export type TrayKind = 'card' | 'tent' | 'domino' | 'block' | 'tri' | 'long' | 'arch' | 'book';
export const TRAY_ORDER: TrayKind[] = ['card', 'tent', 'domino', 'block', 'tri', 'long', 'arch', 'book'];
export const TRAY: Record<TrayKind, { price: number; make: () => Omit<Piece, 'x' | 'y'> }> = {
  card: { price: 1, make: () => ({ type: 'cardFlat', w: 2, h: CARD_T }) },
  tent: { price: 1, make: () => ({ type: 'cardTent', w: 1.5, h: 1.4 }) },
  domino: { price: 1, make: () => ({ type: 'domStand', w: 0.75, h: 2 }) },   // 0.75 wide (was 0.5): a real domino's shape, as drawn
  block: { price: 2, make: () => ({ type: 'block', w: 1, h: 1 }) },
  tri: { price: 2, make: () => ({ type: 'tri', w: 1, h: 1 }) },
  long: { price: 3, make: () => ({ type: 'long', w: 2, h: 1 }) },
  arch: { price: 3, make: () => ({ type: 'arch', w: 2, h: 1 }) },
  book: { price: 3, make: () => ({ type: 'bookLie', w: 3, h: 0.5 }) },
};
export function trayKindOf(p: Piece): TrayKind | null {
  switch (p.type) {
    case 'cardFlat': return 'card'; case 'cardTent': return 'tent'; case 'domStand': case 'domLie': return 'domino';
    case 'block': return 'block'; case 'tri': return 'tri'; case 'long': return 'long'; case 'arch': return 'arch';
    case 'bookLie': case 'bookStand': return 'book'; default: return null;
  }
}
export const priceOf = (p: Piece): number => { const k = trayKindOf(p); return k ? TRAY[k].price : 0; };

/** Tap to turn: long blocks, books and dominoes stand up or lie down. Returns null if the piece can't turn. */
export function turned(p: Piece): Piece | null {
  const swap = { ...p, w: p.h, h: p.w };
  if (p.type === 'long') return swap;
  if (p.type === 'bookLie') return { ...swap, type: 'bookStand' };
  if (p.type === 'bookStand') return { ...swap, type: 'bookLie' };
  if (p.type === 'domStand') return { ...swap, type: 'domLie' };
  if (p.type === 'domLie') return { ...swap, type: 'domStand' };
  return null;
}

// Paint is decoration only; it rotates so a fort looks like a toy box, not a spreadsheet.
const BLOCK_PAINTS: Paint[] = ['toyRed', 'toyYellow', 'wood', 'cream'], BOOK_PAINTS: Paint[] = ['bookOx', 'bookMustard', 'bookPlum'];
const SYMS = ['circle', 'star', 'triangle'] as const;
export function decorate(p: Piece, i: number): Piece {
  const f = familyOf(p.type);
  if (f === 'block') return { ...p, paint: p.type === 'tri' ? 'wood' : BLOCK_PAINTS[i % 4], sym: SYMS[i % 3] };
  if (f === 'book') return { ...p, paint: BOOK_PAINTS[i % 3] };
  if (f === 'domino') return { ...p, pips: [1 + (i * 5) % 6, 1 + (i * 3 + 2) % 6] as [number, number] };
  return p;
}

// ---------- the draw: identical for both players (the duplicate-bridge rule) ----------
// No budget (Thomas, playtest 3: "the budget doesn't make building fun enough"): you may use everything in the box,
// and the box itself changes every match or round: a random mix of 4–6 kinds. Prices stay only as each piece's
// value, which weighs the destruction tiebreak.
export type Draw = Record<TrayKind, number>;
const MAX_OF: Record<TrayKind, number> = { card: 6, tent: 4, domino: 8, block: 8, tri: 4, long: 5, arch: 3, book: 5 };
export function makeDraw(rng: () => number, size = 18): Draw {
  for (;;) {
    const kinds = [...TRAY_ORDER];
    for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    const use = kinds.slice(0, 4 + Math.floor(rng() * 3)), d = Object.fromEntries(TRAY_ORDER.map(k => [k, 0])) as Draw;
    for (let n = 0, tries = 0; n < size && tries < 200; tries++) { const k = use[Math.floor(rng() * use.length)]; if (d[k] < MAX_OF[k]) { d[k]++; n++; } }
    // always enough to lift three plushies the minimum cell (and a bit more)
    const lifts = d.block + d.long + d.arch + d.tent + Math.floor(d.book / 2) + Math.floor(d.domino / 2);
    if (lifts >= 4) return d;
  }
}
export const boxSize = (d: Draw): number => TRAY_ORDER.reduce((n, k) => n + d[k], 0);

// ---------- build rules (docs/02-core-design.md §2, 04-systems.md §4) ----------
// MIN_PLUSH_Y 1 (was 3, then 2): propping the plushies up took 90% of the pieces (playtests 1 and 3)
export const RUG_W = 10, CAP = 7, MIN_PLUSH_Y = 1,   // CAP 7 (not 12 as in 04-systems): a phone's height is the limit
   PLUSHIES: Plushie[] = ['brumm', 'hoppel', 'socke'];
/** A plushie's body: taller than wide, to match its sprite (playtest 3: the sprites were bigger than their 1 × 1 boxes). */
export const PLUSH_W = 1, PLUSH_H = 1.4;
const E = 1e-6;
export const overlaps = (a: Piece, b: Piece): boolean =>
  a.x < b.x + b.w - E && b.x < a.x + a.w - E && a.y < b.y + b.h - E && b.y < a.y + a.h - E;
/** The open-sky funnel: a V opening upward from the plushie's waist, 20° from vertical. Nothing may reach into it.
 *  04-systems started at 45° from the feet; the prototype went to 30°, and playtest 3 to 20° from the waist, so pieces
 *  may come up to a plushie's waist. Watch for cheat castles. */
export const FUNNEL_SLOPE = Math.tan((20 * Math.PI) / 180);
export const funnelBase = (pl: Piece): number => pl.y + pl.h / 2;
export function inFunnel(pl: Piece, p: Piece): boolean {
  const base = funnelBase(pl);
  if (p === pl || p.y + p.h <= base + E) return false;
  const hwTop = pl.w / 2 + (p.y + p.h - base) * FUNNEL_SLOPE, cx = pl.x + pl.w / 2;
  return p.x < cx + hwTop - E && p.x + p.w > cx - hwTop + E;
}
/** Where a piece lands if dropped at x: on the highest surface under yHint (physics is off while building). */
export function dropY(p: Piece, others: Piece[]): number {
  let top = 0;
  for (const o of others) if (o.x < p.x + p.w - E && p.x < o.x + o.w - E && o.y + o.h <= p.y + 0.3) top = Math.max(top, o.y + o.h);
  return top;
}
export function fits(p: Piece, others: Piece[]): boolean {
  return p.x >= -E && p.x + p.w <= RUG_W + E && p.y >= -E && p.y + p.h <= CAP + E && others.every(o => !overlaps(p, o));
}
export interface Problems { lowPlushies: Piece[]; blocked: Piece[]; missing: number }
export function problems(fort: Piece[]): Problems {
  const pl = fort.filter(p => p.type === 'plush');
  return {
    lowPlushies: pl.filter(p => p.y < MIN_PLUSH_Y - E),
    blocked: pl.filter(q => fort.some(p => inFunnel(q, p))),
    missing: 3 - pl.length,
  };
}

// ---------- physics bodies ----------
export function shapesOf(p: Piece): Shape[] {
  const hw = p.w / 2, hh = p.h / 2;
  switch (p.type) {
    case 'arch':   // two feet and a lintel; the gap approximates the drawn half-circle
      return [{ kind: 'box', hw: 0.275 * hw, hh: 0.225 * p.h, cx: -0.725 * hw, cy: -0.275 * p.h },
              { kind: 'box', hw: 0.275 * hw, hh: 0.225 * p.h, cx: 0.725 * hw, cy: -0.275 * p.h },
              { kind: 'box', hw, hh: 0.275 * p.h, cy: 0.225 * p.h }];
    case 'tri':
      return [{ kind: 'poly', pts: [[-hw, -hh], [hw, -hh], [0, hh]] }];
    case 'cardTent': {   // ONE rigid piece: two cards joined at the top (Phase 6 spike)
      const len = Math.hypot(hw, p.h), lean = Math.atan2(hw, p.h);
      return [{ kind: 'box', hw: CARD_T / 2, hh: len / 2, cx: -hw / 2, angle: -lean },
              { kind: 'box', hw: CARD_T / 2, hh: len / 2, cx: hw / 2, angle: lean }];
    }
    default:
      return [{ kind: 'box', hw, hh }];
  }
}
export function bodyOf(p: Piece, rugX: number): BodySpec {
  return { x: rugX + p.x + p.w / 2, y: p.y + p.h / 2, shapes: shapesOf(p), mat: MATERIALS[familyOf(p.type)] };
}

// ---------- hand-made bot forts: only a fallback since bot.ts builds from the box (they ignore the draw's counts) ----------
type Spec = [PieceType, number, number, number, number, Plushie?];
const fort = (specs: Spec[]): Piece[] => specs.map(([type, x, y, w, h, plush], i) => decorate(type === 'plush' ? { type, x, y, w: PLUSH_W, h: PLUSH_H, plush } : { type, x, y, w, h, plush }, i));
const T = CARD_T;
export const BOT_FORTS: Piece[][] = [
  fort([   // three towers (the style-frame fort)
    ['block', 0, 0, 1, 1], ['block', 2, 0, 1, 1], ['bookLie', 0, 1, 3, 0.5], ['block', 1, 1.5, 1, 1], ['block', 1, 2.5, 1, 1],
    ['arch', 3.5, 0, 2, 1], ['domStand', 3.55, 1, 0.5, 2], ['domStand', 4.95, 1, 0.5, 2], ['cardFlat', 3.4, 3, 2.2, T], ['cardTent', 3.75, 3 + T, 1.5, 1.4], ['cardFlat', 3.5, 3 + T + 1.4, 2, T],
    ['long', 6.5, 0, 1, 2], ['long', 8.5, 0, 1, 2], ['bookLie', 6.5, 2, 3, 0.5], ['block', 7.5, 2.5, 1, 1],
    ['plush', 1, 3.5, 1, 1, 'brumm'], ['plush', 4, 3 + 2 * T + 1.4, 1, 1, 'hoppel'], ['plush', 7.5, 3.5, 1, 1, 'socke'],
  ]),
  fort([   // three columns
    ['block', 0.5, 0, 1, 1], ['block', 0.5, 1, 1, 1], ['block', 0.5, 2, 1, 1], ['block', 1.5, 0, 1, 1],
    ['long', 4.5, 0, 1, 2], ['block', 4.5, 2, 1, 1], ['block', 4.5, 3, 1, 1], ['domStand', 4, 0, 0.5, 2], ['domStand', 5.5, 0, 0.5, 2],
    ['bookStand', 7.5, 0, 0.5, 3], ['bookStand', 9.5, 0, 0.5, 3], ['bookLie', 7, 3, 3, 0.5], ['block', 8.25, 0, 1, 1],
    ['plush', 0.5, 3, 1, 1, 'brumm'], ['plush', 4.5, 4, 1, 1, 'hoppel'], ['plush', 8, 3.5, 1, 1, 'socke'],
  ]),
  fort([   // tall middle, low wings
    ['block', 0, 0, 1, 1], ['block', 0, 1, 1, 1], ['block', 0, 2, 1, 1], ['block', 9, 0, 1, 1], ['block', 9, 1, 1, 1], ['block', 9, 2, 1, 1],
    ['bookLie', 3, 0, 3, 0.5], ['bookLie', 3, 0.5, 3, 0.5], ['long', 3.5, 1, 1, 2], ['long', 4.5, 1, 1, 2], ['bookLie', 3, 3, 3, 0.5],
    ['cardTent', 3.75, 3.5, 1.5, 1.4], ['cardFlat', 3.5, 4.9, 2, T],
    ['plush', 0, 3, 1, 1, 'brumm'], ['plush', 4, 4.9 + T, 1, 1, 'hoppel'], ['plush', 9, 3, 1, 1, 'socke'],
  ]),
];
