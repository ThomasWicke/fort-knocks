// Prototype M1, the sandbox: one fort on a rug, the rubber-band launcher, marbles, the lava rule.
// Questions it answers: does shooting feel good, and is the collapse satisfying? (docs/06-prototype.md)
import { initPhysics, World } from './physics';
import { TEST_FORT, MATERIALS, bodyOf, valueOf, type Piece } from './fort';
import { P, drawPiece, drawPlush, drawMarble, rrPath } from './draw';

// ---------- world layout (metres = cells, y up) ----------
const G = 10, STEP = 1 / 60;
const RUG = { x0: -0.3, x1: 10.3 };
const LAVA_TOP = -0.3;
const BOOK = { x: -14, y: 0.1, hw: 1.7, hh: 0.4 };
const ANCHOR = { x: -13.6, y: 2.35 };            // between the pencil tops
const MAX_PULL = 2.0, V_MAX = 20, MARBLE_R = 0.3;
const VIEW = { x0: -17, x1: 12.5, y0: -2.2, y1: 11.3 };
const PREVIEW_SHARE = 0.35;
const LOST_FADE_MS = 1200;                       // crayon dots show the first 35% of the arc (04-systems)

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const hud = document.getElementById('hud')!;

let world: World;
let pieces: { piece: Piece; id: number; lost: boolean; out: boolean; lostAt: number; gone: boolean }[] = [];
let marbleId = -1, state: 'aim' | 'flight' = 'aim', flightT = 0, shots = 0;
let pull: { x: number; y: number } | null = null, pointerId = -1, dragFrom = { x: 0, y: 0 };
let trail: [number, number][] = [], lastTrail: [number, number][] = [];
let slowUntil = 0, acc = 0;

function build(): void {
  world?.destroy();
  world = new World(-G);
  world.add({ x: 0, y: LAVA_TOP - 0.2, shapes: [{ kind: 'box', hw: 60, hh: 0.2 }], mat: MATERIALS.floor, fixed: true });
  world.add({ x: (RUG.x0 + RUG.x1) / 2, y: -0.15, shapes: [{ kind: 'box', hw: (RUG.x1 - RUG.x0) / 2, hh: 0.15 }], mat: MATERIALS.floor, fixed: true });
  world.add({ x: BOOK.x, y: BOOK.y, shapes: [{ kind: 'box', hw: BOOK.hw, hh: BOOK.hh }], mat: MATERIALS.floor, fixed: true });
  pieces = TEST_FORT.map(piece => ({ piece, id: world.add(bodyOf(piece, 0)), lost: false, out: false, lostAt: 0, gone: false }));
  marbleId = -1; state = 'aim'; shots = 0; lastTrail = []; trail = [];
  // the settle: whatever falls, falls (docs/02-core-design.md)
  for (let i = 0; i < 90; i++) world.step(STEP);
}

// ---------- camera ----------
let k = 30, ox = 0, oy = 0, cssW = 0, cssH = 0;
function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cssW = canvas.clientWidth; cssH = canvas.clientHeight;
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  k = Math.min(cssW / (VIEW.x1 - VIEW.x0), cssH / (VIEW.y1 - VIEW.y0));
  ox = (cssW - (VIEW.x1 - VIEW.x0) * k) / 2 - VIEW.x0 * k;
  oy = cssH - (cssH - (VIEW.y1 - VIEW.y0) * k) / 2 + VIEW.y0 * k;
}
const sx = (x: number) => ox + x * k, sy = (y: number) => oy - y * k;
const wx = (px: number) => (px - ox) / k, wy = (py: number) => (oy - py) / k;

// ---------- input: drag back anywhere on the left half, release to fire ----------
function launchVelocity(p: { x: number; y: number }): { x: number; y: number } {
  return { x: (p.x / MAX_PULL) * V_MAX, y: (p.y / MAX_PULL) * V_MAX };
}
canvas.addEventListener('pointerdown', e => {
  if (state !== 'aim' || pointerId !== -1 || e.clientX > cssW * 0.55) return;
  pointerId = e.pointerId; canvas.setPointerCapture(e.pointerId);
  pull = { x: 0, y: 0 }; dragFrom = { x: wx(e.offsetX), y: wy(e.offsetY) };
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointerId || !pull) return;
  let dx = dragFrom.x - wx(e.offsetX), dy = dragFrom.y - wy(e.offsetY);   // pulling back aims forward
  const len = Math.hypot(dx, dy);
  if (len > MAX_PULL) { dx *= MAX_PULL / len; dy *= MAX_PULL / len; }
  pull = { x: dx, y: dy };
});
const release = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return;
  pointerId = -1;
  if (pull && Math.hypot(pull.x, pull.y) > 0.35) fire(pull);
  pull = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', e => { if (e.pointerId === pointerId) { pointerId = -1; pull = null; } });

function pouch(): { x: number; y: number } { return pull ? { x: ANCHOR.x - pull.x, y: ANCHOR.y - pull.y } : { ...ANCHOR }; }
function fire(p: { x: number; y: number }): void {
  const v = launchVelocity(p), at = pouch();
  marbleId = world.add({ x: at.x, y: at.y, shapes: [{ kind: 'circle', r: MARBLE_R }], mat: MATERIALS.marble, bullet: true, vx: v.x, vy: v.y });
  state = 'flight'; flightT = 0; trail = [];
}

document.getElementById('reset')!.addEventListener('click', build);

// ---------- rules ----------
function judge(now: number): void {
  for (const p of pieces) {
    if (p.gone) continue;
    const t = world.transform(p.id);
    if (p.piece.type === 'plush') {
      if (!p.out && t.y < 0.62) { p.out = true; slowUntil = now + 900; }   // a plushie on the rug or the floor is out
    } else if (!p.lost && t.y < 1.5 && (t.x < RUG.x0 || t.x > RUG.x1)) { p.lost = true; p.lostAt = now; }   // knocked off the rug
    if (p.lost && now - p.lostAt > LOST_FADE_MS) { world.remove(p.id); p.gone = true; }   // lost pieces dissolve (crayon smoke later)
  }
  if (state !== 'flight') return;
  const m = world.transform(marbleId);
  if (flightT < 3 && trail.length < 400) trail.push([m.x, m.y]);
  const resting = flightT > 1 && !world.awake(marbleId) && pieces.every(p => p.gone || !world.awake(p.id));
  if (resting || flightT > 8 || m.x > 40 || m.x < -40) {
    world.remove(marbleId); marbleId = -1; state = 'aim'; shots++; lastTrail = trail;
  }
}

// ---------- drawing ----------
let boil = 0;
function draw(): void {
  ctx.fillStyle = P.wall; ctx.fillRect(0, 0, cssW, cssH);
  ctx.fillStyle = P.wall2; ctx.fillRect(0, sy(1.4), cssW, sy(0.9) - sy(1.4));
  ctx.fillStyle = P.floor; ctx.fillRect(0, sy(0.9), cssW, cssH);
  // lava: a flat grey-box band with a moving wavy top (the crayon version is in dev/style-frame)
  ctx.beginPath(); ctx.moveTo(0, cssH);
  for (let px = 0; px <= cssW + 12; px += 12) ctx.lineTo(px, sy(LAVA_TOP) + Math.sin(px * 0.04 + boil) * 2.5);
  ctx.lineTo(cssW, cssH); ctx.closePath(); ctx.fillStyle = P.lava; ctx.fill();
  ctx.strokeStyle = P.lavaRed; ctx.lineWidth = 3; ctx.stroke();
  // rug
  const rx = sx(RUG.x0), rw = (RUG.x1 - RUG.x0) * k, ry = sy(0), rh = 0.3 * k;
  ctx.fillStyle = P.rug; ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = P.rug2; for (let i = rx + 4; i < rx + rw - 4; i += k * 0.5) ctx.fillRect(i, ry, k * 0.22, rh);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(rx, ry, rw, rh);
  // launcher book and back pencil + back band
  const bk = rrPath(sx(BOOK.x - BOOK.hw), sy(BOOK.y + BOOK.hh), BOOK.hw * 2 * k, BOOK.hh * 2 * k, 3);
  ctx.fillStyle = P.bookOx; ctx.fill(bk); ctx.fillStyle = P.cream; ctx.fillRect(sx(BOOK.x - BOOK.hw + 0.3), sy(BOOK.y + BOOK.hh - 0.12), (BOOK.hw * 2 - 0.4) * k, (BOOK.hh * 2 - 0.24) * k);
  ctx.lineWidth = 2.2; ctx.strokeStyle = P.ink; ctx.stroke(bk);
  const backTop = { x: ANCHOR.x - 0.38, y: ANCHOR.y }, frontTop = { x: ANCHOR.x + 0.38, y: ANCHOR.y };
  pencil(backTop.x, true);
  const pp = pouch();
  if (state === 'aim') band(backTop, pp);
  // pieces and plushies
  for (const p of pieces) {
    if (p.gone) continue;
    const t = world.transform(p.id);
    ctx.save(); ctx.translate(sx(t.x), sy(t.y)); ctx.rotate(-t.angle);
    if (p.lost) ctx.globalAlpha = Math.max(0, 1 - (clock - p.lostAt) / LOST_FADE_MS);
    if (p.piece.type === 'plush') drawPlush(ctx, p.piece.plush!, p.piece.w * k, p.piece.h * k, p.out);
    else drawPiece(ctx, p.piece, k);
    ctx.restore();
  }
  if (marbleId >= 0) { const m = world.transform(marbleId); ctx.save(); ctx.translate(sx(m.x), sy(m.y)); ctx.rotate(-m.angle); drawMarble(ctx, MARBLE_R * k); ctx.restore(); }
  // the loaded marble, front pencil, front band
  if (state === 'aim') { ctx.save(); ctx.translate(sx(pp.x), sy(pp.y)); drawMarble(ctx, MARBLE_R * k); ctx.restore(); }
  pencil(frontTop.x, false);
  if (state === 'aim') band(frontTop, pp); else band(frontTop, backTop);
  // last shot's trail (faint) and the aim preview
  dots(lastTrail, 2, 'rgba(74,70,80,0.35)');
  if (pull && Math.hypot(pull.x, pull.y) > 0.35) dots(previewArc(pp, launchVelocity(pull)), 3, P.graphite);
  // status
  const out = pieces.filter(p => p.out).length, total = pieces.reduce((s, p) => s + valueOf(p.piece.type), 0);
  const lost = pieces.filter(p => p.lost).reduce((s, p) => s + valueOf(p.piece.type), 0);
  hud.textContent = `Plushies out ${out}/3 · Knocked off ${Math.round((100 * lost) / total)}% · Shots ${shots}`;
}
function pencil(x: number, dim: boolean): void {
  const pw = 0.32 * k, top = sy(ANCHOR.y + 0.35), bottom = sy(BOOK.y + BOOK.hh), px = sx(x) - pw / 2;
  const body = rrPath(px, top + 0.5 * k, pw, bottom - top - 0.5 * k, 1.5);
  ctx.fillStyle = dim ? '#C99A05' : P.toyYellow; ctx.fill(body); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke(body);
  ctx.beginPath(); ctx.moveTo(px, top + 0.5 * k); ctx.lineTo(px + pw / 2, top); ctx.lineTo(px + pw, top + 0.5 * k); ctx.closePath();
  ctx.fillStyle = P.wood; ctx.fill(); ctx.stroke();
}
function band(a: { x: number; y: number }, b: { x: number; y: number }): void {
  ctx.lineCap = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 0.18 * k + 2.5;
  ctx.beginPath(); ctx.moveTo(sx(a.x), sy(a.y)); ctx.lineTo(sx(b.x), sy(b.y)); ctx.stroke();
  ctx.strokeStyle = P.toyRed; ctx.lineWidth = 0.18 * k; ctx.stroke();
}
function previewArc(p0: { x: number; y: number }, v: { x: number; y: number }): [number, number][] {
  const pts: [number, number][] = [];
  let len = 0, prev = p0;
  const all: [number, number, number][] = [];
  for (let t = 0; t < 4; t += 0.01) {
    const p = { x: p0.x + v.x * t, y: p0.y + v.y * t - 0.5 * G * t * t };
    len += Math.hypot(p.x - prev.x, p.y - prev.y); prev = p; all.push([p.x, p.y, len]);
    if (p.y < 0 || p.x > VIEW.x1) break;
  }
  const show = len * PREVIEW_SHARE;
  let next = 0.6;
  for (const [x, y, l] of all) { if (l > show) break; if (l >= next) { pts.push([x, y]); next += 0.55; } }
  return pts;
}
function dots(pts: [number, number][], r: number, col: string): void {
  ctx.fillStyle = col;
  pts.forEach(([x, y], i) => { if (i % 3) return; ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2); ctx.fill(); });
}

// ---------- loop ----------
let last = performance.now(), clock = 0;   // clock: game time in ms, so tests can advance it without a visible tab
function tick(dt: number): void {
  clock += dt * 1000;
  if (clock < slowUntil) { world.step(dt * 0.3); if (state === 'flight') flightT += dt * 0.3; }   // slow motion when a plushie goes in
  else {
    acc += dt;
    while (acc >= STEP) { world.step(STEP); acc -= STEP; if (state === 'flight') flightT += STEP; }
  }
  judge(clock);
  boil += dt * 3;
}
function frame(now: number): void {
  tick(Math.min(0.05, (now - last) / 1000)); last = now;
  draw();
  requestAnimationFrame(frame);
}

// Dev hook for automated checks: __fk.fire(pullX, pullY) with a pull in cells (max 2), __fk.run(seconds).
if (import.meta.env.DEV) Object.assign(window, { __fk: {
  fire: (x: number, y: number) => { if (state === 'aim') fire({ x, y }); },
  run: (sec: number) => { for (let i = 0; i < sec * 60; i++) tick(1 / 60); draw(); return hud.textContent; },
  reset: () => { build(); draw(); },
} });

(async () => {
  await initPhysics();
  resize(); build();
  new ResizeObserver(resize).observe(canvas);
  requestAnimationFrame(frame);
})();
