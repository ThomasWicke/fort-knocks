// The game log. Every match played on the deployed game goes to D1 (worker.ts), so playtest feedback can name a
// game ("game 12, Green's second shot"). A log holds everything a replay needs: both forts as built and every
// shot as (step, pull) on its target's range (range.ts explains why that is enough).
import type { Draw, Piece, Plushie } from './fort';
import type { Ammo } from './ammo';
import type { Rules } from './modes';
import type { Repair, ShotRec } from './range';

export type Team = 'blue' | 'green';
/** A shot is the range's own record plus who fired it and how the aim went. */
export interface ShotLog extends ShotRec {
  volley: number; by: Team; n: number;
  raw?: { x: number; y: number };   // the pull at the moment the finger lifted; `pull` is what was fired (see main.ts, release)
  aimMs?: number;                   // finger down to release
}
export interface SideLog {
  team: Team; name: string; bot: boolean;
  fort: Piece[] | null;              // null until built
  buildMs?: number; tests?: number;  // how long building took, and how often Test was pressed
  botFort?: number;                  // which of BOT_FORTS
  drowned?: Plushie[];               // plushies the rising lava took
}
export interface GameLog {
  v: 1;
  app: string;                       // build (git commit)
  mode: 'pass' | 'bot' | 'online';
  /** The mode's rules (modes.ts; absent before M4: the Siege) and, in Best of Three, the round. */
  rules?: Rules; round?: number;
  started: string;                   // ISO time
  device: string;
  status: 'building' | 'siege' | 'done' | 'quit';
  draw: Draw;
  /** The ammo schedule, two per volley (absent in logs from before M3: marbles only). */
  schedule?: Ammo[][];
  sides: [SideLog, SideLog];
  shots: ShotLog[];
  /** Siege repairs, per fort (by = the fort's owner), with the step of its range they landed at (replays apply them there). */
  repairs?: ({ by: Team; step: number } & Repair)[];
  /** Plushies standing after each volley, once the lava has risen. */
  volleys: { volley: number; standing: Record<Team, number> }[];
  /** destroyed: the share of each team's own fort that was knocked off (by price, the tiebreak). */
  result?: { standing: Record<Team, number>; destroyed: Record<Team, number>; winner: Team | 'draw'; ms: number };
  winner: Team | 'draw' | null;
  summary: string;
}

// The Vite dev server has no API. Built code (deployed, or `npm run dev:worker`) records.
const ENABLED = !import.meta.env.DEV;

/** Keeps one match's log and sends all of it at each checkpoint. Every send replaces the row, so a request
 *  that fails (offline, a tunnel) is simply covered by the next one. */
export class Recorder {
  id: number | null = null;
  onId: ((id: number) => void) | null = null;
  private busy = false;
  private again = false;

  /** enabled: false for online matches, whose room keeps the log (party/room.ts). */
  constructor(public log: GameLog, private enabled = true) { void this.save(); }

  async save(): Promise<void> {
    if (!ENABLED || !this.enabled) return;
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    try {
      const body = JSON.stringify(this.log), headers = { 'content-type': 'application/json' };
      if (this.id === null) {
        const r = await fetch('/api/games', { method: 'POST', body, headers });
        if (r.ok) { this.id = (await r.json() as { id: number }).id; this.onId?.(this.id); }
      } else await fetch(`/api/games/${this.id}`, { method: 'PUT', body, headers });
    } catch { /* offline: the next checkpoint sends everything again */ }
    this.busy = false;
    if (this.again) { this.again = false; void this.save(); }
  }

  /** The page is going away (app switched, tab closed): a last fire-and-forget copy. */
  beacon(): void {
    if (!ENABLED || !this.enabled || this.id === null) return;
    navigator.sendBeacon(`/api/games/${this.id}`, new Blob([JSON.stringify(this.log)], { type: 'application/json' }));
  }
}

export function deviceInfo(): string {
  return `${navigator.userAgent} · ${innerWidth}×${innerHeight} @${devicePixelRatio}`;
}
