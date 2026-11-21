"""1:1-Welt: Regionen (8 km) mit Strassen, Gebaeuden, Wasser, Baeumen, Hoehenraster; Landesstrassen; Tunnel; Treffpunkte."""
import osmium, json, math, sys, time, random, re, os, zlib, pickle, base64, heapq, glob
import numpy as np, shapely, tifffile
from collections import defaultdict
from PIL import Image
from scipy import ndimage
from shapely.geometry import Polygon, Point, LineString, box
from shapely import STRtree, make_valid
from shapely.ops import unary_union
from shapely.prepared import prep
from geo import *

pbf = os.environ.get('PBF', '../data/ch.osm.pbf'); OUT = os.environ.get('OUT', '../')
for d in ('r', 'n', 'w'): os.makedirs(OUT + d, exist_ok=True)
cv = pickle.load(open('../data/coverage.pkl', 'rb')); cov = cv['cov']
regs = set(map(tuple, json.load(open('../data/regions.json'))))
ONLY = set(tuple(map(int, s.split('_'))) for s in sys.argv[1].split(',')) if len(sys.argv) > 1 and sys.argv[1] != '-' else None
NATTOO = ONLY is None or '--landesstrassen' in sys.argv   # mit ONLY: Landesstrassen (n/) trotzdem neu, z. B. wenn eine Region dazukommt
places = json.load(open('places.json'))
bx0, bz0, bx1, bz1 = cov.bounds; CM = 50
gxa = np.arange(bx0, bx1 + CM, CM); gza = np.arange(bz0, bz1 + CM, CM)
covmask = shapely.contains_xy(cov, *np.meshgrid(gxa, gza))
def incov(x, z):
    i = int((x - bx0) / CM + .5); j = int((z - bz0) / CM + .5)
    return 0 <= i < len(gxa) and 0 <= j < len(gza) and bool(covmask[j, i])
def rkey(x, z): return (math.floor(x / REG), math.floor(z / REG))
def num(s, d=None):
    if not s: return d
    m = re.match(r'\s*([\d.]+)', s)
    try: return float(m.group(1)) if m else d
    except ValueError: return d
t0 = time.time()

# ------------------------------------------------------------------ Hoehenraster
nd_ = np.load('../data/natdem.npz'); NDEM = nd_['dem']; NX0 = float(nd_['x0']); NZ0 = float(nd_['z0']); NST = float(nd_['step'])
def nat_h(X, Z): return ndimage.map_coordinates(NDEM, [(np.asarray(Z) - NZ0) / NST, (np.asarray(X) - NX0) / NST], order=1, mode='nearest')
PAD = 8; NL = int(REG / LAT) + 1
alti_cache = {}
def alti(te, tn):
    k = (te, tn)
    if k not in alti_cache:
        p = f'../data/alti/{te}-{tn}.tif'
        if os.path.exists(p):
            try: a = tifffile.imread(p).astype(np.float32)
            except Exception: a = None
            if a is not None and a.shape == (500, 500):
                bad = a < -500; a[bad] = np.nan
                s = ndimage.uniform_filter(np.nan_to_num(a, nan=0.0), 12); w = ndimage.uniform_filter((~bad).astype(np.float32), 12)
                a = np.where(w > .5, s / np.maximum(w, 1e-6), np.nan)
            else: a = None
        else: a = None
        if len(alti_cache) > 600: alti_cache.clear()
        alti_cache[k] = a
    return alti_cache[k]
def build_dem(key):
    ix, iz = key
    xs = ix * REG + (np.arange(NL + 2 * PAD) - PAD) * LAT; zs = iz * REG + (np.arange(NL + 2 * PAD) - PAD) * LAT
    X, Z = np.meshgrid(xs, zs); E, N = lv95(lon_of(X), lat_of(Z))
    nat = nat_h(X, Z); fine = np.full(X.shape, np.nan, np.float32)
    inc = covmask[np.clip(((Z - bz0) / CM + .5).astype(int), 0, len(gza) - 1), np.clip(((X - bx0) / CM + .5).astype(int), 0, len(gxa) - 1)] & (X >= bx0) & (X <= bx1) & (Z >= bz0) & (Z <= bz1)
    te = np.floor(E / 1000).astype(int); tn = np.floor(N / 1000).astype(int)
    for a, b in set(zip(te[inc].ravel().tolist(), tn[inc].ravel().tolist())):
        t = alti(a, b)
        if t is None: continue
        m = inc & (te == a) & (tn == b)
        fine[m] = t[np.clip(((b * 1000 + 1000 - N[m]) / 2).astype(int), 0, 499), np.clip(((E[m] - a * 1000) / 2).astype(int), 0, 499)]
    valid = ~np.isnan(fine)
    w = np.clip(ndimage.distance_transform_edt(valid) / 6, 0, 1) if valid.any() else np.zeros(X.shape)
    h = np.where(valid, w * np.nan_to_num(fine) + (1 - w) * nat, nat)
    return h[PAD:-PAD, PAD:-PAD].astype(np.float32)
DEM = {}
for k in sorted(regs):
    if ONLY and k not in ONLY: continue
    DEM[k] = build_dem(k)
print('dem', len(DEM), round(time.time() - t0), 's', flush=True)
def hdem(x, z):
    k = rkey(x, z); d = DEM.get(k)
    if d is None:
        fx = min(max((x - NX0) / NST, 0), NDEM.shape[1] - 1.001); fz = min(max((z - NZ0) / NST, 0), NDEM.shape[0] - 1.001); i = int(fx); j = int(fz); fx -= i; fz -= j
        return float(NDEM[j, i] * (1 - fx) * (1 - fz) + NDEM[j, i + 1] * fx * (1 - fz) + NDEM[j + 1, i] * (1 - fx) * fz + NDEM[j + 1, i + 1] * fx * fz)
    fx = (x - k[0] * REG) / LAT; fz = (z - k[1] * REG) / LAT; i = min(int(fx), NL - 2); j = min(int(fz), NL - 2); fx -= i; fz -= j
    return float(d[j, i] * (1 - fx) * (1 - fz) + d[j, i + 1] * fx * (1 - fz) + d[j + 1, i] * (1 - fx) * fz + d[j + 1, i + 1] * fx * fz)
def enc_dem(d):
    q = np.round(d * 10).astype(np.int64); out = bytearray()
    for row in q:
        prev = 0
        for v in row:
            dv = int(v) - prev; prev = int(v); u = (dv << 1) ^ (dv >> 63)
            while u >= 128: out.append((u & 127) | 128); u >>= 7
            out.append(u)
    return base64.b64encode(bytes(out)).decode()

# ------------------------------------------------------------------ Dachfarbe aus dem Luftbild
tile_cache = {}; lu_cache = {}
def z17(lon, lat):
    fx = (lon + 180) / 360 * 131072; fy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 131072
    tx, ty = int(fx), int(fy); k = (tx, ty)
    if k not in tile_cache:
        p = f'../data/tiles/17/{tx}/{ty}.jpg'
        try: a = np.asarray(Image.open(p).convert('RGB')) if os.path.exists(p) else None
        except Exception: a = None
        if len(tile_cache) > 2500: tile_cache.clear()
        tile_cache[k] = a
    a = tile_cache[k]
    return None if a is None else a[min(255, int((fy - ty) * 256)), min(255, int((fx - tx) * 256))]
def lu14(x, z):
    i, j = math.floor(x / 25600), math.floor(z / 25600); k = (i, j)
    if k not in lu_cache:
        p = f'../data/lu14_{i}_{j}.npy'; lu_cache[k] = np.load(p, mmap_mode='r') if os.path.exists(p) else None
    a = lu_cache[k]
    return None if a is None else a[min(4095, int((z - j * 25600) / 6.25)), min(4095, int((x - i * 25600) / 6.25))]
def roofcol(pg):
    c = pg.centroid; pts = [(c.x, c.y)] + [((c.x + x) / 2, (c.y + y) / 2) for x, y in list(pg.exterior.coords)[:-1:max(1, (len(pg.exterior.coords) - 1) // 4)]]
    acc = []
    for x, z in pts:
        v = z17(lon_of(x), lat_of(z))
        if v is None: v = lu14(x, z)
        if v is not None: acc.append(v)
    if not acc: return 0
    r, g, b = np.mean(np.array(acc, dtype=np.float32), axis=0)
    if r > 247 and g > 247 and b > 247: return 0
    return 4096 + (int(r) >> 4 << 8 | int(g) >> 4 << 4 | int(b) >> 4)

# ------------------------------------------------------------------ OSM einlesen
HW = {'motorway': 0, 'motorway_link': 0, 'trunk': 0, 'trunk_link': 0, 'primary': 1, 'primary_link': 1, 'secondary': 2, 'secondary_link': 2, 'tertiary': 3, 'tertiary_link': 3,
      'residential': 4, 'unclassified': 4, 'living_street': 4, 'service': 5, 'pedestrian': 6, 'footway': 7, 'path': 7, 'cycleway': 7, 'steps': 7}
DEFW = [9, 9, 8, 7, 5.6, 3.6, 5, 3]
roads = []; tunnels = []
R = defaultdict(lambda: dict(bld=[], parts=[], water=[], forest=[], trees=[], poi=[], tw=[]))
def wanted(k): return k in regs and (ONLY is None or k in ONLY)
def on_way(o):
    t = o.tags; hw = t.get('highway')
    if hw:
        c = HW.get(hw)
        if c is None or t.get('area') == 'yes': return
        nd = [(n.ref, wx(n.lon), wz(n.lat)) for n in o.nodes if n.location.valid()]
        if len(nd) < 2: return
        inreg = any((rkey(x, z) in regs) if NATTOO else wanted(rkey(x, z)) for _, x, z in nd[::4] + [nd[-1]])   # mit Landesstrassen: gleiche Teilung wie beim vollen Lauf
        if not inreg and (c > 3 or not NATTOO): return
        tun = t.get('tunnel', 'no'); br = t.get('bridge', 'no') != 'no'
        one = t.get('oneway') == 'yes' or hw.startswith('motorway') or t.get('junction') == 'roundabout'
        name = t.get('name') or t.get('ref') or ''
        if tun not in ('no', 'building_passage'):
            ln = sum(math.hypot(nd[i + 1][1] - nd[i][1], nd[i + 1][2] - nd[i][2]) for i in range(len(nd) - 1))
            if c <= 4 and (ln >= 90 or t.get('layer', '0').startswith('-')): tunnels.append((t.get('tunnel:name') or name, nd, c)); return
            if c > 4: return
        if c == 7 and not br: return
        if c == 5 and t.get('service') in ('driveway', 'parking_aisle', 'drive-through', 'emergency_access'): return
        if c >= 5 and t.get('access') in ('private', 'no'): return
        lanes = num(t.get('lanes')); w = num(t.get('width')) if c == 7 else None
        if w is None:
            if lanes: w = min(16, lanes * 3.2 + 0.8)
            elif hw.endswith('_link'): w = 5
            elif one and c <= 3: w = 6.6
            else: w = DEFW[c]
        roads.append((c, (1 if br else 0) | (2 if one else 0) | (4 if t.get('covered') == 'yes' else 0), name, w, nd))
    elif t.get('natural') == 'tree_row':
        nd = [(wx(n.lon), wz(n.lat)) for n in o.nodes if n.location.valid()]
        if len(nd) < 2 or not wanted(rkey(*nd[0])): return
        ls = LineString(nd); d = 4.0
        while d < ls.length:
            p = ls.interpolate(d); d += 9
            if incov(p.x, p.y): R[rkey(p.x, p.y)]['trees'].append((p.x, p.y, 0))
BT4 = {'church', 'cathedral', 'chapel', 'monastery', 'temple', 'mosque', 'synagogue', 'castle', 'tower', 'city_gate'}
BT3 = {'industrial', 'warehouse', 'garage', 'garages', 'hangar', 'greenhouse', 'service', 'roof', 'carport', 'kiosk', 'transformer_tower', 'bunker', 'storage_tank', 'silo'}
BT5 = {'farm', 'barn', 'farm_auxiliary', 'stable', 'cowshed', 'cabin', 'chalet', 'hut', 'shed', 'sty'}
BT2 = {'commercial', 'retail', 'office', 'supermarket', 'hotel', 'public', 'civic', 'school', 'university', 'college', 'hospital', 'train_station', 'government', 'transportation', 'sports_hall', 'stadium', 'kindergarten', 'parking', 'museum', 'fire_station'}
BT1 = {'apartments', 'residential', 'dormitory', 'terrace'}
LOW = {'garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'kiosk', 'greenhouse', 'sty'}
def on_area(o):
    t = o.tags; b = t.get('building'); bp = t.get('building:part')
    if (b and b != 'no') or (bp and bp != 'no'):
        part = not (b and b != 'no')
        info = (b or bp, num(t.get('height')), num(t.get('building:levels')), t.get('roof:shape'), num(t.get('roof:height')), num(t.get('min_height'), 0) or (num(t.get('building:min_level'), 0) or 0) * 3.1,
                t.get('amenity') == 'place_of_worship' or 'historic' in t, o.orig_id(), b in ('church', 'cathedral') or (t.get('amenity') == 'place_of_worship' and b not in ('chapel',)))
        for outer in o.outer_rings():
            pts = [(wx(n.lon), wz(n.lat)) for n in outer if n.location.valid()]
            if len(pts) < 4: continue
            cx = sum(p[0] for p in pts[:-1]) / (len(pts) - 1); cz = sum(p[1] for p in pts[:-1]) / (len(pts) - 1); k = rkey(cx, cz)
            if wanted(k) and incov(cx, cz): R[k]['parts' if part else 'bld'].append((pts[:-1], info))
        return
    mm = t.get('man_made')
    if mm in ('tower', 'mast', 'communications_tower', 'chimney'):
        h = num(t.get('height'))
        for outer in o.outer_rings():
            pts = [(wx(n.lon), wz(n.lat)) for n in outer if n.location.valid()]
            if len(pts) > 2 and h and h >= 18:
                cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts); k = rkey(cx, cz)
                if wanted(k) and incov(cx, cz): R[k]['tw'].append((cx, cz, h, 1 if mm == 'chimney' else 0))
        return
    nat = t.get('natural'); lu = t.get('landuse')
    isw = nat == 'water' or t.get('waterway') in ('riverbank', 'dock') or lu in ('reservoir', 'basin')
    isf = lu == 'forest' or nat == 'wood'
    if not (isw or isf): return
    if isw and (t.get('leisure') == 'swimming_pool' or t.get('water') in ('pool', 'fountain', 'wastewater') or t.get('tunnel') or t.get('covered') == 'yes'): return
    for outer in o.outer_rings():
        out = [(wx(n.lon), wz(n.lat)) for n in outer if n.location.valid()]
        if len(out) < 4: continue
        xs = [p[0] for p in out]; zs = [p[1] for p in out]
        ks = [(i, j) for i in range(math.floor(min(xs) / REG), math.floor(max(xs) / REG) + 1) for j in range(math.floor(min(zs) / REG), math.floor(max(zs) / REG) + 1) if wanted((i, j))]
        if not ks: continue
        try:
            pg = Polygon(out, [[(wx(n.lon), wz(n.lat)) for n in inner if n.location.valid()] for inner in o.inner_rings(outer)])
            if not pg.is_valid: pg = make_valid(pg)
        except Exception: continue
        for k in ks:
            try: q = pg.intersection(box(k[0] * REG, k[1] * REG, (k[0] + 1) * REG, (k[1] + 1) * REG))
            except Exception: continue
            if q.is_empty or q.area < (120 if isw else 400): continue
            R[k]['water' if isw else 'forest'].append(q)
def on_node(o):
    t = o.tags; x = wx(o.lon); z = wz(o.lat); k = rkey(x, z)
    if not wanted(k) or not incov(x, z): return
    if t.get('natural') == 'tree': R[k]['trees'].append((x, z, 1 if t.get('leaf_type') == 'needleleaved' else 0)); return
    mm = t.get('man_made')
    if mm in ('tower', 'mast', 'communications_tower', 'chimney'):
        h = num(t.get('height'))
        if h and h >= 18: R[k]['tw'].append((x, z, h, 1 if mm == 'chimney' else 0))
        return
    name = t.get('name')
    if not name: return
    kind = None
    if t.get('railway') in ('station', 'halt') and t.get('station') != 'subway': kind = 'bahn'
    elif "jet d'eau" in name.lower(): kind = 'jet'
    if kind: R[k]['poi'].append((name, kind, x, z))
# ------------------------------------------------------------------ swissBUILDINGS3D: echte Dachgeometrie
import zlib
from pyproj import Transformer
TR = Transformer.from_crs(2056, 4326, always_xy=True)
def wall_edges(P, T, fp, inset, ft=None, me=-1):
    """Randkanten des Dachnetzes -> Wandkanten. Aussen: am Gebaeudeumriss. Innen: nur wo das Nachbardach tiefer liegt.
    Jede Kante (a, b) ist so gerichtet, dass (-dz, dx) nach aussen zeigt. Bei geneigten Daechern steht die Wand um den
    Dachvorsprung zurueck: dafuer kommen zusaetzliche Wandpunkte unter der Dachflaeche dazu (dritter Rueckgabewert)."""
    E = {}
    for ti, t in enumerate(T):
        for i in range(3):
            a, b, c = int(t[i]), int(t[(i + 1) % 3]), int(t[(i + 2) % 3]); key = (a, b) if a < b else (b, a)
            E[key] = None if key in E else (a, b, c, ti)
    be = [v for v in E.values() if v is not None]
    if not be: return [], [], []
    be = np.array(be); A = P[be[:, 0]]; Bv = P[be[:, 1]]; C = P[be[:, 2]]
    dx = Bv[:, 0] - A[:, 0]; dz = Bv[:, 2] - A[:, 2]; L = np.hypot(dx, dz); ok = L > .06; be = be[ok]
    if not len(be): return [], [], []
    A = A[ok]; Bv = Bv[ok]; C = C[ok]; dx = dx[ok] / L[ok]; dz = dz[ok] / L[ok]; nx = -dz; nz = dx
    flip = (C[:, 0] - A[:, 0]) * nx + (C[:, 2] - A[:, 2]) * nz > 0
    nx = np.where(flip, -nx, nx); nz = np.where(flip, -nz, nz); ea = np.where(flip, be[:, 1], be[:, 0]); eb = np.where(flip, be[:, 0], be[:, 1])
    mx = (A[:, 0] + Bv[:, 0]) / 2; mz = (A[:, 2] + Bv[:, 2]) / 2; my = (A[:, 1] + Bv[:, 1]) / 2
    outer = shapely.distance(fp.boundary, shapely.points(mx, mz)) < .09
    keep = np.zeros(len(be), bool)
    inn = np.nonzero(~outer)[0]
    if len(inn):
        qx = mx[inn] + nx[inn] * .09; qz = mz[inn] + nz[inn] * .09
        p0 = P[T[:, 0]]; p1 = P[T[:, 1]]; p2 = P[T[:, 2]]
        d = (p1[:, 2] - p2[:, 2]) * (p0[:, 0] - p2[:, 0]) + (p2[:, 0] - p1[:, 0]) * (p0[:, 2] - p2[:, 2]); good = np.abs(d) > 1e-4; d = np.where(good, d, 1)
        w0 = ((p1[:, 2] - p2[:, 2])[None] * (qx[:, None] - p2[:, 0][None]) + (p2[:, 0] - p1[:, 0])[None] * (qz[:, None] - p2[:, 2][None])) / d[None]
        w1 = ((p2[:, 2] - p0[:, 2])[None] * (qx[:, None] - p2[:, 0][None]) + (p0[:, 0] - p2[:, 0])[None] * (qz[:, None] - p2[:, 2][None])) / d[None]
        w2 = 1 - w0 - w1; ins = (w0 >= -1e-3) & (w1 >= -1e-3) & (w2 >= -1e-3) & good[None]
        hh = np.where(ins, w0 * p0[:, 1][None] + w1 * p1[:, 1][None] + w2 * p2[:, 1][None], -1e9).max(axis=1)
        keep[inn] = hh < my[inn] - .3
    oa = ea[outer].copy(); ob = eb[outer].copy(); extra = []
    if inset > 0 and len(oa):
        # Ebene des Dachdreiecks an jeder Aussenkante; flache und senkrechte Flaechen haben keinen Vorsprung
        N = np.cross(Bv - A, C - A)[outer]; nl = np.linalg.norm(N, axis=1); nl[nl == 0] = 1; N = N / nl[:, None]; N[N[:, 1] < 0] *= -1
        de = np.where((N[:, 1] < .97) & (N[:, 1] > .25), inset, 0.0); onx = nx[outer]; onz = nz[outer]; A0 = A[outer]
        if ft is not None and de.any():
            # Brandmauern (Nachbarhaus direkt angebaut): kein Vorsprung, sonst entstehen Spalten zwischen Reihenhaeusern
            qi, ti = ft.query(shapely.points(mx[outer] + onx * .35, mz[outer] + onz * .35), predicate='within'); de[qi[ti != me]] = 0
        if de.any():
            vin = defaultdict(list); vout = defaultdict(list)
            for e in range(len(oa)): vout[int(oa[e])].append(e); vin[int(ob[e])].append(e)
            nP = len(P)
            for v in set(vin) & set(vout):
                if len(vin[v]) != 1 or len(vout[v]) != 1: continue
                e1 = vin[v][0]; e2 = vout[v][0]; d1 = de[e1]; d2 = de[e2]
                if d1 == 0 and d2 == 0: continue
                det = onx[e1] * onz[e2] - onz[e1] * onx[e2]
                if abs(det) < .2: ox_ = -(onx[e1] * d1 + onx[e2] * d2) / 2; oz_ = -(onz[e1] * d1 + onz[e2] * d2) / 2
                else: ox_ = (-d1 * onz[e2] + d2 * onz[e1]) / det; oz_ = (-onx[e1] * d2 + onx[e2] * d1) / det
                lo = math.hypot(ox_, oz_); lim = 2.5 * max(d1, d2)
                if lo > lim: ox_ *= lim / lo; oz_ *= lim / lo
                wx_ = P[v, 0] + ox_; wz_ = P[v, 2] + oz_; ys = []
                for e in (e1, e2):
                    if N[e, 1] > .25: ys.append(A0[e, 1] - (N[e, 0] * (wx_ - A0[e, 0]) + N[e, 2] * (wz_ - A0[e, 2])) / N[e, 1])
                y = min(max(min(ys) if ys else P[v, 1], P[v, 1] - .3), P[v, 1] + 1.2)
                extra.append((wx_, y, wz_)); oa[e2] = nP + len(extra) - 1; ob[e1] = nP + len(extra) - 1
    eo = np.column_stack([oa, ob]).ravel().tolist(); ei = np.column_stack([ea[keep], eb[keep]]).ravel().tolist()
    return eo, ei, extra
B3 = defaultdict(list); seenb = set()
for f in sorted(glob.glob('../data/b3d/t/*.pkl')):
    for b in pickle.load(open(f, 'rb')):
        if b['id'] in seenb: continue
        V = b['V']; lon, lat = TR.transform(V[:, 0], V[:, 1]); x = (lon - LON_C) * KXM; z = -(lat - LAT_C) * KZM
        cx, cz = float(x.mean()), float(z.mean()); k = rkey(cx, cz)
        if not wanted(k) or not incov(cx, cz): continue
        seenb.add(b['id']); B3[k].append((np.column_stack([x, V[:, 2], z]), b['T'], b['kind'], b.get('ground')))
print('b3d buildings', sum(len(v) for v in B3.values()), round(time.time() - t0), 's', flush=True)
stats = dict(n=0, w=0, a=0)
for o in osmium.FileProcessor(pbf).with_locations().with_areas().with_filter(osmium.filter.KeyFilter('highway', 'building', 'building:part', 'natural', 'waterway', 'landuse', 'railway', 'man_made')):
    if o.is_node(): stats['n'] += 1; on_node(o)
    elif o.is_way(): stats['w'] += 1; on_way(o)
    elif o.is_area(): stats['a'] += 1; on_area(o)
print('pass', stats, 'roads', len(roads), 'tunnels', len(tunnels), round(time.time() - t0), 's', flush=True)

# ------------------------------------------------------------------ Strassen: teilen, zuordnen, Brueckenhoehen
cnt = defaultdict(int)
for c, fl, name, w, nd in roads:
    for q in nd: cnt[q[0]] += 1
for name, nd, c in tunnels: cnt[nd[0][0]] += 1; cnt[nd[-1][0]] += 1
pieces = []
for c, fl, name, w, nd in roads:
    cur = [nd[0]]
    for i in range(1, len(nd)):
        cur.append(nd[i])
        if cnt[nd[i][0]] > 1 and i < len(nd) - 1: pieces.append([c, fl, name, w, cur, 0.0, 0.0]); cur = [nd[i]]
    if len(cur) > 1: pieces.append([c, fl, name, w, cur, 0.0, 0.0])
del roads
def plen(nd): return sum(math.hypot(nd[i + 1][1] - nd[i][1], nd[i + 1][2] - nd[i][2]) for i in range(len(nd) - 1))
# Brueckenkomponenten: Deckhoehe linear zwischen den Widerlagern
inc = defaultdict(list)
for i, p in enumerate(pieces): inc[p[4][0][0]].append(i); inc[p[4][-1][0]].append(i)
seen = set(); nb = 0
for i, p in enumerate(pieces):
    if not (p[1] & 1) or i in seen: continue
    comp = []; stack = [i]; seen.add(i)
    while stack:
        j = stack.pop(); comp.append(j)
        for end in (pieces[j][4][0][0], pieces[j][4][-1][0]):
            for k in inc[end]:
                if k not in seen and pieces[k][1] & 1: seen.add(k); stack.append(k)
    nodes = {}
    for j in comp:
        for q in (pieces[j][4][0], pieces[j][4][-1]): nodes[q[0]] = (q[1], q[2])
    anchors = [n for n in nodes if any(not (pieces[k][1] & 1) for k in inc[n]) or len(inc[n]) == 1]
    if not anchors: anchors = list(nodes)[:1]
    adj = defaultdict(list)
    for j in comp:
        a, b = pieces[j][4][0][0], pieces[j][4][-1][0]; L = max(.1, plen(pieces[j][4])); adj[a].append((b, L)); adj[b].append((a, L))
    hs = {}; ws = defaultdict(float); acc = defaultdict(float)
    for a in anchors:
        ha = hdem(*nodes[a]); dist = {a: 0.0}; pq = [(0.0, a)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist.get(u, 1e18): continue
            for v, L in adj[u]:
                if d + L < dist.get(v, 1e18): dist[v] = d + L; heapq.heappush(pq, (d + L, v))
        for n, d in dist.items():
            wgt = 1e9 if d < .01 else 1 / d; ws[n] += wgt; acc[n] += wgt * ha
    for j in comp:
        a, b = pieces[j][4][0][0], pieces[j][4][-1][0]
        pieces[j][5] = max(acc[a] / ws[a], hdem(*nodes[a])) if ws[a] else hdem(*nodes[a]); pieces[j][6] = max(acc[b] / ws[b], hdem(*nodes[b])) if ws[b] else hdem(*nodes[b])
    nb += 1
print('pieces', len(pieces), 'bridge groups', nb, round(time.time() - t0), 's', flush=True)

def dm(v): return int(round(v * 10))
def ring_out(coords, ox, oz):
    out = []; last = None
    for x, y in coords:
        p = (dm(x - ox), dm(y - oz))
        if p != last: out.extend(p); last = p
    if len(out) >= 4 and out[0] == out[-2] and out[1] == out[-1]: out = out[:-2]
    return out
def polys(g):
    if g.is_empty: return []
    if g.geom_type == 'Polygon': return [g]
    if hasattr(g, 'geoms'): return [q for p in g.geoms for q in polys(p)]
    return []
RR = defaultdict(list); NAT = defaultdict(lambda: defaultdict(list)); CELL = 3200.0; TILE = 51200.0
def cut(nd, step):
    """Polylinie an Gitterlinien teilen."""
    out = [[nd[0]]]
    for i in range(1, len(nd)):
        a, b = out[-1][-1], nd[i]; ts = []
        for ax in (0, 1):
            lo, hi = sorted((a[ax], b[ax]))
            for k in range(math.floor(lo / step) + 1, math.floor(hi / step) + 1):
                v = k * step
                if lo < v < hi: ts.append((v - a[ax]) / (b[ax] - a[ax]))
        for t in sorted(ts):
            p = (round(a[0] + (b[0] - a[0]) * t, 1), round(a[1] + (b[1] - a[1]) * t, 1)); out[-1].append(p); out.append([p])
        out[-1].append(b)
    return [o for o in out if len(o) > 1]
nnat = 0
for c, fl, name, w, nd, y0, y1 in pieces:
    xy = [(x, z) for _, x, z in nd]; L = plen(nd)
    if L < 0.5: continue
    ls = LineString(xy); m = ls.interpolate(L / 2); k = rkey(m.x, m.y)
    if wanted(k) and incov(m.x, m.y):
        if c == 5 and L < 18 and cnt[nd[0][0]] + cnt[nd[-1][0]] < 4: continue
        RR[k].append((c, fl, name, w, y0, y1, list(ls.simplify(0.35, preserve_topology=False).coords), ls))
    elif c <= 3 and NATTOO and not (k in regs and incov(m.x, m.y)):   # Strassen bestehender Regionen nicht doppelt
        co = [(round(x, 1), round(y, 1)) for x, y in ls.simplify(2.2, preserve_topology=False).coords]
        segs = cut(co, CELL); tot = sum(LineString(s).length for s in segs) or 1; run = 0
        for s in segs:
            sl = LineString(s).length; ya = y0 + (y1 - y0) * run / tot; run += sl; yb = y0 + (y1 - y0) * run / tot
            mm = LineString(s).interpolate(sl / 2); tk = (math.floor(mm.x / TILE), math.floor(mm.y / TILE)); ck = (math.floor(mm.x / CELL), math.floor(mm.y / CELL))
            NAT[tk][ck].append((c, fl, name, w, ya if fl & 1 else 0, yb if fl & 1 else 0, s)); nnat += 1
del pieces
print('region roads', sum(len(v) for v in RR.values()), 'national pieces', nnat, round(time.time() - t0), 's', flush=True)
natfiles = []
for tk, cells in NAT.items():
    names = []; nidx = {}; out = {}
    for ck, lst in cells.items():
        arr = []
        for c, fl, name, w, ya, yb, s in lst:
            if name not in nidx: nidx[name] = len(names); names.append(name)
            arr.append([c, fl, nidx[name], dm(w), dm(ya), dm(yb)] + ring_out(s, tk[0] * TILE, tk[1] * TILE))
        out[f'{ck[0]},{ck[1]}'] = arr
    sj = json.dumps({'names': names, 'cells': out}, ensure_ascii=False, separators=(',', ':'))
    open(OUT + f'n/{tk[0]}_{tk[1]}.json', 'w', encoding='utf-8').write(sj); natfiles.append([tk[0], tk[1], len(sj)])
if NATTOO: print('national files', len(natfiles), 'MB', round(sum(f[2] for f in natfiles) / 1e6, 1), flush=True)

# ------------------------------------------------------------------ Tunnel -> Portalpaare
portals = []
if not ONLY:
    tinc = defaultdict(list)
    for i, (name, nd, c) in enumerate(tunnels): tinc[nd[0][0]].append(i); tinc[nd[-1][0]].append(i)
    seen = set()
    for i in range(len(tunnels)):
        if i in seen: continue
        comp = []; stack = [i]; seen.add(i)
        while stack:
            j = stack.pop(); comp.append(j)
            for end in (tunnels[j][1][0][0], tunnels[j][1][-1][0]):
                for k in tinc[end]:
                    if k not in seen: seen.add(k); stack.append(k)
        ends = []
        for j in comp:
            nd = tunnels[j][1]
            for q, nx in ((nd[0], nd[1]), (nd[-1], nd[-2])):
                if len(tinc[q[0]]) == 1: ends.append((q, nx))
        if len(ends) != 2: continue
        L = sum(plen(tunnels[j][1]) for j in comp)
        (a, an), (b, bn) = ends
        if not (cnt[a[0]] > 1 and cnt[b[0]] > 1): continue          # beide Portale muessen an eine Strasse anschliessen
        name = next((tunnels[j][0] for j in comp if tunnels[j][0]), '')
        portals.append([round(a[1], 1), round(a[2], 1), round(math.atan2(a[1] - an[1], a[2] - an[2]), 3), round(b[1], 1), round(b[2], 1), round(math.atan2(b[1] - bn[1], b[2] - bn[2]), 3), int(L), name])
    print('portals', len(portals), flush=True)

# ------------------------------------------------------------------ Regionen schreiben
ALP = {p['id'] for p in places if p['kind'] == 'alp'}
alpc = [(wx(p['lon']), wz(p['lat'])) for p in places if p['kind'] == 'alp']
bigc = [(wx(p['lon']), wz(p['lat'])) for p in places if p['kind'] == 'big']
regout = []; hubinfo = {}
def finish(k):
    ox, oz = k[0] * REG, k[1] * REG; D = R[k]; rnd = random.Random(k[0] * 7919 + k[1])
    names = []; nidx = {}; rout = []; rlines = []
    for c, fl, name, w, y0, y1, co, ls in RR.get(k, []):
        if name not in nidx: nidx[name] = len(names); names.append(name)
        rout.append([c, fl, nidx[name], dm(w), dm(y0) if fl & 1 else 0, dm(y1) if fl & 1 else 0] + ring_out(co, ox, oz))
        if c <= 5: rlines.append(ls)
    def mk(xy):
        try:
            pg = Polygon(xy)
            if not pg.is_valid: pg = pg.buffer(0)
            ps = polys(pg.simplify(0.3)); return max(ps, key=lambda p: p.area) if ps else None
        except Exception: return None
    outl = [(mk(xy), info) for xy, info in D['bld']]; outl = [(p, i) for p, i in outl if p is not None and p.area >= 10]
    parts = [(mk(xy), info) for xy, info in D['parts']]; parts = [(p, i) for p, i in parts if p is not None and p.area >= 4 and (i[1] or i[2])]
    drop = set()
    if parts and outl:
        tree = STRtree([p for p, _ in outl])
        for pp, _ in parts:
            rp = pp.representative_point()
            for q in tree.query(rp):
                if outl[q][0].contains(rp): drop.add(int(q))
    # echte Daecher zuordnen: OSM liefert die Nutzung, swisstopo die Form
    b3 = B3.get(k, []); b3out = defaultdict(list); fps = []; votes = defaultdict(list); pdrop = set()
    for V, T, kind, _g in b3:
        try: fp = shapely.union_all(shapely.buffer(shapely.polygons(V[T][:, :, [0, 2]]), 0.03))
        except Exception: fp = Point(float(V[:, 0].mean()), float(V[:, 2].mean())).buffer(2)
        fps.append(fp)
    if fps:
        ft = STRtree(fps)
        for q, (pg, info) in enumerate(outl):
            rp = pg.representative_point(); hits = ft.query(rp, predicate='within')
            for j in hits: votes[int(j)].append((pg.area, info, pg))
            if len(hits): drop.add(q)
        if outl:
            ot = STRtree([p for p, _ in outl])
            for j, fp in enumerate(fps):
                rp = fp.representative_point()
                for q in ot.query(rp, predicate='within'): votes[j].append((outl[q][0].area, outl[q][1], outl[q][0])); drop.add(int(q))
        for q, (pp, _) in enumerate(parts):
            if len(ft.query(pp.representative_point(), predicate='within')): pdrop.add(q)
    for j, (V, T, kind, gnd) in enumerate(b3):
        fp = fps[j]; a = fp.area; cx, cz = float(V[:, 0].mean()), float(V[:, 2].mean())
        core = any(math.hypot(cx - x, cz - z) < 900 for x, z in bigc); alp = any(math.hypot(cx - x, cz - z) < 1500 for x, z in alpc); flags = 0
        if votes[j]:
            _, info, _ = max(votes[j], key=lambda v: v[0]); okind, hist, oid = info[0], info[6], info[7]
            if hist or okind in BT4: ty = 4
            elif okind in BT5: ty = 5
            elif okind in BT3: ty = 3
            elif okind in BT2: ty = 2
            elif okind in BT1: ty = 1
            elif okind in ('house', 'detached', 'semidetached_house', 'bungalow'): ty = 5 if alp and (oid % 5) < 3 else 0
            else: ty = (2 if a > 1500 else 1) if (a > 330 or core) else (5 if alp and (oid % 5) < 3 else 0)
        elif kind in ('Sakrales Gebaeude', 'Kapelle', 'Sakraler Turm'): ty = 4
        elif kind == 'Treibhaus': ty = 2
        elif kind in ('Lagertank', 'Im Bau', 'Kuehlturm', 'Hochkamin', 'Offenes Gebaeude', 'Flugdach'): ty = 3
        else: ty = (2 if a > 1500 else 1) if (a > 330 or core) else (5 if alp and (j % 5) < 3 else 0)
        if kind in ('Offenes Gebaeude', 'Flugdach'): flags |= 1
        Vd = np.round(np.column_stack([(V[:, 0] - ox) * 10, V[:, 1] * 10, (V[:, 2] - oz) * 10])).astype(np.int64)
        uq, inv = np.unique(Vd, axis=0, return_inverse=True); T2 = inv.reshape(-1)[T]; good = (T2[:, 0] != T2[:, 1]) & (T2[:, 1] != T2[:, 2]) & (T2[:, 0] != T2[:, 2]); T2 = T2[good]
        if not len(T2): continue
        used = np.unique(T2); remap = np.full(len(uq), -1, np.int64); remap[used] = np.arange(len(used)); uq = uq[used]; T2 = remap[T2]
        mn = uq.min(axis=0); rel = uq - mn; ps = polys(fp)
        P = uq / 10.0; P[:, 0] += ox; P[:, 2] += oz; ins = 0 if flags or a < 20 or fp.buffer(-1.1).is_empty else (.5 if ty in (0, 5) else .4 if ty in (1, 4) else .2)
        eo, ei, extra = wall_edges(P, T2, fp, ins, ft, j)
        if extra:
            ex = np.array(extra); ex[:, 0] -= ox; ex[:, 2] -= oz; uq = np.vstack([uq, np.maximum(np.round(ex * 10).astype(np.int64), mn[None])]); rel = uq - mn
        if (not eo and not flags) or len(uq) > 65000 or rel.max() > 65000 or mn[1] < 0 or mn[1] > 65000: continue
        g = int(round(gnd * 10)) if gnd is not None and gnd == gnd and 100 < gnd < 6000 else 0
        X = int(mn[0]) + 100000; Z = int(mn[2]) + 100000; ctr = (mn + uq.max(axis=0)) / 20.0
        ck = (min(19, max(0, int(ctr[0] // 400))), min(19, max(0, int(ctr[2] // 400))))
        rc = roofcol(max(ps, key=lambda p: p.area)) if ps else 0
        b3out[ck].append(np.concatenate([[ty | flags << 8, rc, len(uq), len(T2), len(eo) // 2, len(ei) // 2, X & 0xffff, X >> 16, Z & 0xffff, Z >> 16, int(mn[1]), g], rel.ravel(), T2.ravel(), eo, ei]).astype(np.uint16))
    nb3 = sum(len(v) for v in b3out.values()); b3file = OUT + f'r/{k[0]}_{k[1]}.b3z'
    if nb3:
        # Binaerformat: Kopf (uint32: Kennung, Anzahl Chunks, je Chunk [ci | cj << 8, Anzahl, Offset, Laenge]) + uint16-Nutzdaten, zlib-komprimiert
        hd = [0x31443342, len(b3out)]; pay = []; off = 0
        for ck in sorted(b3out):
            n = sum(len(r) for r in b3out[ck]); hd += [ck[0] | ck[1] << 8, len(b3out[ck]), off, n]; off += n; pay += b3out[ck]
        raw = np.array(hd, dtype='<u4').tobytes() + np.concatenate(pay).astype('<u2').tobytes()
        open(b3file, 'wb').write(zlib.compress(raw, 9))
    elif os.path.exists(b3file): os.remove(b3file)
    bout = []
    def emit(pg, info, part):
        kind, h, lev, rshape, rh, base, hist, oid, church = info
        a = pg.area; c = pg.centroid
        core = any(math.hypot(c.x - x, c.y - z) < 900 for x, z in bigc); alp = any(math.hypot(c.x - x, c.y - z) < 1500 for x, z in alpc)
        if hist or kind in BT4: ty = 4
        elif kind in BT5: ty = 5
        elif kind in BT3: ty = 3
        elif kind in BT2: ty = 2
        elif kind in BT1: ty = 1
        elif kind in ('house', 'detached', 'semidetached_house', 'bungalow'): ty = 5 if alp and (oid % 5) < 3 else 0
        else: ty = (2 if a > 1500 else 1) if (a > 330 or core) else (5 if alp and (oid % 5) < 3 else 0)
        j = 0.88 + ((oid * 2654435761) % 1000) / 1000 * 0.26
        if h is None:
            if lev: h = lev * 3.1 + (1.2 if ty in (0, 4, 5) else 0.6)
            elif kind in LOW: h = 3.0
            elif ty == 0: h = 7.4 * j
            elif ty == 5: h = (5.0 if kind in ('shed', 'sty', 'hut', 'cabin') else 7.5) * j
            elif ty == 1: h = (17 if core else 12.5) * j
            elif ty == 2: h = (18 if core else 11) * j
            elif ty == 3: h = 6.5 * j
            else: h = (22 if kind == 'cathedral' else 15 if kind in ('church', 'tower') else 8) * j
        roof = 0
        if rshape in ('pyramidal', 'dome', 'cone', 'hipped', 'onion', 'round') and rh: roof = rh; h = max(h - rh, base + 0.5)
        elif rshape in ('gabled', 'half-hipped', 'gambrel', 'mansard', 'saltbox') and rh: roof = -rh; h = max(h - rh, base + 0.5)
        elif rshape == 'flat': roof = 0.01
        if h - base < 0.8: return
        co = ring_out(list(pg.exterior.coords), ox, oz)
        if len(co) < 6: return
        bout.append([dm(h), ty | (8 if church and not part else 0), dm(roof), dm(base), roofcol(pg)] + co)
    for q, (pg, info) in enumerate(outl):
        if q not in drop: emit(pg, info, False)
    for q, (pg, info) in enumerate(parts):
        if q not in pdrop: emit(pg, info, True)
    wout = []
    if D['water']:
        u = unary_union(D['water']).simplify(1.0)
        for pg in polys(u):
            if pg.area < 150: continue
            wout.append({'o': ring_out(list(pg.exterior.coords), ox, oz), 'h': [ring_out(list(r.coords), ox, oz) for r in pg.interiors if Polygon(r).area > 60]})
    trees = list(D['trees'])
    if len(trees) > 2600: trees = rnd.sample(trees, 2600)
    if D['forest']:
        f = unary_union(D['forest'])
        if not f.is_empty and f.area > 300:
            n = int(min(3400, f.area / 170)); pf = prep(f); fx0, fy0, fx1, fy1 = f.bounds; rt = STRtree(rlines) if rlines else None; q = 0; tries = 0
            while q < n and tries < n * 25:
                tries += 1; x = rnd.uniform(fx0, fx1); z = rnd.uniform(fy0, fy1)
                if not incov(x, z): continue
                p = Point(x, z)
                if not pf.contains(p): continue
                if rt is not None and len(rt.query(p, predicate='dwithin', distance=6)): continue
                trees.append((x, z, 1 if rnd.random() < .6 else 0)); q += 1
    tout = []
    for x, z, ty in trees: tout.extend((int(round((x - ox) / 2)), int(round((z - oz) / 2)), ty))
    seen = set(); pout = []
    for name, kind, x, z in D['poi']:
        if name in seen: continue
        seen.add(name); pout.append([name, kind, dm(x - ox), dm(z - oz)])
    tw = [[dm(x - ox), dm(z - oz), dm(h), kd] for x, z, h, kd in D['tw']]
    data = dict(ix=k[0], iz=k[1], names=names, roads=rout, bld=bout, water=wout, trees=tout, poi=pout, tw=tw, dem=enc_dem(DEM[k]))
    s = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    open(OUT + f'r/{k[0]}_{k[1]}.json', 'w', encoding='utf-8').write(s)
    # Treffpunkte der Orte in dieser Region
    blds = [p for p, _ in outl]
    for p in places:
        px, pz = wx(p['lon']), wz(p['lat'])
        if rkey(px, pz) != k: continue
        tx, tz = px, pz; best = 1e9
        for name, kind, x, z in D['poi']:
            d = math.hypot(x - px, z - pz)
            if kind == 'bahn' and d < best and d < p['r'] * .75: best = d; tx, tz = x, z
        cand = [(c, fl, w, ls) for c, fl, name, w, y0, y1, co, ls in RR.get(k, []) if 1 <= c <= 4 and not fl & 1 and ls.length > 20]
        if not cand: cand = [(c, fl, w, ls) for c, fl, name, w, y0, y1, co, ls in RR.get(k, []) if c <= 5]
        if not cand: hubinfo[p['id']] = [round(px, 1), round(pz, 1), 0, round(px + 6, 1), round(pz + 6, 1), 0]; continue
        T = Point(tx, tz); c, fl, w, ls = min(cand, key=lambda q: q[3].distance(T)); s0 = ls.project(T); a = ls.interpolate(s0); b = ls.interpolate(min(ls.length, s0 + 1) if s0 + 1 <= ls.length else s0 - 1)
        dx, dz = b.x - a.x, b.y - a.y
        if s0 + 1 > ls.length: dx, dz = -dx, -dz
        L = math.hypot(dx, dz) or 1; dx /= L; dz /= L; side = w / 2 + 3.2; bt = STRtree(blds) if blds else None
        hub = None
        for sgn in (1, -1):
            q = Point(a.x - dz * side * sgn, a.y + dx * side * sgn)
            if bt is None or not len(bt.query(q, predicate='dwithin', distance=2.6)): hub = q; break
        if hub is None: hub = a
        s1 = s0 - 13 if s0 > 14 else min(ls.length, s0 + 13); dr = 1 if s0 > 14 else -1; q = ls.interpolate(s1)
        hubinfo[p['id']] = [round(hub.x, 1), round(hub.y, 1), round(math.atan2(dx, dz), 3), round(q.x - dz * dr * 1.2, 1), round(q.y + dx * dr * 1.2, 1), round(math.atan2(dx * dr, dz * dr), 3)]
    return len(rout), len(bout), len(wout), len(tout) // 3, len(s), nb3, (os.path.getsize(b3file) if nb3 else 0)
def run_region(k):
    before = set(hubinfo); r = finish(k); return k, r, {i: v for i, v in hubinfo.items() if i not in before}
tot = 0; todo = [k for k in sorted(regs) if not ONLY or k in ONLY]
import multiprocessing
todo.sort(key=lambda k: -len(B3.get(k, [])))
with multiprocessing.get_context('fork').Pool(int(os.environ.get('JOBS', '4'))) as pool: res = sorted(pool.imap_unordered(run_region, todo))
for k, r, hubs in res:
    hubinfo.update(hubs); tot += r[4] + r[6]; regout.append([k[0], k[1], 1 if r[5] else 0, 1 if os.path.exists(OUT + f'r/{k[0]}_{k[1]}.trz') else 0])
    print(f'{k[0]:3d}_{k[1]:3d} roads {r[0]:5d} b3d {r[5]:6d} bld {r[1]:6d} water {r[2]:3d} trees {r[3]:5d} {r[4] / 1024:7.0f} KB + {r[6] / 1024:6.0f} KB', flush=True)
print('regions total', round(tot / 1e6, 1), 'MB', round(time.time() - t0), 's')
if not ONLY:
    pl = []
    for p in places:
        h = hubinfo.get(p['id'], [wx(p['lon']), wz(p['lat']), 0, wx(p['lon']) + 6, wz(p['lat']) + 6, 0])
        pl.append(dict(id=p['id'], name=p['name'], kind=p['kind'], lu=p['lu'], r=p['r'], x=round(wx(p['lon']), 1), z=round(wz(p['lat']), 1), hub=h,
                       img=[int(v) for v in img_rect(p)]))
    json.dump(pl, open(OUT + 'w/places.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    nd = json.load(open('../data/natdem.json'))
    lus = sorted([int(v) for v in os.path.basename(f)[2:-4].split('_')] for f in glob.glob(OUT + 'w/l_*.jpg'))
    n12 = sorted([int(v) for v in os.path.basename(f)[2:-4].split('_')] for f in glob.glob(OUT + 'w/n_*.jpg'))
    hi = sorted([int(v) for v in os.path.basename(f)[2:-4].split('_')] for f in glob.glob(OUT + 'z/h_*.jpg'))
    json.dump(dict(regions=regout, nat=[[a, b] for a, b, _ in natfiles], lu=lus, n12=n12, hi=hi, dem=nd, tunnels=portals), open(OUT + 'w/index.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print('index written', len(portals), 'tunnels', len(lus), 'lu tiles', len(n12), 'n12 tiles')
else:                                   # nur einzelne Regionen: bestehenden Index und Ortsliste nachfuehren
    ip = OUT + 'w/index.json'; idx = json.load(open(ip)); old = {(r[0], r[1]): r for r in idx['regions']}
    for r in regout: old[(r[0], r[1])] = r
    idx['regions'] = [old[k] for k in sorted(old)]
    if NATTOO: idx['nat'] = [[a, b] for a, b, _ in natfiles]
    idx['hi'] = sorted([int(v) for v in os.path.basename(f)[2:-4].split('_')] for f in glob.glob(OUT + 'z/h_*.jpg'))
    json.dump(idx, open(ip, 'w'), ensure_ascii=False, separators=(',', ':'))
    pp = OUT + 'w/places.json'; prev = {p['id']: p for p in json.load(open(pp))}; pl = []
    for p in places:
        q = prev.get(p['id'])
        if q is None or p['id'] in hubinfo:
            h = hubinfo.get(p['id'], [wx(p['lon']), wz(p['lat']), 0, wx(p['lon']) + 6, wz(p['lat']) + 6, 0])
            q = dict(id=p['id'], name=p['name'], kind=p['kind'], lu=p['lu'], r=p['r'], x=round(wx(p['lon']), 1), z=round(wz(p['lat']), 1), hub=h, img=[int(v) for v in img_rect(p)])
        pl.append(q)
    json.dump(pl, open(pp, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('index nachgefuehrt:', len(idx['regions']), 'Regionen,', len(idx['nat']), 'Landesstrassen-Dateien,', len(pl), 'Orte')
