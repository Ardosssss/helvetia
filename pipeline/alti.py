"""Laedt swissALTI3D (2 m, swisstopo OGD) fuer das Detailgebiet."""
import json, pickle, math, os, sys, time
from concurrent.futures import ThreadPoolExecutor
from shapely.geometry import box
from shapely.prepared import prep
from geo import *
cov = pickle.load(open('../data/coverage.pkl', 'rb'))['cov'].buffer(350); pc = prep(cov)
regs = json.load(open('../data/regions.json'))
OUT = '../data/alti/'
items = {}
def listing(r):
    ix, iz = r; lo0, lo1 = lon_of(ix * REG) - .004, lon_of((ix + 1) * REG) + .004; la1, la0 = lat_of(iz * REG) + .003, lat_of((iz + 1) * REG) - .003
    url = f'https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissalti3d/items?bbox={lo0:.5f},{la0:.5f},{lo1:.5f},{la1:.5f}&limit=100'; out = []
    while url:
        d = fetch(url)
        if d is None: print('list fail', r, flush=True); break
        d = json.loads(d)
        for f in d['features']:
            for a in f['assets'].values():
                if a['href'].endswith('_2_2056_5728.tif'): out.append((f['id'], a['href']))
        url = next((l['href'] for l in d.get('links', []) if l['rel'] == 'next'), None)
    return out
t0 = time.time()
with ThreadPoolExecutor(6) as ex:
    for res in ex.map(listing, regs):
        for fid, href in res:
            _, year, key = fid.split('_'); E, N = [int(v) for v in key.split('-')]
            if key not in items or year > items[key][0]: items[key] = (year, href, E, N)
print('listed', len(items), round(time.time() - t0), 's', flush=True)
need = []
for key, (year, href, E, N) in items.items():
    c = [(wx(a), wz(b)) for a, b in (wgs(E * 1000 + dx, N * 1000 + dy) for dx, dy in ((0, 0), (1000, 0), (1000, 1000), (0, 1000)))]
    xs = [p[0] for p in c]; zs = [p[1] for p in c]
    if pc.intersects(box(min(xs), min(zs), max(xs), max(zs))): need.append((key, href))
print('needed tiles', len(need), flush=True)
json.dump(sorted(k for k, _ in need), open('../data/alti_tiles.json', 'w'))
def dl(t):
    key, href = t; p = OUT + key + '.tif'
    if os.path.exists(p): return 1
    return 1 if fetch(href, p) else 0
done = 0
with ThreadPoolExecutor(8) as ex:
    for i, ok in enumerate(ex.map(dl, need)):
        done += ok
        if i % 200 == 0: print(i, done, round(time.time() - t0), 's', flush=True)
print('done', done, 'of', len(need), round(time.time() - t0), 's')
