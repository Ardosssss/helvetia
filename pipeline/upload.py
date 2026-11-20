"""Laedt die grossen Spieldaten (w/, r/, n/, z/) in den Cloudflare-R2-Bucket, aus dem das Spiel sie liest (DATA_URL in src/a_core.js).
Uebertragen wird nur, was sich geaendert hat: der Bucket fuehrt in manifest.json die MD5-Summe jeder Datei.
  python3 upload.py test         eine kleine Testdatei hochladen und ueber die oeffentliche Adresse zuruecklesen
  python3 upload.py              alle vier Ordner abgleichen
  python3 upload.py z r          nur diese Ordner
  python3 upload.py --loeschen   zusaetzlich Dateien im Bucket entfernen, die es lokal nicht mehr gibt
Zugang: Cloudflare-API-Token mit dem Recht "Workers R2 Storage: Edit" in CLOUDFLARE_API_TOKEN. In der Entwicklungsumgebung
haengt der Proxy den Token selbst an, dort bleibt die Variable leer."""
import gzip, hashlib, json, os, sys, threading, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from geo import opener
ACCOUNT = os.environ.get('R2_ACCOUNT', '80e87bd79b0b058813d0bd8c09f25feb'); BUCKET = os.environ.get('R2_BUCKET', 'helvetia')
PUBLIC = os.environ.get('R2_PUBLIC', 'https://pub-fb46c74520864c0ab68934bf502da03f.r2.dev/')
API = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects/'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); DIRS = ['w', 'r', 'n', 'z']
TYPES = {'.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'}
FRESH = {'w/index.json', 'w/places.json', 'manifest.json'}      # bei jedem Spielstart neu pruefen; alles andere darf der Browser einen Tag behalten
RATE = 3.3; _lock = threading.Lock(); _next = [0.0]              # Cloudflare erlaubt 1200 API-Aufrufe in 5 Minuten
def call(method, key, body=None, headers=None, tries=6):
    h = dict(headers or {}); tok = os.environ.get('CLOUDFLARE_API_TOKEN')
    if tok: h['Authorization'] = 'Bearer ' + tok
    for k in range(tries):
        with _lock: t = max(time.time(), _next[0]); _next[0] = t + 1 / RATE
        time.sleep(max(0, t - time.time()))
        try:
            with opener.open(urllib.request.Request(API + urllib.request.quote(key), data=body, method=method, headers=h), timeout=120) as r: return r.status, r.read()
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (401, 403, 404) or k == tries - 1: return e.code, msg
            time.sleep(float(e.headers.get('Retry-After') or 0) or 2 ** k)
        except Exception as e:
            if k == tries - 1: return 0, str(e).encode()
            time.sleep(2 ** k)
def put(key, data):
    ext = os.path.splitext(key)[1]; h = {'Content-Type': TYPES.get(ext, 'application/octet-stream'), 'Cache-Control': 'no-cache' if key in FRESH else 'public, max-age=86400'}
    if ext == '.json': data = gzip.compress(data, 9, mtime=0); h['Content-Encoding'] = 'gzip'       # r2.dev komprimiert nicht selbst
    return call('PUT', key, data, h)
def public(key, tries=5):
    for k in range(tries):
        try:
            with opener.open(urllib.request.Request(PUBLIC + key + '?t=' + str(time.time()), headers={'Accept-Encoding': 'gzip'}), timeout=60) as r:
                d = r.read(); return r.status, gzip.decompress(d) if r.headers.get('Content-Encoding') == 'gzip' else d, dict(r.headers)
        except urllib.error.HTTPError as e:
            if k == tries - 1: return e.code, b'', {}
        except Exception as e:
            if k == tries - 1: return 0, str(e).encode(), {}
        time.sleep(1 + k)
def test():
    ok = True
    for key, data in (('_test/test.txt', ('Helvetia Upload-Test ' + time.strftime('%Y-%m-%d %H:%M:%S')).encode()), ('_test/test.json', json.dumps({'test': 'äöü', 'zahlen': list(range(200))}).encode())):
        st, msg = put(key, data)
        if st != 200: print('Hochladen fehlgeschlagen:', key, st, msg.decode(errors='replace')); ok = False; continue
        st, back, hd = public(key); same = back == data
        print(key, 'hochgeladen, oeffentlich gelesen:', st, 'gleich' if same else 'ABWEICHEND', '|', hd.get('Content-Type'), '|', hd.get('Content-Encoding', 'unkomprimiert'), '|', hd.get('Cache-Control')); ok = ok and same
    print('Test', 'bestanden' if ok else 'NICHT bestanden'); return ok
def main(dirs, delete):
    st, d = call('GET', 'manifest.json')
    if st == 200:
        try: d = gzip.decompress(d)
        except OSError: pass
        man = json.loads(d)
    elif st == 404: man = {}
    else: sys.exit(f'Bucket nicht erreichbar ({st}): {d.decode(errors="replace")}')
    local = {}
    for dd in dirs:
        for f in sorted(os.listdir(os.path.join(ROOT, dd))):
            p = os.path.join(ROOT, dd, f)
            if os.path.isfile(p) and not f.startswith('.'): local[dd + '/' + f] = p
    def md5(p):
        with open(p, 'rb') as fh: return hashlib.md5(fh.read()).hexdigest()
    with ThreadPoolExecutor(4) as ex: sums = dict(zip(local, ex.map(md5, local.values())))
    todo = [k for k in sorted(local) if man.get(k) != sums[k]]; todo.sort(key=lambda k: k in FRESH)      # Index zuletzt: er verweist auf die anderen Dateien
    gone = [k for k in sorted(man) if k.split('/')[0] in dirs and k not in local]
    print(len(local), 'Dateien lokal,', len(todo), 'neu oder geaendert,', len(gone), 'nur noch im Bucket' + (' (werden entfernt)' if delete else ''), '|', round(sum(os.path.getsize(local[k]) for k in todo) / 1e6, 1), 'MB', flush=True)
    t0 = time.time(); fail = []; done = [0]; mlock = threading.Lock()
    def save():
        with mlock: body = json.dumps(man, separators=(',', ':'), sort_keys=True).encode()
        return put('manifest.json', body)[0] == 200
    def up(k):
        with open(local[k], 'rb') as fh: st, msg = put(k, fh.read())
        with mlock:
            done[0] += 1
            if st == 200: man[k] = sums[k]
            else: fail.append(k); print('FEHLER', k, st, msg.decode(errors='replace')[:200], flush=True)
            n = done[0]
        if n % 100 == 0:
            print(n, len(todo), round(time.time() - t0), 's', flush=True)
            if n % 500 == 0: save()                                 # Zwischenstand, damit ein Abbruch nicht alles wiederholt
    bulk = [k for k in todo if k not in FRESH]
    with ThreadPoolExecutor(4) as ex: list(ex.map(up, bulk))
    if delete:
        for k in gone:
            st, msg = call('DELETE', k)
            if st in (200, 404): man.pop(k, None)
            else: fail.append(k); print('FEHLER beim Entfernen', k, st, flush=True)
    if fail: save(); sys.exit(f'{len(fail)} Dateien nicht uebertragen, Index nicht aktualisiert. Skript erneut starten.')
    for k in todo:
        if k in FRESH: up(k)
    if fail or not save(): sys.exit('Index oder Verzeichnis nicht uebertragen. Skript erneut starten.')
    print('fertig:', len(todo), 'Dateien uebertragen,', len(man), 'im Bucket,', round(time.time() - t0), 's')
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args == ['test']: sys.exit(0 if test() else 1)
    bad = [a for a in args if a not in DIRS]
    if bad: sys.exit('Unbekannter Ordner: ' + ', '.join(bad))
    main(args or DIRS, '--loeschen' in sys.argv)
