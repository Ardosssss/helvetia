"""Gebaeude- und Wohnungsregister (BFS, OGD): Gebaeudeklasse, Bauperiode und Geschosszahl je EGID.
Quelle: https://public.madd.bfs.admin.ch/<kanton>.zip (hier lu und be), Ergebnis ../data/gwr.pkl fuer regions.py."""
import csv, io, os, pickle, sys, zipfile
from geo import fetch
D = '../data/gwr/'; os.makedirs(D, exist_ok=True)
out = {}
for k in (sys.argv[1:] or ['lu', 'be']):
    z = D + f'gwr_{k}.zip'
    if not os.path.exists(z) and fetch(f'https://public.madd.bfs.admin.ch/{k}.zip', z, timeout=600) is None: sys.exit(f'Download {k} fehlgeschlagen')
    with zipfile.ZipFile(z).open('gebaeude_batiment_edificio.csv') as fh:
        for r in csv.DictReader(io.TextIOWrapper(fh, 'utf-8'), delimiter='\t'):
            try: e = int(r['EGID'])
            except ValueError: continue
            num = lambda s: int(s) if s.isdigit() else 0
            out[e] = (num(r['GKLAS']), num(r['GBAUP']), min(31, num(r['GASTW'])), num(r['GBAUJ']))
pickle.dump(out, open('../data/gwr.pkl', 'wb'), protocol=4)
print(len(out), 'Gebaeude')
