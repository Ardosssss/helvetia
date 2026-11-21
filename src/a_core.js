'use strict';
const $ = id => document.getElementById(id);
if (!window.THREE) { $('load').textContent = '3D-Bibliothek konnte nicht geladen werden. Bitte Seite neu laden.'; return; }

/* ------------------------------------------------------------ Helfer */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
function rng32(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(ix, iz) { let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const fmtM = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
const chf = n => 'CHF ' + fmtM(n) + '.–';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
/* Die grossen Spieldaten (w/, r/, n/, z/) liegen nicht im Repository, sondern in einem Cloudflare-R2-Bucket (hochgeladen mit pipeline/upload.py).
   Mit ?data=lokal im Seitenaufruf laedt das Spiel stattdessen die Ordner neben index.html, etwa nach einem eigenen Lauf der Pipeline. */
const DATA_URL = 'https://pub-fb46c74520864c0ab68934bf502da03f.r2.dev/';
const DATA = new URLSearchParams(location.search).get('data') === 'lokal' ? '' : DATA_URL;
const getJSON = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' fehlt (' + r.status + ')'); return r.json(); };

/* ------------------------------------------------------------ Eine Welt im Massstab 1:1 (Meter) */
const LON_C = 8.225, LAT_C = 46.81, KXM = 76300, KZM = 111200;
const WX = lon => (lon - LON_C) * KXM, WZ = lat => -(lat - LAT_C) * KZM;
const REG = 8000, LATT = 25, NL = 321;                // Region 8 km, Gelaendegitter 25 m
const BORDER = [[5.96,46.13],[5.98,46.21],[6.06,46.25],[6.12,46.30],[6.12,46.37],[6.08,46.42],[6.07,46.47],[6.14,46.55],[6.21,46.62],[6.28,46.69],[6.36,46.74],[6.44,46.78],[6.44,46.84],[6.46,46.90],[6.60,46.99],[6.70,47.05],[6.76,47.12],[6.87,47.17],[6.96,47.24],[7.02,47.33],[6.90,47.35],[6.94,47.43],[7.00,47.50],[7.13,47.50],[7.19,47.45],[7.33,47.44],[7.42,47.46],[7.44,47.50],[7.51,47.51],[7.50,47.55],[7.56,47.58],[7.59,47.60],[7.67,47.59],[7.70,47.56],[7.80,47.565],[7.95,47.555],[8.06,47.565],[8.22,47.615],[8.30,47.59],[8.43,47.57],[8.52,47.63],[8.45,47.70],[8.50,47.78],[8.60,47.80],[8.73,47.75],[8.80,47.69],[8.86,47.66],[9.00,47.69],[9.18,47.67],[9.40,47.615],[9.56,47.54],[9.58,47.50],[9.66,47.455],[9.67,47.385],[9.61,47.34],[9.54,47.27],[9.49,47.18],[9.52,47.10],[9.48,47.06],[9.61,47.06],[9.88,47.02],[10.00,46.92],[10.11,46.85],[10.23,46.87],[10.31,46.95],[10.39,47.00],[10.49,46.94],[10.47,46.86],[10.39,46.72],[10.49,46.62],[10.45,46.54],[10.30,46.55],[10.23,46.63],[10.10,46.61],[10.05,46.54],[10.05,46.44],[10.13,46.41],[10.17,46.26],[10.11,46.23],[10.05,46.27],[9.97,46.31],[9.91,46.38],[9.77,46.34],[9.71,46.29],[9.62,46.29],[9.52,46.32],[9.45,46.37],[9.46,46.47],[9.42,46.49],[9.33,46.51],[9.28,46.50],[9.25,46.44],[9.29,46.32],[9.25,46.23],[9.16,46.17],[9.08,46.12],[9.07,46.06],[9.02,46.00],[9.03,45.93],[9.09,45.90],[9.03,45.82],[8.95,45.83],[8.91,45.84],[8.90,45.92],[8.86,45.97],[8.80,46.00],[8.76,46.10],[8.68,46.10],[8.62,46.12],[8.59,46.16],[8.47,46.23],[8.44,46.32],[8.46,46.44],[8.39,46.46],[8.31,46.42],[8.22,46.33],[8.15,46.30],[8.09,46.26],[8.15,46.19],[8.08,46.12],[8.02,46.02],[7.91,45.99],[7.87,45.93],[7.66,45.98],[7.57,45.99],[7.38,45.91],[7.18,45.86],[7.07,45.90],[7.04,45.93],[6.94,46.05],[6.88,46.06],[6.80,46.13],[6.80,46.20],[6.86,46.27],[6.80,46.33],[6.80,46.39],[6.55,46.42],[6.33,46.37],[6.24,46.30],[6.31,46.25],[6.29,46.22],[6.24,46.20],[6.19,46.17],[6.14,46.14],[6.04,46.14]];
const BN = BORDER.length, BX = BORDER.map(p => WX(p[0])), BZ = BORDER.map(p => WZ(p[1]));
function insideCH(x, z) { let c = false; for (let i = 0, j = BN - 1; i < BN; j = i++) { const zi = BZ[i], zj = BZ[j]; if ((zi > z) !== (zj > z) && x < (BX[j] - BX[i]) * (z - zi) / (zj - zi) + BX[i]) c = !c; } return c; }

/* ------------------------------------------------------------ Renderer: Fernsicht + Nahbereich */
const cv = $('c');
const coarse = matchMedia('(pointer:coarse)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !coarse, powerPreference: 'high-performance' });
} catch {
  $('load').textContent = 'Für die 3D-Spielwelt braucht dein Browser WebGL. Aktiviere die Grafikbeschleunigung und lade die Seite neu.';
  return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2));
renderer.autoClear = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const MAXTEX = Math.min(renderer.capabilities.maxTextureSize, coarse ? 2048 : 4096);
const FOGD = 0.000034, VIEW = coarse ? 1300 : 2400;    // Sichtweite fuer Gebaeude
const scene = new THREE.Scene(), bgScene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbcd7ea, FOGD); bgScene.fog = new THREE.FogExp2(0xbcd7ea, FOGD);
const camera = new THREE.PerspectiveCamera(60, 1, 0.5, 14000), bgCam = new THREE.PerspectiveCamera(60, 1, 30, 600000);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6f7a55, 1.7), sun = new THREE.DirectionalLight(0xfff2dc, 2.8);
scene.add(hemi, sun, sun.target);
const hemi2 = hemi.clone(), sun2 = new THREE.DirectionalLight(0xfff2dc, 2.8); bgScene.add(hemi2, sun2);
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.4;
{ const c = sun.shadow.camera; c.left = c.bottom = -170; c.right = c.top = 170; c.near = 10; c.far = 1100; c.updateProjectionMatrix(); }
let shadowsOK = !coarse;
function resize() { const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = bgCam.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const _col = new THREE.Color(), _v = new THREE.Vector3(), _m3 = new THREE.Matrix3(), _mat = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const TM = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
function merge(parts) {   // [Geometrie, Farbe, Matrix?] -> eine Geometrie mit Vertexfarben
  let n = 0; const gs = parts.map(p => { const g = p[0].index ? p[0].toNonIndexed() : p[0]; n += g.attributes.position.count; return g; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  parts.forEach((p, i) => { const g = gs[i], P = g.attributes.position, N = g.attributes.normal, m = p[2]; _col.set(p[1]); if (m) _m3.getNormalMatrix(m);
    for (let k = 0; k < P.count; k++, o += 3) { _v.fromBufferAttribute(P, k); if (m) _v.applyMatrix4(m); pos[o] = _v.x; pos[o + 1] = _v.y; pos[o + 2] = _v.z; _v.fromBufferAttribute(N, k); if (m) _v.applyMatrix3(_m3).normalize(); nor[o] = _v.x; nor[o + 1] = _v.y; nor[o + 2] = _v.z; col[o] = _col.r; col[o + 1] = _col.g; col[o + 2] = _col.b; } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
const box = (w, h, d, x, y, z, c) => [new THREE.BoxGeometry(w, h, d), c, TM(x, y, z)];
function taperBox(w, h, d, tx, tz) { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * tx); p.setZ(i, p.getZ(i) * tz); } g.computeVertexNormals(); return g; }
function canvasTex(w, h, draw, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function geo(attrs, idx) { const g = new THREE.BufferGeometry(); for (const k in attrs) g.setAttribute(k, new THREE.BufferAttribute(attrs[k] instanceof Float32Array ? attrs[k] : new Float32Array(attrs[k]), k === 'uv' ? 2 : 3)); if (idx) g.setIndex(idx); return g; }
function instChunks(geom, mat, items, parent, chk, shadow, list) { const map = new Map(); for (const it of items) { const k = Math.floor(it.x / chk) + ',' + Math.floor(it.z / chk); let a = map.get(k); if (!a) map.set(k, a = []); a.push(it); } for (const arr of map.values()) { let cx = 0, cz = 0; for (const it of arr) { cx += it.x; cz += it.z; } const im = new THREE.InstancedMesh(geom, mat, arr.length); arr.forEach((it, i) => { im.setMatrixAt(i, it.m); if (it.c) im.setColorAt(i, it.c); }); im.instanceMatrix.needsUpdate = true; if (shadow) im.castShadow = true; im.userData.c = { x: cx / arr.length, z: cz / arr.length }; parent.add(im); if (list) list.push(im); } }
function loadImage(url) { return new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('Bild fehlt: ' + url)); im.src = url; }); }
function imgTexture(im) { let src = im; if (Math.max(im.width, im.height) > MAXTEX) { const s = MAXTEX / Math.max(im.width, im.height), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); src = c; } const t = new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true; return t; }
const C3 = hex => { _col.set(hex); return [_col.r, _col.g, _col.b]; };

const detailTex = canvasTex(128, 128, (g, w, h) => { const im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const x = i % w, y = i / w | 0, v = 150 + (h2(x, y + 9) * 70 + h2(x >> 2, (y >> 2) + 40) * 35 | 0); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); }, true);
function withDetail(mat, ru, rv, amp) { mat.onBeforeCompile = sh => { sh.uniforms.dTex = { value: detailTex }; sh.uniforms.dRep = { value: new THREE.Vector2(ru, rv) }; sh.uniforms.dAmp = { value: amp };
  sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D dTex; uniform vec2 dRep; uniform float dAmp;\nvoid main() {').replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\n float dNear = 1.0 - smoothstep(8.0, 70.0, length(vViewPosition));\n diffuseColor.rgb *= 1.0 + (texture2D(dTex, vMapUv * dRep).r - 0.62) * dAmp + (texture2D(dTex, vMapUv * dRep * 5.3 + 0.37).r - 0.62) * dAmp * 1.4 * dNear;\n#endif'); }; mat.customProgramCacheKey = () => 'det2' + amp; return mat; }

/* Himmel */
const skyU = { top: { value: new THREE.Color(0x3b78c9) }, hor: { value: new THREE.Color(0xbcd7ea) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(0xfff0d0) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 24, 12), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform vec3 top, hor, sunDir, sunCol;
    varying vec3 vDir;
    void main() {
      vec3 d = normalize(vDir);
      float height = max(d.y, 0.0);
      float facing = clamp(dot(d, sunDir), 0.0, 1.0);
      vec3 color = mix(hor, top, pow(height, 0.55));
      float sunset = 1.0 - smoothstep(0.07, 0.50, abs(sunDir.y));
      color += sunCol * (0.3 + 1.15 * sunset) * pow(facing, 5.0) * exp(-height * 5.5);
      color += sunCol * (0.32 * pow(facing, 45.0) + 5.0 * smoothstep(0.99968, 0.99988, facing));
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` }));
sky.renderOrder = -10; sky.frustumCulled = false; bgScene.add(sky);

/* ------------------------------------------------------------ Hoehenmodell: Landesraster 100 m, in Detailgebieten 25 m */
let ND = null, NS = null, NDX0 = 0, NDZ0 = 0, NDS = 100, NDW = 0, NDH = 0;      // Hoehe (Viertelmeter), Seeabstand
const regions = new Map(), RK = (ix, iz) => (ix + 512) * 1024 + iz + 512;
function natH(x, z) { let fx = clamp((x - NDX0) / NDS, 0, NDW - 1.001), fz = clamp((z - NDZ0) / NDS, 0, NDH - 1.001); const i = fx | 0, j = fz | 0; fx -= i; fz -= j; const o = j * NDW + i; return (ND[o] * (1 - fx) * (1 - fz) + ND[o + 1] * fx * (1 - fz) + ND[o + NDW] * (1 - fx) * fz + ND[o + NDW + 1] * fx * fz) * .25; }
function natSD(x, z) { let fx = clamp((x - NDX0) / NDS, 0, NDW - 1.001), fz = clamp((z - NDZ0) / NDS, 0, NDH - 1.001); const i = fx | 0, j = fz | 0; fx -= i; fz -= j; const o = j * NDW + i; return ((NS[o] * (1 - fx) * (1 - fz) + NS[o + 1] * fx * (1 - fz) + NS[o + NDW] * (1 - fx) * fz + NS[o + NDW + 1] * fx * fz) - 128) * 8; }
const natC = (x, z) => { const sd = natSD(x, z); return natH(x, z) - (sd < 0 ? Math.min(6, -sd * .08) : 0); };
let _lr = null;
function regAt(x, z) { const ix = Math.floor(x / REG), iz = Math.floor(z / REG); if (_lr && _lr.ix === ix && _lr.iz === iz) return _lr.hc ? _lr : null; const R = regions.get(RK(ix, iz)); if (R) _lr = R; return R && R.hc ? R : null; }
function hv(i, j) { const rx = Math.floor(i / 320), rz = Math.floor(j / 320); let R = _lr; if (!R || R.ix !== rx || R.iz !== rz) { R = regions.get(RK(rx, rz)); if (R) _lr = R; } return R && R.hc ? R.hc[(j - rz * 320) * NL + i - rx * 320] : natC(i * LATT, j * LATT); }
// Gelaendehoehe exakt wie das gezeichnete Dreiecksnetz
function H(x, z) { const fx = x / LATT, fz = z / LATT, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, b = hv(i + 1, j), c = hv(i, j + 1); if (u + v <= 1) { const a = hv(i, j); return a + (b - a) * u + (c - a) * v; } const d = hv(i + 1, j + 1); return d + (c - d) * (1 - u) + (b - d) * (1 - v); }
function rawH(R, x, z) { let fx = clamp((x - R.x0) / LATT, 0, NL - 1.001), fz = clamp((z - R.z0) / LATT, 0, NL - 1.001); const i = fx | 0, j = fz | 0; fx -= i; fz -= j; const o = j * NL + i, d = R.dem; return d[o] * (1 - fx) * (1 - fz) + d[o + 1] * fx * (1 - fz) + d[o + NL] * (1 - fx) * fz + d[o + NL + 1] * fx * fz; }
function waterLevel(x, z) { const R = regAt(x, z); if (R) return R.wm && regWater(R, x, z) ? rawH(R, x, z) : -1e9; return natSD(x, z) < 0 ? natH(x, z) : -1e9; }
function regWater(R, x, z) { const u = (x - R.x0) * R.wsc | 0, v = (z - R.z0) * R.wsc | 0; return u >= 0 && v >= 0 && u < R.wmN && v < R.wmN && R.wm[v * R.wmN + u] === 1; }
async function loadDEM(info) {
  NDX0 = info.x0; NDZ0 = info.z0; NDS = info.step; NDW = info.nx; NDH = info.nz; ND = new Uint16Array(NDW * NDH); NS = new Uint8Array(NDW * NDH);
  const parts = await Promise.all([loadImage(DATA + 'w/dem0.png'), loadImage(DATA + 'w/dem1.png')]); let row = 0;
  for (const im of parts) { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' }); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, im.width, im.height).data, o = row * NDW, n = im.width * im.height; for (let i = 0; i < n; i++) { ND[o + i] = d[i * 4] << 8 | d[i * 4 + 1]; NS[o + i] = d[i * 4 + 2]; } row += im.height; }
}

const hit = { x: 0, z: 0, nx: 0, nz: 0, on: false };
