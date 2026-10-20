// Grey-box drawing. Pieces are drawn around their own centre in pixels (canvas y down), so the caller only
// translates and rotates. Colours and line rules follow docs/style.md; polish waits until the fun is proven.
import type { Paint, Piece, Plushie } from './fort';

export const P = {
  ink: '#2E2A33', wall: '#F4E9D8', wall2: '#E6D6BE', floor: '#C98B5A', floor2: '#A86F45', rug: '#EFE6D2', rug2: '#8FA3B8',
  toyRed: '#E63B2E', toyYellow: '#F2B705', wood: '#D9A86C', wood2: '#B5824A', cream: '#FBF3E2',
  bookOx: '#8E2E2A', bookMustard: '#C9952B', bookPlum: '#6B3E62', glass: '#BFE3F2',
  blue: '#2F6FDE', green: '#0F7B5F', lava: '#FF5A1F', lavaRed: '#E2341D', lavaGlow: '#FFD27A', graphite: '#4A4650',
};

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16), k = 1 - f;
  return `rgb(${(((n >> 16) & 255) * k) | 0},${(((n >> 8) & 255) * k) | 0},${((n & 255) * k) | 0})`;
}
export function rrPath(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D(); r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  return p;
}
export function polyPath(pts: [number, number][]): Path2D {
  const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p;
}

// Real layer: flat fill, one shade band lower right, one highlight upper left, ink outline.
function solid(c: CanvasRenderingContext2D, path: Path2D, x: number, y: number, w: number, h: number, fill: string, lw = 2.2, hl = true): void {
  c.fillStyle = fill; c.fill(path);
  c.save(); c.clip(path);
  const bw = Math.max(2.5, Math.min(w, h) * 0.22);
  c.fillStyle = shade(fill, 0.15);
  c.fillRect(x + w - bw, y - 2, bw + 4, h + 4); c.fillRect(x - 2, y + h - bw, w + 4, bw + 4);
  if (hl && w > 10 && h > 10) {
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 4, y + h * 0.5); c.lineTo(x + 4, y + 4); c.lineTo(x + w * 0.4, y + 4); c.stroke();
  }
  c.restore();
  c.lineWidth = lw; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(path);
}

function symbol(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, sym: Piece['sym'], col: string): void {
  c.fillStyle = col; c.beginPath();
  if (sym === 'circle') c.arc(cx, cy, r, 0, Math.PI * 2);
  if (sym === 'triangle') { c.moveTo(cx, cy - r * 1.1); c.lineTo(cx + r * 1.05, cy + r * 0.8); c.lineTo(cx - r * 1.05, cy + r * 0.8); c.closePath(); }
  if (sym === 'star') for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r * 1.15; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  c.fill();
}
const PIPS: Record<number, [number, number][]> = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function pips(c: CanvasRenderingContext2D, cx: number, cy: number, n: number, s: number, r: number): void {
  c.fillStyle = P.ink;
  for (const [i, j] of PIPS[n]) { c.beginPath(); c.arc(cx + i * s, cy + j * s, r, 0, Math.PI * 2); c.fill(); }
}

/** Draw a piece centred on the origin. k = pixels per cell. */
export function drawPiece(c: CanvasRenderingContext2D, p: Piece, k: number): void {
  const w = p.w * k, h = p.h * k, x = -w / 2, y = -h / 2, r = Math.min(w, h) * 0.12, paint = p.paint ? P[p.paint as Paint] : P.cream;
  switch (p.type) {
    case 'block': case 'long':
      solid(c, rrPath(x, y, w, h, r), x, y, w, h, paint);
      symbol(c, -1.5, -1.5, Math.min(w, h) * 0.2, p.sym, p.paint === 'cream' ? P.toyRed : P.cream);
      break;
    case 'arch': {
      const path = new Path2D(), ar = w * 0.225, by = y + h;
      path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r); path.lineTo(x + w, by); path.lineTo(ar, by);
      path.arc(0, by, ar, 0, Math.PI, true); path.lineTo(x, by); path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y); path.closePath();
      solid(c, path, x, y, w, h, paint);
      break;
    }
    case 'tri':
      solid(c, polyPath([[x, y + h], [0, y], [x + w, y + h]]), x, y, w, h, paint, 2.2, false);
      break;
    case 'bookLie': {
      const path = rrPath(x, y, w, h, 2.5);
      c.fillStyle = paint; c.fill(path);
      c.fillStyle = P.cream; c.fillRect(x + 0.23 * k, y + 0.09 * k, w - 0.28 * k, h - 0.18 * k);
      c.strokeStyle = shade(paint, 0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 0.23 * k, y + 2); c.lineTo(x + 0.23 * k, y + h - 2); c.stroke();
      c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke(path);
      break;
    }
    case 'bookStand': {
      const path = rrPath(x, y, w, h, 2.5);
      solid(c, path, x, y, w, h, paint, 2.2, false);
      c.fillStyle = P.cream; c.fillRect(x + 3, y + h * 0.24, w - 6, h * 0.12);
      break;
    }
    case 'domStand': case 'domLie': {
      solid(c, rrPath(x, y, w, h, 3), x, y, w, h, P.cream, 1.8);
      c.strokeStyle = P.ink; c.lineWidth = 1.1; c.beginPath();
      const s = Math.min(w, h) * 0.22, pr = Math.max(1.1, Math.min(w, h) * 0.07), [a, b] = p.pips ?? [1, 1];
      if (p.type === 'domStand') { c.moveTo(x + 2, 0); c.lineTo(x + w - 2, 0); c.stroke(); pips(c, 0, -h / 4, a, s, pr); pips(c, 0, h / 4, b, s, pr); }
      else { c.moveTo(0, y + 2); c.lineTo(0, y + h - 2); c.stroke(); pips(c, -w / 4, 0, Math.min(a, 3), s * 0.8, pr); pips(c, w / 4, 0, Math.min(b, 3), s * 0.8, pr); }
      break;
    }
    case 'cardFlat': {
      const path = rrPath(x, y, w, Math.max(h, 3), 1.5);
      c.fillStyle = P.toyRed; c.fill(path); c.lineWidth = 1.6; c.strokeStyle = P.ink; c.stroke(path);
      break;
    }
    case 'cardTent': {
      const t = Math.max(0.12 * k, 4);
      for (const [bx, col] of [[x, P.toyRed], [x + w, P.graphite]] as const) {
        const dx = 0 - bx, dy = y - (y + h), L = Math.hypot(dx, dy), nx = (-dy / L) * t / 2, ny = (dx / L) * t / 2;
        const path = polyPath([[bx - nx, y + h - ny], [-nx, y - ny], [nx, y + ny], [bx + nx, y + h + ny]]);
        c.fillStyle = col; c.fill(path); c.lineWidth = 1.6; c.strokeStyle = P.ink; c.stroke(path);
      }
      break;
    }
    case 'plush':
      drawPlush(c, p.plush ?? 'hoppel', w, h, false);
      break;
  }
}

const PLUSH_FILL: Record<Plushie, string> = { brumm: '#B87A45', hoppel: '#F3E6CF', socke: '#E8503F' };
/** Grey-box plushie: a soft body with ears, eyes and the team bandana. out = crossed-stitch eyes. */
export function drawPlush(c: CanvasRenderingContext2D, who: Plushie, w: number, h: number, out: boolean, team = P.green): void {
  const x = -w / 2, y = -h / 2, fill = PLUSH_FILL[who];
  c.lineWidth = 2; c.strokeStyle = P.ink; c.fillStyle = fill;
  if (who === 'hoppel') for (const s of [-1, 1]) { const e = rrPath(s * w * 0.18 - w * 0.1, y - h * 0.55, w * 0.2, h * 0.65, w * 0.1); c.fill(e); c.stroke(e); }
  if (who === 'brumm') for (const s of [-1, 1]) { c.beginPath(); c.arc(s * w * 0.33, y + h * 0.08, w * 0.15, 0, Math.PI * 2); c.fill(); c.stroke(); }
  if (who === 'socke') { const tip = rrPath(x + w * 0.45, y - h * 0.35, w * 0.4, h * 0.5, w * 0.18); c.fill(tip); c.stroke(tip); }
  const body = rrPath(x, y, w, h, w * 0.32); c.fill(body);
  if (who === 'socke') { c.save(); c.clip(body); c.fillStyle = P.cream; for (let i = 0; i < 4; i++) c.fillRect(x, y + h * (0.12 + i * 0.25), w, h * 0.1); c.restore(); }
  c.stroke(body);
  // eyes (Socke has one big button eye)
  const eyes: [number, number, number][] = who === 'socke' ? [[0, -h * 0.12, w * 0.17]] : [[-w * 0.18, -h * 0.12, w * 0.1], [w * 0.18, -h * 0.12, w * 0.1]];
  for (const [ex, ey, er] of eyes) {
    if (out) { c.strokeStyle = P.ink; c.lineWidth = 2.2; c.beginPath(); c.moveTo(ex - er, ey - er); c.lineTo(ex + er, ey + er); c.moveTo(ex + er, ey - er); c.lineTo(ex - er, ey + er); c.stroke(); }
    else { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = P.ink; c.beginPath(); c.arc(ex + er * 0.2, ey, er * 0.55, 0, Math.PI * 2); c.fill(); }
  }
  // bandana in team colour, with the team pattern
  const band = polyPath([[x + w * 0.1, y + h * 0.5], [x + w * 0.9, y + h * 0.5], [0, y + h * 0.9]]);
  c.fillStyle = team; c.fill(band);
  c.save(); c.clip(band); c.fillStyle = '#FFFFFF';
  if (team === P.green) for (let i = 0; i < 3; i++) c.fillRect(x, y + h * (0.56 + i * 0.1), w, h * 0.03);
  else for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + w * (0.25 + (i % 3) * 0.25), y + h * (0.58 + Math.floor(i / 3) * 0.12), w * 0.025, 0, Math.PI * 2); c.fill(); }
  c.restore(); c.lineWidth = 1.6; c.strokeStyle = P.ink; c.stroke(band);
}

export function drawMarble(c: CanvasRenderingContext2D, r: number): void {
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = P.glass; c.fill(); c.clip();
  c.lineWidth = r * 0.55; c.strokeStyle = P.toyRed; c.beginPath(); c.arc(-r * 0.9, r * 0.2, r * 1.1, -0.9, 0.5); c.stroke();
  c.strokeStyle = P.toyYellow; c.beginPath(); c.arc(r * 1.1, -r * 0.3, r * 1.1, 2.4, 3.6); c.stroke();
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.4, r * 0.25, 0, Math.PI * 2); c.fill();
  c.lineWidth = 2; c.strokeStyle = P.ink; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
}
