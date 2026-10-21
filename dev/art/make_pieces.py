# Piece sprites (playtest 3: pieces "more in line with the concept art"): key out the magenta, split each sheet into its
# objects along empty columns (or rows, for the stacked books), crop each to its outline, and scale it to the exact
# proportions of its physics box, PX pixels per cell. Run with the ComfyUI venv's Python (numpy, Pillow).
import pathlib
import numpy as np
from PIL import Image
FK = pathlib.Path(__file__).resolve().parents[2]
SRC, OUT = FK / 'docs/concept/pieces', FK / 'client/public/art/pieces'
OUT.mkdir(parents=True, exist_ok=True)
PX = 160

def key(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lo, hi = np.minimum(r, b), np.maximum(np.maximum(r, b), 1)
    k = np.clip((lo - g) / hi, 0, 1)
    t = np.clip((k - 0.35) / (0.75 - 0.35), 0, 1)
    alpha = 1 - t * t * (3 - 2 * t)
    spill = np.clip(lo - g, 0, None)
    rgb = np.stack([r - spill, g, b - spill], -1).clip(0, 255)
    return np.dstack([rgb, alpha * 255]).astype(np.uint8)

def split(arr, axis):
    """Objects separated by fully transparent columns (axis 0 = along x) or rows (axis 1 = along y)."""
    solid = (arr[..., 3] > 40).any(axis=axis)
    runs, start = [], None
    for i, s in enumerate(solid):
        if s and start is None: start = i
        if not s and start is not None:
            if i - start > 20: runs.append((start, i))
            start = None
    if start is not None: runs.append((start, len(solid)))
    out = []
    for a, b in runs:
        part = arr[:, a:b] if axis == 0 else arr[a:b, :]
        ys, xs = np.where(part[..., 3] > 40)
        out.append(part[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    return out

def widen(part, aspect):
    """Widen to the target aspect by stretching only two plain strips (between the ends and the middle), so the end
    caps and the symbol in the middle keep their shape."""
    h, w = part.shape[:2]; extra = round(aspect * h) - w
    if extra <= 0: return part
    cuts = [0, round(w * 0.22), round(w * 0.30), round(w * 0.70), round(w * 0.78), w]
    bands = [part[:, cuts[i]:cuts[i + 1]] for i in range(5)]
    for i in (1, 3):
        im = Image.fromarray(bands[i], 'RGBA'); bands[i] = np.asarray(im.resize((im.width + extra // 2 + (extra % 2 if i == 3 else 0), h), Image.LANCZOS))
    return np.concatenate(bands, axis=1)

def save(part, name, w, h):
    if part.shape[1] / part.shape[0] < (w / h) * 0.9 and w > h: part = widen(part, w / h)
    Image.fromarray(part, 'RGBA').resize((round(w * PX), round(h * PX)), Image.LANCZOS).save(OUT / f'{name}.png', optimize=True)

sheets = {
    'blocks': (0, [('block-red', 1, 1), ('block-yellow', 1, 1), ('block-wood', 1, 1), ('block-cream', 1, 1)]),
    'longs': (0, [('long-red', 2, 1), ('long-yellow', 2, 1), ('long-wood', 2, 1), ('long-cream', 2, 1)]),
    'arches': (0, [('arch-yellow', 2, 1), ('arch-wood', 2, 1), ('tri-wood', 1, 1), ('tri-red', 1, 1)]),
    'dominoes': (0, [('domino-1', 0.75, 2), ('domino-2', 0.75, 2), ('domino-3', 0.75, 2), ('tent', 1.5, 1.4)]),
    'books': (1, [('book-ox', 3, 0.5), ('book-mustard', 3, 0.5), ('book-plum', 3, 0.5)]),
}
for sheet, (axis, names) in sheets.items():
    parts = split(key(Image.open(SRC / f'{sheet}.png')), axis)
    assert len(parts) == len(names), (sheet, len(parts))
    for part, (name, w, h) in zip(parts, names):
        save(part, name, w, h)
        print(name, part.shape[1], 'x', part.shape[0], '->', round(w * PX), 'x', round(h * PX), f'(aspect was {part.shape[1] / part.shape[0]:.2f}, box {w / h:.2f})')
