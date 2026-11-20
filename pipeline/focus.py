"""Schwerpunktgebiet fuer besonders genaue Daten (scharfe Luftbilder, echte Baeume): der ganze Kanton Luzern,
dazu ausgewaehlte Orte ausserhalb und die Strasse dazwischen."""
import json, math, os, glob, pickle
import numpy as np
from shapely.geometry import Point, LineString
from shapely.ops import unary_union
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
from geo import *
KANTON = True                                  # ganzer Kanton Luzern (Grenze aus coverage.py)
PLACES = ['BI', 'NI', 'PO']                    # ausserhalb des Kantons: ganzer Ort
ROUTES = [['BI', 'NI', 'PO']]                  # und die Strasse dazwischen
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
def focus_area():
    lu = [pickle.load(open('../data/coverage.pkl', 'rb'))['lu']] if KANTON else []
    return unary_union(lu + [Point(wx(P[i]['lon']), wz(P[i]['lat'])).buffer(P[i]['r'] + 150) for i in PLACES] + [route(r).buffer(260) for r in ROUTES])
