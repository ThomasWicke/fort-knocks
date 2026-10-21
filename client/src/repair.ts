// The repair between Siege volleys (docs/04-systems.md §9): your ruins and the toy box with what's left of the draw.
// Up to 3 pieces and 3 tapes per repair (no budget since playtest 3). Everything is a tap, because ruins are no place
// for precise dragging on a phone:
//   - tap a piece in the box, then tap over your fort: it will drop there, onto whatever is below
//   - tap a seam between two pieces to tape it
//   - tap a ghost to take it back
// Nothing moves yet: repairs land when the next volley starts, so the other player can't see them coming.
import { RUG_W, TRAY, TRAY_ORDER, decorate, turned, type Draw, type Piece, type TrayKind } from './fort';
import { FONT, HAND, P, drawPiece, rrPath } from './draw';
import { Cam, TAPE, drawScene, drawTape, patchPiece, type Patch, type Repair, type Snap } from './range';

const TRAY_H = 60, LIFT = 22, SNAP = 0.5;
export const REPAIR_PIECES = 3, REPAIR_SECS = 20;

export interface RepairView { snap: Snap; pieces: Piece[] }

export class RepairScreen {
  cam = new Cam();
  selected: TrayKind | null = null;
  turnSel = false;
  patches: Patch[] = [];
  tapes: [number, number, number, number][] = [];
  private slots: { kind: TrayKind; x: number; y: number; w: number; h: number }[] = [];
  private w = 0; private h = 0; private top = 0;
  note = '';

  constructor(public team: 'blue' | 'green', public left: Draw, private view: () => RepairView | null) {}

  countLeft(k: TrayKind): number { return this.left[k] - this.patches.filter(p => p.kind === k).length; }
  result(): Repair { return { patches: this.patches.map(p => ({ ...p })), tapes: this.tapes.map(t => [...t] as [number, number, number, number]) }; }

  layout(w: number, h: number, top: number): void {
    this.w = w; this.h = h; this.top = top;
    this.cam.fit({ x0: -0.8, x1: RUG_W + 0.8, y0: -0.6, y1: 7.6 }, { x: 8, y: top + 4, w: w - 16, h: h - top - TRAY_H - LIFT - 10 });
    const kinds = TRAY_ORDER.filter(k => this.left[k] > 0 || this.patches.some(p => p.kind === k));
    const n = Math.max(kinds.length, 1), sw = Math.min(84, (w - 24) / n - 6), y = h - LIFT - TRAY_H + 5;
    const x0 = (w - n * (sw + 6) + 6) / 2;
    this.slots = kinds.map((kind, i) => ({ kind, x: x0 + i * (sw + 6), y, w: sw, h: TRAY_H - 10 }));
  }

  tap(px: number, py: number): void {
    this.note = '';
    const slot = this.slots.find(s => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h);
    if (slot) {
      if (this.selected === slot.kind) { this.turnSel = !this.turnSel; return; }   // tap again to turn it
      if (this.countLeft(slot.kind) <= 0) { this.note = 'none left in the box'; return; }
      this.selected = slot.kind; this.turnSel = false; return;
    }
    const v = this.view(); if (!v) return;
    const x = this.cam.wx(px), y = this.cam.wy(py);
    // a ghost under the finger comes back out
    const gi = this.ghosts(v).findIndex(g => x >= g.x - 0.1 && x <= g.x + g.w + 0.1 && y >= g.y - 0.1 && y <= g.y + g.h + 0.4);
    if (gi >= 0) { this.patches.splice(gi, 1); return; }
    const ti = this.tapes.findIndex(t => Math.hypot(t[2] - x, t[3] - y) < 0.4);
    if (ti >= 0) { this.tapes.splice(ti, 1); return; }
    if (this.selected) {   // drop a piece here
      const k = this.selected;
      if (this.countLeft(k) <= 0) { this.note = 'none left in the box'; return; }
      if (this.patches.length >= REPAIR_PIECES) { this.note = `at most ${REPAIR_PIECES} pieces per repair`; return; }
      const base = { ...TRAY[k].make(), x: 0, y: 0 } as Piece, piece = this.turnSel ? turned(base) ?? base : base;
      const left = Math.round((x - piece.w / 2) / SNAP) * SNAP;
      if (left + piece.w < -0.2 || left > RUG_W + 0.2) { this.note = 'drop it over your rug'; return; }
      this.patches.push({ kind: k, turned: this.turnSel, x: left });
      if (this.countLeft(k) <= 0) this.selected = null;
      return;
    }
    // no piece in hand: tape the seam under the finger
    if (this.tapes.length >= TAPE.perRepair) { this.note = `at most ${TAPE.perRepair} tapes per repair`; return; }
    const pair = seamAt(v, x, y);
    if (!pair) { this.note = 'tap a seam between two pieces to tape it, or pick a piece from the box'; return; }
    if (this.tapes.some(t => (t[0] === pair[0] && t[1] === pair[1]) || (t[0] === pair[1] && t[1] === pair[0]))) { this.note = 'already taped'; return; }
    this.tapes.push([pair[0], pair[1], Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
  }

  /** Where each planned patch will land: over its column, on top of the ruins as they stand now. */
  private ghosts(v: RepairView): { x: number; y: number; w: number; h: number; piece: Piece }[] {
    return this.patches.map((p, i) => {
      const piece = patchPiece(p, v.pieces.length + i);
      return { x: piece.x, y: topOf(v, piece.x, piece.x + piece.w), w: piece.w, h: piece.h, piece };
    });
  }

  draw(c: CanvasRenderingContext2D, boil: number): void {
    const v = this.view(), { cam } = this;
    if (!v) { c.fillStyle = P.wall; c.fillRect(0, 0, this.w, this.h); return; }
    drawScene(c, cam, v.pieces, this.team, v.snap, { pull: null, lava: v.snap.lava, boil, launcher: false, w: this.w, h: this.h });
    c.fillStyle = 'rgba(251,246,236,0.18)'; c.fillRect(0, 0, this.w, this.h);   // repair time: the room steps back a little
    for (const g of this.ghosts(v)) {   // planned patches, dashed, with a little arrow: they'll drop here
      c.save(); c.globalAlpha = 0.6; c.translate(cam.sx(g.x + g.w / 2), cam.sy(g.y + g.h / 2)); drawPiece(c, g.piece, cam.k); c.restore();
      c.strokeStyle = P.green; c.lineWidth = 2.5; c.setLineDash([5, 4]); c.strokeRect(cam.sx(g.x), cam.sy(g.y + g.h), g.w * cam.k, g.h * cam.k); c.setLineDash([]);
    }
    for (const [, , x, y] of this.tapes) drawTape(c, cam.sx(x), cam.sy(y), 0.6, cam.k);
    c.font = `17px ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineJoin = 'round';
    const hint = this.note || (this.selected ? `tap over your fort to drop the ${this.selected}${'longbookdomino'.includes(this.selected) ? ' (tap it in the box again to turn it)' : ''}` : 'tap a seam to tape it · or pick a piece from the box');
    c.strokeStyle = 'rgba(251,246,236,0.9)'; c.lineWidth = 4; c.strokeText(hint, this.w / 2, this.top + 8);
    c.fillStyle = this.note ? P.toyRed : P.ink; c.fillText(hint, this.w / 2, this.top + 8);
    this.tray(c);
  }

  private tray(c: CanvasRenderingContext2D): void {
    const y = this.h - LIFT - TRAY_H;
    c.fillStyle = '#C8A06E'; c.fillRect(0, y, this.w, TRAY_H);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(-2, y, this.w + 4, TRAY_H);
    for (const s of this.slots) {
      const n = this.countLeft(s.kind), ok = n > 0 && this.patches.length < REPAIR_PIECES, on = this.selected === s.kind;
      const box = rrPath(s.x, s.y, s.w, s.h, 8);
      c.fillStyle = on ? '#FFF7E0' : ok ? '#E7D2AE' : '#BFA27A'; c.fill(box); c.lineWidth = on ? 3 : 1.5; c.strokeStyle = on ? P.green : P.ink; c.stroke(box);
      const base = decorate({ ...TRAY[s.kind].make(), x: 0, y: 0 }, TRAY_ORDER.indexOf(s.kind)), piece = on && this.turnSel ? turned(base) ?? base : base;
      const k = Math.min((s.w - 16) / piece.w, (s.h - 20) / Math.max(piece.h, 0.5), 18);
      c.save(); c.globalAlpha = ok ? 1 : 0.45; c.translate(s.x + s.w / 2, s.y + (s.h - 14) / 2 + 1); drawPiece(c, piece, k); c.restore();
      c.fillStyle = P.ink; c.font = `700 11px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText(`${n} left`, s.x + s.w / 2, s.y + s.h - 3);
    }
  }
}

/** The two pieces meeting at a point: the nearest two within a finger's reach, by distance to their (rotated) boxes. */
export function seamAt(v: RepairView, x: number, y: number): [number, number] | null {
  const d: [number, number][] = [];
  v.pieces.forEach((p, i) => {
    const q = v.snap.p[i];
    if (!q || q[3] & 6) return;   // gone or knocked off
    const c = Math.cos(-q[2]), s = Math.sin(-q[2]), dx = x - q[0], dy = y - q[1];
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    d.push([i, Math.hypot(Math.max(Math.abs(lx) - p.w / 2, 0), Math.max(Math.abs(ly) - p.h / 2, 0))]);
  });
  d.sort((a, b) => a[1] - b[1]);
  return d.length >= 2 && d[1][1] < 0.35 ? [d[0][0], d[1][0]] : null;
}
/** The top of the ruins over a column, from a snapshot (the same rule the range uses to land a patch). */
function topOf(v: RepairView, x0: number, x1: number): number {
  let top = 0;
  v.pieces.forEach((p, i) => {
    const q = v.snap.p[i];
    if (!q || q[3] & 6) return;
    const c = Math.abs(Math.cos(q[2])), s = Math.abs(Math.sin(q[2])), ex = (p.w / 2) * c + (p.h / 2) * s, ey = (p.w / 2) * s + (p.h / 2) * c;
    if (q[0] + ex > x0 && q[0] - ex < x1) top = Math.max(top, q[1] + ey);
  });
  return top;
}
