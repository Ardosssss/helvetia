"""Gemeinsame Geometrie: Weltkoordinaten (Meter), LV95, Raster."""
import math, json, os, ssl, urllib.request
LON_C, LAT_C, KXM, KZM = 8.225, 46.81, 76300.0, 111200.0
def wx(lon): return (lon - LON_C) * KXM
def wz(lat): return -(lat - LAT_C) * KZM
def lon_of(x): return LON_C + x / KXM
def lat_of(z): return LAT_C - z / KZM
def img_rect(p):
    """Luftbild-Ausschnitt eines Ortes in Weltkoordinaten (x0, z0, x1, z1), auf das 800-m-Gelaenderaster ausgerichtet,
    damit jede Gelaendekachel im Ort vollstaendig im scharfen Bild liegt."""
    n = max(2, math.ceil((2 * p['r'] + 340) / 800)); x0 = round((wx(p['lon']) - n * 400) / 800) * 800; z0 = round((wz(p['lat']) - n * 400) / 800) * 800
    return x0, z0, x0 + n * 800, z0 + n * 800
REG = 8000.0          # Regionsgroesse
LAT = 25.0            # Gitter
def lv95(lon, lat):
    p = (lat * 3600 - 169028.66) / 10000; l = (lon * 3600 - 26782.5) / 10000
    E = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3
    N = 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3
    return E, N
def wgs(E, N):
    y = (E - 2600000) / 1e6; x = (N - 1200000) / 1e6
    l = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3
    p = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x ** 3
    return l * 100 / 36, p * 100 / 36
_ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
opener = urllib.request.build_opener(urllib.request.ProxyHandler({'https': os.environ.get('HTTPS_PROXY', '')}), urllib.request.HTTPSHandler(context=_ctx))
def fetch(url, path=None, tries=4, timeout=60):
    import time
    if path and os.path.exists(path): return open(path, 'rb').read()
    for k in range(tries):
        try:
            d = opener.open(url, timeout=timeout).read()
            if path: os.makedirs(os.path.dirname(path), exist_ok=True); open(path + '.tmp', 'wb').write(d); os.replace(path + '.tmp', path)
            return d
        except Exception as e:
            if '404' in str(e): return None
            time.sleep(1.5 * (k + 1))
    return None
