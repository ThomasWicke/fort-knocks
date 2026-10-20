// One range: a fort on its rug, the attacker's launcher in front of it, the lava around it.
// Each fort has its own range and physics world, and it keeps its ruins between volleys.
import { World } from './physics';
import { MATERIALS, RUG_W, bodyOf, priceOf, type Piece } from './fort';
import { P, drawPiece, drawPlush, drawMarble, rrPath } from './draw';

export const G = 10, STEP = 1 / 60;
export const RUG = { x0: -0.3, x1: RUG_W + 0.3 };
export const LAVA_TOP = -0.3;
export const BOOK = { x: -14, y: 0.1, hw: 1.7, hh: 0.4 };
export const ANCHOR = { x: -13.6, y: 2.35 };   // between the pencil tops
export const MAX_PULL = 2.0, V_MAX = 16, MARBLE_R = 0.3, MIN_PULL = 0.35;   // V_MAX was 20; 16 still reaches the back of the rug
const PREVIEW_SHARE = 0.35;                      // crayon dots show the first 35% of the arc (04-systems)
const LOST_FADE_MS = 1200;

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

interface Entry { piece: Piece; id: number; lost: boolean; out: boolean; lostAt: number; gone: boolean }
export type Pull = { x: number; y: number };

export class Range {
  world = new World(-G);
  entries: Entry[];
  marbleId = -1;
  state: 'aim' | 'flight' = 'aim';
  flightT = 0;
  private impactAt = -1;
  private lastSpeed = 0;
  trail: [number, number][] = [];
  lastTrail: [number, number][] = [];
  slowUntil = 0;
  private acc = 0;
  /** Called once per finished shot. */
  onShotDone: (() => void) | null = null;
  /** Called when a plushie goes out (for the slow-motion beat). */
  onOut: (() => void) | null = null;

  constructor(blueprint: Piece[], public team: 'blue' | 'green') {
    const w = this.world;
    w.add({ x: 0, y: LAVA_TOP - 0.2, shapes: [{ kind: 'box', hw: 60, hh: 0.2 }], mat: MATERIALS.floor, fixed: true });
    w.add({ x: (RUG.x0 + RUG.x1) / 2, y: -0.15, shapes: [{ kind: 'box', hw: (RUG.x1 - RUG.x0) / 2, hh: 0.15 }], mat: MATERIALS.floor, fixed: true });
    w.add({ x: BOOK.x, y: BOOK.y, shapes: [{ kind: 'box', hw: BOOK.hw, hh: BOOK.hh }], mat: MATERIALS.floor, fixed: true });
    this.entries = blueprint.map(piece => ({ piece, id: w.add(bodyOf(piece, 0)), lost: false, out: false, lostAt: 0, gone: false }));
  }

  /** The settle: physics switches on, whatever falls, falls. */
  settle(seconds = 3, clock = 0): void { for (let i = 0; i < seconds * 60; i++) { this.world.step(STEP); this.judge(clock, 0, false); } }

  pouch(pull: Pull | null): { x: number; y: number } { return pull ? { x: ANCHOR.x - pull.x, y: ANCHOR.y - pull.y } : { ...ANCHOR }; }

  fire(pull: Pull): boolean {
    if (this.state !== 'aim' || Math.hypot(pull.x, pull.y) < MIN_PULL) return false;
    const at = this.pouch(pull), v = launchVelocity(pull);
    this.marbleId = this.world.add({ x: at.x, y: at.y, shapes: [{ kind: 'circle', r: MARBLE_R }], mat: MATERIALS.marble, bullet: true, vx: v.x, vy: v.y });
    this.state = 'flight'; this.flightT = 0; this.trail = []; this.impactAt = -1; this.lastSpeed = Math.hypot(v.x, v.y);
    return true;
  }

  tick(dt: number, clock: number, lava: number): void {
    if (clock < this.slowUntil) { this.world.step(dt * 0.3); if (this.state === 'flight') this.flightT += dt * 0.3; }   // slow motion when a plushie goes in
    else {
      this.acc += dt;
      while (this.acc >= STEP) { this.world.step(STEP); this.acc -= STEP; if (this.state === 'flight') this.flightT += STEP; }
    }
    this.judge(clock, lava, true);
  }

  private judge(clock: number, lava: number, live: boolean): void {
    for (const e of this.entries) {
      if (e.gone) continue;
      const t = this.world.transform(e.id);
      if (e.piece.type === 'plush') {
        // out on the rug or the floor, or when the risen lava reaches its feet
        if (!e.out && (t.y < 0.62 || t.y - 0.5 < lava - 0.02)) { e.out = true; if (live) { this.slowUntil = clock + 900; this.onOut?.(); } }
      } else if (!e.lost && t.y < 1.5 && (t.x < RUG.x0 || t.x > RUG.x1)) { e.lost = true; e.lostAt = clock; }   // knocked off the rug
      if (e.lost && clock - e.lostAt > LOST_FADE_MS) { this.world.remove(e.id); e.gone = true; }
    }
    if (this.state !== 'flight') return;
    const m = this.world.transform(this.marbleId), v = this.world.velocity(this.marbleId), speed = Math.hypot(v.x, v.y);
    if (this.impactAt < 0) this.trail.push([m.x, m.y]);   // the arc up to the first hit
    // the first hit: a sudden loss of speed, or reaching the fort
    if (this.impactAt < 0 && (speed < this.lastSpeed * 0.75 || m.x >= RUG.x0 - 0.2 || m.y < 0)) this.impactAt = this.flightT;
    this.lastSpeed = speed;
    // the next marble is ready shortly after the hit, while the fort is still settling (playtest 1: waiting for rest was too slow)
    const done = (this.impactAt >= 0 && this.flightT - this.impactAt > 1.6) || !this.world.awake(this.marbleId) || this.flightT > 6 || Math.abs(m.x) > 40;
    if (done) {
      this.world.remove(this.marbleId); this.marbleId = -1; this.state = 'aim'; this.lastTrail = this.trail;
      this.onShotDone?.();
    }
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

  draw(c: CanvasRenderingContext2D, cam: Cam, o: { pull: Pull | null; lava: number; boil: number; clock: number; launcher: boolean; w: number; h: number }): void {
    const { sx, sy, k } = cam;
    c.fillStyle = P.wall; c.fillRect(0, 0, o.w, o.h);
    c.fillStyle = P.wall2; c.fillRect(0, sy(1.4), o.w, sy(0.9) - sy(1.4));
    c.fillStyle = P.floor; c.fillRect(0, sy(0.9), o.w, o.h);
    lavaBand(c, cam, o.w, o.h, o.boil);
    const rx = sx(RUG.x0), rw = (RUG.x1 - RUG.x0) * k, ry = sy(0), rh = 0.3 * k;
    c.fillStyle = P.rug; c.fillRect(rx, ry, rw, rh);
    c.fillStyle = P.rug2; for (let i = rx + 4; i < rx + rw - 4; i += k * 0.5) c.fillRect(i, ry, k * 0.22, rh);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(rx, ry, rw, rh);
    const backTop = { x: ANCHOR.x - 0.38, y: ANCHOR.y }, frontTop = { x: ANCHOR.x + 0.38, y: ANCHOR.y }, pp = this.pouch(o.pull);
    if (o.launcher) {
      const bk = rrPath(sx(BOOK.x - BOOK.hw), sy(BOOK.y + BOOK.hh), BOOK.hw * 2 * k, BOOK.hh * 2 * k, 3);
      c.fillStyle = P.bookOx; c.fill(bk); c.fillStyle = P.cream; c.fillRect(sx(BOOK.x - BOOK.hw + 0.3), sy(BOOK.y + BOOK.hh - 0.12), (BOOK.hw * 2 - 0.4) * k, (BOOK.hh * 2 - 0.24) * k);
      c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke(bk);
      pencil(c, cam, backTop.x, true);
      if (this.state === 'aim') band(c, cam, backTop, pp);
    }
    for (const e of this.entries) {
      if (e.gone) continue;
      const t = this.world.transform(e.id);
      c.save(); c.translate(sx(t.x), sy(t.y)); c.rotate(-t.angle);
      if (e.lost) c.globalAlpha = Math.max(0, 1 - (o.clock - e.lostAt) / LOST_FADE_MS);
      if (e.piece.type === 'plush') drawPlush(c, e.piece.plush!, e.piece.w * k, e.piece.h * k, e.out, this.team === 'blue' ? P.blue : P.green);
      else drawPiece(c, e.piece, k);
      c.restore();
    }
    if (o.lava > 0) risenLava(c, cam, o.lava, o.boil);
    if (this.marbleId >= 0) { const m = this.world.transform(this.marbleId); c.save(); c.translate(sx(m.x), sy(m.y)); c.rotate(-m.angle); drawMarble(c, MARBLE_R * k); c.restore(); }
    if (o.launcher) {
      if (this.state === 'aim') { c.save(); c.translate(sx(pp.x), sy(pp.y)); drawMarble(c, MARBLE_R * k); c.restore(); }
      pencil(c, cam, frontTop.x, false);
      band(c, cam, frontTop, this.state === 'aim' ? pp : backTop);
      dots(c, cam, this.lastTrail, 2, 'rgba(74,70,80,0.35)', 3);
      if (o.pull && Math.hypot(o.pull.x, o.pull.y) >= MIN_PULL) dots(c, cam, previewArc(pp, launchVelocity(o.pull)), 3, P.graphite, 1);
    }
  }
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

function lavaBand(c: CanvasRenderingContext2D, cam: Cam, w: number, h: number, boil: number): void {
  c.beginPath(); c.moveTo(0, h);
  for (let px = 0; px <= w + 12; px += 12) c.lineTo(px, cam.sy(LAVA_TOP) + Math.sin(px * 0.04 + boil) * 2.5);
  c.lineTo(w, h); c.closePath(); c.fillStyle = P.lava; c.fill();
  c.strokeStyle = P.lavaRed; c.lineWidth = 3; c.stroke();
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
