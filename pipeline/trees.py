"""Echte Baeume fuer das Schwerpunktgebiet: Standort und Hoehe jedes Baums aus dem Oberflaechenmodell
swissSURFACE3D Raster (0,5 m) minus Gelaendemodell swissALTI3D, ohne Gebaeude (swissBUILDINGS3D).
Ergebnis: r/{ix}_{iz}.trz (je 400-m-Chunk eine Liste x, z, Hoehe, Kronenradius, Nadel-/Laubbaum; zlib-komprimiert)."""
import json, math, os, glob, pickle, random, sys, zlib, time
import numpy as np, tifffile
from collections import defaultdict
from multiprocessing import get_context
from PIL import Image, ImageDraw
from scipy import ndimage
from shapely.geometry import box, Polygon
from shapely.ops import unary_union
from shapely.prepared import prep
from pyproj import Transformer
from geo import *
from focus import focus_area
OUT = '../r/'; DSM = '../data/dsm/'; os.makedirs(DSM, exist_ok=True); T = 800; CH = 400; CAP = 2400
TO95 = Transformer.from_crs(4326, 2056, always_xy=True); TO84 = Transformer.from_crs(2056, 4326, always_xy=True)
area = focus_area(); x0, z0, x1, z1 = area.bounds
cells = {(i, j) for i in range(math.floor(x0 / T), math.floor(x1 / T) + 1) for j in range(math.floor(z0 / T), math.floor(z1 / T) + 1) if area.intersects(box(i * T, j * T, (i + 1) * T, (j + 1) * T))}
A = unary_union([box(i * T, j * T, (i + 1) * T, (j + 1) * T) for i, j in cells]); pA = prep(A)
def kmpoly(e, n):
    lon, lat = TO84.transform([e * 1000, e * 1000 + 1000, e * 1000 + 1000, e * 1000], [n * 1000, n * 1000, n * 1000 + 1000, n * 1000 + 1000]); return Polygon([(wx(a), wz(b)) for a, b in zip(lon, lat)])
need = {}
for part in getattr(A, 'geoms', [A]):
    bx0, bz0, bx1, bz1 = part.bounds; lo0, lo1, la0, la1 = lon_of(bx0), lon_of(bx1), lat_of(bz1), lat_of(bz0)
    url = f'https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swisssurface3d-raster/items?bbox={lo0:.5f},{la0:.5f},{lo1:.5f},{la1:.5f}&limit=100'
    while url:
        d = json.loads(fetch(url))
        for f in d['features']:
            _, year, key = f['id'].split('_'); e, n = [int(v) for v in key.split('-')]
            href = next((a['href'] for a in f['assets'].values() if a['href'].endswith('_0.5_2056_5728.tif')), None)
            if href and pA.intersects(kmpoly(e, n)) and (key not in need or year > need[key][0]): need[key] = (year, href, e, n)
        url = next((l['href'] for l in d.get('links', []) if l['rel'] == 'next'), None)
print(len(cells), 'Zellen,', len(need), 'Kacheln swissSURFACE3D', flush=True)
# Gebaeude je Kilometerkachel (Dachdreiecke in LV95)
BLD = defaultdict(list)
for f in glob.glob('../data/b3d/t/*.pkl'):
    for b in pickle.load(open(f, 'rb')):
        V = b['V']; e0, e1 = int(V[:, 0].min() // 1000), int(V[:, 0].max() // 1000); n0, n1 = int(V[:, 1].min() // 1000), int(V[:, 1].max() // 1000)
        for e in range(e0, e1 + 1):
            for n in range(n0, n1 + 1):
                if f'{e}-{n}' in need: BLD[(e, n)].append(V[b['T']][:, :, :2])
print('Gebaeude in', len(BLD), 'Kacheln', flush=True)
tile_cache = {}
def z17(lon, lat):
    fx = (lon + 180) / 360 * 131072; fy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 131072; tx, ty = int(fx), int(fy); k = (tx, ty)
    if k not in tile_cache:
        p = f'../data/tiles/17/{tx}/{ty}.jpg'
        try: a = np.asarray(Image.open(p).convert('RGB')).astype(np.int16) if os.path.exists(p) else None
        except Exception: a = None
        tile_cache[k] = a
    a = tile_cache[k]
    return None if a is None else a[min(255, int((fy - ty) * 256)), min(255, int((fx - tx) * 256))]
def work(key):
    year, href, e, n = need[key]; p = DSM + key + '.tif'
    if fetch(href, p, timeout=300) is None: return key, None
    try: dsm = tifffile.imread(p).astype(np.float32)
    except Exception as ex: return key, None
    ap = f'../data/alti/{e}-{n}.tif'
    if dsm.shape != (2000, 2000) or not os.path.exists(ap): return key, None
    dtm = tifffile.imread(ap).astype(np.float32)
    if dtm.shape != (500, 500): return key, None
    bad = dtm < -500; dtm[bad] = np.nan; dtm = ndimage.zoom(np.pad(dtm, 1, mode='edge'), 4, order=1)[2:-6, 2:-6]     # Zellmitten 2 m -> 0,5 m
    nd = dsm - dtm; nd[(dsm < -500) | ~np.isfinite(nd)] = 0
    n1 = nd.reshape(1000, 2, 1000, 2).max(axis=(1, 3))
    img = Image.new('L', (1000, 1000), 0); dr = ImageDraw.Draw(img)
    for tri in BLD.get((e, n), []):
        px = tri[:, :, 0] - e * 1000; py = n * 1000 + 1000 - tri[:, :, 1]
        for q in range(len(tri)): dr.polygon([(px[q, 0], py[q, 0]), (px[q, 1], py[q, 1]), (px[q, 2], py[q, 2])], fill=255)
    n1[ndimage.maximum_filter(np.asarray(img), 5) > 0] = 0
    sm = ndimage.gaussian_filter(n1, 1.0); mean5 = ndimage.uniform_filter(n1, 5); pk = ndimage.maximum_filter(n1, 3)
    cand = (sm == ndimage.maximum_filter(sm, size=5)) & (sm >= 3.5) & (pk < 55) & (mean5 > .45 * pk)
    ys, xs = np.nonzero(cand); out = []
    if not len(ys): return key, out
    E = e * 1000 + xs + .5; N = n * 1000 + 1000 - ys - .5; lon, lat = TO84.transform(E, N); X = (np.asarray(lon) - LON_C) * KXM; Z = -(np.asarray(lat) - LAT_C) * KZM
    for q in range(len(ys)):
        if (math.floor(X[q] / T), math.floor(Z[q] / T)) not in cells: continue
        c = z17(lon[q], lat[q])
        if c is not None:
            r_, g_, b_ = int(c[0]), int(c[1]), int(c[2])
            if not ((g_ >= r_ * .98 and g_ >= b_) or r_ + g_ + b_ < 230): continue        # nur Gruenes oder Schatten: keine Kraene, Masten, Lastwagen
        h = float(pk[ys[q], xs[q]]); fir = mean5[ys[q], xs[q]] < .78 * h and h > 6
        out.append((float(X[q]), float(Z[q]), h, fir))
    return key, out
if __name__ == '__main__':
    t0 = time.time(); trees = defaultdict(list); nt = 0; miss = 0
    with get_context('fork').Pool(4) as pool:
        for k, (key, res) in enumerate(pool.imap_unordered(work, sorted(need))):
            if res is None: miss += 1; continue
            nt += len(res)
            for x, z, h, fir in res: trees[(math.floor(x / REG), math.floor(z / REG))].append((x, z, h, fir))
            if k % 10 == 0: print(k, len(need), nt, 'Baeume', round(time.time() - t0), 's', flush=True)
    print('Baeume', nt, 'fehlende Kacheln', miss, flush=True)
    rnd = random.Random(7); tot = 0; regs = set()
    for f in glob.glob(OUT + '*.trz'): os.remove(f)
    for (ix, iz), L in sorted(trees.items()):
        ch = defaultdict(list)
        for x, z, h, fir in L: ch[(min(19, int((x - ix * REG) // CH)), min(19, int((z - iz * REG) // CH)))].append((x, z, h, fir))
        hd = [0x31455254, len(ch)]; pay = []; off = 0
        for (ci, cj), C in sorted(ch.items()):
            rnd.shuffle(C); grow = 1.0
            if len(C) > CAP: grow = min(1.6, math.sqrt(len(C) / CAP)); C = C[:CAP]         # dichter Wald: weniger, dafuer breitere Kronen
            for x, z, h, fir in C:
                r = (min(4.0, max(1.2, .7 + .13 * h)) if fir else min(7.5, max(1.6, .9 + .22 * h))) * grow
                pay += [min(1599, int((x - ix * REG - ci * CH) * 4)), min(1599, int((z - iz * REG - cj * CH) * 4)), min(255, round(h * 4)) | min(63, round(r * 4)) << 8 | (1 if fir else 0) << 14]
            hd += [ci | cj << 8, len(C), off, 0]; off += len(C) * 3; tot += len(C)
        open(OUT + f'{ix}_{iz}.trz', 'wb').write(zlib.compress(np.array(hd, dtype='<u4').tobytes() + np.array(pay, dtype='<u2').tobytes(), 9)); regs.add((ix, iz))
    # Index nachfuehren: viertes Feld = Region hat echte Baeume
    ip = '../w/index.json'; idx = json.load(open(ip))
    idx['regions'] = [[r[0], r[1], r[2] if len(r) > 2 else 0, 1 if (r[0], r[1]) in regs else 0] for r in idx['regions']]
    json.dump(idx, open(ip, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('geschrieben', tot, 'Baeume in', len(regs), 'Regionen', round(sum(os.path.getsize(f) for f in glob.glob(OUT + '*.trz')) / 1e6, 2), 'MB')
