// Prototype M2: one complete match of The Siege, end to end. Both players build from the same draw, both forts settle,
// then three volleys of two shots each, with the lava rising after every volley. Most plushies standing wins.
// Pass and play on one phone, or against a bot. (docs/02-core-design.md §4, docs/06-prototype.md)
// Every match is logged with a game number (record.ts), and any logged game can be watched again (?watch=<number>).
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/gochi-hand/latin-400.css';
import { initPhysics } from './physics';
import wasmUrl from '../../node_modules/box2d3-wasm/build/dist/es/compat/Box2D.compat.wasm?url';
import { BOT_FORTS, BUDGET, makeDraw, type Draw, type Piece } from './fort';
import { Builder } from './build';
import { BOOK, Cam, Range, aimAt, MAX_PULL, type Pull } from './range';
import { HAND } from './draw';
import { AMMO, drawAmmo, makeSchedule, type Ammo } from './ammo';
import { Recorder, deviceInfo, type GameLog, type ShotLog, type Team } from './record';

const VOLLEYS = 3, SHOTS = 2, VIEW = { x0: -17, x1: 12.5, y0: -2.2, y1: 11.3 }, BAR = 44;
// Finger travel for a full pull, in css px. It used to be 2 cells of screen, about 50 px on a phone, where a few
// pixels of lift-off wobble moved the shot by several percent (playtest 2: "the preview isn't accurate any more").
const PULL_PX = 110;
// A shot fires the pull the player last saw: the one from SEEN_MS before the finger lifted, not the lift-off wobble.
const SEEN_MS = 50;
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const barLeft = document.getElementById('bar-left')!, barRight = document.getElementById('bar-right')!;
const overlay = document.getElementById('overlay')!;

interface Side { team: Team; name: string; bot: boolean; fort: Piece[]; range: Range | null }
interface Match {
  mode: 'pass' | 'bot'; draw: Draw; sides: [Side, Side];
  volley: number; shooter: 0 | 1; shotsLeft: number; lava: number; lavaShown: number; started: number; busy: boolean;
  rec: Recorder;
  /** The ammo schedule: two per volley, the same for both players, known while building. */
  schedule: Ammo[][];
  /** This turn's ammo still to fire, and the one in the band. The shooter picks the order (04-systems §5). */
  hand: Ammo[]; loaded: Ammo;
  /** The bot's plan for the shot in flight: where it aimed, so it knows when to tap. */
  botPlan: { x: number; y: number } | null;
}
let screen: 'menu' | 'build' | 'siege' | 'result' | 'watch' = 'menu';
let match: Match | null = null, builder: Builder | null = null, buildDone: (() => void) | null = null;
let clock = 0, boil = 0, cssW = 0, cssH = 0, sawHowTo = false;
const cam = new Cam(), tally: Record<Team, number> = { blue: 0, green: 0 };
let pull: Pull | null = null, pointerId = -1, botPull: Pull | null = null;
let aim = { x: 0, y: 0, t: 0, seen: [] as { t: number; p: Pull }[] };   // the drag in progress: where and when it started, recent pulls
const timers: { at: number; fn: () => void }[] = [];
const later = (ms: number, fn: () => void) => { timers.push({ at: clock + ms, fn }); };
const rng = Math.random;

// ---------- screens ----------
function menu(): void {
  quitMatch();
  screen = 'menu'; match = null; builder = null; watching = null; timers.length = 0;
  if (location.search) history.replaceState(null, '', '/');
  bar('', []);
  show(`<h1>Fort Knocks</h1><p>Prototype · one match of The Siege</p>
    <div class="row"><button id="m-pass">Pass and play</button><button id="m-bot">Play against a bot</button></div>
    <p class="small">Build a fort from the toy box and put your three plushies on top. Then knock the other fort down: a plushie that touches the rug or the lava is out. Three volleys of two marbles each, and the lava rises after every volley. Most plushies standing wins.</p>
    <p class="small"><a href="/games">Past games</a>: every match is saved with its game number.</p>`);
  on('m-pass', () => newMatch('pass')); on('m-bot', () => newMatch('bot'));
}
function newMatch(mode: Match['mode']): void {
  quitMatch();
  timers.length = 0;
  const blue: Side = { team: 'blue', name: mode === 'bot' ? 'You' : 'Blue', bot: false, fort: [], range: null };
  const green: Side = { team: 'green', name: mode === 'bot' ? 'Bot' : 'Green', bot: mode === 'bot', fort: [], range: null };
  const draw = makeDraw(rng), schedule = makeSchedule(rng);
  const log: GameLog = {
    v: 1, app: __APP__, mode, started: new Date().toISOString(), device: deviceInfo(), status: 'building', draw, schedule,
    sides: [{ team: 'blue', name: blue.name, bot: false, fort: null }, { team: 'green', name: green.name, bot: green.bot, fort: null }],
    shots: [], volleys: [], winner: null, summary: `${blue.name} building`,
  };
  match = { mode, draw, sides: [blue, green], volley: 1, shooter: 0, shotsLeft: SHOTS, lava: 0, lavaShown: 0, started: clock, busy: false, rec: new Recorder(log),
    schedule, hand: [], loaded: 'marble', botPlan: null };
  match.rec.onId = () => { if (screen === 'siege') status(); };   // the build bar picks the number up by itself
  if (mode === 'pass') passThen('Blue builds first', 'Green, look away while Blue builds.', () => build(0));
  else build(0);
}
/** Leaving a match before its result still logs it, as quit. */
function quitMatch(): void {
  if (!match || match.rec.log.status === 'done' || match.rec.log.status === 'quit') return;
  const log = match.rec.log;
  save();   // the summary first, then mark it
  log.status = 'quit'; log.summary = `Quit: ${log.summary}`;
  void match.rec.save();
}
function build(i: 0 | 1): void {
  const m = match!, side = m.sides[i];
  screen = 'build'; hide();
  builder = new Builder(side.team, m.draw, clock);
  builder.schedule = m.schedule;
  layout();
  buildDone = () => {
    const b = builder!, sl = m.rec.log.sides[i];
    side.fort = b.pieces.map(p => ({ ...p })); builder = null; buildDone = null;
    Object.assign(sl, { fort: side.fort, buildMs: Math.round(clock - b.started), tests: b.tests });
    if (i === 0 && m.mode === 'pass') {
      m.rec.log.summary = 'Green building'; save();
      passThen('Green builds', 'Blue, look away while Green builds. Same toy box, same budget.', () => build(1));
    } else if (i === 0) {
      const k = Math.floor(rng() * BOT_FORTS.length);
      m.sides[1].fort = BOT_FORTS[k].map(p => ({ ...p }));
      Object.assign(m.rec.log.sides[1], { fort: m.sides[1].fort, botFort: k });
      startSiege();
    } else startSiege();
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
  const left = `${tag()}${side.name} ${side.name === 'You' ? 'build' : 'builds'} · budget ${b.budgetLeft} of ${BUDGET} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
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
  for (const s of m.sides) { s.range = new Range(s.fort, s.team); s.range.settle(3); }   // both forts settle at once
  m.rec.log.status = 'siege'; save();
  screen = 'siege'; hide(); layout();
  if (m.mode === 'pass') passThen('Blue shoots', `Volley 1 of ${VOLLEYS}: ${ammoPair(m, 1)}. Hand the phone to Blue.`, beginTurn);
  else beginTurn();
}
const target = (): Range => match!.sides[1 - match!.shooter].range!;
/** Fire at the current target and log the shot. */
function shoot(p: Pull, how?: Pick<ShotLog, 'raw' | 'aimMs'>): void {
  const m = match!, range = target();
  if (!range.fire(p, m.loaded)) return;
  m.hand.splice(m.hand.indexOf(m.loaded), 1);
  const shot: ShotLog = Object.assign(range.shots[range.shots.length - 1], { volley: m.volley, by: m.sides[m.shooter].team, n: SHOTS - m.shotsLeft + 1 }, how);
  m.rec.log.shots.push(shot);
}
function beginTurn(): void {
  const m = match!, shooter = m.sides[m.shooter], range = target();
  m.shotsLeft = SHOTS; m.busy = false; m.hand = [...m.schedule[m.volley - 1]]; m.loaded = m.hand[0];
  range.onShotDone = () => {
    m.shotsLeft--; m.botPlan = null;
    if (m.hand.length) m.loaded = m.hand[0];
    status();
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
  save();
  if (m.shooter === 0) {
    m.shooter = 1;
    if (m.mode === 'pass') passThen('Green shoots', `Volley ${m.volley} of ${VOLLEYS}: ${ammoPair(m, m.volley)}. Hand the phone to Green.`, beginTurn);
    else beginTurn();
    return;
  }
  // end of the volley: between volleys the lava rises one cell (to 1, then 2), then the score is checked
  m.busy = true;
  const rises = m.volley < VOLLEYS;
  if (rises) { m.lava += 1; status('The lava rises'); }
  later(rises ? 1800 : 600, () => {
    m.rec.log.volleys.push({ volley: m.volley, standing: standing() });
    const wiped = m.sides.some(s => s.range!.standing() === 0);
    if (wiped || m.volley >= VOLLEYS) return result();
    m.volley++; m.shooter = 0;
    save();
    if (m.mode === 'pass') passThen('Blue shoots', `Volley ${m.volley} of ${VOLLEYS}: ${ammoPair(m, m.volley)}. Hand the phone to Blue.`, beginTurn);
    else beginTurn();
  });
}
function botShot(): void {
  const m = match!, range = target(), aims = range.plushTargets();
  if (screen !== 'siege' || range.state !== 'aim' || m.shotsLeft <= 0) return;
  m.loaded = m.hand[Math.floor(rng() * m.hand.length)];
  const t = aims.length ? aims[Math.floor(rng() * aims.length)] : { x: 5, y: 3 };
  // the top is lobbed high so it arrives above its target and drills down; the rest come in at a middle angle
  const [lo, span] = m.loaded === 'top' ? [56, 14] : [32, 26];
  const aimY = m.loaded === 'top' ? t.y + 1.6 : t.y;
  let p: Pull | null = null;
  for (let tries = 0; tries < 8 && !p; tries++) p = aimAt(t.x + (rng() - 0.5) * 0.6, aimY + (rng() - 0.3) * 0.6, lo + rng() * span);
  p ??= { x: 1.4, y: 1.0 };
  // a decent but human bot: up to 7% of power and 3.5° of angle off (it wiped a fort in four shots at 4% and 1.7°)
  const ang = Math.atan2(p.y, p.x) + (rng() - 0.5) * 0.12, mag = Math.min(MAX_PULL, Math.hypot(p.x, p.y) * (1 + (rng() - 0.5) * 0.14));
  const final = { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag }, t0 = clock;
  const pullStep = () => {   // the bot pulls back visibly before letting go
    const f = Math.min(1, (clock - t0) / 700);
    botPull = { x: final.x * f, y: final.y * f };
    if (f < 1) later(16, pullStep); else later(250, () => { botPull = null; m.botPlan = { x: t.x, y: t.y }; shoot(final); });
  };
  pullStep();
}
/** The bot's tap: jacks scatter just before the fort, the top drills when it's over its target, the balloon bursts close to it. */
function botTap(): void {
  const m = match!, range = target(), plan = m.botPlan, a = range.ammoAt(), f = range.flight;
  if (!plan || !a || !f || f.tapped || !AMMO[f.ammo].tap) return;
  const go = f.ammo === 'jacks' ? a.x > plan.x - 4.5
    : f.ammo === 'top' ? Math.abs(a.x - plan.x) < 0.35 && a.y > plan.y + 0.5
    : Math.hypot(a.x - plan.x, a.y - plan.y) < 1.4;
  if (go) range.ability();
}
const standing = (): Record<Team, number> => ({ blue: match!.sides[0].range!.standing(), green: match!.sides[1].range!.standing() });
function result(): void {
  const m = match!, [a, b] = m.sides, sa = a.range!.standing(), sb = b.range!.standing();
  const dealtA = b.range!.destruction(), dealtB = a.range!.destruction();   // what each side knocked off the other's fort
  const winner = sa !== sb ? (sa > sb ? a : b) : dealtA !== dealtB ? (dealtA > dealtB ? a : b) : null;
  if (winner) tally[winner.team]++;
  const ms = clock - m.started, log = m.rec.log;
  log.result = { standing: { blue: sa, green: sb }, destroyed: { blue: dealtB, green: dealtA }, winner: winner?.team ?? 'draw', ms: Math.round(ms) };
  log.status = 'done'; log.winner = winner?.team ?? 'draw';
  log.summary = `${a.name} ${sa} – ${b.name} ${sb} · ${winner ? `${winner.name} ${winner.name === 'You' ? 'win' : 'wins'}${sa === sb ? ' on destruction' : ''}` : 'draw'}`;
  save();
  screen = 'result'; bar('', []);
  show(`<h1>${winner ? (m.mode === 'bot' && winner.team === 'blue' ? 'You win' : `${winner.name} wins`) : 'Draw'}</h1>
    <p>Plushies standing: ${a.name} ${sa} · ${b.name} ${sb}${sa === sb ? ' (tie, decided by destruction)' : ''}</p>
    <p>Knocked off: ${Math.round(dealtA * 100)}% of ${m.mode === 'bot' ? "the bot's" : `${b.name}'s`} fort · ${Math.round(dealtB * 100)}% of ${m.mode === 'bot' ? 'yours' : `${a.name}'s`}</p>
    <p class="small">${m.rec.id ? `Game ${m.rec.id} · ` : ''}Match time ${(ms / 60000).toFixed(1)} min · tonight: Blue ${tally.blue}, Green ${tally.green}</p>
    <div class="row"><button id="r-again">Rematch</button><button id="r-watch" class="quiet">Watch replay</button><button id="r-menu" class="quiet">Menu</button></div>`);
  on('r-again', () => newMatch(m.mode)); on('r-menu', menu);
  on('r-watch', () => watch(log, m.rec.id));
}
function status(extra?: string): void {
  const m = match!, s = m.sides[m.shooter], [a, b] = m.sides;
  const tap = AMMO[m.loaded].tap, ammo = `${AMMO[m.loaded].name}${tap ? ` (tap in flight: ${tap})` : ''}`;
  const you = m.mode === 'bot', who = s.bot ? `The bot is shooting at your fort` : `${you ? 'Your turn' : `${s.name} shoots`} · ${ammo}`;
  bar(`${tag()}Volley ${m.volley}/${VOLLEYS} · ${extra ?? (m.shotsLeft > 0 ? who : '…')} · plushies ${a.name} ${a.range!.standing()} – ${b.name} ${b.range!.standing()}`, [['Menu', menu]]);
}
function passThen(title: string, text: string, next: () => void): void {
  show(`<h1>${title}</h1><p>${text}</p><div class="row"><button id="p-go">Ready</button></div>`);
  on('p-go', () => { hide(); next(); });
}
const ammoPair = (m: Match, volley: number): string => m.schedule[volley - 1].map(a => AMMO[a].name.toLowerCase()).join(' and ');
/** "#12 · " once the game has its number. */
const tag = (): string => (match?.rec.id ? `#${match.rec.id} · ` : '');
/** Bring the log up to date with the ranges, then send it. */
function save(): void {
  const m = match; if (!m) return;
  m.sides.forEach((s, i) => { if (s.range) m.rec.log.sides[i].drowned = s.range.drowned; });
  if (m.rec.log.status === 'siege') { const st = standing(); m.rec.log.summary = `Volley ${m.volley} · ${m.sides[0].name} ${st.blue} – ${m.sides[1].name} ${st.green}`; }
  void m.rec.save();
}
// the phone switches apps or the tab closes: send a last copy
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && match) { save(); match.rec.beacon(); } });

// ---------- watching a logged game again ----------
// Each range replays its shots at the same step numbers with the same pulls, so the physics repeats itself. Quiet
// stretches between shots are skipped. If a fort isn't exactly as it was when a shot was fired (another device's
// maths can differ in the last digit, and a collapse magnifies it), the end card says from which shot on.
const LEAD = 60, PULL_STEPS = 42;   // steps of quiet fort before each replayed shot; the pull animates over the last 42
interface Watching {
  id: number | null; log: GameLog; ranges: Record<Team, Range>; i: number; shown: Team;
  phase: 'lead' | 'flight' | 'after' | 'end'; wait: number; drift: number | null; pull: Pull | null; lava: number; lavaShown: number;
}
let watching: Watching | null = null;
async function watchById(id: number): Promise<void> {
  screen = 'watch'; bar('', [['Menu', menu]]);
  show(`<h1>Game ${id}</h1><p>Loading…</p>`);
  try {
    const r = await fetch(`/api/games/${id}`);
    if (!r.ok) throw new Error(String(r.status));
    watch(((await r.json()) as { log: GameLog }).log, id);
  } catch {
    show(`<h1>Game ${id}</h1><p>This game couldn't be loaded.</p><div class="row"><a class="btn" href="/games">All games</a><button id="w-menu" class="quiet">Menu</button></div>`);
    on('w-menu', menu);
  }
}
function watch(log: GameLog, id: number | null): void {
  timers.length = 0; match = null; builder = null;
  if (!log.shots.length || log.sides.some(s => !s.fort)) {
    screen = 'watch';
    show(`<h1>Game ${id ?? ''}</h1><p>This game ended before the first shot, so there's nothing to watch.</p><div class="row"><a class="btn" href="/games">All games</a><button id="w-menu" class="quiet">Menu</button></div>`);
    on('w-menu', menu);
    return;
  }
  const ranges = { blue: new Range(log.sides[0].fort!, 'blue'), green: new Range(log.sides[1].fort!, 'green') };
  ranges.blue.settle(3); ranges.green.settle(3);
  watching = { id, log, ranges, i: -1, shown: 'green', phase: 'lead', wait: 0, drift: null, pull: null, lava: 0, lavaShown: 0 };
  screen = 'watch'; hide(); layout();
  nextShot();
}
const other = (t: Team): Team => (t === 'blue' ? 'green' : 'blue');
function nextShot(): void {
  const w = watching!; w.i++;
  const s = w.log.shots[w.i];
  if (!s) return endWatch();
  w.shown = other(s.by); w.lava = s.volley - 1; w.phase = 'lead'; w.wait = 0;
  const r = w.ranges[w.shown];
  r.stepTo(Math.max(r.steps, s.step - LEAD), w.lava);
  watchBar();
}
function watchTick(dt: number): void {
  const w = watching!, r = w.ranges[w.shown], s = w.log.shots[w.i];
  w.lavaShown += Math.sign(w.lava - w.lavaShown) * Math.min(Math.abs(w.lava - w.lavaShown), dt * 0.8);
  if (w.phase === 'end' || !s) { r.tick(dt, w.lava); return; }
  if (w.phase === 'lead') {
    r.tick(dt, w.lava, s.step);
    const f = Math.min(1, 1 - (s.step - r.steps) / PULL_STEPS);
    w.pull = f > 0 ? { x: s.pull.x * f, y: s.pull.y * f } : null;
    if (r.steps >= s.step) {
      r.fire(s.pull, s.ammo ?? 'marble'); w.pull = null; w.phase = 'flight'; watchBar();
      if (s.state !== undefined && r.shots[r.shots.length - 1].state !== s.state) w.drift ??= w.i;   // older logs have no fingerprint
    }
    return;
  }
  const next = w.log.shots[w.i + 1], same = !!next && next.by === s.by;   // the same shooter's next shot hits the same range
  const tapAt = w.phase === 'flight' && s.tap !== undefined && !r.flight?.tapped ? s.tap : Infinity;
  r.tick(dt, w.lava, Math.min(tapAt, w.phase === 'flight' && same ? next.step : Infinity));
  if (r.steps === tapAt) r.ability();
  if (w.phase === 'flight' && r.state === 'aim') {   // this marble is done
    if (same) { w.i++; w.phase = 'lead'; w.lava = next.volley - 1; watchBar(); }
    else w.phase = 'after';
  }
  if (w.phase === 'after') { w.wait += dt; if (r.quiet() || w.wait > 3) nextShot(); }
  if (watching?.phase !== 'end') watchBar();   // plushie counts change mid-shot
}
function watchBar(): void {
  const w = watching!, s = w.log.shots[w.i]; if (!s) return;
  const name = (t: Team) => w.log.sides[t === 'blue' ? 0 : 1].name;
  const text = `Replay${w.id ? ` of game ${w.id}` : ''} · Volley ${s.volley}/${VOLLEYS} · ${name(s.by)}, shot ${s.n} of ${SHOTS} · plushies ${name('blue')} ${w.ranges.blue.standing()} – ${name('green')} ${w.ranges.green.standing()}`;
  if (text !== barLeft.textContent) bar(text, [['Menu', menu]]);
}
function endWatch(): void {
  const w = watching!; w.phase = 'end'; w.i = w.log.shots.length - 1;
  const id = w.id;
  show(`<h1>End of ${id ? `game ${id}` : 'the replay'}</h1>
    <p>${w.log.result ? w.log.summary : 'The real game was left before its result.'}</p>
    <p class="small">${w.drift === null ? 'Every shot hit the fort exactly as it stood in the real game.'
      : `From shot ${w.drift + 1} on, this replay came out differently from the real game (physics can differ slightly between devices), so the rest may not match what was played.`}</p>
    <div class="row"><button id="w-again">Watch again</button><a class="btn quiet" href="/games">All games</a><button id="w-menu" class="quiet">Menu</button></div>`);
  on('w-again', () => watch(w.log, id)); on('w-menu', menu);
}

// ---------- DOM helpers ----------
function bar(left: string, buttons: [string, () => void, boolean?][]): void {
  barLeft.textContent = left; barRight.replaceChildren();
  barLeft.parentElement!.classList.toggle('bare', !left && !buttons.length);   // no paper strip when there's nothing on it
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
  if (screen !== 'siege' || !match || match.busy || match.sides[match.shooter].bot) return;
  if (target().state === 'flight') { target().ability(); return; }   // a tap anywhere triggers the ammo's ability
  if (match.shotsLeft <= 0 || target().state !== 'aim') return;
  const slot = ammoSlots().find(sl => Math.hypot(e.offsetX - sl.x, e.offsetY - sl.y) < sl.r + 8);
  if (slot) { match.loaded = slot.ammo; status(); return; }
  if (e.offsetX > cssW * 0.55) return;
  pointerId = e.pointerId; canvas.setPointerCapture(e.pointerId);
  pull = { x: 0, y: 0 }; aim = { x: e.offsetX, y: e.offsetY, t: e.timeStamp, seen: [{ t: e.timeStamp, p: pull }] };
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== pointerId) return;
  if (screen === 'build' && builder) { builder.move(e.offsetX, e.offsetY); return; }
  if (!pull) return;
  // pulling back aims forward; the pull is measured in finger pixels, so it's equally fine on every screen
  let dx = ((aim.x - e.offsetX) / PULL_PX) * MAX_PULL, dy = ((e.offsetY - aim.y) / PULL_PX) * MAX_PULL;
  const len = Math.hypot(dx, dy);
  if (len > MAX_PULL) { dx *= MAX_PULL / len; dy *= MAX_PULL / len; }
  pull = { x: dx, y: dy };
  aim.seen.push({ t: e.timeStamp, p: pull });
  while (aim.seen.length > 2 && aim.seen[1].t < e.timeStamp - 500) aim.seen.shift();
});
const release = (e: PointerEvent) => {
  if (e.pointerId !== pointerId) return;
  pointerId = -1;
  if (screen === 'build' && builder) { builder.up(e.offsetX, e.offsetY); buildBar(); return; }
  if (pull && screen === 'siege' && e.type === 'pointerup') {
    // the newest pull that was on screen for a moment before the finger lifted
    let seen = aim.seen[0].p;
    for (const s of aim.seen) if (s.t <= e.timeStamp - SEEN_MS) seen = s.p;
    shoot(seen, { raw: pull, aimMs: Math.round(e.timeStamp - aim.t) });
  }
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
    for (const s of match.sides) s.range!.tick(dt, match.lavaShown);
    if (match.sides[match.shooter].bot) botTap();
  }
  if (screen === 'watch' && watching) watchTick(dt);
}
function draw(): void {
  const o = { boil, launcher: true, w: cssW, h: cssH };
  if (screen === 'build' && builder) builder.draw(ctx, boil);
  else if ((screen === 'siege' || screen === 'result') && match) {
    const r = target(), human = !match.sides[match.shooter].bot;
    r.draw(ctx, cam, { ...o, pull: pull ?? botPull, lava: match.lavaShown, loaded: match.shotsLeft > 0 ? match.loaded : null });
    if (screen === 'siege' && human && !match.busy) drawSlots();
    const f = r.flight, a = r.ammoAt();
    if (human && f && a && !f.tapped && AMMO[f.ammo].tap) tapHint(cam.sx(a.x), cam.sy(a.y), AMMO[f.ammo].r * cam.k);
  }
  else if (screen === 'watch' && watching) {
    const s = watching.log.shots[watching.i];
    watching.ranges[watching.shown].draw(ctx, cam, { ...o, pull: watching.pull, lava: watching.lavaShown, loaded: s?.ammo ?? 'marble' });
  }
  else { ctx.fillStyle = '#F4E9D8'; ctx.fillRect(0, 0, cssW, cssH); }
}
/** This turn's ammo, as round paper stickers at the bottom left. Tap one to load it. */
function ammoSlots(): { ammo: Ammo; x: number; y: number; r: number }[] {
  const m = match!, r = 25, x0 = Math.max(18, cam.sx(BOOK.x + BOOK.hw) + 16);   // right of the launcher's book
  return m.hand.map((ammo, i) => ({ ammo, x: x0 + r + i * (2 * r + 12), y: cssH - 14 - r, r }));
}
function drawSlots(): void {
  const m = match!, team = m.sides[m.shooter].team === 'blue' ? '#2F6FDE' : '#0F7B5F';
  for (const sl of ammoSlots()) {
    const on = sl.ammo === m.loaded && m.shotsLeft > 0 && target().state === 'aim';
    ctx.save(); ctx.translate(sl.x, sl.y);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, sl.r + 3, 0, Math.PI * 2); ctx.fill();   // the sticker's peeled white edge
    ctx.fillStyle = '#FBF6EC'; ctx.beginPath(); ctx.arc(0, 0, sl.r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = on ? 4 : 2; ctx.strokeStyle = on ? team : '#2E2A33'; ctx.beginPath(); ctx.arc(0, 0, sl.r + (on ? 1 : 0), 0, Math.PI * 2); ctx.stroke();
    drawAmmo(ctx, sl.ammo, sl.ammo === 'balloon' ? sl.r * 0.55 : sl.ammo === 'jacks' ? sl.r * 0.62 : sl.r * 0.5, 0);
    ctx.restore();
  }
}
/** A pulsing ring around ammo that can still be tapped. */
function tapHint(x: number, y: number, r: number): void {
  const p = (clock % 600) / 600;
  ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r + 6 + p * 16, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.font = `18px ${HAND}`; ctx.fillStyle = '#2E2A33'; ctx.textAlign = 'center';
  ctx.fillText('tap!', x, y - r - 12);
  ctx.restore();
}
let last = performance.now();
function frame(now: number): void {
  tick(Math.min(0.05, (now - last) / 1000)); last = now;
  draw();
  requestAnimationFrame(frame);
}

// Dev hook for automated checks without a visible tab (Vite dev server, or a local `npm run dev:worker`).
if (import.meta.env.DEV || location.hostname === 'localhost') Object.assign(window, { __fk: {
  start: (mode: Match['mode']) => { sawHowTo = true; newMatch(mode); document.getElementById('p-go')?.click(); },
  load: (i: number) => { builder?.load(BOT_FORTS[i]); buildBar(); },
  ready: () => { if (builder && !builder.blocker) buildDone?.(); },
  go: () => document.getElementById('p-go')?.click(),
  fire: (x: number, y: number, ammo?: Ammo) => { if (screen === 'siege') { if (ammo && match!.hand.includes(ammo)) match!.loaded = ammo; shoot({ x, y }); } },
  tap: () => target().ability(),
  // balance sweeps (sim.ts): every ammo type at a bot fort over an angle × power grid
  sweep: async (fort: number, ammo: Ammo) => { const sim = await import('./sim'); return sim.summarise(sim.sweep(BOT_FORTS[fort], ammo)); },
  hand: () => match && { hand: match.hand, loaded: match.loaded, schedule: match.schedule },
  run: (sec: number) => { for (let i = 0; i < sec * 60; i++) tick(1 / 60); draw(); return `${screen} · ${barLeft.textContent}`; },
  state: () => ({ screen, volley: match?.volley, shooter: match?.shooter, shotsLeft: match?.shotsLeft, id: match?.rec.id, overlay: overlay.hidden ? '' : overlay.textContent?.trim().slice(0, 200) }),
  log: () => match?.rec.log ?? watching?.log,
  watch: (log: GameLog) => watch(log, null),
  watching: () => watching && { i: watching.i, phase: watching.phase, drift: watching.drift, shown: watching.shown },
} });

(async () => {
  await initPhysics(wasmUrl);
  layout();
  new ResizeObserver(layout).observe(canvas);
  const id = Number(new URLSearchParams(location.search).get('watch'));
  if (id) void watchById(id); else menu();
  requestAnimationFrame(frame);
})();
