"""swissBUILDINGS3D 3.0 (swisstopo OGD): CityGML-Kacheln laden, Dachflaechen als Dreiecksnetze ablegen."""
import json, os, re, sys, time, zipfile, pickle
import xml.etree.ElementTree as ET
import numpy as np
from multiprocessing import Pool
from geo import fetch
from b3d_tri import Mesh
B = '{http://www.opengis.net/citygml/building/2.0}'; G = '{http://www.opengis.net/gml}'; GEN = '{http://www.opengis.net/citygml/generics/2.0}'
OUT = '../data/b3d/t/'; ZIP = '../data/b3d/zip/'; os.makedirs(OUT, exist_ok=True); os.makedirs(ZIP, exist_ok=True)
SKIP = re.compile(r'Mauer|Bruecke|Staumauer|Historische Baute')
def parse(fobj):
    out = []
    for ev, el in ET.iterparse(fobj, events=('end',)):
        if el.tag != B + 'Building': continue
        kind = ''; egid = 0; ground = None
        for a in el.iter(GEN + 'stringAttribute'):
            if a.get('name') == 'OBJEKTART': kind = a.find(GEN + 'value').text or ''; break
        for a in el.iter(GEN + 'intAttribute'):
            if a.get('name') == 'EGID':
                try: egid = int(a.find(GEN + 'value').text)
                except Exception: pass
                break
        for a in el.iter(GEN + 'doubleAttribute'):
            if a.get('name') == 'GELAENDEPUNKT':
                try: ground = float(a.find(GEN + 'value').text)
                except Exception: pass
                break
        if not SKIP.search(kind):
            M = Mesh()
            for r in el.iter(B + 'RoofSurface'):
                for pg in r.iter(G + 'Polygon'):
                    rr = []
                    for side in ('exterior', 'interior'):
                        for e in pg.findall(G + side):
                            for pl in e.iter(G + 'posList'):
                                c = np.array(pl.text.split(), dtype=np.float64)
                                if len(c) >= 12: rr.append(c.reshape(-1, 3))
                                elif side == 'exterior': rr = None
                            if rr is None: break
                        if rr is None: break
                    if rr: M.poly(rr)
            V, T = M.arrays()
            if len(T): out.append(dict(id=el.get(G + 'id'), kind=kind, egid=egid, ground=ground, V=V, T=T))
        el.clear()
    return out
def work(item):
    key, t = item; p = OUT + key + '.pkl'
    if os.path.exists(p): return key, -1, 0
    z = ZIP + key + '.zip'
    if fetch(t['url'], z, timeout=300) is None: return key, None, 0
    try:
        with zipfile.ZipFile(z) as zf:
            name = next(n for n in zf.namelist() if n.lower().endswith('.gml'))
            with zf.open(name) as f: b = parse(f)
    except Exception as e:
        return key, 'ERR ' + str(e)[:80], 0
    pickle.dump(b, open(p + '.tmp', 'wb'), protocol=4); os.replace(p + '.tmp', p); sz = os.path.getsize(z); os.remove(z)
    return key, len(b), sz
if __name__ == '__main__':
    tiles = json.load(open('../data/b3d_tiles.json'))
    items = [(k, v) for k, v in tiles.items() if re.match(r'^\d{4}-\d{2}$', k) and v['url']]
    items.sort(key=lambda kv: (not kv[1]['lu'], kv[0]))
    t0 = time.time(); tot = 0; mb = 0
    with Pool(4) as pool:
        for i, (key, n, sz) in enumerate(pool.imap_unordered(work, items)):
            if isinstance(n, int) and n > 0: tot += n
            mb += sz / 1e6
            if i % 10 == 0 or not isinstance(n, int): print(i, key, n, 'total', tot, 'MB', round(mb), round(time.time() - t0), 's', flush=True)
    print('done', len(items), 'tiles', tot, 'buildings', round(time.time() - t0), 's')
