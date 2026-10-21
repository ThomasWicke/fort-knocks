# Game art for the 80/20 pass: backdrops to JPEG, the rug and the plushies keyed out of magenta, team-coloured variants.
import sys, pathlib, colorsys
import numpy as np
from PIL import Image
FK = pathlib.Path('/Users/thomaswicke/Github Repositories/browser games/fort-knocks')
SRC, OUT = FK / 'docs/concept', FK / 'client/public/art'
OUT.mkdir(parents=True, exist_ok=True)

def key(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lo, hi = np.minimum(r, b), np.maximum(np.maximum(r, b), 1)
    k = np.clip((lo - g) / hi, 0, 1)
    t = np.clip((k - 0.35) / (0.75 - 0.35), 0, 1)
    alpha = 1 - t * t * (3 - 2 * t)
    spill = np.clip(lo - g, 0, None)
    rgb = np.stack([r - spill, g, b - spill], -1).clip(0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(alpha > 0.05)
    return Image.fromarray(out, 'RGBA').crop((max(xs.min() - 3, 0), max(ys.min() - 3, 0), min(xs.max() + 4, a.shape[1]), min(ys.max() + 4, a.shape[0])))

def rgb_to_hsv(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-9), 0)
    return h, s, mx
def hsv_to_rgb(h, s, v):
    c = v * s; x = c * (1 - np.abs((h / 60) % 2 - 1)); m = v - c
    z = np.zeros_like(h); i = (h // 60).astype(int) % 6
    r = np.choose(i, [c, x, z, z, x, c]); g = np.choose(i, [x, c, c, x, z, z]); b = np.choose(i, [z, z, x, c, c, x])
    return np.stack([r + m, g + m, b + m], -1) * 255

def recolor(img, h0, h1, dh, vscale, smin=0.25):
    """Rotate the hues in [h0, h1] by dh degrees and scale their brightness (team colours)."""
    a = np.asarray(img).astype(np.float32)
    h, s, v = rgb_to_hsv(a[..., :3])
    m = (h >= h0) & (h <= h1) & (s > smin)
    h2 = np.where(m, (h + dh) % 360, h); v2 = np.where(m, np.clip(v * vscale, 0, 1), v)
    a[..., :3] = hsv_to_rgb(h2, s, v2)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')

# backdrops: JPEG, full size (the game maps them to world coordinates)
for n in 'abc':
    Image.open(SRC / f'game-art/backdrop-{n}.png').convert('RGB').save(OUT / f'room-{n}.jpg', quality=84, optimize=True, progressive=True)

# the rug: blue as generated, green by turning the stripes teal
rug = key(Image.open(SRC / 'game-art/rug-blue.png'))
rug.save(OUT / 'rug-blue.png', optimize=True)
recolor(rug, 195, 245, -54, 0.62).save(OUT / 'rug-green.png', optimize=True)

# plushies: generated with the green bandana; blue by turning teal to blue
H = int(sys.argv[1]) if len(sys.argv) > 1 else 420
for n, src in [('brumm', 'brumm-grumpy'), ('hoppel', 'hoppel-smug'), ('socke', 'socke-taunt')]:
    p = key(Image.open(SRC / f'sprites/{src}.png'))
    p = p.resize((round(p.width * H / p.height), H), Image.LANCZOS)
    p.save(OUT / f'{n}-green.png', optimize=True)
    recolor(p, 140, 190, 57, 1.9).save(OUT / f'{n}-blue.png', optimize=True)
print('done')
