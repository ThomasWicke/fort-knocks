// An online room: a Durable Object per room code (partyserver). It seats two phones, starts matches, relays forts,
// shots and snapshots, waits for both phones before each step of the siege, and keeps the game log in D1.
// The physics runs on the phones (party/protocol.ts explains who simulates what); the room never simulates.
// Its state is small and saved on every change, so a room survives being evicted while both phones sleep.
import { Server, type Connection, type WSMessage } from 'partyserver';
import { insertGame, updateGame } from './games-db';
import { SEAT_NAME, SEAT_TEAM, type C2S, type Phase, type S2C, type Seat } from './protocol';

interface SeatState {
  player: string | null; conn: string | null; app: string; device: string;
  fort: unknown[] | null; buildMs: number; tests: number;
  fired: string[];            // ammo fired in the current volley (for a phone that reloads mid-volley)
  live: unknown[];            // those shots as fired, in case the phone reloads before its 'done' carries the final records
  done: number; lava: number; // the last volley this seat reported done / its lava risen
}
interface RoomState {
  phase: Phase; n: number; draw: unknown; schedule: unknown; game: number | null; started: string;
  volley: number;
  seats: [SeatState, SeatState];
  /** Per fort (indexed by its owner's seat), as reported by the phone that attacks it. */
  standing: [number, number]; destroyed: [number, number]; drowned: [unknown[], unknown[]];
  snaps: [unknown, unknown];
  shots: unknown[]; volleys: { volley: number; standing: { blue: number; green: number } }[];
}

const VOLLEYS = 3;
const seat = (): SeatState => ({ player: null, conn: null, app: '', device: '', fort: null, buildMs: 0, tests: 0, fired: [], live: [], done: 0, lava: 0 });
const fresh = (): RoomState => ({
  phase: 'lobby', n: 0, draw: null, schedule: null, game: null, started: '', volley: 0, seats: [seat(), seat()],
  standing: [3, 3], destroyed: [0, 0], drowned: [[], []], snaps: [null, null], shots: [], volleys: [],
});

export class FortRoom extends Server<Env> {
  private s: RoomState = fresh();

  async onStart(): Promise<void> {
    const saved = await this.ctx.storage.get<RoomState>('state');
    if (saved) { this.s = saved; for (const st of this.s.seats) st.conn = null; }   // connections don't survive a restart
  }
  private persist(): void { void this.ctx.storage.put('state', this.s); }

  onClose(conn: Connection): void {
    const st = this.s.seats.find(x => x.conn === conn.id);
    if (st) { st.conn = null; this.persist(); this.sendRoom(); }
  }

  async onMessage(conn: Connection, raw: WSMessage): Promise<void> {
    if (typeof raw !== 'string') return;
    let m: C2S;
    try { m = JSON.parse(raw) as C2S; } catch { return; }
    if (m.t === 'hello') return this.hello(conn, m);
    const found = this.s.seats.findIndex(x => x.conn === conn.id);
    if (found < 0) return;
    const me = found as Seat, other = (1 - me) as Seat, s = this.s;
    switch (m.t) {
      case 'start':   // a new match: when both are here (from the lobby) or after a result (rematch)
        if (s.phase === 'siege' || s.phase === 'build' || !s.seats.every(x => x.conn)) return;
        Object.assign(s, { phase: 'build', n: s.n + 1, draw: m.draw, schedule: m.schedule, game: null, started: new Date().toISOString(), volley: 0,
          standing: [3, 3], destroyed: [0, 0], drowned: [[], []], snaps: [null, null], shots: [], volleys: [] });
        for (const st of s.seats) Object.assign(st, { fort: null, buildMs: 0, tests: 0, fired: [], live: [], done: 0, lava: 0 });
        this.persist(); this.sendRoom();
        await this.saveLog();
        this.sendRoom();   // again, now with the game number
        return;
      case 'fort':
        if (s.phase !== 'build' || m.n !== s.n) return;
        Object.assign(s.seats[me], { fort: m.fort, buildMs: m.buildMs, tests: m.tests });
        if (s.seats.every(x => x.fort)) {
          s.phase = 'siege'; s.volley = 1;
          this.broadcastMsg({ t: 'siege', forts: s.seats.map(x => x.fort!), volley: 1 });
        }
        this.persist(); this.sendRoom();
        await this.saveLog();
        return;
      case 'snap':   // the fort of the other seat, as simulated here
        s.snaps[other] = m.snap;
        this.sendTo(other, { t: 'snap', snap: m.snap });
        return;   // not persisted every time: the next save carries it
      case 'shot':
        s.seats[me].fired.push(m.ammo); s.seats[me].live.push(m.shot);
        this.sendTo(other, { t: 'shot', shot: m.shot, ammo: m.ammo });
        this.persist();
        return;
      case 'done':
        if (s.phase !== 'siege' || m.volley !== s.volley || s.seats[me].done >= m.volley) return;
        s.seats[me].done = m.volley; s.standing[other] = m.standing; s.destroyed[other] = m.destroyed;
        // the final records, plus any shot fired before a reload that this phone no longer knows about
        const steps = new Set(m.shots.map(x => (x as { step?: number }).step));
        s.shots.push(...s.seats[me].live.filter(x => !steps.has((x as { step?: number }).step)), ...m.shots);
        this.persist();
        if (s.seats.every(x => x.done >= s.volley)) {
          if (s.volley < VOLLEYS) this.broadcastMsg({ t: 'rise', volley: s.volley });
          else await this.finish();
        }
        await this.saveLog();
        return;
      case 'lava':
        if (s.phase !== 'siege' || m.volley !== s.volley || s.seats[me].lava >= m.volley) return;
        s.seats[me].lava = m.volley; s.standing[other] = m.standing; s.destroyed[other] = m.destroyed; s.drowned[other] = m.drowned;
        if (s.seats.every(x => x.lava >= s.volley)) {
          s.volleys.push({ volley: s.volley, standing: { blue: s.standing[0], green: s.standing[1] } });
          if (s.standing.some(n => n === 0)) await this.finish();
          else {
            s.volley++;
            for (const st of s.seats) { st.fired = []; st.live = []; }
            this.broadcastMsg({ t: 'volley', volley: s.volley });
          }
        }
        this.persist();
        await this.saveLog();
        return;
    }
  }

  /** Seat a phone: back into its own seat if it was here before, else into a free one. */
  private hello(conn: Connection, m: Extract<C2S, { t: 'hello' }>): void {
    const s = this.s;
    let i = s.seats.findIndex(x => x.player === m.player);
    if (i < 0) i = s.seats.findIndex(x => !x.player || (!x.conn && s.phase === 'lobby'));
    if (i < 0) { conn.send(JSON.stringify({ t: 'room', code: this.name, you: null, phase: s.phase, seats: this.seatInfo(), match: null, volley: 0, full: true } satisfies S2C)); return; }
    const st = s.seats[i];
    Object.assign(st, { player: m.player, conn: conn.id, app: m.app, device: m.device });
    this.persist();
    this.sendRoom();
    if (s.phase === 'siege') {   // back in mid-siege: both forts, and where this phone had got to
      const me = i as Seat;
      conn.send(JSON.stringify({ t: 'siege', forts: s.seats.map(x => x.fort!), volley: s.volley,
        resume: { snap: s.snaps[1 - me], fired: st.fired, done: st.done >= s.volley } } satisfies S2C));
      if (st.done >= s.volley && s.seats.every(x => x.done >= s.volley) && s.volley < VOLLEYS && st.lava < s.volley) conn.send(JSON.stringify({ t: 'rise', volley: s.volley } satisfies S2C));
    }
    if (s.phase === 'result') conn.send(JSON.stringify(this.resultMsg()));
  }

  private async finish(): Promise<void> {
    this.s.phase = 'result';
    this.persist();
    this.broadcastMsg(this.resultMsg());
    this.sendRoom();
  }
  /** Most plushies standing wins; a tie goes to whoever knocked off the larger share of the other's fort. */
  private resultMsg(): S2C {
    const { standing: st, destroyed: d, game } = this.s;
    const winner: Seat | null = st[0] !== st[1] ? (st[0] > st[1] ? 0 : 1) : d[1] !== d[0] ? (d[1] > d[0] ? 0 : 1) : null;
    return { t: 'result', standing: [...st], destroyed: [...d], winner, game };
  }

  // ---------- the game log ----------
  private log(): Record<string, unknown> {
    const s = this.s, res = s.phase === 'result' ? this.resultMsg() as Extract<S2C, { t: 'result' }> : null;
    const status = s.phase === 'result' ? 'done' : s.phase === 'siege' ? 'siege' : 'building';
    const winner = res ? (res.winner === null ? 'draw' : SEAT_TEAM[res.winner]) : null;
    const summary = res ? `Blue ${s.standing[0]} – Green ${s.standing[1]} · ${res.winner === null ? 'draw' : `${SEAT_NAME[res.winner]} wins${s.standing[0] === s.standing[1] ? ' on destruction' : ''}`}`
      : s.phase === 'siege' ? `Volley ${s.volley} · Blue ${s.standing[0]} – Green ${s.standing[1]}` : 'Both building';
    return {
      v: 1, app: s.seats[0].app || s.seats[1].app, mode: 'online', started: s.started, room: this.name,
      device: s.seats.map(x => x.device).join(' | '), status, draw: s.draw, schedule: s.schedule,
      sides: s.seats.map((x, i) => ({ team: SEAT_TEAM[i], name: SEAT_NAME[i], bot: false, fort: x.fort, buildMs: x.buildMs, tests: x.tests, drowned: s.drowned[i] })),
      shots: s.shots, volleys: s.volleys,
      result: res ? { standing: { blue: s.standing[0], green: s.standing[1] }, destroyed: { blue: s.destroyed[0], green: s.destroyed[1] }, winner, ms: Date.now() - Date.parse(s.started) } : undefined,
      winner, summary,
    };
  }
  private async saveLog(): Promise<void> {
    const log = this.log(), text = JSON.stringify(log), head = log as { app?: string; mode?: string; status?: string; winner?: string | null; summary?: string };
    try {
      if (this.s.game === null) { this.s.game = await insertGame(this.env.DB, text, head); this.persist(); }
      else await updateGame(this.env.DB, this.s.game, text, head);
    } catch (e) { console.error('game log', e); }
  }

  // ---------- sending ----------
  private seatInfo() { return this.s.seats.map(x => ({ here: !!x.conn, ready: !!x.fort })); }
  private sendRoom(): void {
    const s = this.s, match = s.n ? { n: s.n, draw: s.draw, schedule: s.schedule, game: s.game } : null;
    s.seats.forEach((st, i) => {
      if (!st.conn) return;
      this.getConnection(st.conn)?.send(JSON.stringify({ t: 'room', code: this.name, you: i as Seat, phase: s.phase, seats: this.seatInfo(), match, volley: s.volley } satisfies S2C));
    });
  }
  private sendTo(i: Seat, m: S2C): void { const c = this.s.seats[i].conn; if (c) this.getConnection(c)?.send(JSON.stringify(m)); }
  private broadcastMsg(m: S2C): void { for (const i of [0, 1] as Seat[]) this.sendTo(i, m); }
}
