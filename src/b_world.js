/* ============================================================ Luftbilder: grob fuers Land, fein fuer Kanton Luzern und die Orte */
const IMGS = []; let nightMats = [], imgLoading = 0, camX = 0, camZ = 0;
function addImg(x0, z0, x1, z1, url, maxL, pr, amp) { const im = { x0, z0, x1, z1, url, maxL, pr, amp, state: 'none', tex: null, mat: null, el: null, roofMat: null, t: 0 }; IMGS.push(im); return im; }
function imgReady(im, el) { im.el = el; if (im.pr <= 2) { const c = document.createElement('canvas'); c.width = c.height = im.pr ? 1024 : 2048; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(el, 0, 0, c.width, c.height); im.px = g.getImageData(0, 0, c.width, c.height).data; im.pw = c.width; } im.tex = imgTexture(el); im.mat = withDetail(new THREE.MeshLambertMaterial({ map: im.tex }), (im.x1 - im.x0) / 2.5, (im.z1 - im.z0) / 2.5, im.amp); im.state = 'ready'; if (im.roofMat) { im.roofMat.map = im.tex; im.roofMat.color.set(0xffffff); im.roofMat.needsUpdate = true; } dirtyRect(im.x0, im.z0, im.x1, im.z1, im.maxL); }
function pumpImages() {
  if (imgLoading >= 2) return; let best = null, bd = 1e18;
  for (const im of IMGS) if (im.state === 'want') { const d = Math.hypot(clamp(camX, im.x0, im.x1) - camX, clamp(camZ, im.z0, im.z1) - camZ) - im.pr * 500; if (d < bd) { bd = d; best = im; } }
  if (!best) return; best.state = 'loading'; imgLoading++;
  loadImage(best.url).then(el => { imgLoading--; imgReady(best, el); evictImages(); }, () => { imgLoading--; best.state = 'failed'; });
}
function evictImages() { for (const pr of [3, 2, 1]) { const lim = pr === 3 ? (coarse ? 2 : 5) : pr === 2 ? (coarse ? 2 : 4) : (coarse ? 1 : 3), list = IMGS.filter(im => im.pr === pr && im.state === 'ready'); if (list.length <= lim) continue;
    list.sort((a, b) => Math.hypot(clamp(camX, a.x0, a.x1) - camX, clamp(camZ, a.z0, a.z1) - camZ) - Math.hypot(clamp(camX, b.x0, b.x1) - camX, clamp(camZ, b.z0, b.z1) - camZ));
    for (const im of list.slice(lim)) { if (Math.hypot(clamp(camX, im.x0, im.x1) - camX, clamp(camZ, im.z0, im.z1) - camZ) < 600) continue; im.state = 'none'; im.tex.dispose(); im.mat.dispose(); im.tex = im.mat = im.el = im.px = null; if (im.roofMat) { im.roofMat.map = null; im.roofMat.color.set(0x8a8780); im.roofMat.needsUpdate = true; } dirtyRect(im.x0, im.z0, im.x1, im.z1, im.maxL); } } }
function pickImg(x0, z0, x1, z1, L) { let best = null, ready = null; for (const im of IMGS) { if (im.maxL < L || im.x0 > x0 || im.z0 > z0 || im.x1 < x1 || im.z1 < z1 || im.state === 'failed') continue; if (!best || im.pr > best.pr) best = im; if (im.state === 'ready' && (!ready || im.pr > ready.pr)) ready = im; }
  if (best && best.state === 'none') best.state = 'want'; return ready; }
function imgAt(x, z) { let r = null; for (const im of IMGS) if (im.state === 'ready' && im.x0 <= x && im.x1 >= x && im.z0 <= z && im.z1 >= z && (!r || im.pr > r.pr)) r = im; return r; }
function patchAt(x0, z0, x1, z1) { for (const im of IMGS) if (im.pr === 3 && im.x0 <= x0 && im.z0 <= z0 && im.x1 >= x1 && im.z1 >= z1) return im; return null; }
function roofMatOf(im) { if (!im.roofMat) { im.roofMat = new THREE.MeshLambertMaterial({ map: im.tex, color: im.tex ? 0xffffff : 0x8a8780, side: THREE.DoubleSide }); } return im.roofMat; }

/* ============================================================ Gelaende als Viererbaum: 25 m nah, bis 6.4 km in der Ferne */
const TS = [800, 3200, 12800, 51200, 204800], TN = 32, SPLIT = [0, coarse ? .5 : .8, .75, .6, 1.25], SKIRT = [10, 45, 160, 500, 1200];
const tnodes = new Map(); let tFrame = 0, tBudget = 0;
const waterTime = { value: 0 };
function lakeMaterial() {
  const mat = new THREE.MeshPhongMaterial({
    color: 0x276979, specular: 0xc3d6d6, shininess: 76, transparent: true, opacity: 0.91
  });
  mat.onBeforeCompile = shader => {
    shader.uniforms.rippleTime = waterTime;
    shader.vertexShader = 'varying vec2 waterXZ;\n' + shader.vertexShader.replace(
      '#include <project_vertex>', '#include <project_vertex>\nwaterXZ = (modelMatrix * vec4(transformed, 1.0)).xz;'
    );
    shader.fragmentShader = 'uniform float rippleTime; varying vec2 waterXZ;\n' + shader.fragmentShader.replace(
      '#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float t = rippleTime;
      vec2 slope = vec2(sin(dot(waterXZ, vec2(.42,.21)) + t * 1.4), cos(dot(waterXZ, vec2(.16,-.34)) - t));
      float detail = 1.0 - smoothstep(80.0, 550.0, length(vViewPosition));
      normal = normalize(normal + mat3(viewMatrix) * vec3(slope.x, 0., slope.y) * .095 * detail);`
    );
  };
  return mat;
}
const natWaterMat = lakeMaterial();
const tIndex = (() => { const V = TN + 1, idx = []; for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) { const a = j * V + i, b = a + 1, c = a + V, d = c + 1; idx.push(a, c, b, b, c, d); }
  const S0 = V * V, ring = []; for (let i = 0; i < V; i++) ring.push(i); for (let j = 1; j < V; j++) ring.push(j * V + TN); for (let i = TN - 1; i >= 0; i--) ring.push(TN * V + i); for (let j = TN - 1; j >= 1; j--) ring.push(j * V);
  for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length], c = S0 + k, d = S0 + (k + 1) % ring.length; idx.push(a, b, c, b, d, c); }
  return { idx: new Uint16Array(idx), ring }; })();
function tnode(l, i, j) { const k = l + ':' + i + ':' + j; let n = tnodes.get(k); if (!n) tnodes.set(k, n = { l, i, j, k, mesh: null, dirty: false, seen: 0, show: false }); return n; }
function dirtyRect(x0, z0, x1, z1, maxL) { for (const n of tnodes.values()) { if (n.l > maxL || !n.mesh) continue; const S = TS[n.l]; if (n.i * S < x1 && (n.i + 1) * S > x0 && n.j * S < z1 && (n.j + 1) * S > z0) n.dirty = true; } }
function freeNode(n) { if (!n.mesh) return; (n.l ? bgScene : scene).remove(n.mesh); n.mesh.geometry.dispose(); if (n.water) { n.water.geometry.dispose(); } for (const t of n.trees || []) t.dispose(); n.mesh = n.water = n.trees = null; }
function buildNode(n) {
  freeNode(n); n.dirty = false;
  const S = TS[n.l], c = S / TN, st = c / LATT, x0 = n.i * S, z0 = n.j * S, li = x0 / LATT, lj = z0 / LATT, M = TN + 3, V = TN + 1, hh = new Float32Array(M * M);
  for (let b = 0; b < M; b++) for (let a = 0; a < M; a++) hh[b * M + a] = hv(li + (a - 1) * st, lj + (b - 1) * st);
  const im = pickImg(x0, z0, x0 + S, z0 + S, n.l) || IMGS[0], iw = im.x1 - im.x0, ih = im.z1 - im.z0, ring = tIndex.ring, nv = V * V + ring.length;
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) { const k = j * V + i, o = (j + 1) * M + i + 1, h = hh[o]; pos[k * 3] = i * c; pos[k * 3 + 1] = h; pos[k * 3 + 2] = j * c;
    let nx = (hh[o - 1] - hh[o + 1]) / (2 * c), nz = (hh[o - M] - hh[o + M]) / (2 * c); const l = Math.hypot(nx, 1, nz); nor[k * 3] = nx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = nz / l;
    uv[k * 2] = (x0 + i * c - im.x0) / iw; uv[k * 2 + 1] = 1 - (z0 + j * c - im.z0) / ih; }
  for (let q = 0; q < ring.length; q++) { const s = ring[q], k = V * V + q; pos[k * 3] = pos[s * 3]; pos[k * 3 + 1] = pos[s * 3 + 1] - SKIRT[n.l]; pos[k * 3 + 2] = pos[s * 3 + 2]; nor[k * 3] = nor[s * 3]; nor[k * 3 + 1] = nor[s * 3 + 1]; nor[k * 3 + 2] = nor[s * 3 + 2]; uv[k * 2] = uv[s * 2]; uv[k * 2 + 1] = uv[s * 2 + 1]; }
  const g = geo({ position: pos, normal: nor, uv }); g.setIndex(new THREE.BufferAttribute(tIndex.idx, 1));
  const m = new THREE.Mesh(g, im.mat); m.position.set(x0, 0, z0); m.receiveShadow = n.l === 0; m.matrixAutoUpdate = false; m.updateMatrix(); n.mesh = m; n.img = im; (n.l ? bgScene : scene).add(m);
  // Seen ausserhalb der Detailgebiete (dort kommt das Wasser aus den Kartendaten)
  const wp = [];
  for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) { const xa = x0 + i * c, za = z0 + j * c; if (n.l === 0 && regAt(xa + c / 2, za + c / 2)) continue; let lv = -1e9, any = false; for (let q = 0; q < 4; q++) { const x = xa + (q & 1) * c, z = za + (q >> 1) * c, sd = natSD(x, z); if (sd < c * .7) any = true; if (sd < 0) lv = Math.max(lv, natH(x, z)); }
    if (!any || lv < -1e8) continue; const y = lv + .06, X = i * c, Z = j * c; wp.push(X, y, Z, X, y, Z + c, X + c, y, Z, X + c, y, Z, X, y, Z + c, X + c, y, Z + c); }
  // Waelder ausserhalb der Detailgebiete: dort, wo das Luftbild dunkelgruen ist
  if (n.l === 0 && im.px && !regAt(x0 + S / 2, z0 + S / 2)) { const r = rng32(n.i * 7349 + n.j * 9151 | 0), fa = [], fb = [], pw = im.pw; for (let k = 0; k < (coarse ? 60 : 150); k++) { const x = r() * S, z = r() * S, pi = (clamp((z0 + z - im.z0) / ih * pw | 0, 0, pw - 1) * pw + clamp((x0 + x - im.x0) / iw * pw | 0, 0, pw - 1)) * 4, R = im.px[pi], Gc = im.px[pi + 1], B = im.px[pi + 2]; if (!(Gc > R * 1.03 && Gc > B * 1.12 && R + Gc + B < 230)) continue; const gx = x0 + x, gz = z0 + z; if (natSD(gx, gz) < 30 || nearRoad(gx, gz, 7, 9, false)) continue; const y = H(gx, gz), s = .9 + r() * .9; (y > 1100 || r() < .5 ? fa : fb).push(TM(x, y - .3, z, s, s * (.9 + r() * .4), s, 0, r() * TAU, 0)); }
    n.trees = []; for (const [gm, list] of [[zFirGeo, fa], [zLeafGeo, fb]]) { if (!list.length) continue; const t = new THREE.InstancedMesh(gm, treeMat, list.length); list.forEach((mm, q) => t.setMatrixAt(q, mm)); t.castShadow = true; t.frustumCulled = false; m.add(t); n.trees.push(t); } }
  if (wp.length) { const wg = geo({ position: wp }), nn = new Float32Array(wp.length); for (let q = 1; q < nn.length; q += 3) nn[q] = 1; wg.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); n.water = new THREE.Mesh(wg, natWaterMat); m.add(n.water); }
}
function tVisit(l, i, j) {
  const n = tnode(l, i, j), S = TS[l]; n.seen = tFrame;
  const d = Math.hypot(clamp(camX, i * S, i * S + S) - camX, clamp(camZ, j * S, j * S + S) - camZ);
  if (l > 0 && d < S * SPLIT[l]) { let ok = true; const cs = []; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) cs.push(tnode(l - 1, i * 4 + a, j * 4 + b));
    for (const ch of cs) { if (!ch.mesh || ch.dirty) { if (tBudget > 0) { buildNode(ch); tBudget--; } else if (!ch.mesh) ok = false; } }
    if (ok) { n.show = false; for (const ch of cs) tVisit(l - 1, ch.i, ch.j); return; } for (const ch of cs) { ch.seen = tFrame; ch.show = false; } }
  if (!n.mesh || (n.dirty && tBudget > 0)) { buildNode(n); tBudget--; } n.show = true;
}
function updTerrain(force) {
  tFrame++; tBudget = force ? 400 : 5;
  for (let i = -1; i <= 0; i++) for (let j = -1; j <= 0; j++) tVisit(4, i, j);
  for (const n of tnodes.values()) { if (n.mesh) n.mesh.visible = n.show && n.seen === tFrame; if (n.seen !== tFrame) n.show = false; if (tFrame - n.seen > 400) { freeNode(n); tnodes.delete(n.k); } else if (n.seen !== tFrame && n.l === 0 && tFrame - n.seen > 60) freeNode(n); }
}

/* ============================================================ Wolken und Ortsschilder in der Ferne */
const clouds = [];
function buildClouds() {
  const n = 110, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x8a96a3, transparent: true, opacity: .93 }), n), r = rng32(5);
  for (let i = 0; i < n;) { const cx = (r() - .5) * 60000, cz = (r() - .5) * 60000, cy = 2700 + r() * 1500, k = 3 + (r() * 3 | 0); for (let q = 0; q < k && i < n; q++, i++) clouds.push({ x: cx + (r() - .5) * 1400, y: cy + (r() - .5) * 120, z: cz + (r() - .5) * 900, sx: 500 + r() * 600, sy: 110 + r() * 90, sz: 380 + r() * 420 }); }
  im.frustumCulled = false; bgScene.add(im); clouds.mesh = im;
}
function updClouds(dt) { const im = clouds.mesh; for (let i = 0; i < clouds.length; i++) { const c = clouds[i]; c.x += dt * 9; let dx = c.x - camX, dz = c.z - camZ; dx = ((dx + 30000) % 60000 + 60000) % 60000 - 30000; dz = ((dz + 30000) % 60000 + 60000) % 60000 - 30000; _mat.compose(_v.set(camX + dx, c.y, camZ + dz), _q.identity(), _s.set(c.sx, c.sy, c.sz)); im.setMatrixAt(i, _mat); } im.instanceMatrix.needsUpdate = true; }
const labels = []; let labelT = 0;
function buildLabels() { for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true, fog: false })); s.visible = false; s.renderOrder = 50; scene.add(s); labels.push(s); } }
function labelTex(p) { if (!p.tex) { p.tex = canvasTex(320, 80, g => { g.font = '600 44px Arial, sans-serif'; const w = Math.min(300, g.measureText(p.name).width + 36), x = (320 - w) / 2; g.fillStyle = '#f3f6f4'; g.strokeStyle = '#111'; g.lineWidth = 5; g.beginPath(); g.roundRect(x, 8, w, 62, 9); g.fill(); g.stroke(); g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.name, 160, 41, 280); }); } return p.tex; }
function updLabels(px, pz, now) {
  if (now - labelT > .5) { labelT = now; const near = PLACES.map(p => [Math.hypot(p.x - px, p.z - pz), p]).filter(a => a[0] < 9000 && a[0] > a[1].r * .7).sort((a, b) => a[0] - b[0]).slice(0, labels.length);
    labels.forEach((s, i) => { const a = near[i]; s.visible = !!a; if (a) { const p = a[1]; if (s.material.map !== labelTex(p)) { s.material.map = p.tex; s.material.needsUpdate = true; } s.position.set(p.x, H(p.x, p.z) + 60 + a[0] * .03, p.z); } }); }
  for (const s of labels) if (s.visible) { const d = camera.position.distanceTo(s.position), k = clamp(d * .03, 6, 260); s.scale.set(k * 4, k, 1); }
}

/* ============================================================ Orte */
let PLACES = [], PLACE = {};
function initPlaces(list) { PLACES = list.map(p => Object.assign(p, { found: false, hx: p.hub[0], hz: p.hub[1], ha: p.hub[2], ax: p.hub[3], az: p.hub[4], aa: p.hub[5] })); PLACE = {}; for (const p of PLACES) { PLACE[p.id] = p; addImg(p.img[0], p.img[1], p.img[2], p.img[3], 'z/' + p.id + '.jpg', 0, 3, .22); } }
function placeAt(x, z) { let best = null, bd = 1e9; for (const p of PLACES) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r && d / p.r < bd) { bd = d / p.r; best = p; } } return best; }
function nearestPlace(x, z, big) { let best = null, bd = 1e18; for (const p of PLACES) { if (big && p.kind === 'village') continue; const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = p; } } return best; }
