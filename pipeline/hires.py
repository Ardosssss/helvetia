"""Besonders scharfe Luftbilder (swisstopo SWISSIMAGE, rund 0,4 m pro Pixel) als 800-m-Kacheln z/h_{i}_{j}.jpg:
fuer ausgewaehlte Orte und entlang der Strasse zwischen ihnen. Eine Kachel deckt genau eine Gelaendekachel des Spiels."""
import json, math, os, io, glob, sys
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from shapely.geometry import box
from geo import *
OUT = '../z/'; CACHE = '../data/tiles/'; T = 800; PX = 2048; Z = 18
from focus import focus_area
area = focus_area()
x0, z0, x1, z1 = area.bounds; cells = [(i, j) for i in range(math.floor(x0 / T), math.floor(x1 / T) + 1) for j in range(math.floor(z0 / T), math.floor(z1 / T) + 1) if area.intersects(box(i * T, j * T, (i + 1) * T, (j + 1) * T))]
print(len(cells), 'Kacheln', flush=True)
if len(sys.argv) > 1 and sys.argv[1] == 'count': sys.exit()
def tile(q):
    x, y = q; d = fetch(f'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{Z}/{x}/{y}.jpeg', f'{CACHE}{Z}/{x}/{y}.jpg', timeout=30)
    try: return Image.open(io.BytesIO(d)).convert('RGB') if d else None
    except Exception: return None
def fx(lon): return (lon + 180) / 360 * 2 ** Z
def fy(lat): return (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** Z
ex = ThreadPoolExecutor(8); keep = set(); tot = 0
for n, (i, j) in enumerate(sorted(cells)):
    out = f'{OUT}h_{i}_{j}.jpg'; keep.add(os.path.basename(out))
    if not os.path.exists(out):
        a0, a1 = fx(lon_of(i * T)), fx(lon_of((i + 1) * T)); b0, b1 = fy(lat_of(j * T)), fy(lat_of((j + 1) * T)); tx0, tx1, ty0, ty1 = int(a0), int(a1), int(b0), int(b1)
        jobs = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]; ims = list(ex.map(tile, jobs))
        mos = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256), (120, 135, 110)); miss = 0
        for (x, y), im in zip(jobs, ims):
            if im is None: miss += 1; continue
            mos.paste(im, ((x - tx0) * 256, (y - ty0) * 256))
        if miss > len(jobs) // 2: print('skip', i, j, flush=True); keep.discard(os.path.basename(out)); continue
        mos.crop((round((a0 - tx0) * 256), round((b0 - ty0) * 256), round((a1 - tx0) * 256), round((b1 - ty0) * 256))).resize((PX, PX), Image.LANCZOS).save(out, 'JPEG', quality=74, optimize=True, progressive=True)
    tot += os.path.getsize(out)
    if n % 10 == 0: print(n, len(cells), round(tot / 1e6, 1), 'MB', flush=True)
for f in glob.glob(OUT + 'h_*.jpg'):
    if os.path.basename(f) not in keep: os.remove(f)
print('done', len(keep), 'Kacheln', round(tot / 1e6, 1), 'MB')
