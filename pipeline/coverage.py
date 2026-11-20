import osmium, json, math, pickle
from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.ops import unary_union
from geo import *
places = json.load(open('places.json'))
polys = []
for o in osmium.FileProcessor('../data/ch.osm.pbf').with_locations().with_areas().with_filter(osmium.filter.KeyFilter('boundary')):
    if o.is_area() and o.tags.get('boundary') == 'administrative' and o.tags.get('admin_level') == '4' and o.tags.get('name') == 'Luzern':
        for outer in o.outer_rings():
            pts = [(wx(n.lon), wz(n.lat)) for n in outer if n.location.valid()]
            polys.append(Polygon(pts, [[(wx(n.lon), wz(n.lat)) for n in inner if n.location.valid()] for inner in o.inner_rings(outer)]))
lu = unary_union(polys).buffer(0)
print('LU area km2', lu.area / 1e6, lu.bounds)
circles = [Point(wx(p['lon']), wz(p['lat'])).buffer(p['r'] + 150, 48) for p in places if not p['lu']]
cov = unary_union([lu.buffer(120)] + circles)
print('coverage km2', cov.area / 1e6, 'parts', len(getattr(cov, 'geoms', [cov])))
pickle.dump({'lu': lu, 'cov': cov}, open('../data/coverage.pkl', 'wb'))
regs = set()
import numpy as np
x0, z0, x1, z1 = cov.bounds
from shapely.geometry import box
for ix in range(math.floor(x0 / REG), math.floor(x1 / REG) + 1):
    for iz in range(math.floor(z0 / REG), math.floor(z1 / REG) + 1):
        if cov.intersects(box(ix * REG, iz * REG, (ix + 1) * REG, (iz + 1) * REG)): regs.add((ix, iz))
print('regions', len(regs))
json.dump(sorted(regs), open('../data/regions.json', 'w'))
