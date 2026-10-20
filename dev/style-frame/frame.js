'use strict';
// Fort Knocks style frame (Phase 5.3): one siege screen at landscape phone size (844 x 390 pt).
// Drawn in code: room, rug, pieces, launcher, ammo, crayon layer, HUD. Illustrated sprites: the three plushies.
// Every colour, line and layer rule comes from docs/style.md.

const W = 844, H = 390, C = 30, GROUND = 326, RUG_X = 486;
const P = {
  ink: '#2E2A33', wall: '#F4E9D8', wall2: '#E6D6BE', floor: '#C98B5A', floor2: '#A86F45', rug: '#EFE6D2', rug2: '#8FA3B8',
  toyRed: '#E63B2E', toyYellow: '#F2B705', wood: '#D9A86C', wood2: '#B5824A', cream: '#FBF3E2',
  bookOx: '#8E2E2A', bookMustard: '#C9952B', bookPlum: '#6B3E62', glass: '#BFE3F2',
  blue: '#2F6FDE', green: '#0F7B5F',
  lava: '#FF5A1F', lavaRed: '#E2341D', lavaGlow: '#FFD27A', graphite: '#4A4650',
  cardboard: '#C8A06E', cardboard2: '#A8834F', tape: 'rgba(234,219,176,0.9)',
  nightWall: '#26304D', nightFloor: '#4A3427',
};

const state = { mode: 'aim', night: false, boil: 0, shakeUntil: 0, t: 0 };
const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d');
const crayonCanvas = document.createElement('canvas');
const darkCanvas = document.createElement('canvas');
let S = 1, grain = null;
const sprites = {};

// ---------- helpers ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rngFor = id => mulberry32((id * 7919 + state.boil * 104729) >>> 0);
const fixedRng = id => mulberry32(id * 7919 + 13);
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), k = 1 - f; return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; }
function rrPath(x, y, w, h, r) { const p = new Path2D(); r = Math.min(r, w / 2, h / 2); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p; }
function polyPath(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; }
const cellBox = pc => ({ x: RUG_X + pc.x * C, y: GROUND - (pc.y + pc.h) * C, w: pc.w * C, h: pc.h * C });

// Real layer: flat fill, one shade band lower right, one highlight upper left, ink outline.
function solid(c, path, b, fill, o = {}) {
  c.save();
  c.fillStyle = fill; c.fill(path);
  c.save(); c.clip(path);
  const bw = Math.max(3, Math.min(b.w, b.h) * 0.22);
  c.fillStyle = shade(fill, 0.15);
  c.fillRect(b.x + b.w - bw, b.y - 2, bw + 4, b.h + 4);
  c.fillRect(b.x - 2, b.y + b.h - bw, b.w + 4, bw + 4);
  if (o.hl !== false && b.w > 10 && b.h > 10) {
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(b.x + 4.5, b.y + b.h * 0.5); c.lineTo(b.x + 4.5, b.y + 4.5); c.lineTo(b.x + b.w * 0.4, b.y + 4.5); c.stroke();
  }
  c.restore();
  c.lineWidth = o.lw ?? 2.5; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(path);
  c.restore();
}

// Crayon layer: jittered strokes in 2 passes, hatched fills, no outlines.
function crayonLine(c, pts, o) {
  const rng = o.rng, w = o.w ?? 3, jit = o.jit ?? 1.4, passes = o.passes ?? 2, step = o.step ?? 6;
  const s = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) { const t = k / n; s.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (y1 - y0) / L, -(x1 - x0) / L]); }
  }
  const last = pts[pts.length - 1]; s.push([last[0], last[1], 0, 0]);
  c.save(); c.strokeStyle = o.color; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let p = 0; p < passes; p++) {
    c.globalAlpha = o.alpha ?? 0.8; c.lineWidth = w * (0.75 + 0.4 * rng());
    c.beginPath();
    s.forEach(([x, y, nx, ny], i) => { const j = (rng() - 0.5) * 2 * jit; i ? c.lineTo(x + nx * j, y + ny * j) : c.moveTo(x + nx * j, y + ny * j); });
    c.stroke();
  }
  c.restore();
}
function crayonFill(c, path, b, o) {
  c.save(); c.clip(path);
  const sets = [o.angle ?? 35].concat(o.cross ? [(o.angle ?? 35) + o.cross] : []);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.hypot(b.w, b.h) / 2 + 8;
  for (const deg of sets) {
    const a = deg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    for (let d = -R; d <= R; d += o.sp ?? 5) {
      const px = cx + nx * d, py = cy + ny * d;
      crayonLine(c, [[px - dx * R, py - dy * R], [px + dx * R, py + dy * R]], { ...o, passes: 1, step: 9 });
    }
  }
  c.restore();
}
function crayonPass(alpha, fn) {
  const oc = crayonCanvas.getContext('2d');
  oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.clearRect(0, 0, crayonCanvas.width, crayonCanvas.height);
  oc.setTransform(S, 0, 0, S, shakeX * S, shakeY * S);
  fn(oc);
  // paper tooth: knock random specks out of the wax
  oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'destination-out'; oc.fillStyle = grain; oc.fillRect(0, 0, crayonCanvas.width, crayonCanvas.height);
  oc.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(crayonCanvas, 0, 0); ctx.restore();
}
function makeGrain() {
  const g = document.createElement('canvas'); g.width = g.height = 128;
  const gc = g.getContext('2d'), img = gc.createImageData(128, 128), r = mulberry32(7);
  for (let i = 0; i < img.data.length; i += 4) { const v = r(); img.data[i + 3] = v < 0.3 ? v * 1.6 * 255 : 0; }
  gc.putImageData(img, 0, 0);
  grain = crayonCanvas.getContext('2d').createPattern(g, 'repeat');
}

// ---------- the scene ----------
const FORT = [
  { t: 'bookLie', x: 0, y: 0, w: 3, h: 0.5, c: 'bookOx' },
  { t: 'bookLie', x: 0, y: 0.5, w: 3, h: 0.5, c: 'bookMustard' },
  { t: 'block', x: 0, y: 1, w: 1, h: 1, c: 'toyRed', sym: 'circle' },
  { t: 'block', x: 2, y: 1, w: 1, h: 1, c: 'wood', sym: 'star' },
  { t: 'bookLie', x: 0, y: 2, w: 3, h: 0.5, c: 'bookPlum' },
  { t: 'block', x: 1, y: 2.5, w: 1, h: 1, c: 'cream', sym: 'triangle' },
  { t: 'arch', x: 3.5, y: 0, w: 2, h: 1, c: 'toyRed' },
  { t: 'domStand', x: 3.55, y: 1, w: 0.5, h: 2, pips: [2, 5] },
  { t: 'domStand', x: 4.95, y: 1, w: 0.5, h: 2, pips: [6, 1] },
  { t: 'cardFlat', x: 3.4, y: 3, w: 2.2, h: 0.18 },
  { t: 'cardTent', x: 3.75, y: 3.18, w: 1.5, h: 1.37, tilt: true },
  { t: 'cardFlat', x: 3.5, y: 4.55, w: 2, h: 0.18, tilt: true },
  { t: 'long', x: 6, y: 0, w: 2, h: 1, c: 'toyYellow', sym: 'circle' },
  { t: 'long', x: 8, y: 0, w: 2, h: 1, c: 'toyRed', sym: 'star' },
  { t: 'bookStand', x: 6.4, y: 1, w: 0.5, h: 3, c: 'bookMustard' },
  { t: 'bookStand', x: 9.1, y: 1, w: 0.5, h: 3, c: 'bookOx' },
  { t: 'block', x: 7.3, y: 1, w: 1, h: 1, c: 'toyYellow', sym: 'triangle' },
  { t: 'tri', x: 7.3, y: 2, w: 1, h: 1, c: 'wood' },
  { t: 'domLie', x: 7.3, y: 3, w: 1.5, h: 0.4, pips: [3, 4] },
  { t: 'bookLie', x: 6.5, y: 4, w: 3, h: 0.5, c: 'bookPlum' },
];
const PLUSHIES = [
  { key: 'brumm-grumpy', cx: 1.5, base: 3.5, h: 54 },
  { key: 'hoppel-smug', cx: 4.5, base: 4.73, h: 64, tilt: true },
  { key: 'socke-taunt', cx: 8.05, base: 4.5, h: 58 },
];
const TENT_PIVOT = [RUG_X + 5.25 * C, GROUND - 3.18 * C];
// the aim: a marble released between the pencils, landing on the card platform under Hoppel
const RELEASE = [158, 226], G = 900, IMPACT = [RUG_X + 3.5 * C, GROUND - 4.73 * C], FLIGHT = 1.15;
const V = [(IMPACT[0] - RELEASE[0]) / FLIGHT, (IMPACT[1] - RELEASE[1] - 0.5 * G * FLIGHT * FLIGHT) / FLIGHT];
const arcAt = (t, v = V) => [RELEASE[0] + v[0] * t, RELEASE[1] + v[1] * t + 0.5 * G * t * t];
const IMPACT_T = FLIGHT;

function symbol(c, b, sym, col) {
  const cx = b.x + b.w / 2 - 1.5, cy = b.y + b.h / 2 - 1.5, r = Math.min(b.w, b.h) * 0.2;
  c.fillStyle = col; c.beginPath();
  if (sym === 'circle') c.arc(cx, cy, r, 0, Math.PI * 2);
  if (sym === 'triangle') { c.moveTo(cx, cy - r * 1.1); c.lineTo(cx + r * 1.05, cy + r * 0.8); c.lineTo(cx - r * 1.05, cy + r * 0.8); c.closePath(); }
  if (sym === 'star') for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r * 1.15; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  c.fill();
}
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function pips(c, cx, cy, n, s) { c.fillStyle = P.ink; for (const [i, j] of PIPS[n]) { c.beginPath(); c.arc(cx + i * s, cy + j * s, 1.5, 0, Math.PI * 2); c.fill(); } }

function drawPiece(c, pc) {
  const b = cellBox(pc), r = Math.min(b.w, b.h) * 0.12;
  if (pc.t === 'block' || pc.t === 'long') {
    solid(c, rrPath(b.x, b.y, b.w, b.h, r), b, P[pc.c]);
    if (pc.c === 'wood') { c.strokeStyle = P.wood2; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x + 5, b.y + b.h * 0.3); c.quadraticCurveTo(b.x + b.w * 0.5, b.y + b.h * 0.22, b.x + b.w - 6, b.y + b.h * 0.34); c.stroke(); }
    symbol(c, b, pc.sym, pc.c === 'cream' ? P.toyRed : P.cream);
  } else if (pc.t === 'arch') {
    const p = new Path2D(), ar = b.w * 0.2, cx = b.x + b.w / 2, by = b.y + b.h;
    p.moveTo(b.x + r, b.y); p.lineTo(b.x + b.w - r, b.y); p.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + r); p.lineTo(b.x + b.w, by); p.lineTo(cx + ar, by);
    p.arc(cx, by, ar, 0, Math.PI, true); p.lineTo(b.x, by); p.lineTo(b.x, b.y + r); p.quadraticCurveTo(b.x, b.y, b.x + r, b.y); p.closePath();
    solid(c, p, b, P[pc.c]);
  } else if (pc.t === 'tri') {
    solid(c, polyPath([[b.x, b.y + b.h], [b.x + b.w / 2, b.y], [b.x + b.w, b.y + b.h]]), b, P[pc.c], { hl: false });
    c.strokeStyle = P.wood2; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x + b.w * 0.3, b.y + b.h * 0.75); c.lineTo(b.x + b.w * 0.62, b.y + b.h * 0.72); c.stroke();
  } else if (pc.t === 'bookLie') {
    const p = rrPath(b.x, b.y, b.w, b.h, 2.5);
    c.fillStyle = P[pc.c]; c.fill(p);
    c.fillStyle = P.cream; c.fillRect(b.x + 7, b.y + 2.6, b.w - 8.5, b.h - 5.2);
    c.strokeStyle = '#D9CDB5'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(b.x + 9, b.y + b.h / 2); c.lineTo(b.x + b.w - 3, b.y + b.h / 2); c.stroke();
    c.strokeStyle = shade(P[pc.c], 0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(b.x + 7, b.y + 2); c.lineTo(b.x + 7, b.y + b.h - 2); c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(p);
  } else if (pc.t === 'bookStand') {
    const p = rrPath(b.x, b.y, b.w, b.h, 2.5);
    solid(c, p, b, P[pc.c], { hl: false });
    c.strokeStyle = shade(P[pc.c], 0.35); c.lineWidth = 1.6;
    for (const f of [0.1, 0.9]) { c.beginPath(); c.moveTo(b.x + 2, b.y + b.h * f); c.lineTo(b.x + b.w - 2, b.y + b.h * f); c.stroke(); }
    c.fillStyle = P.cream; c.fillRect(b.x + 3, b.y + b.h * 0.24, b.w - 6, b.h * 0.12);
    c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(p);
  } else if (pc.t === 'domStand' || pc.t === 'domLie') {
    solid(c, rrPath(b.x, b.y, b.w, b.h, 3), b, P.cream, { lw: 2 });
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath();
    if (pc.t === 'domStand') { c.moveTo(b.x + 2.5, b.y + b.h / 2); c.lineTo(b.x + b.w - 2.5, b.y + b.h / 2); c.stroke(); pips(c, b.x + b.w / 2, b.y + b.h / 4, pc.pips[0], 3.4); pips(c, b.x + b.w / 2, b.y + b.h * 0.75, pc.pips[1], 3.4); }
    else { c.moveTo(b.x + b.w / 2, b.y + 2); c.lineTo(b.x + b.w / 2, b.y + b.h - 2); c.stroke(); pips(c, b.x + b.w / 4, b.y + b.h / 2, Math.min(pc.pips[0], 3), 2.6); pips(c, b.x + b.w * 0.75, b.y + b.h / 2, Math.min(pc.pips[1], 3), 2.6); }
  } else if (pc.t === 'cardFlat') {
    const p = rrPath(b.x, b.y, b.w, b.h, 1.5);
    c.fillStyle = P.toyRed; c.fill(p);
    c.strokeStyle = P.cream; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x + 3, b.y + b.h / 2); c.lineTo(b.x + b.w - 3, b.y + b.h / 2); c.stroke();
    c.lineWidth = 1.8; c.strokeStyle = P.ink; c.stroke(p);
  } else if (pc.t === 'cardTent') {
    const apex = [b.x + b.w / 2, b.y], legs = [[[b.x, b.y + b.h], P.toyRed], [[b.x + b.w, b.y + b.h], P.graphite]];
    for (const [base, col] of legs) {
      const dx = apex[0] - base[0], dy = apex[1] - base[1], L = Math.hypot(dx, dy), nx = -dy / L * 3.6, ny = dx / L * 3.6;
      const p = polyPath([[base[0] - nx, base[1] - ny], [apex[0] - nx, apex[1] - ny], [apex[0] + nx, apex[1] + ny], [base[0] + nx, base[1] + ny]]);
      c.fillStyle = col; c.fill(p);
      c.strokeStyle = P.cream; c.lineWidth = 1; c.beginPath(); c.moveTo(base[0] + dx * 0.08, base[1] + dy * 0.08); c.lineTo(apex[0] - dx * 0.1, apex[1] - dy * 0.1); c.stroke();
      c.lineWidth = 1.8; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(p);
    }
  }
}

function drawFort(c) {
  const impact = state.mode === 'impact';
  for (const pc of FORT) {
    if (pc.tilt && impact) { c.save(); c.translate(...TENT_PIVOT); c.rotate(0.16); c.translate(-TENT_PIVOT[0], -TENT_PIVOT[1]); drawPiece(c, pc); c.restore(); }
    else drawPiece(c, pc);
  }
}

function drawPlushies(c) {
  const impact = state.mode === 'impact';
  PLUSHIES.forEach((p, i) => {
    const img = sprites[p.key]; if (!img) return;
    const w = img.width * p.h / img.height, x = RUG_X + p.cx * C, y = GROUND - p.base * C;
    const bob = 1 + 0.025 * Math.sin(state.t * 2.2 + i * 2);   // plushies breathe; real pieces never squash
    c.save(); c.translate(x, y);
    if (p.tilt && impact) { c.translate(20, -26); c.rotate(0.42); }
    c.scale(2 - bob, bob);
    c.drawImage(img, -w / 2, -p.h, w, p.h);
    c.restore();
  });
}

function drawRoom(c) {
  const n = state.night;
  c.fillStyle = n ? P.nightWall : P.wall; c.fillRect(-20, -20, W + 40, 320);
  // window with rain (rainy afternoon) or moon (lights out)
  const wx = 196, wy = 52, ww = 96, wh = 88;
  c.fillStyle = n ? '#141B33' : '#C9D6DF'; c.fillRect(wx, wy, ww, wh);
  if (n) { c.fillStyle = '#F4EBC8'; c.beginPath(); c.arc(wx + 88, wy + 34, 13, 0, Math.PI * 2); c.fill(); c.fillStyle = '#141B33'; c.beginPath(); c.arc(wx + 94, wy + 30, 11, 0, Math.PI * 2); c.fill(); }
  else { const r = fixedRng(3); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.2; for (let i = 0; i < 26; i++) { const x = wx + r() * ww, y = wy + r() * wh; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 10); c.stroke(); } }
  c.strokeStyle = n ? '#5A4636' : P.wood; c.lineWidth = 7; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 4; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
  c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(wx - 3.5, wy - 3.5, ww + 7, wh + 7);
  // skirting and the far strip of floor (the rest of the floor is lava)
  c.fillStyle = n ? '#323B58' : P.wall2; c.fillRect(-20, 282, W + 40, 14);
  c.fillStyle = n ? P.nightFloor : P.floor; c.fillRect(-20, 296, W + 40, 100);
  c.strokeStyle = n ? '#3A291F' : P.floor2; c.lineWidth = 1.2;
  for (const y of [306, 316]) { c.beginPath(); c.moveTo(-20, y); c.lineTo(W + 20, y); c.stroke(); }
  for (let i = 0; i < 16; i++) { const x = i * 61 + (i % 2) * 27, y = 296 + (i % 3) * 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10); c.stroke(); }
  // the tape line between the two players
  c.fillStyle = P.tape; c.beginPath(); c.moveTo(398, 296); c.lineTo(408, 296); c.lineTo(413, 322); c.lineTo(401, 322); c.closePath(); c.fill();
}

function drawWallDrawings(c) {
  // the kid's crayon drawings on the wall; quiet during play (pass alpha 0.3)
  const r = rngFor(11);
  const volcano = polyPath([[690, 150], [738, 78], [764, 78], [826, 150]]);
  crayonFill(c, volcano, { x: 690, y: 78, w: 136, h: 72 }, { rng: r, color: P.graphite, sp: 7, w: 3, angle: 60 });
  crayonLine(c, [[690, 150], [738, 78], [764, 78], [826, 150]], { rng: r, color: P.graphite, w: 3.5 });
  for (const [dx, h] of [[-12, 40], [0, 52], [12, 38]]) crayonLine(c, [[751 + dx * 0.3, 76], [751 + dx, 76 - h * 0.6], [751 + dx * 1.6, 76 - h]], { rng: r, color: P.lava, w: 4 });
  crayonLine(c, [[742, 82], [735, 110], [740, 128]], { rng: r, color: P.lava, w: 4 });
  // castle with flag
  crayonLine(c, [[330, 196], [330, 130], [340, 130], [340, 122], [350, 122], [350, 130], [370, 130], [370, 122], [380, 122], [380, 130], [390, 130], [390, 196]], { rng: r, color: P.graphite, w: 3 });
  crayonLine(c, [[360, 122], [360, 94]], { rng: r, color: P.graphite, w: 2.5 });
  crayonFill(c, polyPath([[360, 94], [380, 100], [360, 107]]), { x: 360, y: 94, w: 20, h: 13 }, { rng: r, color: P.lava, sp: 3, w: 3 });
  // sun
  const sun = new Path2D(); sun.arc(560, 60, 16, 0, Math.PI * 2);
  crayonFill(c, sun, { x: 544, y: 44, w: 32, h: 32 }, { rng: r, color: P.lavaGlow, sp: 4, w: 3.5, cross: 70 });
  for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; crayonLine(c, [[560 + Math.cos(a) * 22, 60 + Math.sin(a) * 22], [560 + Math.cos(a) * 32, 60 + Math.sin(a) * 32]], { rng: r, color: P.lavaGlow, w: 3 }); }
}

function lavaTop(r, x) { return GROUND - 5 + Math.sin(x * 0.045 + state.boil * 0.9) * 2.2 + (r() - 0.5) * 1.5; }
function drawLava(c) {
  const r = rngFor(21), pts = [];
  for (let x = -20; x <= W + 20; x += 14) pts.push([x, lavaTop(r, x)]);
  const body = polyPath([...pts, [W + 20, H + 20], [-20, H + 20]]), box = { x: -20, y: GROUND - 10, w: W + 40, h: H - GROUND + 30 };
  c.fillStyle = 'rgba(255,90,31,0.55)'; c.fill(body);   // under-colour so paper never shows through the wax
  crayonFill(c, body, box, { rng: r, color: P.lava, sp: 4.5, w: 4, angle: -18, cross: 34 });
  crayonFill(c, polyPath([[-20, GROUND + 26], [W + 20, GROUND + 20], [W + 20, H + 20], [-20, H + 20]]), { x: -20, y: GROUND + 20, w: W + 40, h: 50 }, { rng: r, color: P.lavaRed, sp: 6, w: 4, angle: 20 });
  for (const y of [GROUND + 12, GROUND + 30, GROUND + 47]) {
    const swirl = []; for (let x = -10; x <= W + 10; x += 22) swirl.push([x, y + Math.sin(x * 0.03 + y + state.boil * 0.7) * 4]);
    crayonLine(c, swirl, { rng: r, color: P.lavaGlow, w: 3, alpha: 0.85 });
  }
  for (const [bx, by, br] of [[262, GROUND + 22, 6], [380, GROUND + 42, 8], [450, GROUND + 16, 5], [826, GROUND + 34, 7]]) {
    const p = new Path2D(); p.arc(bx, by, br + Math.sin(state.boil + bx) * 1.2, 0, Math.PI * 2);
    crayonFill(c, p, { x: bx - br, y: by - br, w: br * 2, h: br * 2 }, { rng: r, color: P.lavaGlow, sp: 3, w: 3 });
    crayonLine(c, Array.from({ length: 9 }, (_, i) => [bx + Math.cos(i * 0.8) * br, by + Math.sin(i * 0.8) * br]), { rng: r, color: P.lavaRed, w: 2.5 });
  }
  crayonLine(c, pts, { rng: r, color: P.lavaRed, w: 3.5 });
  for (const [fx, fh] of [[RUG_X - 10, 28], [RUG_X + 10 * C + 10, 24], [44, 18], [214, 24], [320, 14]]) flame(c, fx, GROUND - 2, fh + Math.sin(state.boil * 1.7 + fx) * 3, r);
}
function flame(c, x, y, h, r) {
  const bw = h * 0.55, tip = [x + (r() - 0.5) * h * 0.25, y - h];
  const p = new Path2D(); p.moveTo(x - bw / 2, y); p.quadraticCurveTo(x - bw * 0.7, y - h * 0.45, tip[0], tip[1]); p.quadraticCurveTo(x + bw * 0.7, y - h * 0.45, x + bw / 2, y); p.closePath();
  crayonFill(c, p, { x: x - bw, y: y - h, w: bw * 2, h }, { rng: r, color: P.lava, sp: 3, w: 3, angle: 80 });
  const q = new Path2D(); q.moveTo(x - bw / 4, y); q.quadraticCurveTo(x - bw * 0.3, y - h * 0.3, tip[0] * 0.3 + x * 0.7, y - h * 0.55); q.quadraticCurveTo(x + bw * 0.3, y - h * 0.3, x + bw / 4, y); q.closePath();
  crayonFill(c, q, { x: x - bw / 2, y: y - h * 0.6, w: bw, h: h * 0.6 }, { rng: r, color: P.lavaGlow, sp: 2.5, w: 2.5, angle: 80 });
}
function drawRisingLava(c) {
  // Siege: after volley 1 the lava has risen one cell up the fort. Pieces are safe; a plushie below the line is out.
  // Drawn as a crayon waterline with a faint wash and licks, so the pieces under it stay readable.
  const r = rngFor(31), top = GROUND - C, x0 = RUG_X - 8, x1 = RUG_X + 10 * C + 8, pts = [];
  for (let x = x0; x <= x1; x += 10) pts.push([x, top + Math.sin(x * 0.08 + state.boil) * 2]);
  c.save(); c.globalAlpha = 0.16; c.fillStyle = P.lava; c.fill(polyPath([...pts, [x1, GROUND + 9], [x0, GROUND + 9]])); c.restore();
  crayonLine(c, pts, { rng: r, color: P.lava, w: 4.5 });
  crayonLine(c, pts.map(([x, y]) => [x, y + 3]), { rng: r, color: P.lavaRed, w: 2.5, alpha: 0.7 });
  for (let x = x0 + 14; x < x1; x += 34 + r() * 16) { const h = 6 + r() * 6; crayonLine(c, [[x - 3, top + 1], [x, top - h], [x + 3, top + 1]], { rng: r, color: P.lava, w: 3 }); }
}

function drawRug(c) {
  const x = RUG_X - 6, w = 10 * C + 12;
  c.fillStyle = P.rug; c.fillRect(x, GROUND, w, 9);
  c.fillStyle = P.rug2; for (let i = x + 5; i < x + w - 4; i += 14) c.fillRect(i, GROUND, 6, 9);
  c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(x, GROUND, w, 9);
  c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const y = GROUND + 2 + i * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 1); c.moveTo(x + w, y); c.lineTo(x + w + 5, y + 1); c.stroke(); }
}

function marble(c, x, y, r) {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = P.glass; c.fill(); c.clip();
  c.lineWidth = r * 0.55; c.strokeStyle = P.toyRed; c.beginPath(); c.arc(x - r * 0.9, y + r * 0.2, r * 1.1, -0.9, 0.5); c.stroke();
  c.strokeStyle = P.toyYellow; c.beginPath(); c.arc(x + r * 1.1, y - r * 0.3, r * 1.1, 2.4, 3.6); c.stroke();
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.25, 0, Math.PI * 2); c.fill();
  c.lineWidth = 2; c.strokeStyle = P.ink; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}
function pencil(c, x, top, bottom, dim) {
  const pw = 11, body = rrPath(x, top + 18, pw, bottom - top - 18, 1.2);
  c.fillStyle = dim ? shade(P.toyYellow, 0.2) : P.toyYellow; c.fill(body);
  c.fillStyle = shade(P.toyYellow, dim ? 0.35 : 0.15); c.fillRect(x + pw - 3.5, top + 18, 3.5, bottom - top - 18);
  c.lineWidth = 2.2; c.strokeStyle = P.ink; c.stroke(body);
  const cone = polyPath([[x, top + 18], [x + pw / 2, top + 1], [x + pw, top + 18]]);
  c.fillStyle = dim ? shade(P.wood, 0.2) : P.wood; c.fill(cone); c.stroke(cone);
  c.fillStyle = P.graphite; c.beginPath(); c.moveTo(x + pw / 2 - 2, top + 7); c.lineTo(x + pw / 2, top + 1); c.lineTo(x + pw / 2 + 2, top + 7); c.fill();
}
function band(c, a, b) { c.lineCap = 'round'; c.strokeStyle = P.ink; c.lineWidth = 5.5; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.strokeStyle = P.toyRed; c.lineWidth = 3.2; c.stroke(); }
const AIM_POUCH = [100, 252];
function drawLauncher(c) {
  const bx = 48, bw = 166, bh = 26, by = GROUND - bh;
  const p = rrPath(bx, by, bw, bh, 3); c.fillStyle = P.bookOx; c.fill(p);
  c.fillStyle = P.cream; c.fillRect(bx + 9, by + 3.5, bw - 12, bh - 7);
  c.strokeStyle = '#D9CDB5'; c.lineWidth = 0.8; for (const y of [by + 9.5, by + 15.5]) { c.beginPath(); c.moveTo(bx + 11, y); c.lineTo(bx + bw - 4, y); c.stroke(); }
  c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(p);
  const aim = state.mode === 'aim', back = [147, 222], front = [169, 222], pouch = aim ? AIM_POUCH : [158, 226];
  pencil(c, 141.5, 204, by + 2, true);
  band(c, back, pouch);
  if (aim) marble(c, pouch[0], pouch[1], 10);
  pencil(c, 163.5, 204, by + 2, false);
  band(c, front, pouch);
}

function arcDots(c, v, upto, every, o) {
  const pts = []; let last = null, dist = 0;
  for (let t = 0; t < upto; t += 0.004) { const p = arcAt(t, v); if (last) dist += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; if (dist >= every) { pts.push(p); dist = 0; } }
  for (const [x, y] of pts) { const d = new Path2D(); d.arc(x, y, o.r, 0, Math.PI * 2); crayonFill(c, d, { x: x - o.r, y: y - o.r, w: o.r * 2, h: o.r * 2 }, { rng: o.rng, color: o.color, sp: 1.6, w: 2.2, jit: 0.6 }); }
}
function drawFront(c) {
  const r = rngFor(41), dot = state.night ? '#FFFFFF' : P.graphite;
  if (state.mode === 'aim') {
    arcDots(c, [V[0] * 0.93, V[1] * 0.97], 1.3, 15, { r: 2.2, color: dot, rng: r });              // last shot's trail, faint (pass alpha)
  }
}
function drawFrontStrong(c) {
  const r = rngFor(51), dot = state.night ? '#FFFFFF' : P.graphite;
  if (state.mode === 'aim') {
    arcDots(c, V, 0.42, 14, { r: 3.2, color: dot, rng: r });                          // preview: first 35% of the arc
    for (let i = 0; i < 7; i++) { const a = 2.2 + i * 0.32, [px, py] = AIM_POUCH; crayonLine(c, [[px + Math.cos(a) * 16, py + Math.sin(a) * 16], [px + Math.cos(a) * 25, py + Math.sin(a) * 25]], { rng: r, color: P.lava, w: 2.5 }); }
  } else {
    const [ix, iy] = arcAt(IMPACT_T), vy = V[1] + G * IMPACT_T, L = Math.hypot(V[0], vy), ux = V[0] / L, uy = vy / L;
    for (const o of [-8, 0, 8]) crayonLine(c, [[ix - ux * 70 - uy * o, iy - uy * 70 + ux * o], [ix - ux * 14 - uy * o, iy - uy * 14 + ux * o]], { rng: r, color: P.lava, w: 3.5 });
    const star = []; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, rr = i % 2 ? 15 + r() * 4 : 34 + r() * 8; star.push([ix + Math.cos(a) * rr, iy + Math.sin(a) * rr]); }
    crayonFill(c, polyPath(star), { x: ix - 44, y: iy - 44, w: 88, h: 88 }, { rng: r, color: P.lavaGlow, sp: 3.5, w: 3.5, cross: 60 });
    crayonLine(c, [...star, star[0]], { rng: r, color: P.lava, w: 3.5 });
    for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2; crayonLine(c, [[ix + Math.cos(a) * 46, iy + Math.sin(a) * 46], [ix + Math.cos(a) * 60, iy + Math.sin(a) * 60]], { rng: r, color: P.lavaRed, w: 3 }); }
    const hx = RUG_X + 4.5 * C + 30, hy = GROUND - 4.73 * C - 52;
    for (const k of [0, 1]) crayonLine(c, Array.from({ length: 6 }, (_, i) => [hx + 24 + k * 8 + Math.cos(-1.2 + i * 0.35) * (20 + k * 8), hy + Math.sin(-1.2 + i * 0.35) * (20 + k * 8)]), { rng: r, color: P.graphite, w: 2.5 });
  }
}

// ---------- HUD: stuff from a kid's desk ----------
function sticker(c, x, y, r, fill, icon) {
  c.fillStyle = 'rgba(46,42,51,0.9)'; c.beginPath(); c.arc(x, y + 2, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  const disc = new Path2D(); disc.arc(x, y, r - 3, 0, Math.PI * 2);
  crayonFill(c, disc, { x: x - r, y: y - r, w: r * 2, h: r * 2 }, { rng: fixedRng(61 + x), color: fill, sp: 2.6, w: 3, cross: 70 });
  c.fillStyle = '#FFFFFF'; icon(c, x, y);
  c.fillStyle = '#EDE6DA'; c.beginPath(); c.moveTo(x + r * 0.45, y + r * 0.88); c.lineTo(x + r * 0.9, y + r * 0.42); c.lineTo(x + r * 0.5, y + r * 0.42); c.closePath(); c.fill();
}
function bandana(c, x, y, team, out) {
  const col = team === 'blue' ? P.blue : P.green, p = polyPath([[x - 10, y - 6], [x + 10, y - 6], [x, y + 8]]);
  c.fillStyle = col; c.fill(p);
  c.save(); c.clip(p); c.fillStyle = '#FFFFFF';
  if (team === 'blue') for (const [dx, dy] of [[-5, -3], [1, -3], [6, -3], [-2, 1], [3, 1], [0, 5]]) { c.beginPath(); c.arc(x + dx, y + dy, 1.1, 0, Math.PI * 2); c.fill(); }
  else for (const dy of [-3, 1, 5]) c.fillRect(x - 10, y + dy - 0.6, 20, 1.3);
  c.restore();
  c.lineWidth = 1.8; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(p);
  c.fillStyle = col; c.beginPath(); c.arc(x + 7, y - 7, 3, 0, Math.PI * 2); c.fill(); c.stroke();
  if (out) { const r = fixedRng(x); crayonLine(c, [[x - 12, y - 10], [x + 12, y + 10]], { rng: r, color: P.lavaRed, w: 3.5 }); crayonLine(c, [[x + 12, y - 10], [x - 12, y + 10]], { rng: r, color: P.lavaRed, w: 3.5 }); }
}
function tapeLabel(c, cx, cy, w, h, text) {
  const r = fixedRng(71), pts = [];
  pts.push([cx - w / 2, cy - h / 2]); pts.push([cx + w / 2, cy - h / 2]);
  for (let i = 0; i <= 4; i++) pts.push([cx + w / 2 + (i % 2 ? -3 : 0) + r(), cy - h / 2 + i * h / 4]);
  pts.push([cx - w / 2, cy + h / 2]);
  for (let i = 4; i >= 0; i--) pts.push([cx - w / 2 + (i % 2 ? 3 : 0) - r(), cy - h / 2 + i * h / 4]);
  c.fillStyle = P.tape; c.fill(polyPath(pts));
  c.fillStyle = P.ink; c.font = '400 17px "Gochi Hand", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cx, cy + 1);
}
function clock(c, x, y, r, left) {
  const rr = fixedRng(81), wedge = new Path2D();
  wedge.moveTo(x, y); wedge.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2); wedge.closePath();
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  crayonFill(c, wedge, { x: x - r, y: y - r, w: r * 2, h: r * 2 }, { rng: rr, color: P.graphite, sp: 3, w: 2.5 });
  crayonLine(c, Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.45) * r, y + Math.sin(i * 0.45) * r]), { rng: rr, color: P.graphite, w: 3 });
  c.fillStyle = state.night ? P.cream : P.ink; c.font = '800 16px "Baloo 2", system-ui, sans-serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
  c.fillText('0:24', x - r - 7, y + 1);
}
function matchbox(c, x, y) {
  // sleeve
  solid(c, rrPath(x, y, 108, 36, 3), { x, y, w: 108, h: 36 }, P.cardboard, { lw: 2, hl: false });
  c.fillStyle = P.toyRed; c.fillRect(x + 6, y + 5, 34, 26); c.fillStyle = P.cream; c.beginPath(); c.arc(x + 23, y + 18, 7, 0, Math.PI * 2); c.fill();
  // drawer pulled out to the right, two slots: the marble in the band, then the water balloon
  const dx = x + 46;
  c.fillStyle = P.cardboard2; c.fillRect(dx, y + 4, 58, 28); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(dx, y + 4, 58, 28);
  c.beginPath(); c.moveTo(dx + 29, y + 4); c.lineTo(dx + 29, y + 32); c.stroke();
  if (state.mode === 'aim') marble(c, dx + 14.5, y + 18, 7);
  const bx = dx + 44, by = y + 17, bal = new Path2D(); bal.ellipse(bx, by, 7, 8.5, -0.2, 0, Math.PI * 2);
  c.fillStyle = P.toyRed; c.fill(bal); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(bx - 2.5, by - 3.5, 1.8, 0, Math.PI * 2); c.fill();
  c.lineWidth = 1.8; c.strokeStyle = P.ink; c.stroke(bal);
  c.fillStyle = P.toyRed; c.beginPath(); c.moveTo(bx + 2, by + 8); c.lineTo(bx + 5, by + 11.5); c.lineTo(bx - 1, by + 11); c.closePath(); c.fill(); c.stroke();
}
function drawHUD(c) {
  sticker(c, 34, 34, 18, P.graphite, (cc, x, y) => { cc.fillRect(x - 6, y - 7, 4.5, 14); cc.fillRect(x + 1.5, y - 7, 4.5, 14); });
  [[300, true], [324, false], [348, false]].forEach(([x, out]) => bandana(c, x, 30, 'blue', out));
  [[496, false], [520, false], [544, false]].forEach(([x]) => bandana(c, x, 30, 'green', false));
  tapeLabel(c, 422, 30, 112, 26, 'Volley 2 of 3');
  clock(c, 806, 34, 17, 0.6);
  matchbox(c, 14, 340);
}

// ---------- frame ----------
let shakeX = 0, shakeY = 0;
function render() {
  const n = state.night;
  const sh = Math.max(0, state.shakeUntil - performance.now()) / 350;
  shakeX = sh ? (Math.random() - 0.5) * 12 * sh : 0; shakeY = sh ? (Math.random() - 0.5) * 12 * sh : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(S, 0, 0, S, shakeX * S, shakeY * S);
  drawRoom(ctx);
  crayonPass(n ? 0.18 : 0.3, drawWallDrawings);
  crayonPass(1, drawLava);
  ctx.setTransform(S, 0, 0, S, shakeX * S, shakeY * S);
  drawRug(ctx); drawLauncher(ctx); drawFort(ctx); drawPlushies(ctx);
  if (state.mode === 'impact') { const [ix, iy] = arcAt(IMPACT_T); marble(ctx, ix, iy, 10); }
  crayonPass(0.9, drawRisingLava);
  if (n) {
    // lights out: everything goes dark except the torch cone, then the lava glows on its own
    const dc = darkCanvas.getContext('2d');
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
    dc.fillStyle = 'rgba(6,10,28,0.66)'; dc.fillRect(0, 0, darkCanvas.width, darkCanvas.height);
    dc.setTransform(S, 0, 0, S, 0, 0); dc.globalCompositeOperation = 'destination-out';
    // a soft beam from the kid's torch at the top left, and a pool of light on the target fort
    dc.fillStyle = 'rgba(0,0,0,0.35)'; dc.filter = 'blur(14px)'; dc.fill(polyPath([[-20, 20], [W + 40, 150], [W + 40, 360], [-20, 110]])); dc.filter = 'none';
    const g = dc.createRadialGradient(RUG_X + 5 * C, GROUND - 2.4 * C, 10, RUG_X + 5 * C, GROUND - 2.4 * C, 250);
    g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dc.fillStyle = g; dc.fillRect(0, 0, W, H);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(darkCanvas, 0, 0); ctx.restore();
    crayonPass(0.95, drawLava);
    ctx.save(); ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalCompositeOperation = 'lighter';
    for (let x = 0; x <= W; x += 120) { const gl = ctx.createRadialGradient(x, GROUND, 4, x, GROUND, 90); gl.addColorStop(0, 'rgba(255,120,40,0.28)'); gl.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 90, GROUND - 90, 180, 180); }
    ctx.restore();
    crayonPass(0.9, drawRisingLava);
  }
  crayonPass(0.35, drawFront);
  crayonPass(1, drawFrontStrong);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  drawHUD(ctx);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3), cssW = canvas.clientWidth || W;
  for (const cv of [canvas, crayonCanvas, darkCanvas]) { cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssW * dpr * H / W); }
  S = canvas.width / W;
  makeGrain();
}

function loadSprite(key) {
  return new Promise(res => { const img = new Image(); img.onload = () => { sprites[key] = img; res(); }; img.onerror = res; img.src = `sprites/${key}.png`; });
}

let lastBoil = 0;
function loop(now) {
  state.t = now / 1000;
  if (now - lastBoil > 1000 / 12) { state.boil++; lastBoil = now; render(); }   // crayon boils at 12 fps
  requestAnimationFrame(loop);
}

window.FortKnocksFrame = {
  set(opt) {
    if (opt.mode && opt.mode !== state.mode) { state.mode = opt.mode; if (opt.mode === 'impact' && !matchMedia('(prefers-reduced-motion: reduce)').matches) state.shakeUntil = performance.now() + 350; }
    if (opt.night !== undefined) state.night = opt.night;
    render();
  },
  resize() { resize(); render(); },
};

(async function start() {
  resize();
  await Promise.all([...PLUSHIES.map(p => loadSprite(p.key)), document.fonts ? Promise.all([document.fonts.load('17px "Gochi Hand"'), document.fonts.load('800 16px "Baloo 2"')]).catch(() => {}) : null]);
  render();
  requestAnimationFrame(loop);
  new ResizeObserver(() => { resize(); render(); }).observe(canvas);
})();
