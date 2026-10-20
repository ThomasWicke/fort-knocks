// The build screen: drag pieces from the toy box onto the rug, tap a piece to turn it, drag it back to return it.
// Physics is off while building; pieces drop onto whatever is under them. Test runs the settle privately.
import {
  BUDGET, CAP, FUNNEL_SLOPE, MIN_PLUSH_Y, PLUSHIES, RUG_W, TRAY, TRAY_ORDER, decorate, dropY, fits, inFunnel, priceOf, trayKindOf, turned,
  type Draw, type Piece, type Plushie, type TrayKind,
} from './fort';
import { P, drawPiece, drawPlush, rrPath } from './draw';
import { Cam, Range } from './range';

const TRAY_H = 66, SNAP = 0.5;
type Slot = { kind: TrayKind | 'plush'; plush?: Plushie; x: number; y: number; w: number; h: number };
type Drag = { piece: Piece; from: 'tray' | 'field'; original: Piece | null; gx: number; gy: number; moved: boolean; px: number; py: number; valid: boolean };

export class Builder {
  pieces: Piece[] = [];
  left: Draw;
  spent = 0;
  cam = new Cam();
  slots: Slot[] = [];
  drag: Drag | null = null;
  testing: Range | null = null;
  testClock = 0;
  started = 0;
  private placed = 0;
  private w = 0; private h = 0; private top = 0;

  constructor(public team: 'blue' | 'green', draw: Draw, now: number) { this.left = { ...draw }; this.started = now; }

  get budgetLeft(): number { return BUDGET - this.spent; }
  get plushiesPlaced(): number { return this.pieces.filter(p => p.type === 'plush').length; }
  get ready(): boolean { return this.plushiesPlaced === 3; }

  /** Load a whole fort at once (the dev hook uses it); ignores the draw. */
  load(fort: Piece[]): void { this.pieces = fort.map(p => ({ ...p })); this.spent = this.pieces.reduce((s, p) => s + priceOf(p), 0); }

  layout(w: number, h: number, top: number): void {
    this.w = w; this.h = h; this.top = top;
    // the field reaches under the top bar: nothing is ever built in the top strip's corners
    this.cam.fit({ x0: -0.7, x1: RUG_W + 0.7, y0: -0.45, y1: CAP + 0.15 }, { x: 8, y: Math.max(4, top - 30), w: w - 16, h: h - Math.max(4, top - 30) - TRAY_H - 4 });
    const kinds: Slot[] = [];
    for (const k of TRAY_ORDER) if (this.left[k] > 0) kinds.push({ kind: k, x: 0, y: 0, w: 0, h: 0 });
    for (const pl of PLUSHIES) if (!this.pieces.some(p => p.plush === pl)) kinds.push({ kind: 'plush', plush: pl, x: 0, y: 0, w: 0, h: 0 });
    const sw = Math.min(80, (w - 24) / Math.max(kinds.length, 1)), x0 = (w - sw * kinds.length) / 2;
    kinds.forEach((s, i) => Object.assign(s, { x: x0 + i * sw + 3, y: h - TRAY_H + 5, w: sw - 6, h: TRAY_H - 10 }));
    this.slots = kinds;
  }

  // ---------- input ----------
  down(px: number, py: number): void {
    if (this.testing || this.drag) return;
    const slot = this.slots.find(s => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h);
    if (slot) {
      if (slot.kind === 'plush') this.startDrag({ type: 'plush', x: 0, y: 0, w: 1, h: 1, plush: slot.plush }, 'tray', null, px, py);
      else if (TRAY[slot.kind].price <= this.budgetLeft) this.startDrag({ ...TRAY[slot.kind].make(), x: 0, y: 0 }, 'tray', null, px, py);
      return;
    }
    const wx = this.cam.wx(px), wy = this.cam.wy(py);
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
    this.drag = { piece, from, original, gx, gy, moved: false, px, py, valid: false };
    if (from === 'tray') this.move(px, py);
    else this.drag.valid = true;
  }
  move(px: number, py: number): void {
    const d = this.drag; if (!d) return;
    if (Math.hypot(px - d.px, py - d.py) > 8) d.moved = true;
    if (d.from === 'field' && !d.moved) return;
    const x = Math.round((this.cam.wx(px) - d.gx) / SNAP) * SNAP, yHint = this.cam.wy(py) - d.gy;
    d.piece.x = x; d.piece.y = yHint;
    d.piece.y = dropY(d.piece, this.pieces);
    d.valid = !this.overTray(py) && this.legal(d.piece);
  }
  up(_px: number, py: number): void {
    const d = this.drag; if (!d) return;
    this.drag = null;
    if (d.from === 'field' && !d.moved) {   // a tap turns the piece
      const t = turned(d.original!);
      if (t) { t.y = dropY(t, this.pieces); if (this.legal(t)) { this.pieces.push(t); return; } }
      this.pieces.push(d.original!); return;
    }
    if (this.overTray(py)) {   // dropped back in the toy box: refund
      if (d.from === 'field') this.refund(d.original!);
      return;
    }
    if (!d.valid) { if (d.original) this.pieces.push(d.original); return; }
    if (d.from === 'tray') {
      const k = trayKindOf(d.piece);
      if (k) { this.left[k]--; this.spent += TRAY[k].price; }
      this.pieces.push(decorate(d.piece, this.placed++));
    } else this.pieces.push(d.piece);
    this.layout(this.w, this.h, this.top);
  }
  private refund(p: Piece): void {
    const k = trayKindOf(p);
    if (k) { this.left[k]++; this.spent -= TRAY[k].price; }
    this.layout(this.w, this.h, this.top);
  }
  private overTray(py: number): boolean { return py > this.h - TRAY_H; }
  /** Fits on the rug, overlaps nothing, plushies stand high enough, and every plushie keeps its open sky. */
  private legal(p: Piece): boolean {
    if (!fits(p, this.pieces)) return false;
    if (p.type === 'plush') return p.y >= MIN_PLUSH_Y - 1e-6 && !this.pieces.some(o => inFunnel(p, o));
    return !this.pieces.some(o => o.type === 'plush' && inFunnel(o, p));
  }

  // ---------- test ----------
  startTest(): void { this.testing = new Range(this.pieces, this.team); this.testClock = 0; }
  stopTest(): void { this.testing?.world.destroy(); this.testing = null; }
  tick(dt: number): void { if (this.testing && this.testClock < 4000) { this.testClock += dt * 1000; this.testing.tick(dt, this.testClock, 0); } }

  // ---------- drawing ----------
  draw(c: CanvasRenderingContext2D, boil: number): void {   // boil animates the lava during a test
    const { cam } = this, k = cam.k;
    if (this.testing) {
      this.testing.draw(c, cam, { pull: null, lava: 0, boil, clock: this.testClock, launcher: false, w: this.w, h: this.h });
    } else {
      this.backdrop(c);
      // the minimum-height mark (masking tape on the wall in the final art)
      c.strokeStyle = 'rgba(46,42,51,0.35)'; c.setLineDash([6, 6]); c.lineWidth = 2;
      c.beginPath(); c.moveTo(cam.sx(-0.5), cam.sy(MIN_PLUSH_Y)); c.lineTo(cam.sx(RUG_W + 0.5), cam.sy(MIN_PLUSH_Y)); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(46,42,51,0.55)'; c.font = '600 12px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('plushies stand above this line', cam.sx(-0.5) + 2, cam.sy(MIN_PLUSH_Y) - 3);
      for (const p of this.pieces) this.piece(c, p, 1);
      for (const p of this.pieces) if (p.type === 'plush') this.funnel(c, p, false);
      const d = this.drag;
      if (d && (d.from === 'tray' || d.moved)) {
        c.save(); c.globalAlpha = 0.85; this.piece(c, d.piece, 1); c.restore();
        if (d.piece.type === 'plush') this.funnel(c, d.piece, !d.valid);
        const bx = cam.sx(d.piece.x), by = cam.sy(d.piece.y + d.piece.h);
        c.strokeStyle = d.valid ? P.green : P.toyRed; c.lineWidth = 3; c.setLineDash([5, 4]);
        c.strokeRect(bx - 3, by - 3, d.piece.w * k + 6, d.piece.h * k + 6); c.setLineDash([]);
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
  /** The open-sky funnel, drawn so the rule explains itself. */
  private funnel(c: CanvasRenderingContext2D, pl: Piece, bad: boolean): void {
    const { cam } = this, blocked = bad || this.pieces.some(o => inFunnel(pl, o)), up = (CAP - pl.y) * FUNNEL_SLOPE;
    c.strokeStyle = blocked ? P.toyRed : 'rgba(74,70,80,0.45)'; c.lineWidth = 2; c.setLineDash([4, 5]);
    c.beginPath();
    c.moveTo(cam.sx(pl.x), cam.sy(pl.y)); c.lineTo(cam.sx(pl.x - up), cam.sy(CAP));
    c.moveTo(cam.sx(pl.x + 1), cam.sy(pl.y)); c.lineTo(cam.sx(pl.x + 1 + up), cam.sy(CAP));
    c.stroke(); c.setLineDash([]);
  }
  private tray(c: CanvasRenderingContext2D): void {
    const y = this.h - TRAY_H;
    c.fillStyle = '#C8A06E'; c.fillRect(0, y, this.w, TRAY_H);
    c.strokeStyle = '#A8834F'; c.lineWidth = 1; for (let i = y + 6; i < this.h; i += 6) { c.beginPath(); c.moveTo(0, i); c.lineTo(this.w, i); c.stroke(); }
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke();
    for (const s of this.slots) {
      const affordable = s.kind === 'plush' || TRAY[s.kind].price <= this.budgetLeft;
      const box = rrPath(s.x, s.y, s.w, s.h, 8);
      c.fillStyle = affordable ? '#E7D2AE' : '#BFA27A'; c.fill(box); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(box);
      const piece: Piece = s.kind === 'plush' ? { type: 'plush', x: 0, y: 0, w: 1, h: 1, plush: s.plush } : decorate({ ...TRAY[s.kind].make(), x: 0, y: 0 }, TRAY_ORDER.indexOf(s.kind));
      const k = Math.min((s.w - 18) / piece.w, (s.h - 24) / Math.max(piece.h, 0.5), 20);
      c.save(); c.globalAlpha = affordable ? 1 : 0.45; c.translate(s.x + s.w / 2, s.y + (s.h - 16) / 2 + 2);
      if (piece.type === 'plush') drawPlush(c, piece.plush!, k, k, false, this.team === 'blue' ? P.blue : P.green);
      else drawPiece(c, piece, k);
      c.restore();
      c.fillStyle = P.ink; c.font = '700 12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText(s.kind === 'plush' ? 'plushie' : `${this.left[s.kind]} left`, s.x + s.w / 2, s.y + s.h - 5);
      if (s.kind !== 'plush') {   // the price, as a coin in the corner
        c.fillStyle = P.toyYellow; c.beginPath(); c.arc(s.x + s.w - 9, s.y + 9, 8, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = P.ink; c.stroke();
        c.fillStyle = P.ink; c.font = '800 11px system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText(String(TRAY[s.kind].price), s.x + s.w - 9, s.y + 9.5);
      }
    }
  }
}
