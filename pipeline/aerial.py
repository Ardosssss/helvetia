"""Luftbild (swisstopo SWISSIMAGE, OGD) pro Ort als ein JPEG."""
import json, math, sys, os, io, time, urllib.request, ssl
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from geo import img_rect, lon_of, lat_of
OUT='../z/'; CACHE='../data/tiles/'; os.makedirs(OUT,exist_ok=True)
places=json.load(open('places.json'))
only=set(sys.argv[1].split(',')) if len(sys.argv)>1 else None
ctx=ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')
opener=urllib.request.build_opener(urllib.request.ProxyHandler({'https':os.environ.get('HTTPS_PROXY','')}) if os.environ.get('HTTPS_PROXY') else urllib.request.ProxyHandler(), urllib.request.HTTPSHandler(context=ctx))
def tile(z,x,y):
    p=f'{CACHE}{z}/{x}/{y}.jpg'
    if os.path.exists(p): return Image.open(p).convert('RGB')
    for k in range(4):
        try:
            d=opener.open(f'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',timeout=30).read()
            os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'wb').write(d); return Image.open(io.BytesIO(d)).convert('RGB')
        except Exception as e:
            if '404' in str(e) or '204' in str(e): return None
            time.sleep(1+k)
    return None
def fx(lon,z): return (lon+180)/360*2**z
def fy(lat,z): return (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z
ex=ThreadPoolExecutor(6)
for p in places:
    if only and p['id'] not in only: continue
    out=OUT+p['id']+'.jpg'
    if os.path.exists(out): continue
    wx0,wz0,wx1,wz1=img_rect(p); z=17; cap=min(4096,round(wx1-wx0))
    x0,x1=fx(lon_of(wx0),z),fx(lon_of(wx1),z); y0,y1=fy(lat_of(wz0),z),fy(lat_of(wz1),z)
    tx0,tx1,ty0,ty1=int(x0),int(x1),int(y0),int(y1)
    jobs=[(x,y) for y in range(ty0,ty1+1) for x in range(tx0,tx1+1)]
    ims=list(ex.map(lambda q: tile(z,q[0],q[1]),jobs))
    mos=Image.new('RGB',((tx1-tx0+1)*256,(ty1-ty0+1)*256),(120,135,110))
    miss=0
    for (x,y),im in zip(jobs,ims):
        if im is None: miss+=1; continue
        mos.paste(im,((x-tx0)*256,(y-ty0)*256))
    crop=mos.crop((round((x0-tx0)*256),round((y0-ty0)*256),round((x1-tx0)*256),round((y1-ty0)*256)))
    crop=crop.resize((cap,cap),Image.LANCZOS)
    crop.save(out,'JPEG',quality=70,optimize=True,progressive=True)
    print(p['id'],p['name'],len(jobs),'tiles',miss,'missing',crop.size,os.path.getsize(out)//1024,'KB',flush=True)
