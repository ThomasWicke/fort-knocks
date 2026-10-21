// Messages between the two phones and their room (party/room.ts). Shared by the client and the Worker.
//
// How an online match runs: both phones build at the same time from the same draw. In the siege, each phone
// simulates the fort it attacks (Box2D on that phone is the authority for that fort) and streams snapshots of it to
// the fort's owner, who watches their own fort as a picture. Both players shoot at the same time; the room waits
// for both before it raises the lava or starts the next volley, and it keeps the game log.
//
// Forts, shots and snapshots are opaque to the room: it stores and relays them, and only reads the plushie counts.

export type Seat = 0 | 1;
export type Phase = 'lobby' | 'build' | 'siege' | 'result';
export const SEAT_TEAM = ['blue', 'green'] as const;
export const SEAT_NAME = ['Blue', 'Green'] as const;

export interface SeatInfo { here: boolean; ready: boolean }
/** One match in the room. n counts matches (rematches), game is its number in the game log. */
export interface MatchSetup { n: number; draw: unknown; schedule: unknown; game: number | null; rules: string; round: number; wins: number[] }

export type C2S =
  /** On every (re)connect. player: a random id kept on the device, so a reconnect gets its seat back. */
  | { t: 'hello'; player: string; app: string; device: string }
  /** Start a match (when both are here), a rematch, or Best of Three's next round. The phone rolls the draw and the ammo. */
  | { t: 'start'; draw: unknown; schedule: unknown; rules: string; round: number }
  /** Ready: this phone's fort for match n. */
  | { t: 'fort'; n: number; fort: unknown[]; buildMs: number; tests: number }
  /** A snapshot of the opponent's fort, as simulated on this phone (relayed to its owner). */
  | { t: 'snap'; snap: unknown }
  /** A shot just fired (relayed, so the other phone knows what's coming; the final record comes with 'done'). */
  | { t: 'shot'; shot: unknown; ammo: string }
  /** This phone's shots for the volley are done and its target is quiet. shots: their final records. */
  | { t: 'done'; volley: number; standing: number; destroyed: number; shots: unknown[]; repairs?: unknown[] }
  /** The Siege's repair of this phone's own fort (lands on the other phone, which simulates it, when the next volley starts). */
  | { t: 'repaired'; volley: number; repair: unknown }
  /** The lava has risen on this phone's target. */
  | { t: 'lava'; volley: number; standing: number; destroyed: number; drowned: unknown[] };

export type S2C =
  | { t: 'room'; code: string; you: Seat | null; phase: Phase; seats: SeatInfo[]; match: MatchSetup | null; volley: number; full?: boolean }
  /** Both forts are in. resume: for a phone that reloaded mid-siege, its target as last streamed and what it already fired this volley. */
  | { t: 'siege'; forts: unknown[][]; volley: number; resume?: { snap: unknown | null; fired: string[]; done: boolean } }
  | { t: 'snap'; snap: unknown }
  | { t: 'shot'; shot: unknown; ammo: string }
  /** The next volley. repair: the other player's repair, to land on the fort this phone simulates; mine: this phone's own. */
  | { t: 'volley'; volley: number; repair?: unknown; mine?: unknown }
  /** Siege: both repair their own fort before volley n. */
  | { t: 'repair'; volley: number }
  | { t: 'rise'; volley: number }
  | { t: 'result'; standing: number[]; destroyed: number[]; winner: Seat | null; game: number | null; rules: string; round: number; wins: number[]; over: boolean };
