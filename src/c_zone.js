/* ============================================================ Fassaden, Daecher, Materialien */
function zFacade(ty) {                                 // Kachel: 2 Fensterachsen x 2 Geschosse
  const W = 256, cm = document.createElement('canvas'), ce = document.createElement('canvas'); cm.width = cm.height = ce.width = ce.height = W; const g = cm.getContext('2d'), e = ce.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  g.fillStyle = ['#f4f1ea', '#eeeae2', '#dfe4e8', '#e6e6e3', '#e9e3d6', '#8a6242', '#efeeea', '#7d5c3e'][ty]; g.fillRect(0, 0, W, W);
  const im = g.getImageData(0, 0, W, W); for (let i = 0; i < W * W; i++) { const n = (h2(i % W + ty * 31, i / W | 0) - .5) * 12; im.data[i * 4] += n; im.data[i * 4 + 1] += n; im.data[i * 4 + 2] += n; } g.putImageData(im, 0, 0);
  if (ty === 4) { g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 1; for (let y = 0; y < W; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 16 % 2) * 16; x < W; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } }
  if (ty === 3) { g.strokeStyle = 'rgba(0,0,0,.1)'; for (let x = 0; x < W; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, W); g.stroke(); } }
  if (ty === 5) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let y = 0; y < W; y += 9) { g.beginPath(); g.moveTo(0, y + h2(y, 3) * 2); g.lineTo(W, y + h2(y, 4) * 2); g.stroke(); } }
  if (ty === 7) { for (let x = 0; x < W; x += 16) { g.fillStyle = 'rgba(' + (h2(x, 7) < .5 ? '0,0,0,' : '255,230,200,') + (h2(x, 3) * .12).toFixed(3) + ')'; g.fillRect(x, 0, 16, W); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 2, W); } }
  if (ty !== 7) { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 124, W, 3); g.fillRect(0, 252, W, 4); }
  let k = 0;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++, k++) {
    const x0 = c * 128, y0 = r * 128; let ww, wh;
    if (ty === 0) { ww = 40; wh = 58; } else if (ty === 1) { ww = 54; wh = 66; } else if (ty === 2) { ww = 108; wh = 74; } else if (ty === 3) { ww = 70; wh = 22; } else if (ty === 4) { ww = 34; wh = 76; } else if (ty === 6) { ww = 74; wh = 84; } else if (ty === 7) { ww = 22; wh = 20; } else { ww = 36; wh = 44; }
    const wx = x0 + (128 - ww) / 2, wy = y0 + (ty === 3 ? 22 : (124 - wh) / 2 - 4);
    if (ty === 3 && r === 1 && c === 0) continue;
    if (ty === 7 && k !== 1) continue;
    g.fillStyle = ty === 2 ? '#3c5468' : '#33424d'; g.fillRect(wx, wy, ww, wh);
    if (ty === 4) { g.beginPath(); g.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); g.fill(); }
    const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, 'rgba(160,200,230,.38)'); gr.addColorStop(.6, 'rgba(160,200,230,0)'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    g.strokeStyle = ty === 2 ? '#aab4bc' : ty === 6 ? '#3d4146' : ty === 7 ? '#4a3524' : '#fbfaf6'; g.lineWidth = ty === 6 ? 5 : 3; g.strokeRect(wx, wy, ww, wh); g.lineWidth = 2; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); if (ty === 2) { g.moveTo(wx + ww * .25, wy); g.lineTo(wx + ww * .25, wy + wh); g.moveTo(wx + ww * .75, wy); g.lineTo(wx + ww * .75, wy + wh); } else if (ty < 2) { g.moveTo(wx, wy + wh * .42); g.lineTo(wx + ww, wy + wh * .42); } g.stroke();
    if (ty === 0) { g.fillStyle = '#6f7d6c'; g.fillRect(wx - 15, wy - 1, 12, wh + 2); g.fillRect(wx + ww + 3, wy - 1, 12, wh + 2); }
    if (ty === 5) { g.fillStyle = '#3f5a3a'; g.fillRect(wx - 13, wy - 1, 10, wh + 2); g.fillRect(wx + ww + 3, wy - 1, 10, wh + 2); g.fillStyle = '#b3261e'; g.fillRect(wx - 3, wy + wh + 2, ww + 6, 5); }
    if (ty < 2 || ty === 4 || ty === 6) { g.fillStyle = ty === 6 ? '#8d9196' : 'rgba(0,0,0,.2)'; g.fillRect(wx - 4, wy + wh + 2, ww + 8, ty === 6 ? 5 : 4); }
    if (ty === 1 && (k === 1 || k === 2)) { g.fillStyle = '#7b8288'; g.fillRect(wx - 12, wy + wh - 2, ww + 24, 5); g.strokeStyle = '#7b8288'; g.lineWidth = 1.5; for (let q = 0; q <= 6; q++) { g.beginPath(); g.moveTo(wx - 12 + q * (ww + 24) / 6, wy + wh - 24); g.lineTo(wx - 12 + q * (ww + 24) / 6, wy + wh); g.stroke(); } g.beginPath(); g.moveTo(wx - 12, wy + wh - 24); g.lineTo(wx + ww + 12, wy + wh - 24); g.stroke(); }
    if (ty !== 3 && ty !== 7 && (k === 0 || k === 3 || (ty === 2 && k === 1))) { e.fillStyle = k === 0 ? '#ffd9a0' : '#ffe9c4'; e.fillRect(wx, wy, ww, wh); }
  }
  const map = new THREE.CanvasTexture(cm); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; map.wrapS = map.wrapT = THREE.RepeatWrapping; const em = new THREE.CanvasTexture(ce); em.colorSpace = THREE.SRGBColorSpace; em.wrapS = em.wrapT = THREE.RepeatWrapping;
  const m = new THREE.MeshLambertMaterial({ map, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true }); nightMats.push(m); return m;
}
const zFac = [0, 1, 2, 3, 4, 5, 6, 7].map(zFacade);   // 6 modernes Haus, 7 Scheune (Holz)
// Jede Fotokachel deckt zwei Fensterachsen und zwei Stockwerke ab.
function applyFacadePhoto(type, image) {
  const material = zFac[type], photo = imgTexture(image);
  photo.wrapS = photo.wrapT = THREE.RepeatWrapping;
  material.map.dispose();
  if (material.emissiveMap) material.emissiveMap.dispose();
  material.map = photo;
  // Nur die gezeichneten Fenster passen zur ursprünglichen Leuchtmaske.
  material.emissiveMap = null;
  material.emissive.setHex(0x000000);
  material.needsUpdate = true;
}
const facadeChanges = [0, 0, 0, 0];
for (const [type, file] of [[1, 'wohnblock'], [2, 'buero'], [3, 'industrie']]) {
  loadImage('media/fassaden/' + file + '.webp').then(image => {
    if (!facadeChanges[type]) applyFacadePhoto(type, image);
  }).catch(() => {}); // Die gezeichnete Fassade bleibt bei einem Ladefehler sichtbar.
}
// Erdgeschosse: eine Zeile je Bauart, zwei Achsen breit
const zGround = (() => { const W = 256, RH = 128, cvs = document.createElement('canvas'); cvs.width = W; cvs.height = RH * 8; const g = cvs.getContext('2d');
  for (let t = 0; t < 8; t++) { const y0 = (7 - t) * RH; g.fillStyle = ['#ece8de', '#dedad0', '#cfd5da', '#d9d9d5', '#dcd5c5', '#9a958c', '#e9e8e4', '#76563a'][t]; g.fillRect(0, y0, W, RH);
    const im = g.getImageData(0, y0, W, RH); for (let i = 0; i < W * RH; i++) { const n = (h2(i % W + t * 17, i / W | 0) - .5) * 12; im.data[i * 4] += n; im.data[i * 4 + 1] += n; im.data[i * 4 + 2] += n; } g.putImageData(im, 0, y0);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, y0 + RH - 9, W, 9); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, y0, W, 4);
    const door = (x, w, h, c) => { g.fillStyle = c; g.fillRect(x, y0 + RH - 9 - h, w, h); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(x, y0 + RH - 9 - h, w, h); }, win = (x, y, w, h) => { g.fillStyle = '#33424d'; g.fillRect(x, y0 + y, w, h); const gr = g.createLinearGradient(x, y0 + y, x + w, y0 + y + h); gr.addColorStop(0, 'rgba(160,200,230,.4)'); gr.addColorStop(.6, 'rgba(160,200,230,0)'); g.fillStyle = gr; g.fillRect(x, y0 + y, w, h); g.strokeStyle = '#f6f4ee'; g.lineWidth = 3; g.strokeRect(x, y0 + y, w, h); };
    if (t === 0) { door(46, 34, 78, '#6b4a32'); win(152, 34, 44, 56); }
    else if (t === 1) { door(40, 40, 86, '#4a4f55'); win(142, 26, 84, 80); }
    else if (t === 2) { win(10, 22, 108, 92); win(138, 22, 108, 92); }
    else if (t === 3) { g.fillStyle = '#8f969b'; g.fillRect(24, y0 + 26, 96, RH - 35); g.strokeStyle = 'rgba(0,0,0,.25)'; for (let y = y0 + 32; y < y0 + RH - 10; y += 9) { g.beginPath(); g.moveTo(24, y); g.lineTo(120, y); g.stroke(); } win(160, 40, 60, 24); }
    else if (t === 4) { g.fillStyle = '#4b3526'; g.beginPath(); g.moveTo(44, y0 + RH - 9); g.lineTo(44, y0 + 52); g.arc(64, y0 + 52, 20, Math.PI, 0); g.lineTo(84, y0 + RH - 9); g.fill(); win(156, 34, 36, 62); }
    else if (t === 6) { win(18, 22, 110, 90); g.fillStyle = '#3d4146'; g.fillRect(160, y0 + 30, 44, RH - 39); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(166, y0 + 36, 32, 40); }
    else if (t === 7) { for (let x = 0; x < W; x += 16) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y0, 2, RH); } g.fillStyle = '#5a3f28'; g.fillRect(30, y0 + 14, 120, RH - 23); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(30, y0 + 14, 120, RH - 23); g.beginPath(); g.moveTo(90, y0 + 14); g.lineTo(90, y0 + RH - 9); g.moveTo(30, y0 + 14); g.lineTo(90, y0 + RH - 9); g.moveTo(150, y0 + 14); g.lineTo(90, y0 + RH - 9); g.stroke(); }
    else { g.fillStyle = '#5d4027'; g.fillRect(26, y0 + 30, 84, RH - 39); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; g.strokeRect(26, y0 + 30, 84, RH - 39); g.beginPath(); g.moveTo(68, y0 + 30); g.lineTo(68, y0 + RH - 9); g.stroke(); win(160, 44, 40, 40); } }
  const map = new THREE.CanvasTexture(cvs); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; map.wrapS = THREE.RepeatWrapping; return new THREE.MeshLambertMaterial({ map, vertexColors: true }); })();
const zRoofMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const zTileMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#f2f0ec'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y, w, 2.5); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y + 3, w, 2); g.fillStyle = 'rgba(0,0,0,.09)'; for (let x = (y / 16 % 2) * 6; x < w; x += 12) g.fillRect(x, y + 3, 1.5, 13); } const im = g.getImageData(0, 0, w, h); for (let i = 0; i < w * h; i++) { const n = (h2(i % w, i / w | 0) - .5) * 16; im.data[i * 4] += n; im.data[i * 4 + 1] += n; im.data[i * 4 + 2] += n; } g.putImageData(im, 0, 0); }, true) });
const zNoise = canvasTex(128, 128, (g, w, h) => { const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = 200 + (h2(i % w, (i / w | 0) + 9) * 55 | 0); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); }, true);
const zRoadMat = [-1, -2, -3].map(f => new THREE.MeshLambertMaterial({ vertexColors: true, map: zNoise, polygonOffset: true, polygonOffsetFactor: f, polygonOffsetUnits: f * 4, emissive: 0x2e2a24, emissiveIntensity: 0 }));
nightMats.push(...zRoadMat);   // nachts warmer Schimmer der Strassenbeleuchtung
loadImage('media/belag.webp').then(image => {
  const texture = imgTexture(image);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  zRoadMat[0].map = zRoadMat[1].map = texture;
}).catch(() => {});
const zWaterMat = Object.assign(lakeMaterial(), { polygonOffset: true, polygonOffsetFactor: -.5, polygonOffsetUnits: -2 });
const zPropMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const treeTint = [1, .9, .8, 1.1].map(v => new THREE.Color(v, v, v));
const treeAtlas = canvasTex(128, 64, g => {
  for (const x of [32, 96]) { g.fillStyle = '#594b36'; g.fillRect(x - 2, 23, 4, 40); }
  g.fillStyle = '#466a43'; g.beginPath(); g.ellipse(32, 25, 27, 24, 0, 0, TAU); g.fill();
  g.fillStyle = '#365942'; g.beginPath(); g.moveTo(96, 1); g.lineTo(119, 52); g.lineTo(73, 52); g.fill();
});
const treeMat = new THREE.MeshLambertMaterial({ map: treeAtlas, alphaTest: .35 });
loadImage('media/baeume.webp').then(image => {
  treeMat.map = imgTexture(image);
  treeAtlas.dispose();
}).catch(() => {});

function treeCrown(pine) {
  const pos = [], normal = [], uv = [], idx = [], height = pine ? 9.2 : 8.2;
  const u = pine ? .5 : 0;
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI / 3, dx = Math.cos(angle), dz = Math.sin(angle);
    const radius = height / 2, base = pos.length / 3;
    pos.push(-radius*dx,0,-radius*dz, radius*dx,0,radius*dz,
             radius*dx,height,radius*dz, -radius*dx,height,-radius*dz);
    uv.push(u,0, u+.5,0, u+.5,1, u,1);
    // Nach oben und aussen gerichtete Normalen beleuchten die Krone als Volumen.
    normal.push(-.6*dx,.8,-.6*dz, .6*dx,.8,.6*dz, .6*dx,.8,.6*dz, -.6*dx,.8,-.6*dz);
    for (const j of [0,1,2, 0,2,3, 2,1,0, 3,2,0]) idx.push(base + j);
  }
  return geo({position: pos, normal, uv}, idx);
}
const zLeafGeo = treeCrown(false), zFirGeo = treeCrown(true);
const WALLC = [[0xf4efe4, 0xefe2c8, 0xf2d9c4, 0xe7e9e2, 0xf7f3ea, 0xe9d6b8, 0xdfd3c2], [0xe6ddcb, 0xd9cdb8, 0xe9e4d9, 0xcfc7b8, 0xe2cdb4, 0xd4d7d6], [0xc9d2d8, 0xb9c2c9, 0xd9dcdc, 0xaab6bf, 0xe3e3df], [0xb9bbb8, 0xa9aba9, 0xc9c5ba, 0x9aa3a6], [0xd9cfb8, 0xcfc6ae, 0xe3dccb, 0xc4b89c], [0xffffff, 0xe6d2bc, 0xd9c2a6, 0xf2e2cc], [0xf6f6f3, 0xeceae4, 0xe2e0da, 0xd4d6d6, 0xf3eee4, 0xbfc2c4], [0xffffff, 0xeadccb, 0xd9c6b0, 0xc9b8a4]].map(a => a.map(C3));
const ROOFC = { tile: [0x8a4a35, 0x7a3f30, 0x6b4a3f, 0x93553c, 0x5f4a44, 0x7d5a48].map(C3), flat: [0x8c8f91, 0x9a9a94, 0x7d8286, 0xa5a59c, 0x6f7a6c].map(C3), metal: [0xaab0b3, 0x9aa1a5, 0xb9b6ad].map(C3), old: [0x6b5a4f, 0x5a6f63, 0x4f5a60].map(C3) };

/* ============================================================ Strassennetze (Region oder Landesstrassen-Zelle) */
const roadSets = new Set(), GK = (cx, cz) => (cx + 8192) * 16384 + cz + 8192;
const RC = [C3(0x50545a), C3(0x50545a), C3(0x53575c), C3(0x565a5f), C3(0x5b5f63), C3(0x65686b), C3(0xb1ab9d), C3(0x8a6a48)], SWC = C3(0x98968f), WHITE = C3(0xf2f2ec);
function roadPos(rd, s, out) { const c = rd.cum; let lo = 0, hi = rd.n - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c[m] <= s) lo = m; else hi = m - 1; } const P = rd.pts, t = clamp((s - c[lo]) / ((c[lo + 1] - c[lo]) || 1), 0, 1); out.x = P[lo * 2] + (P[lo * 2 + 2] - P[lo * 2]) * t; out.z = P[lo * 2 + 1] + (P[lo * 2 + 3] - P[lo * 2 + 1]) * t; out.tx = P[lo * 2 + 2] - P[lo * 2]; out.tz = P[lo * 2 + 3] - P[lo * 2 + 1]; const l = Math.hypot(out.tx, out.tz) || 1; out.tx /= l; out.tz /= l; return out; }
function makeRoadSet(list, names, ox, oz, urbanAt) {
  const S = { roads: [], nodes: new Map(), rgrid: new Map(), bgrid: new Map(), g: new THREE.Group(), far: [], x0: 1e18, z0: 1e18, x1: -1e18, z1: -1e18 }; S.g.position.set(ox, 0, oz);
  for (const a of list) { const n = (a.length - 6) / 2; if (n < 2) continue; const pts = new Float64Array(n * 2), cum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = pts[i * 2] = ox + a[6 + i * 2] / 10, z = pts[i * 2 + 1] = oz + a[7 + i * 2] / 10; cum[i] = i ? cum[i - 1] + Math.hypot(x - pts[i * 2 - 2], z - pts[i * 2 - 1]) : 0; if (x < S.x0) S.x0 = x; if (x > S.x1) S.x1 = x; if (z < S.z0) S.z0 = z; if (z > S.z1) S.z1 = z; }
    const rd = { ix: S.roads.length, cls: a[0], fl: a[1], name: names[a[2]] || '', w: a[3] / 10, y0: a[4] / 10, y1: a[5] / 10, pts, n, cum, len: cum[n - 1], k0: (ox * 10 + a[6]) + ',' + (oz * 10 + a[7]), k1: (ox * 10 + a[a.length - 2]) + ',' + (oz * 10 + a[a.length - 1]), set: S }; if (rd.len < .3) continue; S.roads.push(rd);
    for (const [k, end] of [[rd.k0, 0], [rd.k1, 1]]) { let l = S.nodes.get(k); if (!l) S.nodes.set(k, l = []); l.push({ rd, end }); }
    for (let i = 0; i < n - 1; i++) { const a0 = Math.floor(Math.min(pts[i * 2], pts[i * 2 + 2]) / 40), a1 = Math.floor(Math.max(pts[i * 2], pts[i * 2 + 2]) / 40), b0 = Math.floor(Math.min(pts[i * 2 + 1], pts[i * 2 + 3]) / 40), b1 = Math.floor(Math.max(pts[i * 2 + 1], pts[i * 2 + 3]) / 40); for (let x = a0; x <= a1; x++) for (let z = b0; z <= b1; z++) { const k = GK(x, z); let l = S.rgrid.get(k); if (!l) S.rgrid.set(k, l = []); l.push(rd.ix, i); if (rd.fl & 1) { let q = S.bgrid.get(k); if (!q) S.bgrid.set(k, q = []); q.push(rd.ix, i); } } } }
  // Baender: dem Gelaende folgend, Bruecken als gerade Fahrbahn zwischen den Widerlagern
  const chunks = new Map(), layer = k => { let c = chunks.get(k); if (!c) chunks.set(k, c = [0, 1, 2].map(() => ({ pos: [], nor: [], col: [], uv: [], idx: [] }))); return c; }, props = [], t = {};
  const PQ = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, col) => { props.push(ax - ox, ay, az - oz, bx - ox, by, bz - oz, cx - ox, cy, cz - oz, ax - ox, ay, az - oz, cx - ox, cy, cz - oz, dx - ox, dy, dz - oz, col); };
  for (const rd of S.roads) { const br = rd.fl & 1, Lc = layer(Math.floor(rd.pts[0] / 1000) + ',' + Math.floor(rd.pts[1] / 1000)), ns = Math.max(1, Math.ceil(rd.len / 8)), ext = rd.cls <= 5 && !br ? rd.w * .45 : 0;
    const strip = (o, w, lift, c, ex) => { const hw = w / 2, base = o.pos.length / 3; let k = 0;
      for (let q = -1; q <= ns + 1; q++) { if ((q === -1 || q === ns + 1) && !ex) continue; let s = clamp(q, 0, ns) / ns * rd.len; roadPos(rd, clamp(s, .01, rd.len - .01), t); let x = t.x, z = t.z; if (q === -1) { x -= t.tx * ex; z -= t.tz * ex; } if (q === ns + 1) { x += t.tx * ex; z += t.tz * ex; }
        const lx = x - t.tz * hw, lz = z + t.tx * hw, rx = x + t.tz * hw, rz = z - t.tx * hw; let yl, yr; if (br) yl = yr = rd.y0 + (rd.y1 - rd.y0) * s / rd.len + lift + .05; else { yl = H(lx, lz) + lift; yr = H(rx, rz) + lift; }
        o.pos.push(lx - ox, yl, lz - oz, rx - ox, yr, rz - oz); o.nor.push(0, 1, 0, 0, 1, 0); o.col.push(c[0], c[1], c[2], c[0], c[1], c[2]); o.uv.push(lx / 4, lz / 4, rx / 4, rz / 4); if (k) { const b = base + (k - 1) * 2; o.idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } k++; } };
    if (urbanAt && rd.cls >= 1 && rd.cls <= 4 && !br && urbanAt(rd.pts[0], rd.pts[1])) strip(Lc[0], rd.w + 3.6, .09, SWC, rd.w * .3);
    strip(Lc[1], rd.w, .17 - rd.cls * .004, RC[rd.cls], ext);
    if (rd.cls >= 1 && rd.cls <= 3 && !(rd.fl & 2) && rd.len > 24) { const o = Lc[2]; for (let s = 6; s < rd.len - 6; s += 10) { roadPos(rd, s, t); const k = o.pos.length / 3, hx = t.tx * 1.6, hz = t.tz * 1.6, nx = -t.tz * .09, nz = t.tx * .09, y = (br ? rd.y0 + (rd.y1 - rd.y0) * s / rd.len + .05 : H(t.x, t.z)) + .22; o.pos.push(t.x - hx + nx - ox, y, t.z - hz + nz - oz, t.x - hx - nx - ox, y, t.z - hz - nz - oz, t.x + hx + nx - ox, y, t.z + hz + nz - oz, t.x + hx - nx - ox, y, t.z + hz - nz - oz); for (let q = 0; q < 4; q++) { o.nor.push(0, 1, 0); o.col.push(WHITE[0], WHITE[1], WHITE[2]); o.uv.push(0, 0); } o.idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    if (br && rd.len > 6) { const hw = rd.w / 2 + .15, cov = rd.fl & 4 && rd.cls >= 6;      // Gelaender, Fahrbahnplatte, Pfeiler; gedeckte Holzbruecke mit Dach
      for (let q = 0; q < ns; q++) { const s0 = q / ns * rd.len, s1 = (q + 1) / ns * rd.len; roadPos(rd, s0 + .01, t); const x1 = t.x, z1 = t.z, nx = -t.tz * hw, nz = t.tx * hw; roadPos(rd, s1 - .01, t); const x2 = t.x, z2 = t.z, ya = rd.y0 + (rd.y1 - rd.y0) * s0 / rd.len + .2, yb = rd.y0 + (rd.y1 - rd.y0) * s1 / rd.len + .2, pc = cov ? 0x7a5636 : 0x9a9c9a;
        for (const sg of [1, -1]) { const wx = nx * sg, wz = nz * sg; PQ(x1 + wx, ya - .7, z1 + wz, x2 + wx, yb - .7, z2 + wz, x2 + wx, yb + 1.05, z2 + wz, x1 + wx, ya + 1.05, z1 + wz, pc);
          if (cov) { const ex = wx * 1.25, ez = wz * 1.25; PQ(x1 + ex, ya + 2.5, z1 + ez, x2 + ex, yb + 2.5, z2 + ez, x2, yb + 3.8, z2, x1, ya + 3.8, z1, 0x6b4630); } }
        PQ(x1 + nx, ya - .7, z1 + nz, x2 + nx, yb - .7, z2 + nz, x2 - nx, yb - .7, z2 - nz, x1 - nx, ya - .7, z1 - nz, 0x7f8280); }
      for (let s = 14; s < rd.len - 8; s += 28) { roadPos(rd, s, t); const yd = rd.y0 + (rd.y1 - rd.y0) * s / rd.len, gr = H(t.x, t.z); if (yd - gr < 4.5) continue; const px = t.tx * .8, pz = t.tz * .8, qx = -t.tz * Math.min(hw * .6, 2.2), qz = t.tx * Math.min(hw * .6, 2.2); for (const [ax, az, bx, bz] of [[px + qx, pz + qz, px - qx, pz - qz], [px - qx, pz - qz, -px - qx, -pz - qz], [-px - qx, -pz - qz, -px + qx, -pz + qz], [-px + qx, -pz + qz, px + qx, pz + qz]]) PQ(t.x + ax, gr - 1, t.z + az, t.x + bx, gr - 1, t.z + bz, t.x + bx, yd - .5, t.z + bz, t.x + ax, yd - .5, t.z + az, 0x8f9290); } }
  }
  for (const [key, Ls] of chunks) { const [cx, cz] = key.split(',').map(Number); Ls.forEach((o, i) => { if (!o.idx.length) return; const m = new THREE.Mesh(geo({ position: o.pos, normal: o.nor, color: o.col, uv: o.uv }, o.idx), zRoadMat[i]); m.receiveShadow = true; m.frustumCulled = false; m.userData.c = { x: cx * 1000 + 500, z: cz * 1000 + 500 }; S.g.add(m); S.far.push(m); }); }
  if (props.length) { const n = props.length / 19, pos = new Float32Array(n * 18), col = new Float32Array(n * 18); for (let i = 0; i < n; i++) { pos.set(props.slice(i * 19, i * 19 + 18), i * 18); const c = C3(props[i * 19 + 18]); for (let q = 0; q < 6; q++) col.set(c, i * 18 + q * 3); } const g = geo({ position: pos, color: col }); g.computeVertexNormals(); const m = new THREE.Mesh(g, zPropMat); m.castShadow = true; m.frustumCulled = false; S.g.add(m); }
  scene.add(S.g); roadSets.add(S); return S;
}
function freeRoadSet(S) { roadSets.delete(S); scene.remove(S.g); S.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
// naechster Punkt auf einer Strasse; liefert {rd, s, x, z, tx, tz, d}
function nearRoad(x, z, maxCls, maxD, noBridge, minCls) { let best = null, bd = maxD; const c0 = Math.floor((x - maxD) / 40), c1 = Math.floor((x + maxD) / 40), d0 = Math.floor((z - maxD) / 40), d1 = Math.floor((z + maxD) / 40), brute = (c1 - c0) * (d1 - d0) > 500; minCls = minCls || 0;
  const test = (rd, i) => { const P = rd.pts, x1 = P[i * 2], z1 = P[i * 2 + 1], dx = P[i * 2 + 2] - x1, dz = P[i * 2 + 3] - z1, l2 = dx * dx + dz * dz || 1, t = clamp(((x - x1) * dx + (z - z1) * dz) / l2, 0, 1), px = x1 + dx * t, pz = z1 + dz * t, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; const l = Math.sqrt(l2); best = { rd, s: rd.cum[i] + t * l, x: px, z: pz, tx: dx / l, tz: dz / l, d }; } };
  for (const S of roadSets) { if (x < S.x0 - maxD || x > S.x1 + maxD || z < S.z0 - maxD || z > S.z1 + maxD) continue;
    if (brute) { for (const rd of S.roads) { if (rd.cls > maxCls || rd.cls < minCls || (noBridge && rd.fl & 1)) continue; for (let i = 0; i < rd.n - 1; i++) test(rd, i); } continue; }
    for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) { const a = S.rgrid.get(GK(cx, cz)); if (!a) continue; for (let q = 0; q < a.length; q += 2) { const rd = S.roads[a[q]]; if (rd.cls > maxCls || rd.cls < minCls || (noBridge && rd.fl & 1)) continue; test(rd, a[q + 1]); } } }
  return best; }
function nodeOpts(key) { let out = null; for (const S of roadSets) { const l = S.nodes.get(key); if (l) out = out ? out.concat(l) : l; } return out || []; }
// Bodenhoehe inkl. Bruecken (y = aktuelle Hoehe des Objekts, damit man auch unter einer Bruecke durchkommt)
function ground(x, z, y) { let g = H(x, z); const k = GK(Math.floor(x / 40), Math.floor(z / 40));
  for (const S of roadSets) { const a = S.bgrid.get(k); if (!a) continue; for (let q = 0; q < a.length; q += 2) { const rd = S.roads[a[q]], i = a[q + 1], P = rd.pts, x1 = P[i * 2], z1 = P[i * 2 + 1], dx = P[i * 2 + 2] - x1, dz = P[i * 2 + 3] - z1, l2 = dx * dx + dz * dz || 1, t = clamp(((x - x1) * dx + (z - z1) * dz) / l2, 0, 1); if (Math.hypot(x - x1 - dx * t, z - z1 - dz * t) > rd.w / 2 + .35) continue; const s = rd.cum[i] + t * Math.sqrt(l2), yd = rd.y0 + (rd.y1 - rd.y0) * s / rd.len + .12; if (y >= yd - 2.6 && yd > g) g = yd; } }
  return g + .1; }

/* ============================================================ Regionen: Gebaeude, Wasser, Baeume auf echtem Gelaende */
function decodeDem(b64) { const raw = atob(b64), out = new Float32Array(NL * NL); let p = 0; for (let r = 0; r < NL; r++) { let prev = 0; for (let c = 0; c < NL; c++) { let u = 0, sh = 0, b; do { b = raw.charCodeAt(p++); u |= (b & 127) << sh; sh += 7; } while (b & 128); prev += (u >>> 1) ^ -(u & 1); out[r * NL + c] = prev / 10; } } return out; }
function regSeg(R, ax, az, bx, bz, h) { const S = R.segArr, id = S.length / 5; S.push(ax, az, bx, bz, h); const x0 = Math.floor(Math.min(ax, bx) / 24), x1 = Math.floor(Math.max(ax, bx) / 24), z0 = Math.floor(Math.min(az, bz) / 24), z1 = Math.floor(Math.max(az, bz) / 24); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = GK(x, z); let a = R.segs.get(k); if (!a) R.segs.set(k, a = []); a.push(id); } }
function collide(x, z, r, y) { hit.on = false; const cx = Math.floor(x / 24), cz = Math.floor(z / 24);
  for (const R of regions.values()) { if (!R.segs || x < R.x0 - 60 || x > R.x0 + REG + 60 || z < R.z0 - 60 || z > R.z0 + REG + 60) continue; const S = R.segArr;
    for (let ax = cx - 1; ax <= cx + 1; ax++) for (let az = cz - 1; az <= cz + 1; az++) { const a = R.segs.get(GK(ax, az)); if (!a) continue;
      for (let q = 0; q < a.length; q++) { const o = a[q] * 5; if (y > S[o + 4]) continue; const x1 = S[o], z1 = S[o + 1], dx = S[o + 2] - x1, dz = S[o + 3] - z1, l2 = dx * dx + dz * dz; const t = l2 > 0 ? clamp(((x - x1) * dx + (z - z1) * dz) / l2, 0, 1) : 0, px = x1 + dx * t, pz = z1 + dz * t; let ex = x - px, ez = z - pz; const d2 = ex * ex + ez * ez; if (d2 >= r * r) continue;
        if (l2 > 0) { const l = Math.sqrt(l2), ox = -dz / l, oz = dx / l; if (ex * ox + ez * oz < 0 && t > 0 && t < 1) { ex = ox; ez = oz; } else if (d2 > 1e-8) { const d = Math.sqrt(d2); ex /= d; ez /= d; } else { ex = ox; ez = oz; } }
        else if (d2 > 1e-8) { const d = Math.sqrt(d2); ex /= d; ez /= d; } else { ex = 1; ez = 0; }
        x = px + ex * r; z = pz + ez * r; hit.on = true; hit.nx = ex; hit.nz = ez; } } }
  hit.x = x; hit.z = z; return hit.on; }
function obb(xs, zs, n) { let best = null; for (let i = 0; i < n; i++) { const j = (i + 1) % n; let dx = xs[j] - xs[i], dz = zs[j] - zs[i]; const l = Math.hypot(dx, dz); if (l < .5) continue; dx /= l; dz /= l; let u0 = 1e18, u1 = -1e18, v0 = 1e18, v1 = -1e18; for (let k = 0; k < n; k++) { const u = xs[k] * dx + zs[k] * dz, v = -xs[k] * dz + zs[k] * dx; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; } const A = (u1 - u0) * (v1 - v0); if (!best || A < best.A) best = { A, dx, dz, u0, u1, v0, v1 }; }
  if (!best) return null; let { dx, dz, u0, u1, v0, v1 } = best, a = (u1 - u0) / 2, b = (v1 - v0) / 2; const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, cx = uc * dx - vc * dz, cz = uc * dz + vc * dx; if (b > a) { const t = a; a = b; b = t; const ndx = -dz, ndz = dx; dx = ndx; dz = ndz; } return { A: best.A, ux: dx, uz: dz, cx, cz, a, b }; }
const tick = () => new Promise(r => setTimeout(r, 0));
async function buildRegion(R, d, b3, tr) {
  const x0 = R.x0, z0 = R.z0, r = rng32(R.ix * 7919 + R.iz * 104729 | 0); R.g.position.set(x0, 0, z0); R.far = []; R.segs = new Map(); R.segArr = []; R.parked = [];
  R.dem = decodeDem(d.dem); if (tr) trInit(R, tr);
  /* Wasser: Maske fuer Schwimmen/Sperren, Gelaende darunter absenken */
  const M = coarse ? 1024 : 2048, sc = M / REG, mc = document.createElement('canvas'); mc.width = mc.height = M; const mg = mc.getContext('2d', { willReadFrequently: true }); mg.fillStyle = '#f00'; const wpolys = [];
  for (const w of d.water) { const mk = a => { const o = []; for (let i = 0; i < a.length; i += 2) o.push(new THREE.Vector2(a[i] / 10, a[i + 1] / 10)); return o; }, con = mk(w.o), holes = (w.h || []).map(mk).filter(h => h.length > 2); if (con.length < 3) continue; wpolys.push([con, holes]);
    mg.beginPath(); for (const ring of [con, ...holes]) { ring.forEach((q, i) => { i ? mg.lineTo(q.x * sc, q.y * sc) : mg.moveTo(q.x * sc, q.y * sc); }); mg.closePath(); } mg.fill('evenodd'); }
  const hc = new Float32Array(R.dem);
  if (wpolys.length) { const id = mg.getImageData(0, 0, M, M).data, wm = new Uint8Array(M * M); for (let i = 0; i < M * M; i++) wm[i] = id[i * 4 + 3] > 127 ? 1 : 0; R.wm = wm; R.wmN = M; R.wsc = sc;
    for (let j = 0; j < NL; j++) for (let i = 0; i < NL; i++) { const u = Math.min(M - 1, i * LATT * sc | 0), v = Math.min(M - 1, j * LATT * sc | 0); if (wm[v * M + u]) hc[j * NL + i] -= 2.4; } }
  R.hc = hc; _lr = null; await tick();
  /* Strassen */
  const towns = PLACES.filter(p => p.kind !== 'village' && p.x > x0 - 2500 && p.x < x0 + REG + 2500 && p.z > z0 - 2500 && p.z < z0 + REG + 2500);
  R.set = makeRoadSet(d.roads, d.names, x0, z0, towns.length ? (x, z) => towns.some(p => Math.hypot(x - p.x, z - p.z) < p.r + 250) : null); R.far.push(...R.set.far); await tick();
  /* Gebaeude */
  const CH = 400, chunks = new Map(), patches = IMGS.filter(im => im.pr === 3 && im.x0 < x0 + REG && im.x1 > x0 && im.z0 < z0 + REG && im.z1 > z0); R.patches = patches; R.hi = IMGS.filter(im => im.pr === 4 && im.x0 < x0 + REG && im.x1 > x0 && im.z0 < z0 + REG && im.z1 > z0); if (b3) b3Init(R, b3);
  const chunk = (x, z) => { const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); let c = chunks.get(k); if (!c) chunks.set(k, c = { w: [0, 1, 2, 3, 4, 5, 6, 7].map(() => ({ pos: [], nor: [], uv: [], col: [], idx: [] })), gf: { pos: [], nor: [], uv: [], col: [], idx: [] }, r: { pos: [], nor: [], col: [] }, rt: { pos: [], nor: [], col: [], uv: [] }, rp: new Map(), x: (Math.floor(x / CH) + .5) * CH + x0, z: (Math.floor(z / CH) + .5) * CH + z0 }); return c; };
  let Rf, Rt, Rp, Pim, rc, tux = 1, tuz = 0;
  const tri = (ax, ay, az, bx, by, bz, cx, cy, cz, c, tile) => { const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-6) return; nx /= l; ny /= l; nz /= l;
    if (tile) { const q = c || rc, U = (x, z) => (x * tux + z * tuz) / 1.1, V = y => y / .42; if (ny < 0) { Rt.pos.push(ax, ay, az, cx, cy, cz, bx, by, bz); nx = -nx; ny = -ny; nz = -nz; Rt.uv.push(U(ax, az), V(ay), U(cx, cz), V(cy), U(bx, bz), V(by)); } else { Rt.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz); Rt.uv.push(U(ax, az), V(ay), U(bx, bz), V(by), U(cx, cz), V(cy)); } Rt.nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); Rt.col.push(q[0], q[1], q[2], q[0], q[1], q[2], q[0], q[1], q[2]); return; }
    const o = Pim && !c ? Rp : Rf;
    if (ny < 0) { o.pos.push(ax, ay, az, cx, cy, cz, bx, by, bz); nx = -nx; ny = -ny; nz = -nz; if (o === Rp) { const U = x => (x + x0 - Pim.x0) / (Pim.x1 - Pim.x0), Vv = z => 1 - (z + z0 - Pim.z0) / (Pim.z1 - Pim.z0); o.uv.push(U(ax), Vv(az), U(cx), Vv(cz), U(bx), Vv(bz)); } }
    else { o.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz); if (o === Rp) { const U = x => (x + x0 - Pim.x0) / (Pim.x1 - Pim.x0), Vv = z => 1 - (z + z0 - Pim.z0) / (Pim.z1 - Pim.z0); o.uv.push(U(ax), Vv(az), U(bx), Vv(bz), U(cx), Vv(cz)); } }
    o.nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); if (o === Rf) { const q = c || rc; o.col.push(q[0], q[1], q[2], q[0], q[1], q[2], q[0], q[1], q[2]); } };
  const B = d.bld; let last = performance.now();
  for (let bi = 0; bi < B.length; bi++) {
    if ((bi & 255) === 0 && performance.now() - last > 14) { await tick(); last = performance.now(); if (R.dead) return; }
    const b = B[bi], h = b[0] / 10, ty = b[1] & 7, church = b[1] & 8, rf = b[2] / 10, base = b[3] / 10, bc = b[4], n = (b.length - 5) / 2; if (n < 3 || h <= base) continue;
    const xs = new Array(n), zs = new Array(n); let S = 0, cx = 0, cz = 0, gmin = 1e9, x0b = 1e9, x1b = -1e9, z0b = 1e9, z1b = -1e9;
    for (let i = 0; i < n; i++) { const x = xs[i] = b[5 + i * 2] / 10, z = zs[i] = b[6 + i * 2] / 10; cx += x; cz += z; if (x < x0b) x0b = x; if (x > x1b) x1b = x; if (z < z0b) z0b = z; if (z > z1b) z1b = z; }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; S += xs[i] * zs[j] - xs[j] * zs[i]; }
    if (S > 0) { xs.reverse(); zs.reverse(); }
    const area = Math.abs(S) / 2; cx /= n; cz /= n; if (coarse && area < 22) continue;
    for (let i = 0; i < n; i += n > 8 ? 2 : 1) { const g = H(xs[i] + x0, zs[i] + z0); if (g < gmin) gmin = g; }
    const gav = Math.max(gmin, H(cx + x0, cz + z0)), bot = gmin - .5 + base, top = gav + h, c = chunk(cx, cz), Wl = c.w[ty], G = c.gf, hs = h2(b[5], b[6]), wc = WALLC[ty][hs * WALLC[ty].length | 0], sh = .9 + h2(b[6], b[5]) * .16, cr = wc[0] * sh, cg = wc[1] * sh, cb = wc[2] * sh;
    const gfTop = base > 0 || top - gav < 4.3 || coarse ? (base > 0 ? bot : top) : gav + 3.1, nf = Math.max(1, Math.round((top - gfTop) / 3.1)), v0 = (ty + .03) / 8, v1 = (ty + .97) / 8;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, dx = xs[j] - xs[i], dz = zs[j] - zs[i], len = Math.hypot(dx, dz); if (len < .05) continue; const nx = -dz / len, nz = dx / len, nb = len < 2 ? 0 : Math.max(1, Math.round(len / 3.4)), u1 = nb ? nb / 2 : .02;
      if (gfTop > bot && base === 0) { const k = G.pos.length / 3; G.pos.push(xs[i], bot, zs[i], xs[j], bot, zs[j], xs[j], gfTop, zs[j], xs[i], gfTop, zs[i]); G.nor.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz); const ua = h2(b[5] + i, b[6]) < .5 ? 0 : .5; G.uv.push(ua, v0, ua + u1, v0, ua + u1, v1, ua, v1); for (let q = 0; q < 4; q++) G.col.push(cr, cg, cb); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
      if (top > gfTop + .3) { const k = Wl.pos.length / 3, lo = base > 0 ? bot : gfTop; Wl.pos.push(xs[i], lo, zs[i], xs[j], lo, zs[j], xs[j], top, zs[j], xs[i], top, zs[i]); Wl.nor.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz); const vv = nb && top - lo >= 2.4 ? nf / 2 : .02; Wl.uv.push(0, 0, u1, 0, u1, vv, 0, vv); for (let q = 0; q < 4; q++) Wl.col.push(cr, cg, cb); Wl.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
      if (base < 2.5) regSeg(R, xs[i] + x0, zs[i] + z0, xs[j] + x0, zs[j] + z0, top); }
    /* Dach: echtes Luftbild auf der Dachflaeche, wo ein scharfes Bild vorliegt; sonst gemessene Dachfarbe */
    Pim = null; for (const im of patches) if (im.x0 <= x0b + x0 - 1 && im.x1 >= x1b + x0 + 1 && im.z0 <= z0b + z0 - 1 && im.z1 >= z1b + z0 + 1) { Pim = im; break; }
    if (Pim) { Rp = c.rp.get(Pim); if (!Rp) c.rp.set(Pim, Rp = { pos: [], nor: [], uv: [] }); }
    Rf = c.r; Rt = c.rt; if (bc >= 4096) { _col.setRGB(Math.min(1, ((bc >> 8 & 15) / 15) * 1.12 + .03), Math.min(1, ((bc >> 4 & 15) / 15) * 1.12 + .03), Math.min(1, ((bc & 15) / 15) * 1.12 + .03), THREE.SRGBColorSpace); rc = [_col.r, _col.g, _col.b]; } else { const pal = ty === 3 ? ROOFC.metal : ty === 4 ? ROOFC.old : ty === 0 || ty >= 5 ? ROOFC.tile : ROOFC.flat; rc = pal[h2(b[5] + 7, b[6]) * pal.length | 0]; }
    let mode = 'flat', rise = 0, O = null;
    if (rf > 0.05) { mode = 'tent'; rise = rf; }
    else if (rf !== 0.01 && (rf < 0 || ((ty === 0 || ty === 5 || (ty === 1 && area < 430) || (ty === 4 && area < 800)) && h - base <= 15 && area > 16 && area < 1150 && base === 0))) { O = obb(xs, zs, n); if (O && area / O.A > .68 && O.b > 1.2) { mode = 'gable'; rise = rf < 0 ? -rf : Math.min(6.2, O.b * (ty === 5 ? .74 : .62)); } }
    const wcol = [cr, cg, cb];
    if (mode === 'tent') { tux = 1; tuz = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(xs[i], top, zs[i], xs[j], top, zs[j], cx, top + rise, cz, null, true); } }
    else if (mode === 'gable') { tux = O.ux; tuz = O.uz; const o = ty === 5 ? 1.0 : .55, ux = O.ux, uz = O.uz, vx = -uz, vz = ux, a = O.a + o, bb = O.b + o, ye = top - o * rise / O.b, yr = top + rise, P = (su, sv) => [O.cx + ux * a * su + vx * bb * sv, O.cz + uz * a * su + vz * bb * sv], Rg = su => [O.cx + ux * a * su, O.cz + uz * a * su];
      for (const sv of [1, -1]) { const p1 = P(-1, sv), p2 = P(1, sv), r1 = Rg(-1), r2 = Rg(1); tri(p1[0], ye, p1[1], p2[0], ye, p2[1], r2[0], yr, r2[1], null, true); tri(p1[0], ye, p1[1], r2[0], yr, r2[1], r1[0], yr, r1[1], null, true); }
      for (const su of [1, -1]) { const q1 = [O.cx + ux * O.a * su + vx * O.b, O.cz + uz * O.a * su + vz * O.b], q2 = [O.cx + ux * O.a * su - vx * O.b, O.cz + uz * O.a * su - vz * O.b], rr = [O.cx + ux * O.a * su, O.cz + uz * O.a * su]; tri(q1[0], top, q1[1], q2[0], top, q2[1], rr[0], yr, rr[1], wcol); } }
    else { const con = []; for (let i = 0; i < n; i++) con.push(new THREE.Vector2(xs[i], zs[i])); let tris; try { tris = THREE.ShapeUtils.triangulateShape(con, []); } catch (e) { tris = []; } for (const t of tris) tri(xs[t[0]], top, zs[t[0]], xs[t[1]], top, zs[t[1]], xs[t[2]], top, zs[t[2]]); }
    if (church) { O = O || obb(xs, zs, n); if (O) { const s = clamp(O.b * 1.3, 4.5, 8.5) / 2, tx = O.cx - O.ux * (O.a - s), tz = O.cz - O.uz * (O.a - s), th = Math.max(top - gav + 9, (top - gav) * 1.9), ty0 = gmin - .5, ty1 = gav + th, W4 = c.w[4], cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => [tx + O.ux * s * q[0] - O.uz * s * q[1], tz + O.uz * s * q[0] + O.ux * s * q[1]]);
        for (let i = 0; i < 4; i++) { const p = cs[i], q = cs[(i + 1) % 4], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz), k = W4.pos.length / 3; W4.pos.push(q[0], ty0, q[1], p[0], ty0, p[1], p[0], ty1, p[1], q[0], ty1, q[1]); const nx = dz / l, nz = -dx / l; W4.nor.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz); W4.uv.push(0, 0, 1, 0, 1, Math.round(th / 3.1) / 2, 0, Math.round(th / 3.1) / 2); for (let w = 0; w < 4; w++) W4.col.push(cr, cg, cb); W4.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); regSeg(R, q[0] + x0, q[1] + z0, p[0] + x0, p[1] + z0, ty1); }
        const sp = h2(b[5], b[6] + 3) < .5 ? [.2, .36, .28] : [.33, .1, .08]; tux = 1; tuz = 0; for (let i = 0; i < 4; i++) { const p = cs[i], q = cs[(i + 1) % 4]; tri(p[0], ty1, p[1], q[0], ty1, q[1], tx, ty1 + s * 3.4, tz, sp, true); } } }
  }
  await tick(); if (R.dead) return;
  for (const c of chunks.values()) {
    const add = (o, mat, uvs) => { if (!o.pos.length) return; const at = { position: o.pos, normal: o.nor }; if (o.col) at.color = o.col; if (uvs) at.uv = o.uv; const m = new THREE.Mesh(geo(at, o.idx || null), mat); m.castShadow = m.receiveShadow = true; m.userData.c = c; R.g.add(m); R.far.push(m); };
    c.w.forEach((o, ty) => add(o, zFac[ty], true)); add(c.gf, zGround, true); add(c.r, zRoofMat, false); add(c.rt, zTileMat, true); for (const [im, o] of c.rp) add(o, roofMatOf(im), true);
  }
  /* Baeume, Masten */
  const ta = [], tb = [], T = d.trees, maxT = coarse ? 1500 : 6000, step = Math.max(1, Math.ceil(T.length / 3 / maxT));
  for (let i = 0; i < T.length; i += 3 * step) { const x = T[i] * 2, z = T[i + 1] * 2; if (R.wm && regWater(R, x + x0, z + z0)) continue; if (R.trCells && R.trCells.has(Math.floor(x / 400) + ',' + Math.floor(z / 400))) continue; const s = .75 + r() * .7, y = H(x + x0, z + z0); (T[i + 2] ? ta : tb).push({ x, z, m: TM(x, y - .2, z, s, s * (.9 + r() * .35), s, 0, r() * TAU, 0), c: treeTint[r() * 4 | 0] }); if (r() < .6) regSeg(R, x + x0, z + z0, x + x0, z + z0, y + 5); }
  instChunks(zFirGeo, treeMat, ta, R.g, 400, true, R.far); instChunks(zLeafGeo, treeMat, tb, R.g, 400, true, R.far);
  for (const im of R.far) if (im.isInstancedMesh) { im.userData.c = { x: im.userData.c.x + x0, z: im.userData.c.z + z0 }; }
  if (d.tw && d.tw.length) { const parts = []; for (const t of d.tw) { const x = t[0] / 10, z = t[1] / 10, hh = t[2] / 10, y = H(x + x0, z + z0), w = clamp(hh / 26, 1.2, 9); if (t[3]) parts.push([new THREE.CylinderGeometry(w * .35, w * .5, hh, 10), 0x9a9c9a, TM(x, y + hh / 2, z)]); else for (let k = 0; k < 7; k++) { const f0 = k / 7, f1 = (k + 1) / 7, wa = lerp(w, .5, f0), wb = lerp(w, .5, f1), g = new THREE.CylinderGeometry(wb * .7, wa * .7, hh / 7, 4, 1, true); parts.push([g, k % 2 ? 0xf2f2f0 : 0xc62828, TM(x, y + hh * (f0 + f1) / 2, z, 1, 1, 1, 0, Math.PI / 4, 0)]); } regSeg(R, x + x0 - w / 2, z + z0, x + x0 + w / 2, z + z0, y + hh); regSeg(R, x + x0, z + z0 - w / 2, x + x0, z + z0 + w / 2, y + hh); }
    const m = new THREE.Mesh(merge(parts), zPropMat); m.castShadow = true; m.frustumCulled = false; R.g.add(m); }
  /* Wasserflaechen auf Hoehe des echten Wasserspiegels */
  if (wpolys.length) { const wpos = [], widx = []; for (const [con, holes] of wpolys) { let tris; try { tris = THREE.ShapeUtils.triangulateShape(con, holes); } catch (e) { continue; } const all = con.concat(...holes), bs = wpos.length / 3; for (const q of all) wpos.push(q.x, rawH(R, q.x + x0, q.y + z0) + .08, q.y); for (const t of tris) { const a = all[t[0]], b = all[t[1]], c = all[t[2]]; if ((b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y) >= 0) widx.push(bs + t[0], bs + t[1], bs + t[2]); else widx.push(bs + t[0], bs + t[2], bs + t[1]); } }
    const g = geo({ position: wpos }, widx), nn = new Float32Array(wpos.length); for (let i = 1; i < nn.length; i += 3) nn[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); const m = new THREE.Mesh(g, zWaterMat); m.frustumCulled = false; m.receiveShadow = true; R.g.add(m); }
  for (const q of d.poi) if (q[1] === 'jet') { const x = q[2] / 10, z = q[3] / 10, j = new THREE.Mesh(new THREE.ConeGeometry(4, 130, 10).translate(0, 65, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .8, emissive: 0x667788 })); j.position.set(x, H(x + x0, z + z0) + 2, z); R.g.add(j); }
  /* parkierte Fahrzeuge */
  const cand = R.set.roads.filter(rd => rd.cls === 4 && !(rd.fl & 1) && rd.len > 34), want = clamp(cand.length / 28 | 0, 4, coarse ? 30 : 70), t = {};
  for (let k = 0; k < want * 4 && R.parked.length < want && cand.length; k++) { const rd = cand[r() * cand.length | 0], s = 8 + r() * (rd.len - 16); roadPos(rd, s, t); const side = r() < .5 ? 1 : -1, off = rd.w / 2 - 1.15, x = t.x - t.tz * off * side, z = t.z + t.tx * off * side;
    if (R.parked.some(q => Math.hypot(q.x - x, q.z - z) < 7) || collide(x, z, 1.4, H(x, z) + 1)) continue; const q = r(); R.parked.push({ x, z, a: Math.atan2(t.tx * side, t.tz * side), kind: q < .5 ? 'sedan' : q < .74 ? 'suv' : q < .9 ? 'sport' : q < .97 ? 'bus' : 'tractor', paint: r() * 8 | 0 }); }
  scene.add(R.g); R.state = 'ready'; dirtyRect(x0 - 30, z0 - 30, x0 + REG + 30, z0 + REG + 30, 1);
}
/* ---------- echte Dachformen (swisstopo swissBUILDINGS3D): Dach aus Messdaten, Waende von den Dachkanten bis zum Boden.
   Je Region eine Binaerdatei; die 400-m-Chunks werden erst in der Naehe des Spielers gebaut und danach wieder freigegeben. */
const regB3 = new Set(), B3X = new Float32Array(65536), B3Y = new Float32Array(65536), B3Z = new Float32Array(65536);
async function inflate(buf) { return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer(); }
function b3Init(R, buf) { const h = new Uint32Array(buf, 0, 2); if (h[0] !== 0x31443342) return; const nC = h[1], dir = new Uint32Array(buf, 8, nC * 4), U = new Uint16Array(buf, 8 + nC * 16), ch = [];
  for (let i = 0; i < nC; i++) ch.push({ x: ((dir[i * 4] & 255) + .5) * 400 + R.x0, z: ((dir[i * 4] >> 8) + .5) * 400 + R.z0, n: dir[i * 4 + 1], off: dir[i * 4 + 2], ms: null, lod: 0, seg: false }); R.b3 = { U, ch }; }
function b3Free(R, C) { if (!C.ms) return; for (const m of C.ms) { R.g.remove(m); m.geometry.dispose(); } const dead = new Set(C.ms); R.far = R.far.filter(m => !dead.has(m)); C.ms = null; C.lod = 0; }
function b3Build(R, C, lod) {
  const U = R.b3.U, x0 = R.x0, z0 = R.z0, full = lod === 2, old = C.ms;
  const mk = (uv, col, idx) => ({ pos: [], nor: [], uv: uv ? [] : null, col: col ? [] : null, idx: idx ? [] : null });
  const W = [0, 1, 2, 3, 4, 5, 6, 7].map(() => mk(1, 1, 1)), G = mk(1, 1, 1), Rf = mk(0, 1, 0), Rt = mk(1, 1, 0), RP = new Map();
  const quad = (o, ax, az, bx, bz, a0, b0, a1, b1, nx, nz, u0, u1, va0, vb0, va1, vb1, r, g, b, dk = 1) => { const k = o.pos.length / 3, r0 = r * dk | 0, g0 = g * dk | 0, b0_ = b * dk | 0; o.pos.push(ax, a0, az, bx, b0, bz, bx, b1, bz, ax, a1, az); o.nor.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz); o.uv.push(u0, va0, u1, vb0, u1, vb1, u0, va1); o.col.push(r0, g0, b0_, r0, g0, b0_, r, g, b, r, g, b); o.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const flatq = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, nz, r, g, b) => { Rf.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz); for (let i = 0; i < 6; i++) { Rf.nor.push(nx, 0, nz); Rf.col.push(r, g, b); } };
  let p = C.off;
  for (let bi = 0; bi < C.n; bi++) {
    const p0 = p, ty = U[p] & 7, fl = U[p] >> 8, nfl = U[p] >> 3 & 31, bc = U[p + 1], nV = U[p + 2], nT = U[p + 3], nE = U[p + 4], nI = U[p + 5], bx = (U[p + 6] + U[p + 7] * 65536 - 100000) / 10, bz = (U[p + 8] + U[p + 9] * 65536 - 100000) / 10, by = U[p + 10] / 10, gr = U[p + 11] / 10;
    const v0 = p + 12, t0 = v0 + nV * 3, e0 = t0 + nT * 3, i0 = e0 + nE * 2; p = i0 + nI * 2;
    let ymin = 1e9, xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9;
    for (let i = 0; i < nV; i++) { const x = B3X[i] = bx + U[v0 + i * 3] / 10, y = B3Y[i] = by + U[v0 + i * 3 + 1] / 10, z = B3Z[i] = bz + U[v0 + i * 3 + 2] / 10; if (y < ymin) ymin = y; if (x < xa) xa = x; if (x > xb) xb = x; if (z < za) za = z; if (z > zb) zb = z; }
    if (coarse && (xb - xa) * (zb - za) < 22) continue;
    /* Boden im Spiel: das Gebaeude wird so gesetzt, dass es gleich hoch ueber dem Gelaende steht wie in echt */
    const cx = (xa + xb) / 2, cz = (za + zb) / 2, gc = H(cx + x0, cz + z0); let gmin = 1e9;
    for (let i = 0; i < nE; i += nE > 10 ? 2 : 1) { const a = U[e0 + i * 2], g = H(B3X[a] + x0, B3Z[a] + z0); if (g < gmin) gmin = g; }
    if (gmin > 1e8) gmin = gc; const gav = Math.max(gmin, gc);
    let sh = gr ? clamp(gmin - gr, -5, 5) : 0; if (ymin + sh < gmin + 2.1) sh = gmin + 2.1 - ymin;
    if (sh) { for (let i = 0; i < nV; i++) B3Y[i] += sh; ymin += sh; }
    const hs = h2(U[p0 + 6], U[p0 + 8]), wc = WALLC[ty][hs * WALLC[ty].length | 0], sd = (.9 + h2(U[p0 + 8], U[p0 + 6]) * .16) * 255, cr = Math.min(255, wc[0] * sd) | 0, cg = Math.min(255, wc[1] * sd) | 0, cb = Math.min(255, wc[2] * sd) | 0;
    let rr, rg, rb; if (bc >= 4096) { /* gemessene Dachfarbe: etwas kraeftiger und dunkler, weil die Sonne im Spiel die Dachflaeche zusaetzlich aufhellt */ const q0 = (bc >> 8 & 15) / 15, q1 = (bc >> 4 & 15) / 15, q2 = (bc & 15) / 15, qm = (q0 + q1 + q2) / 3; _col.setRGB(clamp((qm + (q0 - qm) * 1.05 + (q0 - q1) * .12) * .9, 0, 1), clamp((qm + (q1 - qm) * .8) * .9, 0, 1), clamp((qm + (q2 - qm) * 1.05) * .9, 0, 1), THREE.SRGBColorSpace); rr = _col.r * 255 | 0; rg = _col.g * 255 | 0; rb = _col.b * 255 | 0; } else { const pal = ty === 3 ? ROOFC.metal : ty === 4 ? ROOFC.old : ty === 0 || ty >= 5 ? ROOFC.tile : ROOFC.flat, q = pal[h2(U[p0 + 6] + 7, U[p0 + 8]) * pal.length | 0]; rr = q[0] * 255 | 0; rg = q[1] * 255 | 0; rb = q[2] * 255 | 0; }
    let Pim = null, Rp = null; if (full) for (const im of R.hi) if (im.state === 'ready' && im.x0 <= xa + x0 && im.x1 >= xb + x0 && im.z0 <= za + z0 && im.z1 >= zb + z0) { Pim = im; break; }
    if (!Pim) for (const im of R.patches) if (im.x0 <= xa + x0 - 1 && im.x1 >= xb + x0 + 1 && im.z0 <= za + z0 - 1 && im.z1 >= zb + z0 + 1) { Pim = im; break; }
    if (Pim) { Rp = RP.get(Pim); if (!Rp) RP.set(Pim, Rp = mk(1, 0, 0)); }
    /* Dachflaechen */
    for (let i = 0; i < nT; i++) { const a = U[t0 + i * 3]; let b = U[t0 + i * 3 + 1], c = U[t0 + i * 3 + 2];
      const ax = B3X[a], ay = B3Y[a], az = B3Z[a]; let ux = B3X[b] - ax, uy = B3Y[b] - ay, uz = B3Z[b] - az, vx = B3X[c] - ax, vy = B3Y[c] - ay, vz = B3Z[c] - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-5) continue; nx /= l; ny /= l; nz /= l;
      if (ny < 0) { const t = b; b = c; c = t; nx = -nx; ny = -ny; nz = -nz; }
      const qx = B3X[b], qy = B3Y[b], qz = B3Z[b], sx = B3X[c], sy = B3Y[c], sz = B3Z[c], o = ny >= .35 && Rp ? Rp : ny >= .97 || ny < .2 ? Rf : Rt, n1 = nx * 127 | 0, n2 = ny * 127 | 0, n3 = nz * 127 | 0;
      o.pos.push(ax, ay, az, qx, qy, qz, sx, sy, sz); o.nor.push(n1, n2, n3, n1, n2, n3, n1, n2, n3);
      if (o === Rt) { const hl = Math.hypot(nx, nz), tx = -nz / hl / 1.1, tz = nx / hl / 1.1, vs = 1 / (.73 * hl); o.uv.push((ax - bx) * tx + (az - bz) * tz, (ay - by) * vs, (qx - bx) * tx + (qz - bz) * tz, (qy - by) * vs, (sx - bx) * tx + (sz - bz) * tz, (sy - by) * vs); o.col.push(rr, rg, rb, rr, rg, rb, rr, rg, rb); }
      else if (o === Rp) { const ku = 1 / (Pim.x1 - Pim.x0), kv = 1 / (Pim.z1 - Pim.z0), ou = x0 - Pim.x0, ov = z0 - Pim.z0; o.uv.push((ax + ou) * ku, 1 - (az + ov) * kv, (qx + ou) * ku, 1 - (qz + ov) * kv, (sx + ou) * ku, 1 - (sz + ov) * kv); }
      else if (ny < .2) o.col.push(cr, cg, cb, cr, cg, cb, cr, cg, cb); else o.col.push(rr, rg, rb, rr, rg, rb, rr, rg, rb); }
    if (fl & 1) { /* offene Bauten: Stuetzen statt Waende */
      const bot = gmin - .3, st = Math.max(1, Math.ceil(nE / 8)), w = .13;
      for (let i = 0; i < nE; i += st) { const a = U[e0 + i * 2], x = B3X[a] + (cx - B3X[a]) * .04, z = B3Z[a] + (cz - B3Z[a]) * .04, t = B3Y[a] - .04; if (t - bot < 1) continue;
        flatq(x - w, bot, z - w, x + w, bot, z - w, x + w, t, z - w, x - w, t, z - w, 0, -127, 105, 108, 110); flatq(x + w, bot, z + w, x - w, bot, z + w, x - w, t, z + w, x + w, t, z + w, 0, 127, 105, 108, 110);
        flatq(x - w, bot, z + w, x - w, bot, z - w, x - w, t, z - w, x - w, t, z + w, -127, 0, 95, 98, 100); flatq(x + w, bot, z - w, x + w, bot, z + w, x + w, t, z + w, x + w, t, z - w, 127, 0, 95, 98, 100); }
      continue; }
    /* Aussenwaende: Erdgeschoss + Obergeschosse, oben schraeg der Dachkante folgend */
    const bot = gmin - .5, gfTop = gav + 3.1, vg0 = (ty + .03) / 8, vg1 = (ty + .97) / 8, Wl = W[ty];
    for (let i = 0; i < nE; i++) { const a = U[e0 + i * 2], b = U[e0 + i * 2 + 1], ax = B3X[a], az = B3Z[a], qx = B3X[b], qz = B3Z[b], dx = qx - ax, dz = qz - az, len = Math.hypot(dx, dz); if (len < .05) continue;
      const nx = -dz / len * 127 | 0, nz = dx / len * 127 | 0, nb = len < 2 ? 0 : Math.max(1, Math.round(len / 3.4)), u1 = nb ? nb / 2 : .02, ya = B3Y[a], yb = B3Y[b], hi = Math.max(ya, yb), lev = Math.abs(ya - yb) < .25;
      if (hi <= bot + .2) continue;
      const up = (lo, A, Bq) => { if (!nb || hi - lo < 2.4) return [.02, .02]; if (lev) { const real = nfl ? (lo > bot + 1 ? nfl - 1 : nfl) : 0, est = Math.round((hi - lo) / 3.1), f = Math.max(1, real && Math.abs(real - est) <= Math.max(1, est * .4) ? real : est) / 2; return [f, f]; } return [Math.max(0, A - lo) / 6.2, Math.max(0, Bq - lo) / 6.2]; };
      if (full && hi - gav >= 4.3) { const ga = Math.min(ya, gfTop), gb = Math.min(yb, gfTop), ua = h2(U[p0 + 6] + i, U[p0 + 8]) < .5 ? 0 : .5, k = (vg1 - vg0) / (gfTop - bot);
        quad(G, ax, az, qx, qz, bot, bot, ga, gb, nx, nz, ua, ua + u1, vg0, vg0, vg0 + (ga - bot) * k, vg0 + (gb - bot) * k, cr, cg, cb, .68);
        if (ya > gfTop + .05 || yb > gfTop + .05) { const v = up(gfTop, ya, yb); quad(Wl, ax, az, qx, qz, ga, gb, ya, yb, nx, nz, 0, u1, 0, 0, v[0], v[1], cr, cg, cb); } }
      else if (full) { const ua = h2(U[p0 + 6] + i, U[p0 + 8]) < .5 ? 0 : .5, k = (vg1 - vg0) / Math.max(3.3, hi - bot); quad(G, ax, az, qx, qz, bot, bot, ya, yb, nx, nz, ua, ua + u1, vg0, vg0, vg0 + Math.max(0, ya - bot) * k, vg0 + Math.max(0, yb - bot) * k, cr, cg, cb, .7); }
      else { const v = up(bot, ya, yb); quad(Wl, ax, az, qx, qz, bot, bot, ya, yb, nx, nz, 0, u1, 0, 0, v[0], v[1], cr, cg, cb); }
      if (!C.seg) regSeg(R, ax + x0, az + z0, qx + x0, qz + z0, hi); }
    /* Waende an Dachstufen (hoeherer Gebaeudeteil ueber tieferem Dach) */
    const ib = Math.max(bot, ymin - .3);
    for (let i = 0; i < nI; i++) { const a = U[i0 + i * 2], b = U[i0 + i * 2 + 1], ax = B3X[a], az = B3Z[a], qx = B3X[b], qz = B3Z[b], dx = qx - ax, dz = qz - az, len = Math.hypot(dx, dz); if (len < .05) continue; const ya = B3Y[a], yb = B3Y[b]; if (Math.max(ya, yb) - ib < .25) continue;
      const tall = len >= 3 && Math.min(ya, yb) - ib > 6, u1 = tall ? Math.max(1, Math.round(len / 3.4)) / 2 : .02; quad(Wl, ax, az, qx, qz, ib, ib, ya, yb, -dz / len * 127 | 0, dx / len * 127 | 0, 0, u1, 0, 0, tall ? (ya - ib) / 6.2 : .02, tall ? (yb - ib) / 6.2 : .02, cr, cg, cb); }
  }
  C.seg = true; C.ms = []; C.lod = lod;
  const add = (o, mat) => { if (!o.pos.length) return; const g = new THREE.BufferGeometry(), drop = function () { this.array = null; };
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(o.pos), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(o.nor), 3, true)); if (o.col) g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(o.col), 3, true)); if (o.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(o.uv), 2)); if (o.idx) g.setIndex(o.idx);
    g.computeBoundingSphere(); for (const k in g.attributes) g.attributes[k].onUpload(drop); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.userData.c = C; R.g.add(m); R.far.push(m); C.ms.push(m); };
  W.forEach((o, ty) => add(o, zFac[ty])); add(G, zGround); add(Rf, zRoofMat); add(Rt, zTileMat); for (const [im, o] of RP) add(o, roofMatOf(im));
  if (old) { for (const m of old) { R.g.remove(m); m.geometry.dispose(); } const dead = new Set(old); R.far = R.far.filter(m => !dead.has(m)); }
}
function b3Dirty(im) { for (const R of regions.values()) if (R.b3 && R.state === 'ready') for (const C of R.b3.ch) if (C.lod === 2 && C.x > im.x0 - 250 && C.x < im.x1 + 250 && C.z > im.z0 - 250 && C.z < im.z1 + 250) C.lod = 1; }
const _b3q = [];
function updB3(px, pz, lim, sync) { const rb = sync ? sync : lim + 520; _b3q.length = 0;
  for (const R of regions.values()) { if (R.state !== 'ready' || !R.b3) continue; if (Math.hypot(clamp(px, R.x0, R.x0 + REG) - px, clamp(pz, R.z0, R.z0 + REG) - pz) > rb + 900) { if (!sync) for (const C of R.b3.ch) if (C.ms) b3Free(R, C); continue; }
    for (const C of R.b3.ch) { const d = Math.hypot(C.x - px, C.z - pz), want = d < rb ? (d < 760 ? 2 : 1) : 0;
      if (!want) { if (C.ms && !sync && d > rb + 320) b3Free(R, C); continue; }
      if (C.lod === want || (C.lod === 2 && d < 930)) continue; _b3q.push([d - (C.lod ? 0 : 600), R, C, want]); } }
  if (!_b3q.length) return 0; _b3q.sort((a, b) => a[0] - b[0]); const t0 = performance.now(); let n = 0;
  for (const q of _b3q) { b3Build(q[1], q[2], q[3]); n++; if (!sync && performance.now() - t0 > 7) break; }
  return _b3q.length - n; }
/* ---------- echte Baeume (swisstopo swissSURFACE3D): Standort, Hoehe und Krone jedes Baums; Chunks wie bei den Gebaeuden erst in der Naehe */
const regTR = new Set();
function trInit(R, buf) { const h = new Uint32Array(buf, 0, 2); if (h[0] !== 0x31455254) return; const nC = h[1], dir = new Uint32Array(buf, 8, nC * 4), U = new Uint16Array(buf, 8 + nC * 16), ch = []; R.trCells = new Set();
  for (let i = 0; i < nC; i++) { const ci = dir[i * 4] & 255, cj = dir[i * 4] >> 8; R.trCells.add(ci + ',' + cj); ch.push({ x0: ci * 400, z0: cj * 400, x: (ci + .5) * 400 + R.x0, z: (cj + .5) * 400 + R.z0, n: dir[i * 4 + 1], off: dir[i * 4 + 2], ms: null, lod: 0, seg: false }); } R.tr = { U, ch }; }
function trFree(R, C) { if (!C.ms) return; for (const m of C.ms) { R.g.remove(m); m.dispose(); } const dead = new Set(C.ms); R.far = R.far.filter(m => !dead.has(m)); C.ms = null; C.lod = 0; }
function trBuild(R, C, lod) { const U = R.tr.U, step = lod === 2 ? 1 : 3, old = C.ms, cnt = [0, 0], k = [0, 0];
  for (let i = 0; i < C.n; i += step) cnt[U[C.off + i * 3 + 2] >> 14 & 1]++;
  const ms = [zLeafGeo, zFirGeo].map((g, t) => cnt[t] ? new THREE.InstancedMesh(g, treeMat, cnt[t]) : null);
  for (let i = 0; i < C.n; i += step) { const p = C.off + i * 3, v = U[p + 2], t = v >> 14 & 1, x = C.x0 + U[p] / 4, z = C.z0 + U[p + 1] / 4, h = (v & 255) / 4, r = (v >> 8 & 63) / 4, X = x + R.x0, Z = z + R.z0, y = H(X, Z);
    const sy = h / (t ? 9.2 : 8.2), sx = 2 * r / (t ? 6.6 : 6.9) * (lod === 2 ? 1 : 1.3);
    ms[t].setMatrixAt(k[t], TM(x, y - .15, z, sx, sy, sx, 0, h2(U[p], U[p + 1]) * TAU, 0)); ms[t].setColorAt(k[t]++, treeTint[(U[p] + U[p + 1]) & 3]);
    if (!C.seg && lod === 2 && h > 5) regSeg(R, X, Z, X, Z, y + 5); }
  if (lod === 2) C.seg = true; C.ms = []; C.lod = lod;
  for (const m of ms) if (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = lod === 2; m.userData.c = C; R.g.add(m); R.far.push(m); C.ms.push(m); }
  if (old) { for (const m of old) { R.g.remove(m); m.dispose(); } const dead = new Set(old); R.far = R.far.filter(m => !dead.has(m)); } }
const _trq = [];
function updTrees(px, pz, lim, sync) { const rn = coarse ? 600 : 900, rb = sync ? sync : Math.min(lim + 300, coarse ? 1100 : 2000); _trq.length = 0;
  for (const R of regions.values()) { if (R.state !== 'ready' || !R.tr) continue; if (Math.hypot(clamp(px, R.x0, R.x0 + REG) - px, clamp(pz, R.z0, R.z0 + REG) - pz) > rb + 900) { if (!sync) for (const C of R.tr.ch) if (C.ms) trFree(R, C); continue; }
    for (const C of R.tr.ch) { const d = Math.hypot(C.x - px, C.z - pz), want = d < rb ? (d < rn ? 2 : 1) : 0;
      if (!want) { if (C.ms && !sync && d > rb + 320) trFree(R, C); continue; }
      if (C.lod === want || (C.lod === 2 && d < rn + 170)) continue; _trq.push([d - (C.lod ? 0 : 600), R, C, want]); } }
  if (!_trq.length) return; _trq.sort((a, b) => a[0] - b[0]); const t0 = performance.now();
  for (const q of _trq) { trBuild(q[1], q[2], q[3]); if (!sync && performance.now() - t0 > 4) break; } }
function freeRegion(R) { R.dead = true; regions.delete(RK(R.ix, R.iz)); _lr = null; scene.remove(R.g); R.g.traverse(o => { if (o.geometry && o.geometry !== zFirGeo && o.geometry !== zLeafGeo) o.geometry.dispose(); }); if (R.set) freeRoadSet(R.set); dirtyRect(R.x0 - 30, R.z0 - 30, R.x0 + REG + 30, R.z0 + REG + 30, 1); if (typeof onRegionGone === 'function') onRegionGone(R); }
let regIndex = new Set(), regBusy = 0;
function loadRegion(ix, iz) { const k = RK(ix, iz); if (regions.has(k) || !regIndex.has(k)) return regions.get(k) || null;
  const R = { ix, iz, x0: ix * REG, z0: iz * REG, state: 'loading', g: new THREE.Group(), hc: null, dem: null, wm: null, set: null, far: [], parked: [], spawned: false }; regions.set(k, R); regBusy++;
  const bin = (set, ext) => set.has(k) && typeof DecompressionStream === 'function' ? fetch(DATA + 'r/' + ix + '_' + iz + ext).then(r => r.ok ? r.arrayBuffer() : null).then(b => b && inflate(b)).catch(e => { console.error(e); return null; }) : null;
  R.promise = Promise.all([getJSON(DATA + 'r/' + ix + '_' + iz + '.json'), bin(regB3, '.b3z'), bin(regTR, '.trz')]).then(q => buildRegion(R, q[0], q[1], q[2])).catch(e => { console.error(e); R.state = 'failed'; }).finally(() => { regBusy--; if (R.state === 'ready' && typeof onRegionReady === 'function') onRegionReady(R); });
  return R; }
function updRegions(px, pz) { const near = 3200, far = 6500;
  for (let ix = Math.floor((px - near) / REG); ix <= Math.floor((px + near) / REG); ix++) for (let iz = Math.floor((pz - near) / REG); iz <= Math.floor((pz + near) / REG); iz++) if (regBusy < 2) loadRegion(ix, iz);
  for (const R of regions.values()) { if (R.state === 'loading') continue; const d = Math.hypot(clamp(px, R.x0, R.x0 + REG) - px, clamp(pz, R.z0, R.z0 + REG) - pz); if (d > far && !chars.some(c => Math.hypot(clamp(c.x, R.x0, R.x0 + REG) - c.x, clamp(c.z, R.z0, R.z0 + REG) - c.z) < 1500)) freeRegion(R); } }
async function ensureRegions(x, z) { const ps = []; for (let ix = Math.floor((x - 900) / REG); ix <= Math.floor((x + 900) / REG); ix++) for (let iz = Math.floor((z - 900) / REG); iz <= Math.floor((z + 900) / REG); iz++) { const R = loadRegion(ix, iz); if (R && R.promise) ps.push(R.promise); } await Promise.all(ps); updB3(x, z, 0, 620); updTrees(x, z, 0, 700); }

/* ============================================================ Landesstrassen ausserhalb der Detailgebiete, Tunnelportale */
const natTiles = new Map(), NT = 51200, NC = 3200; let natIndex = new Set();
function updNatRoads(px, pz) {
  for (let i = Math.floor((px - 4500) / NT); i <= Math.floor((px + 4500) / NT); i++) for (let j = Math.floor((pz - 4500) / NT); j <= Math.floor((pz + 4500) / NT); j++) { const k = i + '_' + j; if (!natIndex.has(k) || natTiles.has(k)) continue; const T = { i, j, cells: null, sets: new Map() }; natTiles.set(k, T); getJSON(DATA + 'n/' + k + '.json').then(d => { T.data = d; T.cells = d.cells; }).catch(() => {}); }
  for (const T of natTiles.values()) { if (!T.cells) continue;
    for (let cx = Math.floor((px - 3600) / NC); cx <= Math.floor((px + 3600) / NC); cx++) for (let cz = Math.floor((pz - 3600) / NC); cz <= Math.floor((pz + 3600) / NC); cz++) { const k = cx + ',' + cz; if (T.sets.has(k) || !T.cells[k]) continue; T.sets.set(k, makeRoadSet(T.cells[k], T.data.names, T.i * NT, T.j * NT, null)); return; }
    for (const [k, S] of T.sets) { const [cx, cz] = k.split(',').map(Number); if (Math.hypot((cx + .5) * NC - px, (cz + .5) * NC - pz) > 8000) { freeRoadSet(S); T.sets.delete(k); } } }
}
const portalGrid = new Map(), portalMeshes = []; let PORTALS = [];
function initPortals(list) { PORTALS = []; for (const t of list) { const a = { x: t[0], z: t[1], out: t[2], len: t[6], name: t[7] }, b = { x: t[3], z: t[4], out: t[5], len: t[6], name: t[7] }; a.other = b; b.other = a; for (const p of [a, b]) { PORTALS.push(p); const k = GK(Math.floor(p.x / 500), Math.floor(p.z / 500)); let l = portalGrid.get(k); if (!l) portalGrid.set(k, l = []); l.push(p); } }
  const g = merge([box(11, 7, 1.2, 0, 3.5, -.6, 0x6f7275), box(8.4, 5.4, .4, 0, 2.7, .12, 0x0b0d0f)]); for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(g, zPropMat); m.visible = false; scene.add(m); portalMeshes.push(m); } }
function portalsNear(x, z, r) { const out = []; for (let cx = Math.floor((x - r) / 500); cx <= Math.floor((x + r) / 500); cx++) for (let cz = Math.floor((z - r) / 500); cz <= Math.floor((z + r) / 500); cz++) { const l = portalGrid.get(GK(cx, cz)); if (l) for (const p of l) if (Math.hypot(p.x - x, p.z - z) < r) out.push(p); } return out; }
function updPortalMeshes(px, pz) { const near = portalsNear(px, pz, 1500).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); portalMeshes.forEach((m, i) => { const p = near[i]; m.visible = !!p; if (p) { m.position.set(p.x - Math.sin(p.out) * 3, H(p.x, p.z) - .3, p.z - Math.cos(p.out) * 3); m.rotation.y = p.out; } }); }
