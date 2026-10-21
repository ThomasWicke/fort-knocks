// The three modes (docs/02-core-design.md §3, numbers from docs/04-systems.md §11), as configurations of one match
// engine. Thomas's call: build all three, then keep the ones that are fun in different ways (cutting criteria §3a).
import { AMMO_ORDER, type Ammo } from './ammo';

export type Rules = 'siege' | 'rounds' | 'race';
export interface ModeSpec {
  name: string; short: string; blurb: string;
  /** How many pieces the toy box holds: one entry, or one per round (no budget since playtest 3: use what's there). */
  boxes: number[];
  /** Build time in seconds (a soft clock: it turns red, nothing is forced). */
  buildSecs: number[];
  /** Shots per player per volley (siege) or per round (rounds). Race: unlimited. */
  shots: number[];
  volleys: number;
  /** How the lava rises: after each volley, every 30 s, or not at all. */
  lava: 'volley' | 'timed' | 'off';
  /** Race only: reload time and match clock, in seconds. */
  reload?: number; clock?: number;
  /** Pass and play needs turns; the race has none, so it's for the bot and for two phones. */
  pass: boolean;
}

export const MODES: Record<Rules, ModeSpec> = {
  siege: {
    name: 'The Siege', short: 'Siege', blurb: 'One fort, three volleys of two shots. The lava rises after each volley.',
    boxes: [18], buildSecs: [90], shots: [2, 2, 2], volleys: 3, lava: 'volley', pass: true,
  },
  rounds: {
    name: 'Best of Three', short: 'Best of 3', blurb: 'Three quick rounds, each fort bigger than the last: 2, 3, then 4 shots.',
    boxes: [10, 14, 18], buildSecs: [45, 60, 75], shots: [2, 3, 4], volleys: 1, lava: 'off', pass: true,
  },
  race: {
    name: 'Before Mum Comes In', short: 'Before Mum', blurb: 'Both shoot at once, as fast as you reload. When Mum opens the door, it\'s over.',
    boxes: [15], buildSecs: [75], shots: [], volleys: 1, lava: 'timed', reload: 5, clock: 120, pass: false,
  },
};
export const RULES_ORDER: Rules[] = ['siege', 'rounds', 'race'];
/** The lava rises half a cell at a time (to 0.5, then 1 in the Siege; every 30 s in the race). With plushies allowed
 *  at 1 cell, a whole cell per volley would have drowned every minimum-height plushie before the last volley. */
export const LAVA_STEP = 0.5;
/** The lava during volley v (the Siege) or the race's 30-second period v. Replays use it too. */
export const lavaFor = (rules: Rules | undefined, v: number): number => (rules === 'rounds' ? 0 : (v - 1) * LAVA_STEP);
/** The toy box size for a match or a round. */
export const boxFor = (rules: Rules, round: number): number => { const b = MODES[rules].boxes; return b[Math.min(round, b.length) - 1]; };

/** Best of Three draws its ammo per round: n shots, as varied as possible. */
export function roundAmmo(n: number, rng: () => number): Ammo[][] {
  const bag = [...AMMO_ORDER];
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  return [Array.from({ length: n }, (_, i) => bag[i % bag.length])];
}

/** The rules picked on this device (the menu remembers the last one). */
export function savedRules(): Rules {
  try { const r = localStorage.getItem('fk-rules'); if (r && r in MODES) return r as Rules; } catch { /* default */ }
  return 'siege';
}
export function saveRules(r: Rules): void { try { localStorage.setItem('fk-rules', r); } catch { /* fine */ } }
