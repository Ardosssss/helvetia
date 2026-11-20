/* ============================================================ Spielablauf in der durchgehenden 1:1-Welt */
let busy = false, started = false, camYaw = 0, camPitch = .28, camZoom = 1, lastCamInput = -9, camSnap = true, startT = 0, portalCool = 0;
const state = { money: 200, time: 17.05, mission: null, lastHub: null };
const fadeOn = txt => { const f = $('fade'); f.textContent = txt || ''; f.classList.add('on'); }, fadeOff = () => $('fade').classList.remove('on');
function settle(e, isVeh) { if (isVeh) { const g = ground(e.x, e.z, 1e9); e.y = e.t.heli && !e.grounded ? Math.max(e.y, g) : g; e.vy = 0; e.g.position.set(e.x, e.y, e.z); e.awake = true; } else { e.y = ground(e.x, e.z, 1e9); e.vy = 0; e.grounded = true; e.P.g.position.set(e.x, e.y, e.z); } }
function onRegionReady(R) {
  if (!R.spawned) { R.spawned = true; for (const q of R.parked) spawnVehicle(q.kind, q.x, q.z, q.a, q.kind === 'tractor' ? 0x2d6a4f : PAINT[q.paint], { reg: R }); }
  const inR = e => e.x >= R.x0 - 30 && e.x <= R.x0 + REG + 30 && e.z >= R.z0 - 30 && e.z <= R.z0 + REG + 30;
  for (const v of vehicles) if (inR(v) && !(v.t.heli && !v.grounded)) settle(v, true);
  for (const c of chars) if (!c.veh && inR(c)) settle(c, false); else if (c.veh) { c.y = c.veh.y; }
  for (const t of traffic) t.y = 1e9; for (const p of peds) p.y = 1e9; camSnap = true;
}
function onRegionGone(R) { for (const v of vehicles.slice()) if (v.reg === R && !v.keep && !v.driver) removeVehicle(v); }
function putActive(x, z, a) { const ch = chars[active], v = ch.veh; ch.x = x; ch.z = z; ch.a = a; ch.vy = 0;
  if (v) { v.x = x; v.z = z; v.a = a; v.vx = v.vz = v.vy = 0; v.grounded = true; v.q.setFromAxisAngle(_u.set(0, 1, 0), a); v.tilt = v.roll = 0; settle(v, true); ch.y = v.y; } else settle(ch, false); camYaw = a; camSnap = true; camX = x; camZ = z; }
function discover(p) { if (p.found) return; p.found = true; state.money += 50; setTimeout(() => toast('Entdeckt: ' + p.name + ' · + CHF 50.–'), 700); }
async function goTo(x, z, a, label) { if (busy) return; busy = true; fadeOn(label); await wait(220); resetNPC(); putActive(x, z, a); await ensureRegions(x, z); putActive(x, z, a); updTerrain(true); save(); await wait(120); fadeOff(); busy = false; }
async function travel(p) { const car = !!chars[active].veh; toggleMap(false); await goTo(p.ax, p.az, p.aa, 'Reise nach ' + p.name + ' …'); state.lastHub = null; discover(p); toast((car ? 'Per Autoverlad' : 'Mit dem Zug') + ' nach ' + p.name + ' gereist.'); }
async function switchChar() { if (!started || busy || uiOpen()) return; const o = chars[1 - active]; busy = true; fadeOn(o.name); await wait(260); resetNPC(); active = 1 - active; camX = o.x; camZ = o.z; await ensureRegions(o.x, o.z); if (o.veh) settle(o.veh, true); else settle(o, false); camYaw = o.veh ? o.veh.a : o.a; camSnap = true; updTerrain(true); fadeOff(); busy = false; toast(o.name); }
function act() { if (!started || busy || uiOpen()) return; const ch = chars[active]; if (ch.veh) exitVehicle(ch); else { const v = nearVehicle(ch); if (v) enterVehicle(ch, v); } }
function unstick() { if (!started || busy) return; const ch = chars[active], v = ch.veh, x = v ? v.x : ch.x, z = v ? v.z : ch.z, h = nearRoad(x, z, 5, 900, true); if (h) putActive(h.x, h.z, Math.atan2(h.tx, h.tz)); else if (v) { v.vx = v.vz = 0; v.y = ground(v.x, v.z, 1e9) + 1; v.q.setFromAxisAngle(_u.set(0, 1, 0), v.a); } }
// Tunnel: am Portal hinein, am anderen Portal wieder heraus
function checkPortal(now) { if (now < portalCool) return; const ch = chars[active], v = ch.veh, x = v ? v.x : ch.x, z = v ? v.z : ch.z; if (v && v.t.heli) return;
  for (const p of portalsNear(x, z, v ? 9 : 5)) { const ix = -Math.sin(p.out), iz = -Math.cos(p.out), sp = v ? v.vx * ix + v.vz * iz : (ch.amt > .5 ? Math.sin(ch.a) * ix + Math.cos(ch.a) * iz : 0) * 4; if (sp > (v ? 2 : 2.5)) { goThrough(p, v ? Math.hypot(v.vx, v.vz) : 0); return; } } }
async function goThrough(p, speed) { busy = true; const o = p.other, len = p.len < 1000 ? p.len + ' m' : (p.len / 1000).toFixed(1).replace('.', ',') + ' km'; fadeOn((p.name || 'Tunnel') + ' · ' + len); await wait(380 + Math.min(900, p.len / 12));
  const ox = Math.sin(o.out), oz = Math.cos(o.out), x = o.x + ox * 15, z = o.z + oz * 15; resetNPC(); putActive(x, z, o.out); await ensureRegions(x, z); putActive(x, z, o.out); const v = chars[active].veh; if (v) { v.vx = ox * speed; v.vz = oz * speed; } updTerrain(true); portalCool = performance.now() / 1000 + 2.5; fadeOff(); busy = false; }

/* ============================================================ Kurierauftraege */
let ring, beam;
function buildMarkers() {
  ring = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.5, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); ring.visible = false; scene.add(ring);
  beam = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 600, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false, fog: false })); beam.visible = false; scene.add(beam);
}
const kmBetween = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) / 1000;
function updMission(px, pz, t) {
  const m = state.mission, here = placeAt(px, pz), np = here || nearestPlace(px, pz); if (here) discover(here);
  const d = Math.hypot(px - np.hx, pz - np.hz); ring.visible = d < 900; if (ring.visible) { ring.position.set(np.hx, ground(np.hx, np.hz, 1e9) + .8, np.hz); ring.rotation.y = t; }
  if (state.lastHub && (state.lastHub !== np.id || d > 18)) state.lastHub = null;
  beam.visible = !!m && Math.hypot(px - m.to.hx, pz - m.to.hz) < 12000; if (beam.visible) beam.position.set(m.to.hx, H(m.to.hx, m.to.hz) + 300, m.to.hz);
  if (m && m.to === np && d < 7) { state.money += m.pay; toast('Paket in ' + m.to.name + ' abgeliefert · + ' + chf(m.pay)); chime(); state.mission = null; state.lastHub = np.id; save(); }
  else if (!m && d < 7 && state.lastHub !== np.id && t - startT > 6) { const opts = PLACES.filter(q => q !== np && (q.kind !== 'village' || np.lu)).map(q => ({ q, d: kmBetween(q, np) })).filter(o => o.d > 4 && o.d < (np.lu ? 40 : 130)); if (opts.length) { const o = opts[Math.random() * opts.length | 0]; state.mission = { from: np, to: o.q, pay: Math.round((90 + o.d * 9) / 10) * 10 }; toast('Kurierauftrag: Paket nach ' + o.q.name + ' · ' + chf(state.mission.pay)); chime(); } }
}
const SAVE = 'helvetia-save-v3';
function snapshot() { return { money: state.money, time: state.time, active, found: PLACES.filter(p => p.found).map(p => p.id), chars: chars.map(c => ({ x: c.veh ? c.veh.x : c.x, z: c.veh ? c.veh.z : c.z, a: c.a })), mission: state.mission ? { from: state.mission.from.id, to: state.mission.to.id, pay: state.mission.pay } : null }; }
function save() { if (!started) return; try { localStorage.setItem(SAVE, JSON.stringify(snapshot())); } catch (e) {} }
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch (e) { return null; } }

/* ============================================================ Garage */
let paintSel = 0; const spawned = [];
function freeSpot() { const ch = chars[active], v = ch.veh, bx = v ? v.x : ch.x, bz = v ? v.z : ch.z, by = v ? v.y : ch.y, a = v ? v.a : ch.a, fx = Math.sin(a), fz = Math.cos(a);
  for (const [f, s] of [[7, 0], [1, 5], [1, -5], [-8, 0], [11, 4], [11, -4], [15, 0], [0, 9], [0, -9], [-13, 0], [20, 0]]) { const x = bx + fx * f - fz * s, z = bz + fz * f + fx * s, g = ground(x, z, by + 1.5); if (!insideCH(x, z) || waterLevel(x, z) - g > .4 || Math.abs(g - by) > 4 || collide(x, z, 2.6, g + .6)) continue; if (vehicles.some(o => Math.hypot(o.x - x, o.z - z) < 4.5 && Math.abs(o.y - g) < 4)) continue; return { x, z, a, y: g }; }
  return null; }
function spawnHere(kind, paint, opt) { const s = freeSpot(); if (!s) { toast('Hier ist kein Platz. Geh auf eine freie Fläche.'); return null; }
  const v = spawnVehicle(kind, s.x, s.z, s.a, paint, Object.assign({ keep: true }, opt)); v.y = s.y; v.g.position.y = s.y; spawned.push(v); while (spawned.length > 8) { const o = spawned.find(q => !q.driver && q !== v); if (!o) break; spawned.splice(spawned.indexOf(o), 1); removeVehicle(o); } return v; }
function buildGarageUI() {
  const sw = $('sw'); PAINT.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'swb'; b.style.background = '#' + c.toString(16).padStart(6, '0'); b.setAttribute('aria-label', 'Farbe ' + (i + 1)); b.setAttribute('aria-pressed', i === 0); b.addEventListener('click', () => { paintSel = i; [...sw.children].forEach((x, k) => x.setAttribute('aria-pressed', k === i)); }); sw.appendChild(b); });
  const std = $('vstd'); for (const k of Object.keys(VT)) { const t = VT[k], b = document.createElement('button'); b.type = 'button'; b.className = 'vb'; b.innerHTML = '<b>' + esc(t.name) + '</b><span>bis ' + Math.round(t.max * 3.6) + ' km/h</span>'; b.addEventListener('click', () => { const v = spawnHere(k, k === 'heli' ? 0xc62828 : k === 'bus' ? 0xf4c400 : PAINT[paintSel]); if (v) { toggleGarage(false); toast(t.name + ' steht bereit.'); } }); std.appendChild(b); }
}
function fillSpecials() { const bx = $('vsp'); bx.textContent = ''; $('spt').textContent = 'Spezialfahrzeuge für ' + chars[active].name;
  for (const s of SPECIAL[active]) { const b = document.createElement('button'); b.type = 'button'; b.className = 'vb'; b.innerHTML = '<b><i style="background:#' + s.paint.toString(16).padStart(6, '0') + '"></i>' + esc(s.name) + '</b><span>bestellen · bis ' + Math.round(VT[s.base].max * s.boost * 3.6) + ' km/h</span>';
    b.addEventListener('click', () => { const old = vehicles.find(v => v.sid === s.id); if (old && old.driver) { toast('Du sitzt bereits in diesem Fahrzeug.'); return; } if (old) { const i = spawned.indexOf(old); if (i >= 0) spawned.splice(i, 1); removeVehicle(old); }
      const t = Object.assign({}, VT[s.base], { name: s.name, max: VT[s.base].max * s.boost, acc: VT[s.base].acc * s.boost }); const v = spawnHere(s.base, s.paint, { t, stripe: s.stripe, sid: s.id }); if (v) { toggleGarage(false); toast('Bestellung geliefert: ' + s.name); chime(); } }); bx.appendChild(b); } }
let garOpen = false, mapOpen = false; const uiOpen = () => garOpen || mapOpen;
function toggleGarage(on) { const want = on === undefined ? !garOpen : on; if (want && (!started || busy)) return; garOpen = want; if (garOpen) { toggleMap(false); fillSpecials(); } $('garov').hidden = !garOpen; }

/* ============================================================ Karten */
let mapSel = null; const MAP0 = { x0: -186582.5, z0: -125312, w: 373600, h: 251200 };
function drawMini() {
  const c = $('mini'), g = c.getContext('2d'), Wd = c.width, ch = chars[active], v = ch.veh, px = v ? v.x : ch.x, pz = v ? v.z : ch.z, sp = v ? Math.hypot(v.vx, v.vz) : 0, alt = (v ? v.y : ch.y) - H(px, pz), Rm = clamp(230 + sp * 7 + alt * 2.2, 230, 4000), k = Wd / (2 * Rm), im = imgAt(px, pz);
  g.save(); g.clearRect(0, 0, Wd, Wd); g.beginPath(); g.arc(Wd / 2, Wd / 2, Wd / 2, 0, TAU); g.clip(); g.fillStyle = '#56704c'; g.fillRect(0, 0, Wd, Wd);
  if (im && im.el) { const s = im.el.width / (im.x1 - im.x0), sz = im.el.height / (im.z1 - im.z0); g.drawImage(im.el, (px - Rm - im.x0) * s, (pz - Rm - im.z0) * sz, 2 * Rm * s, 2 * Rm * sz, 0, 0, Wd, Wd); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, 0, Wd, Wd); }
  const X = x => (x - px) * k + Wd / 2, Z = z => (z - pz) * k + Wd / 2, maxC = Rm < 500 ? 5 : Rm < 1400 ? 3 : 2; g.lineCap = g.lineJoin = 'round';
  for (const S of roadSets) { if (S.x0 > px + Rm || S.x1 < px - Rm || S.z0 > pz + Rm || S.z1 < pz - Rm) continue; for (const rd of S.roads) { if (rd.cls > maxC) continue; const P = rd.pts; if (Math.abs(P[0] - px) > Rm + rd.len || Math.abs(P[1] - pz) > Rm + rd.len) continue; g.beginPath(); for (let i = 0; i < rd.n; i++) i ? g.lineTo(X(P[i * 2]), Z(P[i * 2 + 1])) : g.moveTo(X(P[0]), Z(P[1])); g.strokeStyle = rd.cls <= 1 ? '#ffd23f' : '#fff'; g.lineWidth = Math.max(1.6, rd.w * k * .9); g.stroke(); } }
  if (!(v && v.t.heli)) drawLocalGuide(g, X, Z, px, pz, state.mission ? state.mission.to : placeAt(px, pz) || nearestPlace(px, pz));
  const dot = (x, z, col, r) => { let dx = (x - px) * k, dz = (z - pz) * k; const d = Math.hypot(dx, dz), lim = Wd / 2 - 10; if (d > lim) { dx *= lim / d; dz *= lim / d; } g.beginPath(); g.arc(Wd / 2 + dx, Wd / 2 + dz, r, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke(); };
  for (const o of vehicles) if (!o.driver && Math.abs(o.x - px) < Rm && Math.abs(o.z - pz) < Rm) dot(o.x, o.z, o.t.heli ? '#ff7a59' : '#7fd1ff', 3.5);
  const o = chars[1 - active]; if (Math.hypot(o.x - px, o.z - pz) < 20000) dot(o.x, o.z, '#3aa0ff', 6);
  const np = nearestPlace(px, pz), m = state.mission; if (Math.hypot(np.hx - px, np.hz - pz) < 3000) dot(np.hx, np.hz, '#ffcc00', 6); if (m) dot(m.to.hx, m.to.hz, '#ffcc00', 9);
  const a = v ? v.a : ch.a; g.translate(Wd / 2, Wd / 2); g.rotate(Math.PI - a); g.beginPath(); g.moveTo(0, -13); g.lineTo(9, 10); g.lineTo(0, 5); g.lineTo(-9, 10); g.closePath(); g.fillStyle = '#da291c'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); g.restore();
}
function drawBig() {
  const c = $('big'), g = c.getContext('2d'), Wd = c.width, Hh = c.height, el = IMGS[0].el, s = Math.min(Wd / MAP0.w, Hh / MAP0.h), ox = (Wd - MAP0.w * s) / 2, oz = (Hh - MAP0.h * s) / 2;
  g.fillStyle = '#0c1417'; g.fillRect(0, 0, Wd, Hh); if (el) g.drawImage(el, ox, oz, MAP0.w * s, MAP0.h * s); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(ox, oz, MAP0.w * s, MAP0.h * s);
  const X = x => ox + (x - MAP0.x0) * s, Z = z => oz + (z - MAP0.z0) * s; c.toWorld = (u, v) => [(u - ox) / s + MAP0.x0, (v - oz) / s + MAP0.z0];
  g.beginPath(); for (let i = 0; i < BN; i++) i ? g.lineTo(X(BX[i]), Z(BZ[i])) : g.moveTo(X(BX[i]), Z(BZ[i])); g.closePath(); g.strokeStyle = '#da291c'; g.lineWidth = 2.5; g.stroke(); g.textBaseline = 'middle';
  for (const p of PLACES) { const x = X(p.x), z = Z(p.z), vil = p.kind === 'village'; g.beginPath(); g.arc(x, z, p === mapSel ? 9 : p.kind === 'big' ? 7 : vil ? 2.6 : 4.5, 0, TAU); g.fillStyle = p === mapSel ? '#ffcc00' : p.found ? '#fff' : vil ? '#d9e2e4' : '#9fb0b5'; g.fill(); g.lineWidth = vil ? 1 : 2; g.strokeStyle = '#111'; g.stroke(); }
  for (const p of PLACES) { if ((p.kind === 'village' || (p.lu && p.kind === 'town')) && p !== mapSel) continue; const x = X(p.x), z = Z(p.z); g.font = '600 ' + (p.kind === 'big' || p === mapSel ? 21 : 17) + 'px Arial, sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(p.name, x + 10, z); g.fillStyle = p === mapSel ? '#ffcc00' : '#fff'; g.fillText(p.name, x + 10, z); }
  if (state.mission) { const t = state.mission.to; g.beginPath(); g.arc(X(t.x), Z(t.z), 12, 0, TAU); g.strokeStyle = '#ffcc00'; g.lineWidth = 4; g.stroke(); }
  chars.forEach((ch, i) => { g.beginPath(); g.arc(X(ch.x), Z(ch.z), 8, 0, TAU); g.fillStyle = i === active ? '#da291c' : '#3aa0ff'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); });
}
function fillPlaces() { const bx = $('pitems'), f = $('pfind').value.trim().toLowerCase(), ch = chars[active], here = placeAt(ch.x, ch.z); bx.textContent = '';
  const add = (title, list) => { list = list.filter(p => !f || p.name.toLowerCase().includes(f)).sort((a, b) => a.name.localeCompare(b.name, 'de')); if (!list.length) return; const h = document.createElement('h3'); h.textContent = title + ' (' + list.length + ')'; bx.appendChild(h);
    for (const p of list) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pi' + (p === here ? ' here' : ''); b.innerHTML = esc(p.name) + '<span>' + (p === here ? 'hier' : Math.round(Math.hypot(p.x - ch.x, p.z - ch.z) / 1000) + ' km') + '</span>'; b.addEventListener('click', () => travel(p)); bx.appendChild(b); } };
  add('Städte und Orte', PLACES.filter(p => !p.lu)); add('Kanton Luzern', PLACES.filter(p => p.lu)); }
function toggleMap(on) { const want = on === undefined ? !mapOpen : on; if (want && (!started || busy)) return; mapOpen = want; setPhotoView(false); if (mapOpen) { toggleGarage(false); mapSel = null; $('maphint').textContent = 'Ort wählen: mit dem Zug dorthin reisen.'; drawBig(); fillPlaces(); } $('mapov').hidden = !mapOpen; }
$('big').addEventListener('click', e => { const c = $('big'), r = c.getBoundingClientRect(), [wx, wz] = c.toWorld((e.clientX - r.left) / r.width * c.width, (e.clientY - r.top) / r.height * c.height); let best = null, bd = 3200; for (const p of PLACES) { const d = Math.hypot(p.x - wx, p.z - wz) * (p.kind === 'village' ? 1.5 : 1); if (d < bd) { bd = d; best = p; } }
  if (!best) return; if (best === mapSel) { travel(best); return; } mapSel = best; $('maphint').textContent = best.name + ' gewählt. Nochmals antippen, um hinzureisen.'; drawBig(); });
$('pfind').addEventListener('input', fillPlaces);

function setPhotoView(on) {
  const panel = $('photo-view'), container = $('street-container');
  panel.hidden = !on;
  $('mapbody').hidden = on;
  $('photo-toggle').setAttribute('aria-expanded', String(on));
  $('photo-toggle').textContent = on ? 'Zur Karte' : 'Ortsansicht';
  container.replaceChildren();
  if (!on) return;
  const ch = chars[active], at = mapSel || ch.veh || ch;
  const coordinates = (LAT_C - at.z / KZM).toFixed(6) + ',' + (LON_C + at.x / KXM).toFixed(6);
  const heading = mapSel ? 0 : (180 - at.a * 180 / Math.PI + 360) % 360;
  $('photo-place').textContent = mapSel ? mapSel.name : (placeAt(at.x, at.z)?.name || 'Dein Standort');
  $('photo-coordinates').textContent = (mapSel ? 'Gewählter Ort' : 'Dein Spielstandort') + ' · ' + coordinates.replace(',', ', ');
  const street = new URLSearchParams({ api: '1', map_action: 'pano', viewpoint: coordinates, heading: Math.round(heading) });
  const satellite = new URLSearchParams({ api: '1', map_action: 'map', center: coordinates, zoom: '18', basemap: 'satellite' });
  $('street-link').href = 'https://www.google.com/maps/@?' + street;
  $('satellite-link').href = 'https://www.google.com/maps/@?' + satellite;
  if (panel.dataset.embedKey) {
    const frame = document.createElement('iframe');
    frame.id = 'street-frame';
    frame.title = 'Google Street View – ' + $('photo-place').textContent;
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = 'https://www.google.com/maps/embed/v1/streetview?' + new URLSearchParams({
      key: panel.dataset.embedKey, location: coordinates, heading: Math.round(heading)
    });
    container.append(frame);
  }
}
$('photo-toggle').addEventListener('click', () => setPhotoView($('photo-view').hidden));
$('facade-file').addEventListener('change', async event => {
  const input = event.currentTarget, file = input.files[0], type = Number($('facade-type').value);
  const label = $('facade-type').selectedOptions[0].textContent, feedback = $('facade-feedback');
  if (!file) return;
  input.value = '';
  if (file.size > 20 * 1024 * 1024) { feedback.textContent = 'Bitte ein Bild unter 20 MB wählen.'; return; }
  const version = ++facadeChanges[type], url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (facadeChanges[type] !== version) return;
    const tile = document.createElement('canvas');
    tile.width = tile.height = 512;
    tile.getContext('2d').drawImage(image, 0, 0, 512, 512);
    applyFacadePhoto(type, tile);
    feedback.textContent = 'Foto für ' + label + ' übernommen.';
  } catch {
    feedback.textContent = 'Das Bild konnte nicht gelesen werden. Bitte JPEG, PNG oder WebP wählen.';
  } finally { URL.revokeObjectURL(url); }
});

/* ============================================================ Ton */
let ac = null, eng, engGain, sound = true;
function initAudio() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); eng = ac.createOscillator(); eng.type = 'sawtooth'; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; engGain = ac.createGain(); engGain.gain.value = 0; eng.connect(lp); lp.connect(engGain); engGain.connect(ac.destination); eng.start(); } catch (e) { ac = null; } }
function blip(f, d, type, vol) { if (!ac || !sound) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); }
const thud = () => blip(70, .18, 'square', .12), chime = () => { blip(660, .15, 'sine', .12); setTimeout(() => blip(990, .25, 'sine', .12), 130); };

/* ============================================================ Eingabe */
const keys = {};
const touchUI = () => { $('joy').hidden = false; $('pad').hidden = false; $('keys').hidden = true; };
const NAV = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
addEventListener('keydown', e => { if (e.target && ['INPUT', 'SELECT', 'SUMMARY'].includes(e.target.tagName)) { if (e.code === 'Escape') toggleMap(false); return; } if (e.repeat) { if (NAV.includes(e.code)) e.preventDefault(); return; } keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'KeyF') act(); if (e.code === 'Enter' && !started && !$('go').disabled) begin();
  if (e.code === 'KeyG') toggleGarage(); if (e.code === 'KeyC') switchChar(); if (e.code === 'KeyM') toggleMap(); if (e.code === 'Escape') { toggleMap(false); toggleGarage(false); } if (e.code === 'KeyR') unstick();
  if (NAV.includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
let joyId = null, camId = null, jx = 0, jy = 0, jox = 0, joy0 = 0, lx = 0, ly = 0; const btn = { B: false, C: false };
cv.addEventListener('pointerdown', e => { if (!started || uiOpen()) return; if (e.pointerType === 'touch') touchUI(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  const r = cv.getBoundingClientRect(); if (e.pointerType === 'touch' && e.clientX - r.left < r.width * .42 && joyId === null) { joyId = e.pointerId; jox = e.clientX; joy0 = e.clientY; const j = $('joy'), hr = $('hin').getBoundingClientRect(); j.style.left = (e.clientX - hr.left - 56) + 'px'; j.style.top = (e.clientY - hr.top - 56) + 'px'; j.style.bottom = 'auto'; }
  else if (camId === null) { camId = e.pointerId; lx = e.clientX; ly = e.clientY; } });
cv.addEventListener('pointermove', e => { if (e.pointerId === joyId) { let dx = (e.clientX - jox) / 46, dy = (e.clientY - joy0) / 46; const d = Math.hypot(dx, dy); if (d > 1) { dx /= d; dy /= d; } jx = dx; jy = -dy; $('knob').style.transform = `translate(${dx * 32}px,${dy * 32}px)`; }
  else if (e.pointerId === camId) { camYaw -= (e.clientX - lx) * .0052; camPitch = clamp(camPitch + (e.clientY - ly) * .004, -.2, 1.35); lx = e.clientX; ly = e.clientY; lastCamInput = performance.now() / 1000; } });
const pup = e => { if (e.pointerId === joyId) { joyId = null; jx = jy = 0; $('knob').style.transform = ''; const j = $('joy'); j.style.left = ''; j.style.top = ''; j.style.bottom = ''; } if (e.pointerId === camId) camId = null; };
cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
cv.addEventListener('wheel', e => { camZoom = clamp(camZoom * (e.deltaY > 0 ? 1.1 : .9), .55, 8); e.preventDefault(); }, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());
for (const k of ['B', 'C']) { const b = $('b' + k); b.addEventListener('pointerdown', e => { btn[k] = true; b.classList.add('on'); e.preventDefault(); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { btn[k] = false; b.classList.remove('on'); }); }
$('bA').addEventListener('pointerdown', e => { act(); e.preventDefault(); });
$('tMap').addEventListener('click', () => toggleMap()); $('mini').addEventListener('click', () => toggleMap()); $('mapclose').addEventListener('click', () => toggleMap(false)); $('tSw').addEventListener('click', switchChar);
$('tGar').addEventListener('click', () => toggleGarage()); $('garclose').addEventListener('click', () => toggleGarage(false));
$('tSnd').addEventListener('click', () => { sound = !sound; $('tSnd').setAttribute('aria-pressed', sound); $('tSnd').style.opacity = sound ? 1 : .5; });
function readInput() { let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + jx, iy = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + jy; ix = clamp(ix, -1, 1); iy = clamp(iy, -1, 1); const sp = !!keys.Space || btn.B, sh = !!(keys.ShiftLeft || keys.ShiftRight) || btn.C; return { ix, iy, hb: sp, jump: sp, run: sh, up: sp, down: sh }; }

/* ============================================================ HUD */
let toastT = 0, lastToast = '';
function toast(s) { const n = performance.now(); if (s === lastToast && n - toastT < 2500) return; lastToast = s; toastT = n; const t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2800); }
function updHud() {
  const ch = chars[active], v = ch.veh, x = v ? v.x : ch.x, z = v ? v.z : ch.z, y = v ? v.y : ch.y, here = placeAt(x, z), h = nearRoad(x, z, 7, 26, false); let nm, cls = '', sub = fmtM(y) + ' m ü. M.';
  if (h && h.rd.name) { nm = h.rd.name; cls = here ? 'city' : h.rd.cls === 0 ? 'pass' : ''; if (here) sub = here.name + ' · ' + sub; }
  else if (here) { nm = here.name; cls = 'city'; }
  else { const np = nearestPlace(x, z, true), d = Math.hypot(np.x - x, np.z - z); nm = np.name + ' ' + Math.max(1, Math.round(d / 1000)) + ' km'; }
  $('place').textContent = nm; $('sign').className = cls; $('alt').textContent = sub;
  const hh = Math.floor(state.time), mm = Math.floor((state.time - hh) * 60); $('clock').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  $('money').textContent = chf(state.money); $('found').textContent = PLACES.filter(p => p.found).length + '/' + PLACES.length;
  const m = state.mission, mi = $('mission'); mi.hidden = !m; if (m) { const d = Math.hypot(m.to.hx - x, m.to.hz - z); mi.textContent = 'Paket nach ' + m.to.name + (d < 600 ? ' · zum gelben Ring' : ' · ' + (d < 9500 ? (d / 1000).toFixed(1).replace('.', ',') : Math.round(d / 1000)) + ' km') + ' · ' + chf(m.pay); }
  const sp = $('speedo'); sp.hidden = !v; if (v) { $('kmh').textContent = Math.round(Math.hypot(v.vx, v.vz) * 3.6); $('vname').textContent = v.t.name + (v.t.heli ? ' · ' + fmtM(Math.max(0, v.y - H(v.x, v.z))) + ' m über Grund' : ''); }
  const pr = $('prompt'), nv = v ? null : nearVehicle(ch); pr.hidden = !nv || !$('pad').hidden; if (nv) pr.innerHTML = '<kbd>E</kbd>' + esc(nv.t.name) + ' nehmen';
  $('bA').textContent = v ? 'Raus' : 'Rein'; $('bA').style.opacity = v || nv ? 1 : .45; $('bB').textContent = v ? (v.t.heli ? 'Steigen' : 'Bremse') : 'Sprung'; $('bC').textContent = v ? (v.t.heli ? 'Sinken' : '–') : 'Rennen';
  drawMini();
}

/* ============================================================ Tageszeit und Licht */
const cA = new THREE.Color(), SKY = { twilight: new THREE.Color(0x7767a9), topD: new THREE.Color(0x4486b9), topN: new THREE.Color(0x071022), horD: new THREE.Color(0xbfd9ea), horN: new THREE.Color(0x18243a), dusk: new THREE.Color(0xffa783) };
function updEnv(target) {
  const ang = (state.time - 6) / 12 * Math.PI, el = Math.sin(ang), day = sstep(-.1, .28, el), dusk = (1 - sstep(.05, .55, Math.abs(el))) * sstep(-.3, -.05, el);
  const sd = skyU.sunDir.value.set(Math.cos(ang) * .85, Math.max(el, -.15), .42).normalize();
  skyU.top.value.copy(SKY.topN).lerp(SKY.topD, day).lerp(SKY.twilight, dusk * .82); cA.copy(SKY.horN).lerp(SKY.horD, day).lerp(SKY.dusk, dusk * .9); skyU.hor.value.copy(cA); scene.fog.color.copy(cA); bgScene.fog.color.copy(cA);
  skyU.sunCol.value.setRGB(1, .92 - .42 * dusk, .76 - .56 * dusk).multiplyScalar(sstep(-.10, .04, el));
  if (el > -.05) { _v.set(sd.x, Math.max(sd.y, .14), sd.z).normalize(); sun.color.setRGB(1, lerp(.72, .96, day), lerp(.5, .88, day)); sun.color.g *= 1 - .28 * dusk; sun.color.b *= 1 - .48 * dusk; sun.intensity = .25 + 2.7 * day; } else { _v.set(-.3, .8, .4).normalize(); sun.color.setRGB(.55, .65, 1); sun.intensity = .55; }
  sun.position.copy(target).addScaledVector(_v, 520); sun.target.position.copy(target); sun2.position.copy(_v); sun2.color.copy(sun.color); sun2.intensity = sun.intensity;
  hemi.intensity = hemi2.intensity = .42 + 1.35 * day; const n = Math.max(1 - day, dusk * .42); for (const m of nightMats) m.emissiveIntensity = n * .95;
}

/* ============================================================ Schleife */
const camT = new THREE.Vector3(); let slowAcc = 0, slowN = 0, lastW = 0, lastH = 0, last = 0, hudT = 0, saveT = 0, strT = 0, menuAng = 0, pick = 0;
function setShadows(on) { sun.castShadow = on; renderer.shadowMap.enabled = on; for (const b of blobs) b.visible = !on; }
function stream(px, pz, py) {
  updRegions(px, pz); updNatRoads(px, pz); updPortalMeshes(px, pz); pumpImages();
  const lim = VIEW + Math.max(0, py - H(px, pz) - 40) * 3;
  updB3(px, pz, Math.min(lim, VIEW + 1500));
  for (const R of regions.values()) if (R.state === 'ready') for (const m of R.far) { const c = m.userData.c; m.visible = Math.hypot(c.x - px, c.z - pz) < lim + 420; }
  for (const T of natTiles.values()) for (const S of T.sets.values()) for (const m of S.far) { const c = m.userData.c; m.visible = Math.hypot(c.x - px, c.z - pz) < lim + 900; }
  for (const v of vehicles) v.g.visible = Math.hypot(v.x - px, v.z - pz) < lim;
  for (const c of chars) c.P.g.visible = !c.veh && Math.hypot(c.x - px, c.z - pz) < lim;
}
function frame(now) {
  requestAnimationFrame(frame); now /= 1000; const raw = now - last || .016, dt = Math.min(.05, raw); last = now;
  if (started && !busy && raw < .5) { slowAcc += raw; slowN++; if (slowN >= 120) { if (slowAcc / slowN > .034 && regBusy === 0) { if (sun.castShadow) { shadowsOK = false; setShadows(false); } else if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - .5)); resize(); } } slowAcc = slowN = 0; } }
  if (cv.clientWidth !== lastW || cv.clientHeight !== lastH) { lastW = cv.clientWidth; lastH = cv.clientHeight; resize(); }
  const ch = chars[started ? active : pick], run = started && !busy, inp = run && !uiOpen() ? readInput() : null;
  if (run) {
    state.time = (state.time + dt * 24 / (20 * 60)) % 24;
    for (let i = 0; i < 2; i++) { const c = chars[i]; if (!c.veh && Math.hypot(c.x - ch.x, c.z - ch.z) < 700) updChar(c, dt, i === active ? inp : null); }
    for (const v of vehicles) { if ((v.awake || v.driver) && (v.driver === ch || Math.hypot(v.x - ch.x, v.z - ch.z) < 700)) updVehicle(v, dt, v.driver === ch ? inp : null); }
    for (const c of chars) if (c.veh) { c.x = c.veh.x; c.z = c.veh.z; c.y = c.veh.y; c.a = c.veh.a; }
    checkPortal(now);
  }
  const v = ch.veh, px = v ? v.x : ch.x, pz = v ? v.z : ch.z, py = v ? v.y : ch.y; camX = px; camZ = pz;
  if (now - strT > .25) { strT = now; stream(px, pz, py); }
  updTerrain(false);
  if (!busy) { updTraffic(dt, px, pz, run ? v : null); updPeds(dt, px, pz, run && v && !v.t.heli ? v : null); if (run) updMission(px, pz, now); }
  waterTime.value = now % 4096;
  updClouds(dt); updLabels(px, pz, now);
  let dist, th;
  if (!started) { menuAng += dt * .1; camYaw = menuAng; dist = 190; th = 28; camPitch = .4; }
  else if (v) { dist = v.t.camD * camZoom; th = v.t.camH; const sp = v.vx * Math.sin(v.a) + v.vz * Math.cos(v.a); if (now - lastCamInput > 1.4 && camId === null && Math.abs(sp) > 1.5) camYaw += angDiff(camYaw, v.a + (sp < -1.5 ? Math.PI : 0)) * Math.min(1, dt * 2.6); camera.fov = lerp(camera.fov, 60 + clamp(Math.abs(sp) / v.t.max, 0, 1) * 14, dt * 3); camera.updateProjectionMatrix(); }
  else { dist = 5.6 * camZoom; th = 1.55; if (Math.abs(camera.fov - 60) > .1) { camera.fov = lerp(camera.fov, 60, dt * 3); camera.updateProjectionMatrix(); } }
  _v.set(px, py + th, pz); if (camSnap) { camT.copy(_v); camSnap = false; } else camT.lerp(_v, Math.min(1, dt * 14));
  const cp = Math.cos(camPitch), sx = -Math.sin(camYaw) * cp, sy = Math.sin(camPitch), sz = -Math.cos(camYaw) * cp;
  if (started) { let ok = dist; for (let i = 1; i <= 8; i++) { const t = dist * i / 8, qx = camT.x + sx * t, qz = camT.z + sz * t, qy = camT.y + sy * t; if (collide(qx, qz, .45, qy) || H(qx, qz) > qy - .3) { ok = Math.max(1.2, dist * (i - 1) / 8); break; } } dist = ok; }
  const cx = camT.x + sx * dist, cz = camT.z + sz * dist; let cy = camT.y + sy * dist;
  cy = Math.max(cy, Math.max(H(cx, cz), waterLevel(cx, cz)) + .5); camera.position.set(cx, cy, cz); camera.lookAt(camT);
  updEnv(camT);
  if (ac && engGain) { const sp = v ? Math.hypot(v.vx, v.vz) : 0; engGain.gain.setTargetAtTime(v && sound && run ? (v.t.heli ? .05 * v.rs : .028 + Math.abs(inp ? inp.iy : 0) * .02) : 0, ac.currentTime, .1); eng.frequency.setTargetAtTime(v ? (v.t.heli ? 38 + v.rs * 30 : 48 + sp * 2.6 + (inp ? Math.abs(inp.iy) * 14 : 0)) : 50, ac.currentTime, .08); }
  if (started && now - hudT > .12) { hudT = now; updHud(); }
  if (run && now - saveT > 8) { saveT = now; save(); }
  bgCam.position.copy(camera.position); bgCam.quaternion.copy(camera.quaternion); bgCam.fov = camera.fov; bgCam.updateProjectionMatrix(); sky.position.copy(camera.position);
  renderer.clear(); renderer.render(bgScene, bgCam); renderer.clearDepth(); renderer.render(scene, camera);
}

/* ============================================================ Start */
function begin() { if (started || busy) return; started = true; active = pick; startT = performance.now() / 1000; setTimeout(() => { $('keys').hidden = true; }, 40000); initAudio(); $('start').hidden = true; $('hud').hidden = false; if (coarse) touchUI(); const ch = chars[active]; camYaw = ch.a; camPitch = .28; camSnap = true; cv.focus(); const p = placeAt(ch.x, ch.z); toast('Willkommen in ' + (p ? p.name : 'der Schweiz') + '. Fahrzeuge findest du in der Garage.'); }
for (const i of [0, 1]) $('p' + i).addEventListener('click', async () => { if (busy || started || pick === i) return; busy = true; pick = i; $('p0').setAttribute('aria-pressed', i === 0); $('p1').setAttribute('aria-pressed', i === 1); $('go').disabled = true; $('load').hidden = false; $('load').textContent = 'Lade Umgebung …'; const c = chars[i]; camX = c.x; camZ = c.z; resetNPC(); await ensureRegions(c.x, c.z); settle(c, false); updTerrain(true); camSnap = true; $('load').hidden = true; $('go').disabled = false; busy = false; });
$('go').addEventListener('click', begin);
async function boot(hot) {
  const say = async t => { $('load').textContent = t; await wait(20); };
  try {
    await say('Lade Karten der Schweiz …');
    const [index, places, nat0] = await Promise.all([getJSON('w/index.json'), getJSON('w/places.json'), loadImage('w/ortho.jpg')]);
    const im0 = addImg(MAP0.x0, MAP0.z0, MAP0.x0 + MAP0.w, MAP0.z0 + MAP0.h, 'w/ortho.jpg', 4, 0, .5); imgReady(im0, nat0);
    for (const [i, j] of index.n12) addImg(i * 102400, j * 102400, (i + 1) * 102400, (j + 1) * 102400, 'w/n_' + i + '_' + j + '.jpg', 2, 1, .5);
    if (!coarse) for (const [i, j] of index.hi || []) addImg(i * 800, j * 800, (i + 1) * 800, (j + 1) * 800, 'z/h_' + i + '_' + j + '.jpg', 0, 4, .16);
    for (const [i, j] of index.lu) addImg(i * 25600, j * 25600, (i + 1) * 25600, (j + 1) * 25600, 'w/l_' + i + '_' + j + '.jpg', 1, 2, .4);
    initPlaces(places);
    await say('Lade Höhenmodell …'); await loadDEM(index.dem);
    regIndex = new Set(index.regions.map(q => RK(q[0], q[1]))); for (const q of index.regions) if (q[2]) regB3.add(RK(q[0], q[1])); natIndex = new Set(index.nat.map(q => q[0] + '_' + q[1])); initPortals(index.tunnels);
    buildClouds(); buildLabels();
    const sv = (hot && hot.chars) ? hot : loadSave();
    buildChars(sv); buildTraffic(); buildPeds(); buildMarkers(); buildGarageUI(); setShadows(shadowsOK);
    if (sv) { state.money = sv.money ?? state.money; state.time = sv.time ?? state.time; pick = active = sv.active ? 1 : 0; for (const k of sv.found || []) if (PLACE[k]) PLACE[k].found = true; if (sv.mission && PLACE[sv.mission.to] && PLACE[sv.mission.from]) state.mission = { from: PLACE[sv.mission.from], to: PLACE[sv.mission.to], pay: sv.mission.pay }; $('p0').setAttribute('aria-pressed', pick === 0); $('p1').setAttribute('aria-pressed', pick === 1); if (sv.found && sv.found.length) $('go').textContent = 'Weiterfahren'; }
    chars.forEach((c, i) => { const p = placeAt(c.x, c.z) || nearestPlace(c.x, c.z, true); $('p' + i + 's').textContent = (sv ? 'Zuletzt bei ' : 'Start in ') + p.name; });
    const c = chars[pick]; camX = c.x; camZ = c.z;
    await say('Baue ' + (placeAt(c.x, c.z) || nearestPlace(c.x, c.z, true)).name + ' im Massstab 1:1 …'); await ensureRegions(c.x, c.z);
    for (const q of chars) settle(q, false); updTerrain(true); pumpImages();
    $('load').hidden = true; $('go').disabled = false; requestAnimationFrame(frame);
    if (hot && hot.started) begin();
  } catch (err) { $('load').textContent = 'Fehler beim Aufbau: ' + err.message; console.error(err); }
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => Object.assign(snapshot(), { started })); } catch (e) {}
window.__g = { renderer, scene, bgScene, chars, vehicles, state, H, ground, waterLevel, traffic, peds, regions, roadSets, tnodes, IMGS, get PLACES() { return PLACES; }, get PLACE() { return PLACE; }, get PORTALS() { return PORTALS; }, get active() { return active; }, get busy() { return busy; }, get regBusy() { return regBusy; }, begin, enterVehicle, travel, goTo, spawnHere, nearRoad, collide,
  tp(x, z) { putActive(x, z, chars[active].a); }, cam(y, p, z) { camYaw = y; camPitch = p; if (z) camZoom = z; lastCamInput = 1e9; } };
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot((window.claude && window.claude.hot && window.claude.hot.data) || null);
