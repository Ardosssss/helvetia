"""Landesweite Grundlagen im 1:1-Koordinatensystem: Hoehenmodell 100 m + Seen, Luftbild 25 m/px, Kanton Luzern 6.25 m/px."""
import sys, os, io, math, pickle, json, time
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from scipy import ndimage
from geo import *
Image.MAX_IMAGE_PIXELS = None
OUT = '../w/'; CACHE = '../data/tiles/'
ex = ThreadPoolExecutor(8)
def fx(lon, z): return (lon + 180) / 360 * 2 ** z
def fy(lat, z): return (1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * 2 ** z
def mosaic(z, url, tag, lo0, la0, lo1, la1):
    tx0, tx1 = int(fx(lo0, z)), int(fx(lo1, z)); ty0, ty1 = int(fy(la1, z)), int(fy(la0, z))
    jobs = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    datas = list(ex.map(lambda q: fetch(url.format(z=z, x=q[0], y=q[1]), f'{CACHE}{tag}/{z}/{q[0]}/{q[1]}'), jobs))
    mos = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256), (255, 255, 255)); miss = 0
    for (x, y), d in zip(jobs, datas):
        if d is None: miss += 1; continue
        try: mos.paste(Image.open(io.BytesIO(d)).convert('RGB'), ((x - tx0) * 256, (y - ty0) * 256))
        except Exception: miss += 1
    return mos, tx0, ty0, miss, len(jobs)
def reproject(mos, tx0, ty0, z, x0, z0, size, px):
    """Ausschnitt [x0,x0+size] x [z0,z0+size] (Weltmeter) mit px Pixeln, Nord oben."""
    lo0, lo1 = lon_of(x0), lon_of(x0 + size); mx0, mx1 = (fx(lo0, z) - tx0) * 256, (fx(lo1, z) - tx0) * 256
    lats = lat_of(z0 + (np.arange(px) + .5) / px * size); my = (fy(lats, z) - ty0) * 256
    y0, y1 = int(math.floor(my.min())) - 1, int(math.ceil(my.max())) + 1
    strip = mos.crop((int(round(mx0)), y0, int(round(mx1)), y1)).resize((px, (y1 - y0)), Image.LANCZOS)
    rows = np.clip(np.round(my - y0 - .5).astype(int), 0, y1 - y0 - 1)
    return np.asarray(strip)[rows]
WMTS = 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'
stage = sys.argv[1]
if stage == 'dem':
    ZD = 11; DX0, DX1, DZ0, DZ1, STEP = -180000, 180000, -118000, 118000, 100
    mos, tx0, ty0, miss, n = mosaic(ZD, 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', 'dem', lon_of(DX0) - .05, lat_of(DZ1) - .05, lon_of(DX1) + .05, lat_of(DZ0) + .05)
    print('dem tiles', n, 'missing', miss, mos.size, flush=True)
    a = np.asarray(mos).astype(np.float32); dem = a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768; del a
    rng = ndimage.maximum_filter(dem, 3) - ndimage.minimum_filter(dem, 3)
    flat = ndimage.binary_opening(rng <= 0.35, iterations=1)
    lab, n = ndimage.label(flat); sizes = ndimage.sum(flat, lab, range(1, n + 1))
    mask = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 420]); mask = ndimage.binary_dilation(mask, iterations=1)
    print('lake px', int(mask.sum()), flush=True)
    sd = np.where(mask, -ndimage.distance_transform_edt(mask), ndimage.distance_transform_edt(~mask))
    mpp = 40075016.686 * math.cos(math.radians(46.8)) / 2 ** (ZD + 8)
    xs = np.arange(DX0, DX1 + 1, STEP); zs = np.arange(DZ0, DZ1 + 1, STEP)
    px = (fx(lon_of(xs), ZD) - tx0) * 256 - .5; py = (fy(lat_of(zs), ZD) - ty0) * 256 - .5
    PXg, PYg = np.meshgrid(px, py)
    g = ndimage.map_coordinates(ndimage.uniform_filter(dem, 2), [PYg, PXg], order=1, mode='nearest')
    gs = ndimage.map_coordinates(sd, [PYg, PXg], order=1, mode='nearest') * mpp
    np.savez_compressed('../data/natdem.npz', dem=g.astype(np.float32), sd=gs.astype(np.float32), x0=DX0, z0=DZ0, step=STEP)
    q = np.clip(np.round(g * 4), 0, 65535).astype(np.uint16)
    rgb = np.dstack([(q >> 8).astype(np.uint8), (q & 255).astype(np.uint8), np.clip(np.round(gs / 8) + 128, 1, 255).astype(np.uint8)])
    H2 = rgb.shape[0] // 2
    for k, part in enumerate((rgb[:H2], rgb[H2:])):
        Image.fromarray(part).save(OUT + f'dem{k}.png', optimize=True); print('dem png', k, part.shape, os.path.getsize(OUT + f'dem{k}.png') // 1024, 'KB', flush=True)
    json.dump({'x0': DX0, 'z0': DZ0, 'step': STEP, 'nx': len(xs), 'nz': len(zs), 'split': H2}, open('../data/natdem.json', 'w'))
elif stage == 'nat12':
    Z = 12; S = 102400
    for j in (-1, 0):
        for i in (-2, -1, 0, 1):
            out = OUT + f'n_{i}_{j}.jpg'
            if os.path.exists(out): continue
            mos, tx0, ty0, miss, n = mosaic(Z, WMTS, 'ortho', lon_of(i * S) - .01, lat_of((j + 1) * S) - .01, lon_of((i + 1) * S) + .01, lat_of(j * S) + .01)
            o = reproject(mos, tx0, ty0, Z, i * S, j * S, S, 4096)
            Image.fromarray(o).save(out, 'JPEG', quality=76, optimize=True, progressive=True); print('nat12', i, j, n, 'tiles', miss, 'missing', os.path.getsize(out) // 1024, 'KB', flush=True)
elif stage == 'lu14':
    Z = 14; S = 25600
    from shapely.geometry import box
    lu = pickle.load(open('../data/coverage.pkl', 'rb'))['lu'].buffer(400)
    x0, z0, x1, z1 = lu.bounds
    for i in range(math.floor(x0 / S), math.floor(x1 / S) + 1):
        for j in range(math.floor(z0 / S), math.floor(z1 / S) + 1):
            if not lu.intersects(box(i * S, j * S, (i + 1) * S, (j + 1) * S)): continue
            out = OUT + f'l_{i}_{j}.jpg'
            if os.path.exists(out): continue
            mos, tx0, ty0, miss, n = mosaic(Z, WMTS, 'ortho', lon_of(i * S) - .003, lat_of((j + 1) * S) - .003, lon_of((i + 1) * S) + .003, lat_of(j * S) + .003)
            o = reproject(mos, tx0, ty0, Z, i * S, j * S, S, 4096)
            np.save(f'../data/lu14_{i}_{j}.npy', o)
            Image.fromarray(o).save(out, 'JPEG', quality=74, optimize=True, progressive=True); print('lu14', i, j, n, 'tiles', miss, 'missing', os.path.getsize(out) // 1024, 'KB', flush=True)
