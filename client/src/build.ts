// The build screen: drag pieces from the toy box onto the rug, tap a piece to turn it, drag it back into the box.
// Physics is off while building; pieces rest on whatever is under them. Anything may be placed anywhere: a piece that
// breaks a rule turns red and says why, and only Test (overlaps) and Ready (all rules) wait until it's fixed.
// (Playtest 1: refusing placements without a reason made building hard to figure out.)
import {
  BUDGET, CAP, FUNNEL_SLOPE, MIN_PLUSH_Y, PLUSHIES, RUG_W, TRAY, TRAY_ORDER, decorate, dropY, inFunnel, overlaps, priceOf, trayKindOf, turned,
  type Draw, type Piece, type Plushie, type TrayKind,
} from './fort';
import { P, drawPiece, drawPlush, rrPath } from './draw';
import { Cam, Range } from './range';

// The tray sits LIFT px above the screen edge: drags starting at the very bottom trigger the phone's swipe-home gesture (playtest 1).
const TRAY_H = 64, LIFT = 22, SNAP = 0.5, E = 1e-6;
const NAME: Record<Plushie, string> = { brumm: 'Brumm', hoppel: 'Hoppel', socke: 'Socke' };
type Slot = { kind: TrayKind | 'plush'; plush?: Plushie; x: number; y: number; w: number; h: number };
type Drag = { piece: Piece; from: 'tray' | 'field'; original: Piece | null; gx: number; gy: number; moved: boolean; px: number; py: number; held?: boolean };

export class Builder {
  pieces: Piece[] = [];
  left: Draw;
  spent = 0;
  cam = new Cam();
  slots: Slot[] = [];
  drag: Drag | null = null;
  /** A piece tapped out of the box, waiting on the rug to be dragged into place. */
  held: Piece | null = null;
  testing: Range | null = null;
  /** How often Test was pressed (for the game log). */
  tests = 0;
  testClock = 0;
  started = 0;
  private placed = 0;
  private lastPy = 0;   // the finger's height, so the box can light up under it
  private w = 0; private h = 0; private top = 0;

  constructor(public team: 'blue' | 'green', draw: Draw, now: number) { this.left = { ...draw }; this.started = now; }

  get budgetLeft(): number { return BUDGET - this.spent; }
  get plushiesPlaced(): number { return this.pieces.filter(p => p.type === 'plush').length; }
  /** What still stands between this fort and Ready, in words; null when it's ready. */
  get blocker(): string | null {
    const first = this.problems().values().next().value;
    if (first) return `Fix: ${first}`;
    const missing = 3 - this.plushiesPlaced;
    return missing > 0 ? `Place ${missing} more plushie${missing === 1 ? '' : 's'}` : null;
  }
  /** Test needs a fort physics can run: nothing overlapping. */
  get testable(): boolean { return ![...this.problems().values()].some(r => r === 'overlaps another piece'); }

  /** Load a whole fort at once (the dev hook uses it); ignores the draw. */
  load(fort: Piece[]): void { this.pieces = fort.map(p => ({ ...p })); this.spent = this.pieces.reduce((s, p) => s + priceOf(p), 0); this.layout(this.w, this.h, this.top); }

  layout(w: number, h: number, top: number): void {
    this.w = w; this.h = h; this.top = top;
    // the field reaches under the top bar: nothing is ever built in the top strip's corners
    this.cam.fit({ x0: -0.7, x1: RUG_W + 0.7, y0: -0.45, y1: CAP + 0.15 }, { x: 8, y: Math.max(4, top - 30), w: w - 16, h: h - Math.max(4, top - 30) - TRAY_H - LIFT - 4 });
    // every slot keeps its place all build long (empty ones grey out), so a finger always finds the same piece in the same spot
    const kinds: Slot[] = [];
    for (const k of TRAY_ORDER) kinds.push({ kind: k, x: 0, y: 0, w: 0, h: 0 });
    for (const pl of PLUSHIES) kinds.push({ kind: 'plush', plush: pl, x: 0, y: 0, w: 0, h: 0 });
    const sw = Math.min(80, (w - 24) / Math.max(kinds.length, 1)), x0 = (w - sw * kinds.length) / 2;
    kinds.forEach((s, i) => Object.assign(s, { x: x0 + i * sw + 3, y: h - LIFT - TRAY_H + 5, w: sw - 6, h: TRAY_H - 10 }));
    this.slots = kinds;
  }

  // ---------- rules, as reasons ----------
  /** Why a piece breaks a rule, given the others; null if it's fine. */
  private reason(p: Piece, others: Piece[]): string | null {
    if (p.x < -E || p.x + p.w > RUG_W + E) return 'off the rug';
    if (p.y + p.h > CAP + E) return 'too tall (height limit)';
    if (others.some(o => o !== p && overlaps(p, o))) return 'overlaps another piece';
    if (p.type === 'plush') {
      if (p.y < MIN_PLUSH_Y - E) return `${NAME[p.plush!]} too low: lift above the line`;
      if (others.some(o => o !== p && inFunnel(p, o))) return `${NAME[p.plush!]} needs clear sky`;
      return null;
    }
    const pl = others.find(o => o.type === 'plush' && inFunnel(o, p));
    return pl ? `blocks ${NAME[pl.plush!]}'s sky` : null;
  }
  problems(): Map<Piece, string> {
    const m = new Map<Piece, string>();
    for (const p of this.pieces) { const r = this.reason(p, this.pieces); if (r) m.set(p, r); }
    return m;
  }

  // ---------- input ----------
  down(px: number, py: number): void {
    if (this.testing || this.drag) return;
    this.lastPy = py;
    const slot = this.slots.find(s => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h);
    if (slot) {
      if (!this.available(slot)) return;
      if (slot.kind === 'plush') this.startDrag({ type: 'plush', x: 0, y: 0, w: 1, h: 1, plush: slot.plush }, 'tray', null, px, py);
      else this.startDrag({ ...TRAY[slot.kind].make(), x: 0, y: 0 }, 'tray', null, px, py);
      return;
    }
    const wx = this.cam.wx(px), wy = this.cam.wy(py);
    if (this.held) {   // the waiting piece follows the finger from wherever it touches down
      const h = this.held; this.held = null;
      const on = wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h;
      this.startDrag(h, 'tray', null, px, py, on ? wx - h.x : h.w / 2, on ? wy - h.y : h.h / 2 - 0.6);
      this.drag!.held = true; this.drag!.moved = true; this.move(px, py);
      return;
    }
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      if (wx >= p.x - 0.15 && wx <= p.x + p.w + 0.15 && wy >= p.y - 0.15 && wy <= p.y + p.h + 0.15) {
        this.pieces.splice(i, 1);
        this.startDrag({ ...p }, 'field', p, px, py, wx - p.x, wy - p.y);
        return;
      }
    }
  }
  private startDrag(piece: Piece, from: Drag['from'], original: Piece | null, px: number, py: number, gx = piece.w / 2, gy = piece.h / 2 - 0.6): void {
    this.drag = { piece, from, original, gx, gy, moved: false, px, py };
    if (from === 'tray') this.move(px, py);
  }
  move(px: number, py: number): void {
    const d = this.drag; if (!d) return;
    this.lastPy = py;
    if (Math.hypot(px - d.px, py - d.py) > 8) d.moved = true;
    if (d.from === 'field' && !d.moved) return;
    const x = Math.round((this.cam.wx(px) - d.gx) / SNAP) * SNAP;
    d.piece.x = Math.max(-0.5, Math.min(RUG_W + 0.5 - d.piece.w, x));
    d.piece.y = this.cam.wy(py) - d.gy;
    d.piece.y = dropY(d.piece, this.pieces);
  }
  up(_px: number, py: number): void {
    const d = this.drag; if (!d) return;
    this.drag = null;
    if (d.from === 'field' && !d.moved) {   // a tap turns the piece
      this.pieces.push(turned(d.original!) ?? d.original!);
      return this.changed();
    }
    if (d.from === 'tray' && !d.moved && !d.held) {   // a tap on the box takes the piece out; drag it into place next
      this.held = { ...d.piece, x: Math.round((RUG_W / 2 - d.piece.w / 2) / SNAP) * SNAP, y: Math.min(CAP * 0.5, CAP - d.piece.h - 1.2) };
      return this.layout(this.w, this.h, this.top);
    }
    if (this.overTray(py)) {   // dropped in the toy box: back it goes, points refunded
      if (d.from === 'field') this.refund(d.original!);
      return this.changed();
    }
    if (d.from === 'tray') {
      const k = trayKindOf(d.piece);
      if (k) { this.left[k]--; this.spent += TRAY[k].price; }
      this.pieces.push(decorate(d.piece, this.placed++));
    } else this.pieces.push(d.piece);
    this.changed();
  }
  private available(s: Slot): boolean {
    if (s.kind === 'plush') return !this.pieces.some(p => p.plush === s.plush) && this.held?.plush !== s.plush;
    return this.left[s.kind] > 0 && TRAY[s.kind].price <= this.budgetLeft;
  }
  private refund(p: Piece): void { const k = trayKindOf(p); if (k) { this.left[k]++; this.spent -= TRAY[k].price; } }
  /** After every change the blueprint settles: pieces rest on what's under them, so nothing floats. */
  private changed(): void {
    const done: Piece[] = [];
    for (const p of [...this.pieces].sort((a, b) => a.y - b.y)) { p.y = dropY(p, done); done.push(p); }
    this.layout(this.w, this.h, this.top);
  }
  private overTray(py: number): boolean { return py > this.h - LIFT - TRAY_H; }

  // ---------- test ----------
  startTest(): void { this.testing = new Range(this.pieces, this.team); this.testClock = 0; this.tests++; }
  stopTest(): void { this.testing?.world.destroy(); this.testing = null; }
  tick(dt: number): void { if (this.testing && this.testClock < 4000) { this.testClock += dt * 1000; this.testing.tick(dt, 0); } }

  // ---------- drawing ----------
  draw(c: CanvasRenderingContext2D, boil: number): void {   // boil animates the lava during a test
    const { cam } = this;
    if (this.testing) {
      this.testing.draw(c, cam, { pull: null, lava: 0, boil, launcher: false, w: this.w, h: this.h });
      this.tray(c);
      return;
    }
    this.backdrop(c);
    // the minimum-height mark (masking tape on the wall in the final art)
    c.strokeStyle = 'rgba(46,42,51,0.35)'; c.setLineDash([6, 6]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(cam.sx(-0.5), cam.sy(MIN_PLUSH_Y)); c.lineTo(cam.sx(RUG_W + 0.5), cam.sy(MIN_PLUSH_Y)); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(46,42,51,0.55)'; c.font = '600 12px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillText('plushies stand above this line', cam.sx(-0.5) + 2, cam.sy(MIN_PLUSH_Y) - 3);
    const probs = this.problems();
    for (const p of this.pieces) this.piece(c, p, 1);
    for (const p of this.pieces) if (p.type === 'plush') this.funnel(c, p, probs.get(p)?.endsWith('sky') ?? false);
    this.taken = [];
    let labels = 0;
    for (const [p, why] of probs) { this.flag(c, p); if (labels++ < 3) this.label(c, p, why); }
    if (this.held) {   // a piece waiting to be dragged into place
      c.save(); c.globalAlpha = 0.8; this.piece(c, this.held, 1); c.restore();
      this.outline(c, this.held, P.graphite);
      this.label(c, this.held, 'drag me into place', P.ink);
    }
    const d = this.drag;
    if (d && (d.from === 'tray' || d.moved)) {
      if (!this.overTray(this.lastPy)) {
        c.save(); c.globalAlpha = 0.85; this.piece(c, d.piece, 1); c.restore();
        const why = this.reason(d.piece, this.pieces);
        if (d.piece.type === 'plush') this.funnel(c, d.piece, !!why?.endsWith('sky'));
        this.outline(c, d.piece, why ? P.toyRed : P.green);
        if (why) this.label(c, d.piece, why);
      }
    }
    this.tray(c);
  }
  private backdrop(c: CanvasRenderingContext2D): void {
    const { cam } = this;
    c.fillStyle = P.wall; c.fillRect(0, 0, this.w, this.h);
    c.fillStyle = P.floor; c.fillRect(0, cam.sy(0) + 0.3 * cam.k, this.w, this.h);
    c.fillStyle = P.lava; c.fillRect(0, cam.sy(-0.3), this.w, this.h);
    const rx = cam.sx(-0.3), rw = (RUG_W + 0.6) * cam.k;
    c.fillStyle = P.rug; c.fillRect(rx, cam.sy(0), rw, 0.3 * cam.k);
    c.fillStyle = P.rug2; for (let i = rx + 4; i < rx + rw - 4; i += cam.k * 0.5) c.fillRect(i, cam.sy(0), cam.k * 0.22, 0.3 * cam.k);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(rx, cam.sy(0), rw, 0.3 * cam.k);
  }
  private piece(c: CanvasRenderingContext2D, p: Piece, scale: number): void {
    const { cam } = this, k = cam.k * scale;
    c.save(); c.translate(cam.sx(p.x + p.w / 2), cam.sy(p.y + p.h / 2));
    if (p.type === 'plush') drawPlush(c, p.plush!, p.w * k, p.h * k, false, this.team === 'blue' ? P.blue : P.green);
    else drawPiece(c, p, k);
    c.restore();
  }
  private outline(c: CanvasRenderingContext2D, p: Piece, col: string): void {
    const { cam } = this, bx = cam.sx(p.x), by = cam.sy(p.y + p.h);
    c.strokeStyle = col; c.lineWidth = 3; c.setLineDash([5, 4]); c.strokeRect(bx - 3, by - 3, p.w * cam.k + 6, Math.max(p.h * cam.k, 4) + 6); c.setLineDash([]);
  }
  private flag(c: CanvasRenderingContext2D, p: Piece): void {
    const { cam } = this;
    c.save(); c.globalAlpha = 0.25; c.fillStyle = P.toyRed; c.fillRect(cam.sx(p.x), cam.sy(p.y + p.h), p.w * cam.k, Math.max(p.h * cam.k, 4)); c.restore();
    this.outline(c, p, P.toyRed);
  }
  private taken: { x: number; y: number; w: number }[] = [];   // label pills drawn this frame, so they don't cover each other
  /** A short reason in a pill above the piece. */
  private label(c: CanvasRenderingContext2D, p: Piece, text: string, col: string = P.toyRed): void {
    const { cam } = this, cx = cam.sx(p.x + p.w / 2);
    let y = Math.max(16, cam.sy(p.y + p.h) - 10);
    c.font = '700 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + 14, x = Math.max(4 + w / 2, Math.min(this.w - 4 - w / 2, cx));
    while (this.taken.some(t => Math.abs(t.y - y) < 22 && Math.abs(t.x - x) < (t.w + w) / 2 + 4)) y -= 22;
    this.taken.push({ x, y, w });
    const pill = rrPath(x - w / 2, y - 10, w, 20, 10);
    c.fillStyle = '#FFFFFF'; c.fill(pill); c.lineWidth = 1.5; c.strokeStyle = col; c.stroke(pill);
    c.fillStyle = col; c.fillText(text, x, y + 0.5);
  }
  /** The open-sky funnel, drawn so the rule explains itself. */
  private funnel(c: CanvasRenderingContext2D, pl: Piece, blocked: boolean): void {
    const { cam } = this, up = (CAP - pl.y) * FUNNEL_SLOPE;
    c.strokeStyle = blocked ? P.toyRed : 'rgba(74,70,80,0.45)'; c.lineWidth = 2; c.setLineDash([4, 5]);
    c.beginPath();
    c.moveTo(cam.sx(pl.x), cam.sy(pl.y)); c.lineTo(cam.sx(pl.x - up), cam.sy(CAP));
    c.moveTo(cam.sx(pl.x + 1), cam.sy(pl.y)); c.lineTo(cam.sx(pl.x + 1 + up), cam.sy(CAP));
    c.stroke(); c.setLineDash([]);
  }
  private tray(c: CanvasRenderingContext2D): void {
    const y = this.h - LIFT - TRAY_H, d = this.drag, carrying = !!d && (d.from === 'tray' || d.moved);
    c.fillStyle = '#C8A06E'; c.fillRect(0, y, this.w, TRAY_H);
    c.strokeStyle = '#A8834F'; c.lineWidth = 1; for (let i = y + 6; i < y + TRAY_H; i += 6) { c.beginPath(); c.moveTo(0, i); c.lineTo(this.w, i); c.stroke(); }
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(-2, y, this.w + 4, TRAY_H);
    for (const s of this.slots) {
      const affordable = this.available(s);
      const box = rrPath(s.x, s.y, s.w, s.h, 8);
      c.fillStyle = affordable ? '#E7D2AE' : '#BFA27A'; c.fill(box); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(box);
      const piece: Piece = s.kind === 'plush' ? { type: 'plush', x: 0, y: 0, w: 1, h: 1, plush: s.plush } : decorate({ ...TRAY[s.kind].make(), x: 0, y: 0 }, TRAY_ORDER.indexOf(s.kind));
      const k = Math.min((s.w - 18) / piece.w, (s.h - 24) / Math.max(piece.h, 0.5), 20);
      c.save(); c.globalAlpha = affordable ? 1 : 0.45; c.translate(s.x + s.w / 2, s.y + (s.h - 16) / 2 + 2);
      if (piece.type === 'plush') drawPlush(c, piece.plush!, k, k, false, this.team === 'blue' ? P.blue : P.green);
      else drawPiece(c, piece, k);
      c.restore();
      c.fillStyle = P.ink; c.font = '700 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText(s.kind === 'plush' ? (affordable ? NAME[s.plush!] : 'on the rug') : `${this.left[s.kind]} left`, s.x + s.w / 2, s.y + s.h - 5);
      if (s.kind !== 'plush') {   // the price, as a coin in the corner
        c.fillStyle = P.toyYellow; c.beginPath(); c.arc(s.x + s.w - 9, s.y + 9, 8, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = P.ink; c.stroke();
        c.fillStyle = P.ink; c.font = '800 11px system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText(String(TRAY[s.kind].price), s.x + s.w - 9, s.y + 9.5);
      }
    }
    if (carrying) {   // while carrying a piece, the box says what dropping it there does
      const over = this.lastPy > y;
      c.save(); c.globalAlpha = over ? 0.9 : 0.7; c.fillStyle = over ? P.green : '#2E2A33'; c.fillRect(0, y, this.w, TRAY_H); c.restore();
      c.fillStyle = '#FFFFFF'; c.font = '800 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(d!.from === 'field' ? 'Drop here to put it back in the box' : 'Drop here to put it back', this.w / 2, y + TRAY_H / 2);
    }
  }
}
