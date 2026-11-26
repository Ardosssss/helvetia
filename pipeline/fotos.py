"""Echte Fotos (Wikimedia Commons, mit GPS) fuer die Fotoansicht im Spiel: ../data/neu/index.jsonl + fotos/ -> ../f/<n>.jpg und ../f/index.json.
Uebernommen werden nur gewoehnliche Fotos; Luftbildserien, Mapillary-Fahrtbilder und Aufnahmen aus dem All bleiben weg.
Jeder Eintrag: [x, z, Bildnummer, Titel, Autor, Lizenz, Lizenz-URL, Quellseite] (x, z in Spielmetern)."""
import json, os, re, sys
from PIL import Image, ImageOps
SRC = sys.argv[1] if len(sys.argv) > 1 else '../data/neu/'; OUT = '../f/'; os.makedirs(OUT, exist_ok=True)
LON_C, LAT_C, KXM, KZM = 8.225, 46.81, 76300, 111200
SKIP = re.compile(r'aerial photograph|Mapillary|ISS0\d\d-E|View of Earth', re.I)
rows = [json.loads(l) for l in open(SRC + 'index.jsonl', encoding='utf-8')]
out = []
for r in sorted(rows, key=lambda r: (r['lat'], r['lon'], r['datei'])):
    if SKIP.search(r['title']) or not os.path.exists(SRC + r['datei']): continue
    n = len(out); p = OUT + f'{n}.jpg'
    if not os.path.exists(p):
        im = ImageOps.exif_transpose(Image.open(SRC + r['datei'])).convert('RGB'); im.thumbnail((1280, 1280)); im.save(p, 'JPEG', quality=80, optimize=True, progressive=True)
    t = re.sub(r'^File:', '', r['title']); t = re.sub(r'\.(jpe?g|png|webp|tiff?)$', '', t, flags=re.I).replace('_', ' ')
    out.append([round((r['lon'] - LON_C) * KXM, 1), round(-(r['lat'] - LAT_C) * KZM, 1), n, t[:120], (r.get('author') or 'unbekannt')[:80], r['license'], r.get('license_url') or '', r['page']])
json.dump(out, open(OUT + 'index.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'Fotos', round(sum(os.path.getsize(OUT + f'{e[2]}.jpg') for e in out) / 1e6, 1), 'MB')
