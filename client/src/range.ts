// One range: a fort on its rug, the attacker's launcher in front of it, the lava around it.
// Each fort has its own range and physics world, and it keeps its ruins between volleys.
import { World, type Shape } from './physics';
import { MATERIALS, RUG_W, bodyOf, priceOf, type Piece, type Plushie } from './fort';
import { P, drawPiece, drawPlush, rrPath } from './draw';
import { AMMO, CRUSH_MOMENTUM, DRILL, JACK, SPLASH, drawAmmo, drawJack, drawTop, type Ammo } from './ammo';
import { FX_LIFE, drawFx, type Fx } from './fx';
import { drawPlushSprite, drawRoom, drawRug } from './art';

export const G = 10, STEP = 1 / 60;
export const RUG = { x0: -0.3, x1: RUG_W + 0.3 };
export const LAVA_TOP = -0.3;
export const BOOK = { x: -14, y: 0.1, hw: 1.7, hh: 0.4 };
export const ANCHOR = { x: -13.6, y: 2.35 };   // between the pencil tops
export const MAX_PULL = 2.0, V_MAX = 16, MIN_PULL = 0.35;   // V_MAX was 20; 16 still reaches the back of the rug
const PREVIEW_SHARE = 0.35;                      // crayon dots show the first 35% of the arc (04-systems)
const LOST_FADE = 72;                            // steps (1.2 s) a knocked-off piece fades before it's removed
const SLOW = { steps: 54, rate: 0.3 };           // a plushie going out: 54 steps (0.9 s) at 0.3× speed

export class Cam {
  k = 30; ox = 0; oy = 0;
  /** Fit a world rectangle into a screen rectangle (css px), centred. */
  fit(v: { x0: number; x1: number; y0: number; y1: number }, r: { x: number; y: number; w: number; h: number }): void {
    this.k = Math.min(r.w / (v.x1 - v.x0), r.h / (v.y1 - v.y0));
    this.ox = r.x + (r.w - (v.x1 - v.x0) * this.k) / 2 - v.x0 * this.k;
    this.oy = r.y + r.h - (r.h - (v.y1 - v.y0) * this.k) / 2 + v.y0 * this.k;
  }
  sx = (x: number) => this.ox + x * this.k;
  sy = (y: number) => this.oy - y * this.k;
  wx = (px: number) => (px - this.ox) / this.k;
  wy = (py: number) => (this.oy - py) / this.k;
}

// out: the plushie no longer counts (it touched down, was crushed, or the lava took it). down: it touched the rug or the
// floor, which is what starts the slow motion. Kept apart so slow motion depends on the physics alone, never on the lava.
interface Entry { piece: Piece; id: number; lost: boolean; out: boolean; down: boolean; lostAt: number; gone: boolean; wet: boolean }
export type Pull = { x: number; y: number };
/** One shot fired at this range, and what it did (for the game log and replays). tap: the step its ability was
 *  triggered at. state: the fort's fingerprint when it was fired, so a replay can tell it's still the same game. */
export interface ShotRec {
  step: number; pull: Pull; ammo: Ammo; tap?: number; state: number;
  impact: [number, number] | null; out: Plushie[]; crushed?: Plushie[]; lost: number;
}
interface Flight { ammo: Ammo; ids: number[]; tapped: boolean; drill: number; impactAt: number; lastSpeed: number }

// Replays need the same shot to do the same thing twice. So the world only ever advances in counted steps:
// everything that touches physics (fire, abilities, removing a knocked-off piece, slow motion) happens at a step
// number, never at a wall-clock time, and a shot is fully described by its step, its pull, its ammo and its tap step.
export class Range {
  world = new World(-G);
  entries: Entry[];
  state: 'aim' | 'flight' = 'aim';
  flight: Flight | null = null;
  flightT = 0;
  /** Physics steps taken since the fort was built. */
  steps = 0;
  shots: ShotRec[] = [];
  /** Plushies the rising lava took (not a shot). */
  drowned: Plushie[] = [];
  fx: Fx[] = [];
  trail: [number, number][] = [];
  lastTrail: [number, number][] = [];
  private slow = 0;
  private acc = 0;
  private byId = new Map<number, Entry>();
  /** Called once per finished shot. */
  onShotDone: ((shot: ShotRec) => void) | null = null;

  constructor(blueprint: Piece[], public team: 'blue' | 'green') {
    const w = this.world;
    w.add({ x: 0, y: LAVA_TOP - 0.2, shapes: [{ kind: 'box', hw: 60, hh: 0.2 }], mat: MATERIALS.floor, fixed: true });
    w.add({ x: (RUG.x0 + RUG.x1) / 2, y: -0.15, shapes: [{ kind: 'box', hw: (RUG.x1 - RUG.x0) / 2, hh: 0.15 }], mat: MATERIALS.floor, fixed: true });
    w.add({ x: BOOK.x, y: BOOK.y, shapes: [{ kind: 'box', hw: BOOK.hw, hh: BOOK.hh }], mat: MATERIALS.floor, fixed: true });
    this.entries = blueprint.map(piece => ({ piece, id: w.add(bodyOf(piece, 0)), lost: false, out: false, down: false, lostAt: 0, gone: false, wet: false }));
    for (const e of this.entries) this.byId.set(e.id, e);
  }

  /** The settle: physics switches on, whatever falls, falls. */
  settle(seconds = 3): void { for (let i = 0; i < seconds * 60; i++) this.step(0, false); }

  pouch(pull: Pull | null): { x: number; y: number } { return pull ? { x: ANCHOR.x - pull.x, y: ANCHOR.y - pull.y } : { ...ANCHOR }; }

  fire(pull: Pull, ammo: Ammo = 'marble'): boolean {
    if (this.state !== 'aim' || Math.hypot(pull.x, pull.y) < MIN_PULL) return false;
    const at = this.pouch(pull), v = launchVelocity(pull), a = AMMO[ammo];
    const id = this.world.add({ x: at.x, y: at.y, shapes: [{ kind: 'circle', r: a.r }], mat: a, bullet: true, vx: v.x, vy: v.y, events: true });
    this.flight = { ammo, ids: [id], tapped: false, drill: -1, impactAt: -1, lastSpeed: Math.hypot(v.x, v.y) };
    this.state = 'flight'; this.flightT = 0; this.trail = [];
    this.shots.push({ step: this.steps, pull: { ...pull }, ammo, state: this.fingerprint(), impact: null, out: [], lost: 0 });
    return true;
  }

  /** The tap in flight: jacks scatter, the top drills, the balloon bursts. False if there's nothing to trigger. */
  ability(): boolean {
    const f = this.flight;
    if (this.state !== 'flight' || !f || f.tapped || !AMMO[f.ammo].tap || !f.ids.length) return false;
    const w = this.world, id = f.ids[0], p = w.transform(id), v = w.velocity(id);
    f.tapped = true;
    this.shots[this.shots.length - 1].tap = this.steps;
    if (f.ammo === 'jacks') {   // the bundle fans out into four jacks
      w.remove(id); f.ids = [];
      const speed = Math.hypot(v.x, v.y), dir = Math.atan2(v.y, v.x), arms: Shape[] = [0, 1, 2].map(i => ({ kind: 'box', hw: JACK.arm, hh: JACK.thick, angle: (i * Math.PI) / 3 }));
      JACK.spread.forEach((da, i) => {
        const a = dir + da, s = speed * JACK.speed[i];
        f.ids.push(w.add({ x: p.x + Math.cos(a + Math.PI / 2) * da * 0.6, y: p.y + Math.sin(a + Math.PI / 2) * da * 0.6, angle: i, shapes: arms,
          mat: { density: JACK.density, friction: 0.6, restitution: 0.15 }, bullet: true, vx: Math.cos(a) * s, vy: Math.sin(a) * s, spin: (i - 1.5) * 8, events: true }));
      });
      this.fx.push({ kind: 'scatter', x: p.x, y: p.y, at: this.steps });
    } else if (f.ammo === 'top') {   // stops dead and drills straight down. Still a body among bodies: light pieces give way,
      w.setVelocity(id, 0, -DRILL.speed, DRILL.spin);   // a heavy stack stops it (a kinematic drill flattened whole towers)
      f.drill = Math.round(DRILL.maxT * 60);
    } else this.burst(p.x, p.y);
    return true;
  }

  /** The water balloon bursts: a push wave, and everything it reaches is soaked (slippery). */
  private burst(x: number, y: number): void {
    const f = this.flight!, w = this.world;
    for (const id of f.ids) w.remove(id);
    f.ids = [];
    if (f.impactAt < 0) { f.impactAt = this.flightT; this.shots[this.shots.length - 1].impact = [round2(x), round2(y)]; }
    for (const e of this.entries) {
      if (e.gone) continue;
      const t = w.transform(e.id), dx = t.x - x, dy = t.y - y, d = Math.hypot(dx, dy);
      if (d > SPLASH.radius) continue;
      const fall = 1 - d / SPLASH.radius, n = d > 0.05 ? 1 / d : 0, imp = SPLASH.impulse * fall;
      w.impulse(e.id, (n ? dx * n : 0.3) * imp, (n ? dy * n : 1) * imp + 0.3 * imp);
      if (!e.wet) { e.wet = true; w.setFriction(e.id, SPLASH.wetFriction); }
    }
    this.fx.push({ kind: 'splash', x, y, at: this.steps, r: SPLASH.radius });
  }

  /** Advance by real time dt. Slow motion only stretches time: each step stays the same physics either way.
   *  stopAt: never step past this step number (replays fire and tap exactly there). */
  tick(dt: number, lava: number, stopAt = Infinity): void {
    this.acc = Math.min(this.acc + dt, 0.25);
    while (this.acc >= STEP && this.steps < stopAt) { this.acc -= STEP; this.step(lava, true); }
    if (this.steps >= stopAt) this.acc = 0;
  }

  /** Step at once (no drawing) up to step number n. Replays use it to skip quiet stretches. */
  stepTo(n: number, lava: number): void { while (this.steps < n) this.step(lava, true); this.acc = 0; }

  private step(lava: number, live: boolean): void {
    // slow motion: a smaller step per frame. The step sizes follow from the physics alone, so replays match.
    const h = this.slow > 0 ? STEP * SLOW.rate : STEP;
    if (this.slow > 0) this.slow--;
    this.world.step(h); this.steps++;
    if (this.state === 'flight') { this.flightT += h; this.contacts(); }
    this.judge(lava, live);
    if (this.fx.length) this.fx = this.fx.filter(f => this.steps - f.at < FX_LIFE[f.kind]);
  }

  /** What the ammo touched this step: the balloon bursts on its first touch, and a hard direct hit crushes a plushie. */
  private contacts(): void {
    const f = this.flight!, w = this.world, shot = this.shots[this.shots.length - 1];
    // (not in its first 0.15 s: a steep full pull starts it brushing the launcher's book)
    if (f.ammo === 'balloon' && f.ids.length && this.flightT > 0.15 && w.begins.some(([a, b]) => a === f.ids[0] || b === f.ids[0])) {
      const p = w.transform(f.ids[0]); this.burst(p.x, p.y); return;
    }
    const crush = (e: Entry | undefined) => {
      if (!e || e.piece.type !== 'plush' || e.out) return;
      e.out = true; this.slow = SLOW.steps;
      shot.out.push(e.piece.plush!); (shot.crushed ??= []).push(e.piece.plush!);
      const t = w.transform(e.id); this.fx.push({ kind: 'puff', x: t.x, y: t.y, at: this.steps });
    };
    for (const hit of w.hits) {
      const ammo = f.ids.includes(hit.a) ? hit.a : f.ids.includes(hit.b) ? hit.b : -1;
      if (ammo < 0) continue;
      const other = this.byId.get(ammo === hit.a ? hit.b : hit.a);
      if (f.ammo !== 'balloon' && w.mass(ammo) * hit.speed >= CRUSH_MOMENTUM) crush(other);
      if (f.impactAt < 0 && other) this.fx.push({ kind: 'hit', x: w.transform(ammo).x, y: w.transform(ammo).y, at: this.steps });
    }
    if (f.drill > 0) {   // drilling: dust flies until it stops or reaches the rug
      const p = w.transform(f.ids[0]);
      if (this.steps % 4 === 0) this.fx.push({ kind: 'drill', x: p.x, y: p.y, at: this.steps });
      if (--f.drill === 0 || p.y <= AMMO.top.r + 0.02) f.drill = 0;
    }
  }

  private judge(lava: number, live: boolean): void {
    const shot = live ? this.shots[this.shots.length - 1] : undefined;
    for (const e of this.entries) {
      if (e.gone) continue;
      const t = this.world.transform(e.id);
      if (e.piece.type === 'plush') {
        if (!e.down && t.y < 0.62) {   // on the rug or the floor
          e.down = true;
          if (live) this.slow = SLOW.steps;
          if (!e.out) { e.out = true; shot?.out.push(e.piece.plush!); }
        } else if (!e.out && t.y - 0.5 < lava - 0.02) { e.out = true; this.drowned.push(e.piece.plush!); }   // the risen lava reached its feet
      } else if (!e.lost && t.y < 1.5 && (t.x < RUG.x0 || t.x > RUG.x1)) {   // knocked off the rug
        e.lost = true; e.lostAt = this.steps;
        if (shot) shot.lost++;
      }
      if (e.lost && this.steps - e.lostAt > LOST_FADE) { this.fx.push({ kind: 'smoke', x: t.x, y: t.y, at: this.steps }); this.world.remove(e.id); e.gone = true; }
    }
    const f = this.flight;
    if (this.state !== 'flight' || !f) return;
    const lead = f.ids[0];
    if (lead !== undefined) {
      const m = this.world.transform(lead), v = this.world.velocity(lead), speed = Math.hypot(v.x, v.y);
      if (f.impactAt < 0) this.trail.push([m.x, m.y]);   // the arc up to the first hit
      // the first hit: a sudden loss of speed, or reaching the fort
      if (f.impactAt < 0 && (speed < f.lastSpeed * 0.75 || m.x >= RUG.x0 - 0.2 || m.y < 0)) {
        f.impactAt = this.flightT;
        if (shot) shot.impact = [round2(m.x), round2(m.y)];
      }
      f.lastSpeed = speed;
    }
    // the next shot is ready shortly after the hit, while the fort is still settling (playtest 1: waiting for rest was too slow)
    const gone = f.ids.every(id => { const p = this.world.transform(id); return !this.world.awake(id) || Math.abs(p.x) > 40 || p.y < -5; });
    const done = (f.impactAt >= 0 && this.flightT - f.impactAt > 1.6) || gone || this.flightT > 6;
    if (done) {
      for (const id of f.ids) this.world.remove(id);
      this.flight = null; this.state = 'aim'; this.lastTrail = this.trail;
      this.onShotDone?.(this.shots[this.shots.length - 1]);
    }
  }

  /** Where everything is, folded into one number. Equal only if every piece is where it was in the other run. */
  fingerprint(): number {
    let f = 0;
    for (const e of this.entries) if (!e.gone) { const t = this.world.transform(e.id); f += t.x * 1.31 + t.y * 0.73 + t.angle * 0.17; }
    return Math.round(f * 1e4) / 1e4;
  }

  /** Nothing in the fort is moving any more. */
  quiet(): boolean { return this.entries.every(e => e.gone || !this.world.awake(e.id)); }

  standing(): number { return this.entries.filter(e => e.piece.type === 'plush' && !e.out).length; }
  /** Share of the fort's value knocked off the rug, 0..1 (the tiebreak). */
  destruction(): number {
    const total = this.entries.reduce((s, e) => s + priceOf(e.piece), 0);
    return total ? this.entries.filter(e => e.lost).reduce((s, e) => s + priceOf(e.piece), 0) / total : 0;
  }
  plushTargets(): { x: number; y: number }[] {
    return this.entries.filter(e => e.piece.type === 'plush' && !e.out).map(e => this.world.transform(e.id));
  }
  /** Where the ammo in flight is (the lead body), for the bot's tap timing. */
  ammoAt(): { x: number; y: number; vx: number; vy: number } | null {
    const id = this.flight?.ids[0];
    if (id === undefined) return null;
    const p = this.world.transform(id), v = this.world.velocity(id);
    return { x: p.x, y: p.y, vx: v.x, vy: v.y };
  }

  /** The range as plain data: what drawing needs, and what the attacker's phone streams to the fort's owner. */
  snap(lava: number): Snap {
    const r3 = (n: number) => Math.round(n * 1000) / 1000, f = this.flight;
    return {
      steps: this.steps, lava, aiming: this.state === 'aim',
      p: this.entries.map(e => {
        const t = e.gone ? { x: 0, y: 0, angle: 0 } : this.world.transform(e.id);
        const flags = (e.out ? 1 : 0) | (e.lost ? 2 : 0) | (e.gone ? 4 : 0) | (e.wet ? 8 : 0);
        return [r3(t.x), r3(t.y), r3(t.angle), flags, e.lost ? Math.min(1, (this.steps - e.lostAt) / LOST_FADE) : 0];
      }),
      ammo: f && f.ids.length ? { kind: f.ammo, tapped: f.tapped, drilling: f.drill > 0, b: f.ids.map(id => { const t = this.world.transform(id); return [r3(t.x), r3(t.y), r3(t.angle)]; }) } : null,
      fx: this.fx.map(x => ({ ...x })),
    };
  }

  /** Rebuild a range from a snapshot (a phone that reloaded mid-match takes its target back from the room). */
  static fromSnap(blueprint: Piece[], team: 'blue' | 'green', s: Snap): Range {
    const r = new Range(blueprint, team);
    r.entries.forEach((e, i) => {
      const [x, y, a, flags] = s.p[i];
      e.out = !!(flags & 1); e.down = e.out; e.lost = !!(flags & 2); e.wet = !!(flags & 8);
      if (flags & 4) { r.world.remove(e.id); e.gone = true; return; }
      r.world.setTransform(e.id, x, y, a);
      if (e.wet) r.world.setFriction(e.id, SPLASH.wetFriction);
      if (e.lost) e.lostAt = s.steps - LOST_FADE - 1;
    });
    r.steps = s.steps;
    return r;
  }

  draw(c: CanvasRenderingContext2D, cam: Cam, o: SceneOpts): void {
    drawScene(c, cam, this.entries.map(e => e.piece), this.team, this.snap(o.lava), o, this.lastTrail);
  }
}

/** Everything needed to draw a range, as plain data. p: per piece, in blueprint order: x, y, angle, flags
 *  (1 out, 2 knocked off, 4 gone, 8 wet), and how far a knocked-off piece has faded (0..1). */
export interface Snap {
  steps: number; lava: number; aiming: boolean;
  p: [number, number, number, number, number][];
  ammo: { kind: Ammo; tapped: boolean; drilling: boolean; b: [number, number, number][] } | null;
  fx: Fx[];
}
export interface SceneOpts { pull: Pull | null; lava: number; boil: number; launcher: boolean; w: number; h: number; loaded?: Ammo | null }

/** Draw a range from a snapshot: the live range, or the streamed picture of your own fort. */
export function drawScene(c: CanvasRenderingContext2D, cam: Cam, pieces: Piece[], team: 'blue' | 'green', s: Snap, o: SceneOpts, trail: [number, number][] = []): void {
  const { sx, sy, k } = cam;
  drawRoom(c, cam, o.w, o.h);
  drawRug(c, cam, team);
  const backTop = { x: ANCHOR.x - 0.38, y: ANCHOR.y }, frontTop = { x: ANCHOR.x + 0.38, y: ANCHOR.y };
  const pp = o.pull ? { x: ANCHOR.x - o.pull.x, y: ANCHOR.y - o.pull.y } : { ...ANCHOR };
  if (o.launcher) {
    const bk = rrPath(sx(BOOK.x - BOOK.hw), sy(BOOK.y + BOOK.hh), BOOK.hw * 2 * k, BOOK.hh * 2 * k, 3);
    c.fillStyle = P.bookOx; c.fill(bk); c.fillStyle = P.cream; c.fillRect(sx(BOOK.x - BOOK.hw + 0.3), sy(BOOK.y + BOOK.hh - 0.12), (BOOK.hw * 2 - 0.4) * k, (BOOK.hh * 2 - 0.24) * k);
    c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke(bk);
    pencil(c, cam, backTop.x, true);
    if (s.aiming) band(c, cam, backTop, pp);
  }
  pieces.forEach((piece, i) => {
    const [x, y, a, flags, fade] = s.p[i];
    if (flags & 4) return;
    c.save(); c.translate(sx(x), sy(y)); c.rotate(-a);
    if (flags & 2) c.globalAlpha = Math.max(0, 1 - fade);
    const out = !!(flags & 1);
    if (piece.type === 'plush') { if (!drawPlushSprite(c, piece.plush!, team, k, out)) drawPlush(c, piece.plush!, piece.w * k, piece.h * k, out, team === 'blue' ? P.blue : P.green); }
    else drawPiece(c, piece, k);
    if (flags & 8) wet(c, piece, k, s.steps);
    c.restore();
  });
  if (o.lava > 0) risenLava(c, cam, o.lava, o.boil);
  const f = s.ammo;
  if (f) for (const [x, y, a] of f.b) {
    c.save(); c.translate(sx(x), sy(y));
    if (f.kind === 'jacks' && f.tapped) { c.rotate(-a); drawJack(c, JACK.arm * 1.25 * k); }
    else if (f.kind === 'top') drawTop(c, AMMO.top.r * k, s.steps * (f.drilling ? 0.9 : 0.25));
    else { if (f.kind !== 'balloon') c.rotate(-a); drawAmmo(c, f.kind, AMMO[f.kind].r * k, s.steps / 60); }
    c.restore();
  }
  for (const fx of s.fx) drawFx(c, fx, sx(fx.x), sy(fx.y), k, s.steps - fx.at, o.boil);
  if (o.launcher) {
    if (s.aiming) { const l = o.loaded ?? 'marble'; c.save(); c.translate(sx(pp.x), sy(pp.y)); drawAmmo(c, l, AMMO[l].r * k, 0); c.restore(); }
    pencil(c, cam, frontTop.x, false);
    band(c, cam, frontTop, s.aiming ? pp : backTop);
    dots(c, cam, trail, 2, 'rgba(74,70,80,0.35)', 3);
    if (o.pull && Math.hypot(o.pull.x, o.pull.y) >= MIN_PULL) dots(c, cam, previewArc(pp, launchVelocity(o.pull)), 3, P.graphite, 1);
  }
}

/** Your own fort on your phone, while the other phone simulates it: the streamed snapshots, smoothed between arrivals. */
export class Puppet {
  private prev: Snap | null = null;
  cur: Snap | null = null;
  private at = 0;
  private gap = 66;
  constructor(public pieces: Piece[], public team: 'blue' | 'green') {}
  push(s: Snap, now: number): void {
    if (this.cur && s.steps < this.cur.steps) return;   // late arrival
    this.prev = this.cur; this.cur = s;
    this.gap = Math.min(250, Math.max(30, now - this.at)); this.at = now;
  }
  /** The snapshot to draw now: the last two arrivals blended, one arrival behind (smooth, never guessing ahead). */
  view(now: number): Snap | null {
    const a = this.prev, b = this.cur;
    if (!b) return null;
    if (!a || a.p.length !== b.p.length) return b;
    const f = Math.min(1, (now - this.at) / this.gap), lerp = (u: number, v: number) => u + (v - u) * f;
    return { ...b, p: b.p.map((q, i) => { const o = a.p[i]; return o[3] & 4 ? q : [lerp(o[0], q[0]), lerp(o[1], q[1]), lerpAngle(o[2], q[2], f), q[3], q[4]]; }) };
  }
}
const lerpAngle = (a: number, b: number, f: number) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * f; };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** A soaked piece: darker, with a drip. */
function wet(c: CanvasRenderingContext2D, p: Piece, k: number, steps: number): void {
  const w = p.w * k, h = p.h * k;
  c.globalAlpha = 0.28; c.fillStyle = '#2B6CB0'; c.fillRect(-w / 2, -h / 2, w, h); c.globalAlpha = 1;
  c.fillStyle = '#5DA9E9';
  const dy = ((steps % 60) / 60) * k * 0.4;
  c.beginPath(); c.arc(w * 0.25, h / 2 + dy, Math.max(1.5, k * 0.06), 0, Math.PI * 2); c.fill();
}

export function launchVelocity(p: Pull): Pull { return { x: (p.x / MAX_PULL) * V_MAX, y: (p.y / MAX_PULL) * V_MAX }; }

/** The pull that sends a marble from the launcher through (tx, ty), at angle deg, or null if out of reach. */
export function aimAt(tx: number, ty: number, deg: number): Pull | null {
  const th = (deg * Math.PI) / 180, dx = tx - ANCHOR.x, dy = ty - ANCHOR.y, den = 2 * Math.cos(th) ** 2 * (dx * Math.tan(th) - dy);
  if (den <= 0) return null;
  const v = Math.sqrt((G * dx * dx) / den);
  if (v > V_MAX) return null;
  const m = (v / V_MAX) * MAX_PULL;
  return { x: Math.cos(th) * m, y: Math.sin(th) * m };
}

function risenLava(c: CanvasRenderingContext2D, cam: Cam, level: number, boil: number): void {
  const x0 = cam.sx(RUG.x0 - 0.2), x1 = cam.sx(RUG.x1 + 0.2), top = cam.sy(level), bottom = cam.sy(LAVA_TOP);
  c.save(); c.beginPath(); c.moveTo(x0, bottom);
  for (let px = x0; px <= x1; px += 8) c.lineTo(px, top + Math.sin(px * 0.08 + boil) * 2);
  c.lineTo(x1, bottom); c.closePath();
  c.globalAlpha = 0.28; c.fillStyle = P.lava; c.fill(); c.globalAlpha = 1;
  c.beginPath(); for (let px = x0; px <= x1; px += 8) { const y = top + Math.sin(px * 0.08 + boil) * 2; px === x0 ? c.moveTo(px, y) : c.lineTo(px, y); }
  c.strokeStyle = P.lava; c.lineWidth = 4; c.stroke(); c.restore();
}
function pencil(c: CanvasRenderingContext2D, cam: Cam, x: number, dim: boolean): void {
  const k = cam.k, pw = 0.32 * k, top = cam.sy(ANCHOR.y + 0.35), bottom = cam.sy(BOOK.y + BOOK.hh), px = cam.sx(x) - pw / 2;
  const body = rrPath(px, top + 0.5 * k, pw, bottom - top - 0.5 * k, 1.5);
  c.fillStyle = dim ? '#C99A05' : P.toyYellow; c.fill(body); c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke(body);
  c.beginPath(); c.moveTo(px, top + 0.5 * k); c.lineTo(px + pw / 2, top); c.lineTo(px + pw, top + 0.5 * k); c.closePath();
  c.fillStyle = P.wood; c.fill(); c.stroke();
}
function band(c: CanvasRenderingContext2D, cam: Cam, a: { x: number; y: number }, b: { x: number; y: number }): void {
  c.lineCap = 'round'; c.strokeStyle = P.ink; c.lineWidth = 0.18 * cam.k + 2.5;
  c.beginPath(); c.moveTo(cam.sx(a.x), cam.sy(a.y)); c.lineTo(cam.sx(b.x), cam.sy(b.y)); c.stroke();
  c.strokeStyle = P.toyRed; c.lineWidth = 0.18 * cam.k; c.stroke();
}
function previewArc(p0: { x: number; y: number }, v: Pull): [number, number][] {
  const all: [number, number, number][] = [];
  let len = 0, prev = p0;
  for (let t = 0; t < 4; t += 0.01) {
    const p = { x: p0.x + v.x * t, y: p0.y + v.y * t - 0.5 * G * t * t };
    len += Math.hypot(p.x - prev.x, p.y - prev.y); prev = p; all.push([p.x, p.y, len]);
    if (p.y < 0 || p.x > 14) break;
  }
  const pts: [number, number][] = [];
  let next = 0.6;
  for (const [x, y, l] of all) { if (l > len * PREVIEW_SHARE) break; if (l >= next) { pts.push([x, y]); next += 0.55; } }
  return pts;
}
function dots(c: CanvasRenderingContext2D, cam: Cam, pts: [number, number][], r: number, col: string, every: number): void {
  c.fillStyle = col;
  pts.forEach(([x, y], i) => { if (i % every) return; c.beginPath(); c.arc(cam.sx(x), cam.sy(y), r, 0, Math.PI * 2); c.fill(); });
}
