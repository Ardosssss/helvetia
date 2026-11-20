"""Besonders scharfe Luftbilder (swisstopo SWISSIMAGE, rund 0,4 m pro Pixel) als 800-m-Kacheln z/h_{i}_{j}.jpg:
fuer ausgewaehlte Orte und entlang der Strasse zwischen ihnen. Eine Kachel deckt genau eine Gelaendekachel des Spiels."""
import json, math, os, io, glob, sys
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from shapely.geometry import Point, LineString, box
from shapely.ops import unary_union
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
from geo import *
OUT = '../z/'; CACHE = '../data/tiles/'; T = 800; PX = 2048; Z = 18
PLACES = ['l_gunzwil', 'l_beromunster', 'l_neudorf', 'l_hildisrieden', 'LU', 'BI', 'NI', 'PO']      # ganzer Ort scharf
ROUTES = [['l_gunzwil', 'l_beromunster', 'l_neudorf', 'l_hildisrieden', 'l_rothenburg', 'l_emmen', 'LU'], ['BI', 'NI', 'PO']]   # Strasse dazwischen
P = {p['id']: p for p in json.load(open('places.json'))}
def route(ids):
    """Kuerzester Weg auf den Haupt- und Nebenstrassen der Regionen (ohne Autobahn), als Linienzug in Weltkoordinaten."""
    pts = [(wx(P[i]['lon']), wz(P[i]['lat'])) for i in ids]; xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    nid = {}; coords = []; ea = []; eb = []; ew = []
    def node(x, z):
        k = (round(x), round(z)); j = nid.get(k)
        if j is None: j = nid[k] = len(coords); coords.append(k)
        return j
    for f in glob.glob('../r/*.json'):
        ix, iz = [int(v) for v in os.path.basename(f)[:-5].split('_')]; ox, oz = ix * REG, iz * REG
        if ox > max(xs) + 3000 or ox + REG < min(xs) - 3000 or oz > max(zs) + 3000 or oz + REG < min(zs) - 3000: continue
        for r in json.load(open(f))['roads']:
            if not 1 <= r[0] <= 5: continue
            c = r[6:]; prev = None
            for q in range(0, len(c), 2):
                j = node(ox + c[q] / 10, oz + c[q + 1] / 10)
                if prev is not None and prev != j:
                    d = math.hypot(coords[j][0] - coords[prev][0], coords[j][1] - coords[prev][1]) * (1 + .15 * (r[0] - 1)); ea += [prev, j]; eb += [j, prev]; ew += [d, d]
                prev = j
    C = np.array(coords, dtype=np.float64); G = coo_matrix((ew, (ea, eb)), shape=(len(C), len(C))).tocsr(); line = []
    for a, b in zip(pts[:-1], pts[1:]):
        s = int(np.argmin(np.hypot(C[:, 0] - a[0], C[:, 1] - a[1]))); t = int(np.argmin(np.hypot(C[:, 0] - b[0], C[:, 1] - b[1])))
        dist, pred = dijkstra(G, indices=s, return_predecessors=True); seg = []
        if np.isfinite(dist[t]):
            while t != s and t >= 0: seg.append(tuple(C[t])); t = pred[t]
            seg.append(tuple(C[s])); seg.reverse(); print('route', round(dist[np.argmin(np.hypot(C[:, 0] - b[0], C[:, 1] - b[1]))]), 'm', flush=True)
        else: seg = [a, b]; print('route: keine Verbindung, gerade Linie', flush=True)
        line += seg
    return LineString(line)
area = unary_union([Point(wx(P[i]['lon']), wz(P[i]['lat'])).buffer(P[i]['r'] + 150) for i in PLACES] + [route(r).buffer(260) for r in ROUTES])
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
