"""Dachpolygone (mit Loechern) sauber triangulieren und Eckpunkte zusammenfassen."""
import numpy as np, mapbox_earcut as earcut
class Mesh:
    def __init__(self): self.vid = {}; self.V = []; self.T = []
    def ring(self, pts):
        ids = []
        for x, y, z in pts:
            k = (round(float(x), 2), round(float(y), 2), round(float(z), 2)); j = self.vid.get(k)
            if j is None: j = self.vid[k] = len(self.V); self.V.append(k)
            if not ids or ids[-1] != j: ids.append(j)
        while len(ids) > 1 and ids[0] == ids[-1]: ids.pop()
        return ids
    def poly(self, rings):
        """rings: Liste von Punktfolgen (x,y,z); die erste ist der Aussenring."""
        R = [self.ring(r) for r in rings]
        if not R or len(R[0]) < 3: return
        R = [R[0]] + [r for r in R[1:] if len(r) >= 3]
        if len(R) == 1 and len(R[0]) == 3: self.T.append(tuple(R[0])); return
        P = np.array([self.V[i] for i in R[0]]); Q = np.roll(P, -1, axis=0)
        n = np.array([((P[:, 1] - Q[:, 1]) * (P[:, 2] + Q[:, 2])).sum(), ((P[:, 2] - Q[:, 2]) * (P[:, 0] + Q[:, 0])).sum(), ((P[:, 0] - Q[:, 0]) * (P[:, 1] + Q[:, 1])).sum()])
        ax = int(np.argmax(np.abs(n))); keep = [a for a in (0, 1, 2) if a != ax]
        ids = [i for r in R for i in r]; ends = np.cumsum([len(r) for r in R]).astype(np.uint32)
        xy = np.array([[self.V[i][keep[0]], self.V[i][keep[1]]] for i in ids], dtype=np.float64); xy -= xy[0]
        for a, b, c in earcut.triangulate_float64(xy, ends).reshape(-1, 3):
            t = (ids[a], ids[b], ids[c])
            if len(set(t)) == 3: self.T.append(t)
    def arrays(self): return np.array(self.V, dtype=np.float64), np.array(self.T, dtype=np.int32)
