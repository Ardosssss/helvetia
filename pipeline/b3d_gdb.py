"""Kacheln ohne CityGML: Dachflaechen aus der FileGDB (Layer 'Roof')."""
import json, os, re, sys, time, zipfile, pickle, shutil, glob
import numpy as np, pyogrio, shapely
from multiprocessing import Pool
from geo import fetch
from b3d_tri import Mesh
OUT = '../data/b3d/t/'; ZIP = '../data/b3d/zip/'
SKIP = re.compile(r'Mauer|Bruecke|Staumauer|Historische Baute')
import struct
def rings(buf):
    """Aeussere Ringe aus WKB (Polygon, MultiPolygon, Triangle, TIN, PolyhedralSurface; mit Z)."""
    out = []; pos = 0
    def geom():
        nonlocal pos
        bo = '<' if buf[pos] == 1 else '>'; pos += 1
        (t,) = struct.unpack_from(bo + 'I', buf, pos); pos += 4
        ew = t & 0xe0000000; iso = 0 if ew else (t // 1000); hasz = bool(t & 0x80000000) or iso in (1, 3); hasm = bool(t & 0x40000000) or iso in (2, 3); base = (t & 0x0fffffff) % 1000; dim = 2 + hasz + hasm
        if base in (3, 17):
            (nr,) = struct.unpack_from(bo + 'I', buf, pos); pos += 4
            for r in range(nr):
                (npt,) = struct.unpack_from(bo + 'I', buf, pos); pos += 4
                a = np.frombuffer(buf, dtype=bo + 'f8', count=npt * dim, offset=pos).reshape(npt, dim); pos += npt * dim * 8
                if hasz: (out.append([a[:, :3]]) if r == 0 else out[-1].append(a[:, :3]))
        elif base in (6, 7, 15, 16):
            (n,) = struct.unpack_from(bo + 'I', buf, pos); pos += 4
            for _ in range(n): geom()
        else: raise ValueError('WKB type %d' % t)
    geom(); return out
def work(item):
    key, t = item; p = OUT + key + '.pkl'
    if os.path.exists(p): return key, -1
    z = ZIP + key + '.gdb.zip'; d = ZIP + key + '_gdb/'
    if fetch(t['gdb'], z, timeout=300) is None: return key, None
    try:
        with zipfile.ZipFile(z) as zf: zf.extractall(d)
        g0 = os.path.abspath(glob.glob(d + '*.gdb')[0]); g = os.path.abspath(d) + '/roof.vrt'
        open(g, 'w').write('<OGRVRTDataSource><OGRVRTLayer name="Roof"><SrcDataSource relativeToVRT="0">%s</SrcDataSource><SrcLayer>Roof</SrcLayer><GeometryType>wkbMultiPolygon25D</GeometryType></OGRVRTLayer></OGRVRTDataSource>' % g0)
        info = pyogrio.read_info(g, layer='Roof'); cols = [c for c in ('UUID', 'OBJEKTART', 'EGID', 'GELAENDEPUNKT') if c in info['fields']]
        meta, fids, geom, fields = pyogrio.raw.read(g, layer='Roof', columns=cols)
        col = {c: fields[i] for i, c in enumerate(meta['fields'])}; out = []
        for q, wkb in enumerate(geom):
            if wkb is None: continue
            kind = str(col['OBJEKTART'][q]) if 'OBJEKTART' in col else ''
            if SKIP.search(kind): continue
            M = Mesh()
            for c in rings(wkb): M.poly(c)
            V, T = M.arrays()
            if len(T):
                eg = col['EGID'][q] if 'EGID' in col else 0
                out.append(dict(id=str(col['UUID'][q]) if 'UUID' in col else f'{key}-{q}', kind=kind, egid=int(eg) if eg is not None and eg == eg else 0, ground=(float(col['GELAENDEPUNKT'][q]) if 'GELAENDEPUNKT' in col and col['GELAENDEPUNKT'][q] is not None and col['GELAENDEPUNKT'][q] == col['GELAENDEPUNKT'][q] else None), V=V, T=T))
    except Exception as e:
        return key, 'ERR ' + str(e)[:100]
    pickle.dump(out, open(p + '.tmp', 'wb'), protocol=4); os.replace(p + '.tmp', p); os.remove(z); shutil.rmtree(d, ignore_errors=True)
    return key, len(out)
if __name__ == '__main__':
    tiles = json.load(open('../data/b3d_tiles.json'))
    items = [(k, v) for k, v in tiles.items() if re.match(r'^\d{4}-\d{2}$', k) and not v['url'] and v['gdb']]
    t0 = time.time(); tot = 0
    with Pool(4) as pool:
        for i, (key, n) in enumerate(pool.imap_unordered(work, items)):
            if isinstance(n, int) and n > 0: tot += n
            print(i, key, n, 'total', tot, round(time.time() - t0), 's', flush=True)
    print('done', len(items), 'tiles', tot, 'buildings')
