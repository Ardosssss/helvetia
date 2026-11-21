import osmium, json, math, re, time, unicodedata
D='../data/'
CIT=[('ZH','Zürich',8.54,47.37,1700,'big'),('GE','Genf',6.14,46.20,1600,'big'),('BS','Basel',7.59,47.56,1600,'big'),('BE','Bern',7.45,46.95,1600,'big'),('LS','Lausanne',6.63,46.52,1500,'big'),('LU','Luzern',8.31,47.05,1600,'big'),
('SG','St. Gallen',9.38,47.42,1200,'town'),('LG','Lugano',8.95,46.00,1200,'town'),('CH','Chur',9.53,46.85,1100,'town'),('SI','Sion',7.36,46.23,1100,'town'),('IN','Interlaken',7.86,46.69,1200,'town'),('NE','Neuenburg',6.93,46.99,1100,'town'),
('WI','Winterthur',8.73,47.50,1200,'town'),('ZE','Zermatt',7.75,46.02,900,'alp'),('DA','Davos',9.83,46.80,900,'alp'),('BZ','Bellinzona',9.02,46.19,1000,'town'),('SH','Schaffhausen',8.63,47.70,1000,'town'),('FR','Freiburg',7.16,46.80,1100,'town'),
('SM','St. Moritz',9.84,46.50,900,'alp'),('AN','Andermatt',8.59,46.63,700,'alp'),('BR','Brig',7.99,46.32,900,'town'),('LO','Locarno',8.80,46.17,1000,'town'),('BI','Biel',7.25,47.14,2000,'town'),('NI','Nidau',7.241,47.125,700,'village'),('PO','Port',7.254,47.115,800,'village'),('TH','Thun',7.63,46.76,1200,'town'),
('OL','Olten',7.90,47.35,1000,'town'),('MO','Montreux',6.91,46.43,1000,'town'),('MA','Martigny',7.07,46.10,900,'town'),('LY','Lyssach',7.582,47.065,900,'village')]
rank={'city':0,'town':1,'village':2}
nodes=[]
t=time.time()
for o in osmium.FileProcessor(D+'ch.osm.pbf', osmium.osm.NODE).with_filter(osmium.filter.KeyFilter('place')):
    p=o.tags.get('place')
    if p in rank and o.tags.get('name'): nodes.append((p,o.tags['name'],o.lon,o.lat,o.tags.get('population')))
print('place nodes',len(nodes),time.time()-t)
out=[]
for key,name,lon,lat,r,kind in CIT:
    best=None
    for p,n,lo,la,pop in nodes:
        d=math.hypot((lo-lon)*76,(la-lat)*111)
        if d<4:
            s=(rank[p],d)
            if best is None or s<best[0]: best=(s,n,lo,la)
    print(key,name,'->',best)
    out.append(dict(id=key,name=name,lon=round(best[2],5),lat=round(best[3],5),r=r,kind=kind,lu=0))
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','',s)
seen={'luzern'}
towns={'Sursee','Willisau','Hochdorf','Emmen','Kriens','Horw','Ebikon'}
for o in osmium.FileProcessor(D+'lu.osm.pbf', osmium.osm.NODE).with_filter(osmium.filter.KeyFilter('place')):
    p=o.tags.get('place'); n=o.tags.get('name')
    if p in rank and n:
        s=slug(n)
        if s in seen: continue
        seen.add(s)
        nm=re.sub(r' LU$','',n)
        big = n in towns
        out.append(dict(id='l_'+s[:14],name=nm,lon=round(o.lon,5),lat=round(o.lat,5),r=900 if big else 600,kind='town' if big else 'village',lu=1))
ids=[p['id'] for p in out]; assert len(ids)==len(set(ids)), [i for i in ids if ids.count(i)>1]
json.dump(out,open('places.json','w'),ensure_ascii=False)
print(len(out),'places')
