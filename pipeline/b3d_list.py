import json, pickle, math, time, collections
from concurrent.futures import ThreadPoolExecutor
from shapely.geometry import box
from shapely.prepared import prep
from geo import *
cv = pickle.load(open('../data/coverage.pkl', 'rb')); cov = cv['cov']; lu = cv['lu']; pc = prep(cov.buffer(150)); plu = prep(lu.buffer(150))
regs = json.load(open('../data/regions.json'))
def listing(r):
    ix, iz = r; lo0, lo1 = lon_of(ix * REG) - .004, lon_of((ix + 1) * REG) + .004; la1, la0 = lat_of(iz * REG) + .003, lat_of((iz + 1) * REG) - .003
    url = f'https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissbuildings3d_3_0/items?bbox={lo0:.5f},{la0:.5f},{lo1:.5f},{la1:.5f}&limit=100'; out = []
    while url:
        d = fetch(url)
        if d is None: print('fail', r); break
        d = json.loads(d)
        for f in d['features']:
            a = {k.rsplit('.', 2)[-2]: v['href'] for k, v in f['assets'].items()}
            out.append((f['id'], f['bbox'], a))
        url = next((l['href'] for l in d.get('links', []) if l['rel'] == 'next'), None)
    return out
tiles = {}
with ThreadPoolExecutor(6) as ex:
    for res in ex.map(listing, regs):
        for fid, bb, a in res:
            parts = fid.split('_'); year, key = parts[-2], parts[-1]
            if not key[0].isdigit(): continue
            t = tiles.setdefault(key, {'bbox': bb, 'items': {}}); t['items'][year] = a
need = {}
for key, t in tiles.items():
    bb = t['bbox']; b = box(wx(bb[0]), wz(bb[3]), wx(bb[2]), wz(bb[1]))
    if not pc.intersects(b): continue
    ys = sorted(t['items'], reverse=True); gml = next((y for y in ys if 'citygml' in t['items'][y]), None)
    need[key] = dict(bbox=bb, latest=ys[0], gml=gml, url=t['items'][gml]['citygml'] if gml else None, gdb=t['items'][ys[0]].get('gdb'), lu=bool(plu.intersects(b)))
print('tiles in coverage', len(need), 'with citygml', sum(1 for v in need.values() if v['gml']), 'LU', sum(1 for v in need.values() if v['lu']))
print(collections.Counter(v['gml'] for v in need.values()), collections.Counter(v['latest'] for v in need.values()))
print([k for k, v in need.items() if not v['gml']][:20])
json.dump(need, open('../data/b3d_tiles.json', 'w'))
