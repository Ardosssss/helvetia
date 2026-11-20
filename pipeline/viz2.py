import json, sys, base64, numpy as np
from PIL import Image, ImageDraw
d=json.load(open(sys.argv[1])); S=float(sys.argv[3]) if len(sys.argv)>3 else 0.15   # px per m
cx,cz,half=[float(v) for v in sys.argv[4:7]] if len(sys.argv)>6 else (4000,4000,4000)
raw=base64.b64decode(d['dem']); vals=[]; i=0; N=321
dem=np.zeros((N,N),np.float32)
for r in range(N):
    prev=0
    for c in range(N):
        u=0; sh=0
        while True:
            b=raw[i]; i+=1; u|=(b&127)<<sh; sh+=7
            if b<128: break
        dv=(u>>1)^-(u&1); prev+=dv; dem[r,c]=prev/10
print('dem range',dem.min(),dem.max())
W=int(2*half*S)
gy,gx=np.gradient(dem); hs=np.clip(0.55+(-gx+gy)/25*1.4,0.15,1)
big=np.asarray(Image.fromarray((hs*255).astype(np.uint8)).resize((int(8000*S),int(8000*S)),Image.BILINEAR))
im=Image.fromarray(big).convert('RGB').crop((int((cx-half)*S),int((cz-half)*S),int((cx+half)*S),int((cz+half)*S)))
im=Image.blend(im,Image.new('RGB',im.size,(190,205,170)),0.35); g=ImageDraw.Draw(im)
def P(a): return [((a[i]/10-cx+half)*S,(a[i+1]/10-cz+half)*S) for i in range(0,len(a),2)]
for w in d['water']: g.polygon(P(w['o']),fill=(90,150,210))
col=[(230,120,60),(240,200,80),(250,240,150),(255,255,255),(255,255,255),(235,235,235),(220,200,230),(150,90,40)]
for r in sorted(d['roads'],key=lambda r:-r[0]): g.line(P(r[6:]),fill=(255,0,0) if r[1]&1 else col[r[0]],width=max(1,int(r[3]/10*S)))
for b in d['bld']:
    c=b[4]; rc=((c>>8&15)*17,(c>>4&15)*17,(c&15)*17) if c>=4096 else (160,160,160)
    g.polygon(P(b[5:]),fill=rc,outline=(60,50,40))
for i in range(0,len(d['trees']),3): g.point(((d['trees'][i]*2-cx+half)*S,(d['trees'][i+1]*2-cz+half)*S),fill=(30,110,40))
for t in d['tw']: x,y=P(t[:2])[0]; g.ellipse((x-5,y-5,x+5,y+5),outline=(255,0,255),width=2)
im.save(sys.argv[2])
