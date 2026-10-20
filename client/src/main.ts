// Prototype M2: one complete match of The Siege, end to end. Both players build from the same draw, both forts settle,
// then three volleys of two shots each, with the lava rising after every volley. Most plushies standing wins.
// Pass and play on one phone, or against a bot. (docs/02-core-design.md §4, docs/06-prototype.md)
import { initPhysics } from './physics';
import { BOT_FORTS, BUDGET, makeDraw, type Draw, type Piece } from './fort';
import { Builder } from './build';
import { Cam, Range, aimAt, MAX_PULL, type Pull } from './range';

const VOLLEYS = 3, SHOTS = 2, VIEW = { x0: -17, x1: 12.5, y0: -2.2, y1: 11.3 }, BAR = 44;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const barLeft = document.getElementById('bar-left')!, barRight = document.getElementById('bar-right')!;
const overlay = document.getElementById('overlay')!;

type Team = 'blue' | 'green';
interface Side { team: Team; name: string; bot: boolean; fort: Piece[]; range: Range | null }
interface Match {
  mode: 'pass' | 'bot'; draw: Draw; sides: [Side, Side];
  volley: number; shooter: 0 | 1; shotsLeft: number; lava: number; lavaShown: number; started: number; busy: boolean;
}
let screen: 'menu' | 'build' | 'siege' | 'result' = 'menu';
let match: Match | null = null, builder: Builder | null = null, buildDone: (() => void) | null = null;
let clock = 0, boil = 0, cssW = 0, cssH = 0, sawHowTo = false;
const cam = new Cam(), tally: Record<Team, number> = { blue: 0, green: 0 };
let pull: Pull | null = null, pointerId = -1, dragFrom = { x: 0, y: 0 }, botPull: Pull | null = null;
const timers: { at: number; fn: () => void }[] = [];
const later = (ms: number, fn: () => void) => { timers.push({ at: clock + ms, fn }); };
const rng = Math.random;

// ---------- screens ----------
function menu(): void {
  screen = 'menu'; match = null; builder = null; timers.length = 0;
  bar('', []);
  show(`<h1>Fort Knocks</h1><p>Prototype · one match of The Siege</p>
    <div class="row"><button id="m-pass">Pass and play</button><button id="m-bot">Play against a bot</button></div>
    <p class="small">Build a fort from the toy box and put your three plushies on top. Then knock the other fort down: a plushie that touches the rug or the lava is out. Three volleys of two marbles each, and the lava rises after every volley. Most plushies standing wins.</p>`);
  on('m-pass', () => newMatch('pass')); on('m-bot', () => newMatch('bot'));
}
function newMatch(mode: Match['mode']): void {
  timers.length = 0;
  const blue: Side = { team: 'blue', name: mode === 'bot' ? 'You' : 'Blue', bot: false, fort: [], range: null };
  const green: Side = { team: 'green', name: mode === 'bot' ? 'Bot' : 'Green', bot: mode === 'bot', fort: [], range: null };
  match = { mode, draw: makeDraw(rng), sides: [blue, green], volley: 1, shooter: 0, shotsLeft: SHOTS, lava: 0, lavaShown: 0, started: clock, busy: false };
  if (mode === 'pass') passThen('Blue builds first', 'Green, look away while Blue builds.', () => build(0));
  else build(0);
}
function build(i: 0 | 1): void {
  const m = match!, side = m.sides[i];
  screen = 'build'; hide();
  builder = new Builder(side.team, m.draw, clock);
  layout();
  buildDone = () => {
    side.fort = builder!.pieces.map(p => ({ ...p })); builder = null; buildDone = null;
    if (i === 0 && m.mode === 'pass') passThen('Green builds', 'Blue, look away while Green builds. Same toy box, same budget.', () => build(1));
    else if (i === 0) { m.sides[1].fort = BOT_FORTS[Math.floor(rng() * BOT_FORTS.length)].map(p => ({ ...p })); startSiege(); }
    else startSiege();
  };
  buildBar();
  if (!sawHowTo) {
    sawHowTo = true;
    show(`<h1>How to build</h1>
      <ul class="how">
        <li>Drag a piece from the toy box onto the rug, or <b>tap</b> it to take it out, then drag it into place.</li>
        <li><b>Tap</b> a piece on the rug to turn it. To put it back, <b>drag it into the box</b>: you get its points back.</li>
        <li>Your three plushies stand <b>above the dashed line</b>, with clear sky above them (the dotted V).</li>
        <li>Put anything anywhere. If a piece breaks a rule it turns red and says why; fix those before you're ready.</li>
        <li><b>Test</b> switches the physics on. Whatever falls, falls.</li>
        <li>The lava rises after volleys 1 and 2, so plushies standing low drown.</li>
      </ul>
      <div class="row"><button id="h-ok">Got it</button></div>`);
    on('h-ok', hide);
  }
}
function buildBar(): void {
  const b = builder; if (!b || !match) return;
  const side = match.sides.find(s => s.team === b.team)!, secs = Math.floor((clock - b.started) / 1000);
  const left = `${side.name} ${side.name === 'You' ? 'build' : 'builds'} · budget ${b.budgetLeft} of ${BUDGET} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const blocker = b.blocker, testable = b.testable;
  const key = `${left}|${!!b.testing}|${blocker}|${testable}`;
  if (barRight.dataset.key === key) return;   // rebuild the bar only when something changed
  barRight.dataset.key = key;
  bar(left, b.testing
    ? [['Back to building', () => { b.stopTest(); buildBar(); }]]
    : [['Test', () => { if (b.testable) { b.startTest(); buildBar(); } }, !testable], [blocker ?? 'Ready', () => { if (!b.blocker) buildDone?.(); }, !!blocker]]);
}
function startSiege(): void {
  const m = match!;
  for (const s of m.sides) { s.range = new Range(s.fort, s.team); s.range.settle(3, clock); }   // both forts settle at once
  screen = 'siege'; hide(); layout();
  if (m.mode === 'pass') passThen('Blue shoots', `Volley 1 of ${VOLLEYS}. Hand the phone to Blue.`, beginTurn);
  else beginTurn();
}
const target = (): Range => match!.sides[1 - match!.shooter].range!;
function beginTurn(): void {
  const m = match!, shooter = m.sides[m.shooter], range = target();
  m.shotsLeft = SHOTS; m.busy = false;
  range.onShotDone = () => {
    m.shotsLeft--; status();
    if (m.shotsLeft > 0) { if (shooter.bot) later(700, botShot); return; }
    // the turn ends once the dust has settled (at most 3 s), so everyone sees what the volley did
    const t0 = clock, wait = () => (range.quiet() || clock - t0 > 3000 ? later(500, endTurn) : later(100, wait));
    wait();
  };
  status();
  if (shooter.bot) later(1200, botShot);
}
function endTurn(): void {
  const m = match!;
  if (m.shooter === 0) {
    m.shooter = 1;
    if (m.mode === 'pass') passThen('Green shoots', `Volley ${m.volley} of ${VOLLEYS}. Hand the phone to Green.`, beginTurn);
    else beginTurn();
    return;
  }
  // end of the volley: between volleys the lava rises one cell (to 1, then 2), then the score is checked
  m.busy = true;
  const rises = m.volley < VOLLEYS;
  if (rises) { m.lava += 1; status('The lava rises'); }
  later(rises ? 1800 : 600, () => {
    const wiped = m.sides.some(s => s.range!.standing() === 0);
    if (wiped || m.volley >= VOLLEYS) return result();
    m.volley++; m.shooter = 0;
    if (m.mode === 'pass') passThen('Blue shoots', `Volley ${m.volley} of ${VOLLEYS}. Hand the phone to Blue.`, beginTurn);
    else beginTurn();
  });
}
function botShot(): void {
  const m = match!, range = target(), aims = range.plushTargets();
  if (screen !== 'siege' || range.state !== 'aim' || m.shotsLeft <= 0) return;
  const t = aims.length ? aims[Math.floor(rng() * aims.length)] : { x: 5, y: 3 };
  let p: Pull | null = null;
  for (let tries = 0; tries < 8 && !p; tries++) p = aimAt(t.x + (rng() - 0.5) * 0.6, t.y + (rng() - 0.3) * 0.6, 32 + rng() * 26);
  p ??= { x: 1.4, y: 1.0 };
  // a decent but human bot: up to 7% of power and 3.5° of angle off (it wiped a fort in four shots at 4% and 1.7°)
  const ang = Math.atan2(p.y, p.x) + (rng() - 0.5) * 0.12, mag = Math.min(MAX_PULL, Math.hypot(p.x, p.y) * (1 + (rng() - 0.5) * 0.14));
  const final = { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag }, t0 = clock;
  const pullStep = () => {   // the bot pulls back visibly before letting go
    const f = Math.min(1, (clock - t0) / 700);
    botPull = { x: final.x * f, y: final.y * f };
    if (f < 1) later(16, pullStep); else later(250, () => { botPull = null; range.fire(final); });
  };
  pullStep();
}
function result(): void {
  const m = match!, [a, b] = m.sides, sa = a.range!.standing(), sb = b.range!.standing();
  const dealtA = b.range!.destruction(), dealtB = a.range!.destruction();   // what each side knocked off the other's fort
  const winner = sa !== sb ? (sa > sb ? a : b) : dealtA !== dealtB ? (dealtA > dealtB ? a : b) : null;
  if (winner) tally[winner.team]++;
  const mins = (clock - m.started) / 60000;
  screen = 'result'; bar('', []);
  show(`<h1>${winner ? (m.mode === 'bot' && winner.team === 'blue' ? 'You win' : `${winner.name} wins`) : 'Draw'}</h1>
    <p>Plushies standing: ${a.name} ${sa} · ${b.name} ${sb}${sa === sb ? ' (tie, decided by destruction)' : ''}</p>
    <p>Knocked off: ${Math.round(dealtA * 100)}% of ${m.mode === 'bot' ? "the bot's" : `${b.name}'s`} fort · ${Math.round(dealtB * 100)}% of ${m.mode === 'bot' ? 'yours' : `${a.name}'s`}</p>
    <p class="small">Match time ${mins.toFixed(1)} min · tonight: Blue ${tally.blue}, Green ${tally.green}</p>
    <div class="row"><button id="r-again">Rematch</button><button id="r-menu" class="quiet">Menu</button></div>`);
  on('r-again', () => newMatch(m.mode)); on('r-menu', menu);
}
function status(extra?: string): void {
  const m = match!, s = m.sides[m.shooter], [a, b] = m.sides;
  const you = m.mode === 'bot', who = s.bot ? `The bot is shooting at your fort` : `${you ? 'Your turn' : `${s.name} shoots`} · shot ${SHOTS - m.shotsLeft + 1} of ${SHOTS}`;
  bar(`Volley ${m.volley}/${VOLLEYS} · ${extra ?? (m.shotsLeft > 0 ? who : '…')} · plushies ${a.name} ${a.range!.standing()} – ${b.name} ${b.range!.standing()}`, [['Menu', menu]]);
}
function passThen(title: string, text: string, next: () => void): void {
  show(`<h1>${title}</h1><p>${text}</p><div class="row"><button id="p-go">Ready</button></div>`);
  on('p-go', () => { hide(); next(); });
}

// ---------- DOM helpers ----------
function bar(left: string, buttons: [string, () => void, boolean?][]): void {
  barLeft.textContent = left; barRight.replaceChildren();
  for (const [label, fn, waiting] of buttons) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = fn;
    if (waiting) b.classList.add('waiting');   // still tappable, but reads as "not yet"
    barRight.append(b);
  }
}
function show(html: string): void { overlay.innerHTML = `<div class="card">${html}</div>`; overlay.hidden = false; }
function hide(): void { overlay.hidden = true; }
function on(id: string, fn: () => void): void { document.getElementById(id)!.onclick = fn; }

// ---------- input ----------
canvas.addEventListener('pointerdown', e => {
  if (pointerId !== -1) return;
  if (screen === 'build' && builder) { pointerId = e.pointerId; canvas.setPointerCapture(e.pointerId); builder.down(e.offsetX, e.offsetY); return; }
  if (screen !== 'siege' || !match || match.busy || match.sides[match.shooter].bot || match.shotsLeft <= 0 || target().state !== 'aim') return;
  if (e.offsetX > cssW * 0.55) return;
  pointerId = e.pointerId; canvas.setPointerCapture(e.pointerId);
  pull = { x: 0, y: 0 }; dragFrom = { x: cam.wx(e.offsetX), y: cam.wy(e.offsetY) };
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointerId) return;
  if (screen === 'build' && builder) { builder.move(e.offsetX, e.offsetY); return; }
  if (!pull) return;
  let dx = dragFrom.x - cam.wx(e.offsetX), dy = dragFrom.y - cam.wy(e.offsetY);   // pulling back aims forward
  const len = Math.hypot(dx, dy);
  if (len > MAX_PULL) { dx *= MAX_PULL / len; dy *= MAX_PULL / len; }
  pull = { x: dx, y: dy };
});
const release = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return;
  pointerId = -1;
  if (screen === 'build' && builder) { builder.up(e.offsetX, e.offsetY); buildBar(); return; }
  if (pull && screen === 'siege') target().fire(pull);
  pull = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

// ---------- loop ----------
function layout(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cssW = canvas.clientWidth; cssH = canvas.clientHeight;
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cam.fit(VIEW, { x: 0, y: BAR, w: cssW, h: cssH - BAR });
  builder?.layout(cssW, cssH, BAR);
}
function tick(dt: number): void {
  clock += dt * 1000; boil += dt * 3;
  for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= clock) { const t = timers.splice(i, 1)[0]; t.fn(); }
  if (screen === 'build') { builder?.tick(dt); buildBar(); }
  if (screen === 'siege' && match) {
    match.lavaShown += Math.sign(match.lava - match.lavaShown) * Math.min(Math.abs(match.lava - match.lavaShown), dt * 0.8);
    for (const s of match.sides) s.range!.tick(dt, clock, match.lavaShown);
  }
}
function draw(): void {
  if (screen === 'build' && builder) builder.draw(ctx, boil);
  else if ((screen === 'siege' || screen === 'result') && match) target().draw(ctx, cam, { pull: pull ?? botPull, lava: match.lavaShown, boil, clock, launcher: true, w: cssW, h: cssH });
  else { ctx.fillStyle = '#F4E9D8'; ctx.fillRect(0, 0, cssW, cssH); }
}
let last = performance.now();
function frame(now: number): void {
  tick(Math.min(0.05, (now - last) / 1000)); last = now;
  draw();
  requestAnimationFrame(frame);
}

// Dev hook for automated checks without a visible tab.
if (import.meta.env.DEV) Object.assign(window, { __fk: {
  start: (mode: Match['mode']) => { sawHowTo = true; newMatch(mode); document.getElementById('p-go')?.click(); },
  load: (i: number) => { builder?.load(BOT_FORTS[i]); buildBar(); },
  ready: () => { if (builder && !builder.blocker) buildDone?.(); },
  go: () => document.getElementById('p-go')?.click(),
  fire: (x: number, y: number) => { if (screen === 'siege') target().fire({ x, y }); },
  run: (sec: number) => { for (let i = 0; i < sec * 60; i++) tick(1 / 60); draw(); return `${screen} · ${barLeft.textContent}`; },
  state: () => ({ screen, volley: match?.volley, shooter: match?.shooter, shotsLeft: match?.shotsLeft, overlay: overlay.hidden ? '' : overlay.textContent?.trim().slice(0, 200) }),
} });

(async () => {
  await initPhysics();
  layout();
  new ResizeObserver(layout).observe(canvas);
  menu();
  requestAnimationFrame(frame);
})();
