// The past-games page (/games): every logged match, newest first, with both forts as built, every shot and a link
// to watch it again. On top, how often each toy-box piece gets used, for "which pieces don't help?" (playtest 2).
// No physics here: this page only draws blueprints, so it stays small.
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/lilita-one/latin-400.css';
import { RUG_W, TRAY, TRAY_ORDER, priceOf, trayKindOf, type Piece, type Plushie, type TrayKind } from './fort';
import { P, drawPiece, drawPlush } from './draw';
import { artReady, drawPlushSprite, drawRug } from './art';
import { AMMO } from './ammo';
import { MODES } from './modes';
import type { GameLog, ShotLog, Team } from './record';

interface Row { id: number; created_at: string; updated_at: string; log: GameLog }
const MAX_PULL = 2;   // range.ts; not imported, so this page doesn't load the physics engine
const KIND: Record<TrayKind, string> = { card: 'Card', tent: 'Card tent', domino: 'Domino', block: 'Block', tri: 'Triangle', long: 'Long block', arch: 'Arch', book: 'Book' };
const NAME: Record<Plushie, string> = { brumm: 'Brumm', hoppel: 'Hoppel', socke: 'Socke' };
const list = document.getElementById('games')!, more = document.getElementById('more') as HTMLButtonElement, usage = document.getElementById('usage')!;
const loaded: Row[] = [];
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

async function load(before?: number): Promise<void> {
  more.hidden = true;
  try {
    const r = await fetch(`/api/games?limit=20${before ? `&before=${before}` : ''}`);
    if (!r.ok) throw new Error(String(r.status));
    const rows = (await r.json()) as Row[];
    if (!before) list.replaceChildren();
    if (!rows.length && !loaded.length) list.innerHTML = '<p class="empty">No games yet. Play one and it shows up here.</p>';
    for (const row of rows) { loaded.push(row); list.append(card(row)); }
    more.hidden = rows.length < 20;
    if (rows.length) more.onclick = () => load(rows[rows.length - 1].id);
    renderUsage();
  } catch {
    list.innerHTML = '<p class="empty">The games couldn\'t be loaded. Try again in a moment.</p>';
  }
}

function card(row: Row): HTMLElement {
  const { log } = row, el = document.createElement('article');
  el.className = 'card';
  const when = new Date(row.created_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const mode = `${MODES[log.rules ?? 'siege'].name}${log.round && log.rules === 'rounds' ? `, round ${log.round}` : ''} · ${log.mode === 'bot' ? 'against the bot' : log.mode === 'online' ? 'online' : 'pass and play'}`;
  const mins = log.result ? ` · ${(log.result.ms / 60000).toFixed(1)} min` : '';
  const state = log.status === 'done' ? '' : log.status === 'quit' ? '' : ' · unfinished';
  el.innerHTML = `
    <div class="head"><h2>Game ${row.id}</h2>${log.shots.length && log.sides.every(s => s.fort) ? `<a class="btn" href="/?watch=${row.id}">Watch</a>` : ''}</div>
    <div class="meta">${esc(when)} · ${mode}${mins}${state} · ${device(log.device)} · build ${esc(log.app)}</div>
    <div class="summary">${esc(log.summary)}</div>
    <div class="forts"></div>`;
  const forts = el.querySelector('.forts')!;
  for (const side of log.sides) {
    const f = document.createElement('div'); f.className = 'fort';
    const built = side.fort;
    const bits = side.bot ? [`bot fort ${(side.botFort ?? 0) + 1}`]
      : [side.buildMs !== undefined ? `built in ${clock(side.buildMs)}` : 'not built', side.tests ? `Test ×${side.tests}` : '', built ? `${spent(built)} of 30 spent` : ''];
    if (side.drowned?.length) bits.push(`lava took ${side.drowned.map(p => NAME[p]).join(', ')}`);
    f.innerHTML = `<div class="who ${side.team}">${esc(side.name)}</div>${built ? '<canvas></canvas>' : ''}<div class="meta">${bits.filter(Boolean).join(' · ')}</div>`;
    forts.append(f);
    if (built) requestAnimationFrame(() => drawFort(f.querySelector('canvas')!, built, side.team));
  }
  if (log.shots.length) {
    const d = document.createElement('details');
    d.innerHTML = `<summary>${log.shots.length} shot${log.shots.length === 1 ? '' : 's'}</summary><div class="tablewrap"><table>
      <tr><th>Volley</th><th>Who</th><th>Ammo</th><th>Angle</th><th>Power</th><th>Result</th></tr>
      ${log.shots.map(s => shotRow(log, s)).join('')}</table></div>`;
    el.append(d);
  }
  return el;
}
function shotRow(log: GameLog, s: ShotLog): string {
  const who = log.sides[s.by === 'blue' ? 0 : 1].name;
  const deg = Math.round((Math.atan2(s.pull.y, s.pull.x) * 180) / Math.PI), power = Math.round((Math.hypot(s.pull.x, s.pull.y) / MAX_PULL) * 100);
  const crushed = s.crushed ?? [];
  const res = [s.out.length ? s.out.map(p => `${NAME[p]} ${crushed.includes(p) ? 'crushed' : 'out'}`).join(', ') : '', s.lost ? `${s.lost} piece${s.lost === 1 ? '' : 's'} off` : ''].filter(Boolean).join(' · ');
  const ammo = s.ammo ? `${AMMO[s.ammo].name}${s.tap !== undefined ? ' (tapped)' : ''}` : 'Marble';
  const miss = !s.impact ? 'missed' : s.impact[0] < -0.5 ? 'short' : 'no effect';
  return `<tr><td>${s.volley}</td><td>${esc(who)}, ${s.n}</td><td>${ammo}</td><td>${deg}°</td><td>${power}%</td><td class="${res ? 'out' : ''}">${res || miss}</td></tr>`;
}

/** The fort as built (before physics), on its rug. */
function drawFort(cv: HTMLCanvasElement, fort: Piece[], team: Team): void {
  const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const c = cv.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = Math.min(w / (RUG_W + 1.6), h / 8.4), ox = (w - RUG_W * k) / 2, oy = h - 0.7 * k;
  if (!drawRug(c, { k, sx: x => ox + x * k, sy: y => oy - y * k }, team)) {
    c.fillStyle = P.rug; c.fillRect(ox - 0.3 * k, oy, (RUG_W + 0.6) * k, 0.3 * k);
    c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(ox - 0.3 * k, oy, (RUG_W + 0.6) * k, 0.3 * k);
  }
  for (const p of fort) {
    c.save(); c.translate(ox + (p.x + p.w / 2) * k, oy - (p.y + p.h / 2) * k);
    if (p.type === 'plush') { if (!drawPlushSprite(c, p.plush!, team, k, false)) drawPlush(c, p.plush!, p.w * k, p.h * k, false, team === 'blue' ? P.blue : P.green); }
    else drawPiece(c, p, k);
    c.restore();
  }
}

/** Of what the box held, how much went into forts people built, per piece. */
function renderUsage(): void {
  const forts = loaded.flatMap(r => r.log.sides.filter(s => !s.bot && s.fort).map(s => ({ fort: s.fort!, draw: r.log.draw })));
  if (!forts.length) { usage.hidden = true; return; }
  const rows = TRAY_ORDER.map(k => {
    const inBox = forts.reduce((n, f) => n + f.draw[k], 0), used = forts.reduce((n, f) => n + f.fort.filter(p => trayKindOf(p) === k).length, 0);
    return { k, inBox, used, share: inBox ? used / inBox : 0 };
  });
  usage.hidden = false;
  usage.innerHTML = `<h2>What goes into forts</h2>
    <div class="meta">Across the ${forts.length} fort${forts.length === 1 ? '' : 's'} people built in the games below (bot forts left out): how much of each piece the toy box held, and how much of it was used.</div>
    <div class="tablewrap"><table><tr><th>Piece</th><th>Price</th><th>Per fort</th><th>Used of what was there</th><th></th></tr>
    ${rows.map(r => `<tr><td>${KIND[r.k]}</td><td>${TRAY[r.k].price}</td><td>${(r.used / forts.length).toFixed(1)}</td>
      <td><div class="bar"><i style="width:${Math.min(100, Math.round(r.share * 100))}%"></i></div></td><td>${Math.round(r.share * 100)}%</td></tr>`).join('')}
    </table></div>`;
}

const clock = (ms: number) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const spent = (fort: Piece[]) => fort.reduce((n, p) => n + priceOf(p), 0);
function device(ua: string): string {
  return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'other device';
}

void artReady().then(() => load());
