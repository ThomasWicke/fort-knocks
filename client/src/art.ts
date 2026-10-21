// The 80/20 art pass: an illustrated room behind everything, the rug as an island in the lava, and the plushies as
// illustrated sprites (the hybrid from the Phase 5 style frame). Pieces, launcher, ammo and crayon effects stay in code.
// Every image is placed in world coordinates, so it lines up with the physics on any screen.
// Sources: docs/concept/game-art (backdrops, rug) and docs/concept/sprites (plushies), cut by the art script.
import type { Plushie } from './fort';
import type { Cam } from './range';

/** What placing art needs from a camera (the past-games page passes its own). */
type View = Pick<Cam, 'k' | 'sx' | 'sy'>;

type Team = 'blue' | 'green';
const load = (src: string): HTMLImageElement => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; };
const ready = (i: HTMLImageElement) => i.complete && i.naturalWidth > 0;

// ---------- the room ----------
// Three backdrops were generated; ?backdrop=a|b|c picks one (remembered on this device), c is the default.
// seam: the image row where the wall meets the lava floor. It sits at world y = 1, a little behind the rug.
const ROOMS = { a: { seam: 513 }, b: { seam: 589 }, c: { seam: 604 } } as const;
type RoomKey = keyof typeof ROOMS;
const ROOM_PX = 47.3, ROOM_X0 = -18.5, SEAM_Y = 1;   // image px per cell; world x of the image's left edge
function pickRoom(): RoomKey {
  const q = new URLSearchParams(location.search).get('backdrop');
  try {
    if (q && q in ROOMS) localStorage.setItem('fk-room', q);
    const s = localStorage.getItem('fk-room');
    if (s && s in ROOMS) return s as RoomKey;
  } catch { /* storage blocked: use the default */ }
  return q && q in ROOMS ? (q as RoomKey) : 'c';
}
const roomKey = typeof location === 'undefined' ? 'c' : pickRoom();
const room = load(`/art/room-${roomKey}.jpg`);
// beyond the image's edges (tall or very wide screens) the wall and the lava carry on in their own colours
let wallFill = '#DDC1A6', lavaFill = '#F2711F';
room.addEventListener('load', () => {
  try {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    const c = cv.getContext('2d')!; c.drawImage(room, 0, 0, 64, 64);
    const avg = (y: number) => { const d = c.getImageData(8, y, 48, 2).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`; };
    wallFill = avg(0); lavaFill = avg(62);
  } catch { /* keep the defaults */ }
});

export function drawRoom(c: CanvasRenderingContext2D, cam: View, w: number, h: number): void {
  const seamPy = cam.sy(SEAM_Y);
  c.fillStyle = wallFill; c.fillRect(0, 0, w, seamPy);
  c.fillStyle = lavaFill; c.fillRect(0, seamPy, w, h - seamPy);
  if (!ready(room)) return;
  const k = cam.k / ROOM_PX, seam = ROOMS[roomKey].seam, iw = room.naturalWidth, ih = room.naturalHeight;
  const x = cam.sx(ROOM_X0), y = seamPy - seam * k, dw = iw * k, dh = ih * k;
  c.imageSmoothingQuality = 'high';
  c.drawImage(room, x, y, dw, dh);
  // past the image's edges (wide or zoomed-in screens) the room carries on mirrored, so there's no hard seam
  if (x > 0 || x + dw < w) {
    c.save(); c.scale(-1, 1);
    if (x > 0) c.drawImage(room, -x, y, dw, dh);
    if (x + dw < w) c.drawImage(room, -(x + 2 * dw), y, dw, dh);
    c.restore();
  }
  if (y > 0) c.drawImage(room, 0, 0, iw, 1, x, 0, dw, y + 1);
}

// ---------- the rug: an island in the lava ----------
// Sprite rows 4–98 are its top surface, seen from low; pieces stand on row 51, where it's 1355 px wide = the rug's 10.6 cells.
const rugs: Record<Team, HTMLImageElement> = { blue: load('/art/rug-blue.png'), green: load('/art/rug-green.png') };
const RUG_PX = 1355 / 10.6, RUG_ROW = 51, RUG_MID_PX = 757, RUG_MID_X = 5;
export function drawRug(c: CanvasRenderingContext2D, cam: View, team: Team): boolean {
  const img = rugs[team];
  if (!ready(img)) return false;
  const k = cam.k / RUG_PX;
  c.drawImage(img, cam.sx(RUG_MID_X) - RUG_MID_PX * k, cam.sy(0) - RUG_ROW * k, img.naturalWidth * k, img.naturalHeight * k);
  return true;
}

// ---------- plushies ----------
const plushies: Record<string, HTMLImageElement> = {};
const greys: Record<string, HTMLCanvasElement> = {};
for (const p of ['brumm', 'hoppel', 'socke'] as Plushie[]) for (const t of ['blue', 'green'] as Team[]) {
  const img = load(`/art/${p}-${t}.png`), key = `${p}-${t}`;
  plushies[key] = img;
  img.addEventListener('load', () => {   // an out plushie is drawn faded to grey (canvas filters aren't everywhere yet)
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const c = cv.getContext('2d')!; c.drawImage(img, 0, 0);
    try {
      const d = c.getImageData(0, 0, cv.width, cv.height), a = d.data;
      for (let i = 0; i < a.length; i += 4) { const g = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11; a[i] = a[i + 1] = a[i + 2] = g * 0.75 + 60; }
      c.putImageData(d, 0, 0);
    } catch { /* tainted canvas: no grey version */ }
    greys[key] = cv;
  });
}
/** A plushie sprite standing on the bottom of its 1 × 1 body (k = px per cell), centred on the origin. False until loaded. */
export function drawPlushSprite(c: CanvasRenderingContext2D, who: Plushie, team: Team, k: number, out: boolean): boolean {
  const key = `${who}-${team}`, img = plushies[key];
  if (!ready(img)) return false;
  const src: CanvasImageSource = out && greys[key] ? greys[key] : img;
  const h = k * 1.6, w = (h * img.naturalWidth) / img.naturalHeight;   // drawn bigger than the body, feet on its bottom
  c.drawImage(src, -w / 2, k / 2 - h, w, h);
  return true;
}

/** Resolves once the rugs and plushies have loaded (or failed), for pages that draw once instead of every frame. */
export function artReady(): Promise<void> {
  const all = [...Object.values(rugs), ...Object.values(plushies)];
  return Promise.all(all.map(i => (i.complete ? Promise.resolve() : new Promise<void>(r => { i.onload = i.onerror = () => r(); })))).then(() => undefined);
}
