/* ============================================================ Fahrzeuge */
const VT = {
  sedan:   { name: 'Limousine',    max: 46, acc: 13, brake: 30, turn: 2.4, grip: 7, off: .55, L: 4.5, rad: 1.5, camD: 9.5, camH: 2.6, reach: 4.2 },
  sport:   { name: 'Sportwagen',   max: 68, acc: 22, brake: 38, turn: 2.6, grip: 8, off: .4,  L: 4.5, rad: 1.5, camD: 9.5, camH: 2.3, reach: 4.2 },
  suv:     { name: 'Geländewagen', max: 40, acc: 12, brake: 28, turn: 2.2, grip: 7, off: .9,  L: 4.7, rad: 1.6, camD: 10.5, camH: 3.0, reach: 4.4 },
  bus:     { name: 'Alpenbus',     max: 28, acc: 6,  brake: 20, turn: 1.5, grip: 8, off: .5,  L: 11,  rad: 2.5, camD: 19, camH: 5.2, reach: 7.5 },
  tractor: { name: 'Traktor',      max: 12, acc: 6,  brake: 20, turn: 2.0, grip: 9, off: 1,   L: 3.6, rad: 1.5, camD: 9.5, camH: 3.2, reach: 4.2 },
  heli:    { name: 'Helikopter',   max: 62, acc: 0,  brake: 0,  turn: 1.7, grip: 0, off: 1,   L: 9,   rad: 2.2, camD: 17, camH: 3.5, reach: 5.5, heli: true }
};
const PAINT = [0xc0c5c9, 0x1d1f22, 0xf2f2f0, 0x9b1c1c, 0x1f4e8c, 0x2d6a4f, 0x8e9aa3, 0xd9a400];
// Spezialfahrzeuge je Charakter (Platzhalter, bis die echten Modelle feststehen)
const SPECIAL = [
  [{ id: 's1a', name: 'Spezial 1 · Sport', base: 'sport', paint: 0x15171a, stripe: 0xda291c, boost: 1.18 }, { id: 's1b', name: 'Spezial 1 · Gelände', base: 'suv', paint: 0x1f4e8c, stripe: 0xf2f2f0, boost: 1.15 }],
  [{ id: 's2a', name: 'Spezial 2 · Sport', base: 'sport', paint: 0xb3261e, stripe: 0xf2f2f0, boost: 1.18 }, { id: 's2b', name: 'Spezial 2 · Limousine', base: 'sedan', paint: 0xf2f2f0, stripe: 0x15171a, boost: 1.2 }]
];
const geoCache = new Map();
function vehGeo(kind, paint, stripe) {
  const key = kind + paint + (stripe || ''); if (geoCache.has(key)) return geoCache.get(key);
  const P = [], gl = 0x1a2733, dk = 0x1c1e21, B = (...a) => P.push(box(...a));
  const wheels = (r, w, x, zf, zr, rr = r) => { for (const sx of [-1, 1]) { P.push([new THREE.CylinderGeometry(r, r, w, 12), 0x121315, TM(sx * x, r, zf, 1, 1, 1, 0, 0, Math.PI / 2)], [new THREE.CylinderGeometry(rr, rr, w * (rr > r ? 1.5 : 1), 12), 0x121315, TM(sx * x, rr, zr, 1, 1, 1, 0, 0, Math.PI / 2)], [new THREE.CylinderGeometry(r * .55, r * .55, w + .02, 8), 0x9aa0a6, TM(sx * x, r, zf, 1, 1, 1, 0, 0, Math.PI / 2)], [new THREE.CylinderGeometry(rr * .55, rr * .55, w * (rr > r ? 1.5 : 1) + .02, 8), 0x9aa0a6, TM(sx * x, rr, zr, 1, 1, 1, 0, 0, Math.PI / 2)]); } };
  const lights = (y, z, x = .62) => { B(.42, .15, .08, -x, y, z, 0xfff3c4); B(.42, .15, .08, x, y, z, 0xfff3c4); B(.42, .13, .08, -x, y + .03, -z, 0xc81e1e); B(.42, .13, .08, x, y + .03, -z, 0xc81e1e); };
  if (kind === 'sedan') { P.push([taperBox(1.86, .58, 4.5, .96, .97), paint, TM(0, .64, 0)], [taperBox(1.72, .56, 2.6, .8, .7), gl, TM(0, 1.2, -.25)]); B(1.36, .06, 1.8, 0, 1.5, -.25, paint); B(1.9, .2, 4.56, 0, .42, 0, dk); lights(.72, 2.24); wheels(.34, .26, .86, 1.42, -1.42); if (stripe) { B(.46, .02, 1.32, 0, .945, 1.5, stripe); B(.46, .02, .9, 0, .945, -1.75, stripe); B(.46, .02, 1.8, 0, 1.54, -.25, stripe); } }
  else if (kind === 'sport') { P.push([taperBox(1.92, .44, 4.5, .94, .96), paint, TM(0, .52, 0)], [taperBox(1.62, .42, 2.0, .78, .55), gl, TM(0, .95, -.35)]); B(1.2, .05, 1.05, 0, 1.17, -.35, paint); B(1.96, .16, 4.56, 0, .34, 0, dk); B(1.7, .06, .36, 0, 1.0, -2.05, paint); B(.08, .22, .2, -.7, .86, -2.05, dk); B(.08, .22, .2, .7, .86, -2.05, dk); lights(.56, 2.24, .66); wheels(.33, .3, .88, 1.4, -1.38); if (stripe) { B(.5, .02, 1.5, 0, .752, 1.38, stripe); B(.5, .02, .8, 0, .752, -1.7, stripe); B(.5, .02, 1.05, 0, 1.2, -.35, stripe); } }
  else if (kind === 'suv') { P.push([taperBox(1.96, .78, 4.7, .97, .98), paint, TM(0, .92, 0)], [taperBox(1.84, .7, 3.1, .86, .84), gl, TM(0, 1.66, -.45)]); B(1.58, .07, 2.6, 0, 2.04, -.45, paint); B(2.0, .26, 4.76, 0, .56, 0, dk); B(1.2, .05, 1.6, 0, 2.1, -.45, dk); lights(.98, 2.34, .68); wheels(.43, .3, .9, 1.5, -1.5); if (stripe) { B(.5, .02, 1.1, 0, 1.325, 1.7, stripe); B(1.98, .1, 4.72, 0, 1.0, 0, stripe); } }
  else if (kind === 'bus') { B(2.5, 2.5, 11, 0, 1.85, 0, 0xf4c400); B(2.54, .95, 10.2, 0, 2.3, -.1, gl); B(2.3, .9, .1, 0, 2.3, 5.5, gl); B(2.52, .12, 11.02, 0, 3.1, 0, 0xf6f6f2); B(2.54, .16, 11.02, 0, 1.2, 0, 0xc62828); B(2.52, .3, 11.04, 0, .62, 0, dk); lights(.95, 5.5, .9); wheels(.5, .34, 1.1, 3.7, -3.4); }
  else if (kind === 'tractor') { B(1.0, .8, 2.3, 0, 1.25, .75, paint); B(1.3, .5, 1.5, 0, 1.0, -.7, paint); P.push([taperBox(1.34, 1.25, 1.4, .88, .85), gl, TM(0, 1.9, -.75)]); B(1.2, .07, 1.25, 0, 2.55, -.75, paint); B(.12, 1.0, .12, .38, 2.1, 1.3, dk); B(.9, .3, .1, 0, 1.2, 1.92, 0xfff3c4); wheels(.48, .3, .72, 1.35, -.75, .85); }
  else if (kind === 'heli') { P.push([new THREE.SphereGeometry(1, 14, 10), paint, TM(0, 1.75, .4, 1.15, 1.15, 2.1)], [new THREE.SphereGeometry(1, 12, 8), gl, TM(0, 1.9, 1.35, 1.0, .92, 1.25)]); B(.34, .34, 4.4, 0, 2.05, -3.4, paint); B(.1, 1.3, .7, 0, 2.6, -5.4, 0xf2f2f0); B(1.5, .08, .5, 0, 2.2, -5.2, 0xf2f2f0); B(.5, .5, .5, 0, 2.95, .2, dk); B(.1, .1, 3.4, -1.0, .06, .4, dk); B(.1, .1, 3.4, 1.0, .06, .4, dk); for (const sx of [-1, 1]) for (const z of [-.5, 1.3]) B(.07, .9, .07, sx * .95, .5, z, dk); B(2.34, .22, .5, 0, 1.75, .3, 0xf2f2f0); }
  const g = merge(P); geoCache.set(key, g); return g;
}
const vehMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x555555 });
const shadowTex = canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(.7, 'rgba(0,0,0,.34)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 });
const shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const rotorGeo = merge([box(10.4, .06, .4, 0, 0, 0, 0x202225), box(.4, .06, 10.4, 0, 0, 0, 0x202225)]);
const vehicles = [], blobs = [];
function spawnVehicle(kind, x, z, a, paint, opt) {
  opt = opt || {}; const t = opt.t || VT[kind], g = new THREE.Group(), body = new THREE.Mesh(vehGeo(kind, paint, opt.stripe), vehMat); body.castShadow = true; g.add(body);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.scale.set(kind === 'bus' ? 4 : 3.2, 1, t.L * 1.25); sh.position.y = .07; g.add(sh); blobs.push(sh);
  const v = { kind, t, g, x, z, y: 0, a, vx: 0, vz: 0, vy: 0, driver: null, grounded: true, awake: true, q: new THREE.Quaternion(), rotor: null, rs: 0, sh, tilt: 0, roll: 0, keep: !!opt.keep, sid: opt.sid || null, reg: opt.reg || null };
  if (t.heli) { v.rotor = new THREE.Mesh(rotorGeo, vehMat); v.rotor.position.set(0, 3.25, .2); g.add(v.rotor); }
  v.q.setFromAxisAngle(_v.set(0, 1, 0), a); g.quaternion.copy(v.q); v.y = ground(x, z, 1e9); g.position.set(x, v.y, z); scene.add(g); vehicles.push(v); return v;
}
function removeVehicle(v) { const i = vehicles.indexOf(v); if (i >= 0) vehicles.splice(i, 1); scene.remove(v.g); const b = blobs.indexOf(v.sh); if (b >= 0) blobs.splice(b, 1); }
const _f = new THREE.Vector3(), _l = new THREE.Vector3(), _u = new THREE.Vector3(), _bm = new THREE.Matrix4(), _tq = new THREE.Quaternion();
function updVehicle(v, dt, inp) {
  const T = v.t; if (T.heli) return updHeli(v, dt, inp);
  const st = inp ? inp.ix : 0, thr = inp ? inp.iy : 0, hb = inp ? inp.hb : true;
  let fx = Math.sin(v.a), fz = Math.cos(v.a), vf = v.vx * fx + v.vz * fz;
  if (v.grounded) { const sp = Math.abs(vf); v.a -= st * T.turn * Math.min(1, sp / 5) / (1 + sp / 42) * dt * (vf >= 0 ? 1 : -1); fx = Math.sin(v.a); fz = Math.cos(v.a); }
  vf = v.vx * fx + v.vz * fz; let vl = -v.vx * fz + v.vz * fx;
  const onRoad = !!nearRoad(v.x, v.z, 7, 11, false), maxS = T.max * (onRoad ? 1 : Math.max(T.off, .7));
  if (v.grounded) {
    if (thr > 0) vf += (vf < -0.5 ? T.brake : T.acc * (1 - Math.pow(clamp(vf / maxS, 0, 1), 2))) * thr * dt;
    else if (thr < 0) vf += (vf > 0.5 ? T.brake : T.acc * .6 * (1 - clamp(-vf / (maxS * .3), 0, 1))) * thr * dt;
    vf -= vf * (0.12 + (Math.abs(vf) > maxS ? 1.6 : 0)) * dt; if (!thr) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 3 * dt);
    if (hb) vf -= Math.sign(vf) * Math.min(Math.abs(vf), T.brake * .8 * dt);
    const Lh = T.L * .4, slope = (ground(v.x + fx * Lh, v.z + fz * Lh, v.y + 1) - ground(v.x - fx * Lh, v.z - fz * Lh, v.y + 1)) / (2 * Lh); vf -= 16 * clamp(slope, -.6, .6) * dt * (hb && Math.abs(vf) < 1 ? 0 : 1);
    vl *= Math.exp(-(hb && inp ? 1.5 : T.grip * (onRoad ? 1 : .7)) * dt);
  }
  v.vx = fx * vf - fz * vl; v.vz = fz * vf + fx * vl;
  const steps = clamp(Math.ceil(Math.hypot(v.vx, v.vz) * dt / .9), 1, 5), h = dt / steps; let nx = v.x, nz = v.z;
  for (let s = 0; s < steps; s++) {
    const px = nx, pz = nz; nx += v.vx * h; nz += v.vz * h;
    for (const o of [T.L * .28, -T.L * .28]) { if (collide(nx + fx * o, nz + fz * o, T.rad * .8, v.y + .5)) { nx = hit.x - fx * o; nz = hit.z - fz * o; const vn = v.vx * hit.nx + v.vz * hit.nz; if (vn < 0) { v.vx -= vn * hit.nx * 1.25; v.vz -= vn * hit.nz * 1.25; v.vx *= .82; v.vz *= .82; if (vn < -6 && v.driver) bump(); } } }
    const wl = waterLevel(nx, nz), dep = wl > -1e8 ? wl - ground(nx, nz, v.y + 1) : 0, out = !insideCH(nx, nz);
    if (out || dep > 1.0) { if (v.driver === chars[active]) toast(dep > 1 ? 'Zu tief für dieses Fahrzeug.' : 'Landesgrenze – hier endet die Schweiz.'); v.vx *= -.3; v.vz *= -.3; nx = px; nz = pz; break; }
  }
  for (const o of vehicles) { if (o === v) continue; const dx = nx - o.x, dz = nz - o.z, rr = T.rad + o.t.rad; if (Math.abs(dx) > rr || Math.abs(dz) > rr || Math.abs(o.y - v.y) > 3) continue; const d = Math.hypot(dx, dz); if (d < rr && d > .01) { const ux = dx / d, uz = dz / d; nx = o.x + ux * rr; nz = o.z + uz * rr; const vn = v.vx * ux + v.vz * uz; if (vn < 0) { v.vx -= vn * ux * 1.2; v.vz -= vn * uz * 1.2; if (!o.driver && !o.t.heli) { o.vx += vn * ux * .5; o.vz += vn * uz * .5; o.awake = true; } if (vn < -6 && v.driver) bump(); } } }
  v.x = nx; v.z = nz;
  const g = ground(nx, nz, v.y + 1);
  if (v.y > g + 0.06) { v.vy -= 24 * dt; v.y += v.vy * dt; if (v.y <= g) { v.y = g; v.vy = 0; v.grounded = true; } else v.grounded = v.y - g < 0.3; }
  else { v.vy = clamp((g - v.y) / dt, -30, 30); v.y = g; v.grounded = true; }
  if (v.grounded) { const Lh = T.L * .36, Wh = .9, yy = v.y + 1, hF = ground(nx + fx * Lh, nz + fz * Lh, yy), hB = ground(nx - fx * Lh, nz - fz * Lh, yy), hL = ground(nx + fz * Wh, nz - fx * Wh, yy), hR = ground(nx - fz * Wh, nz + fx * Wh, yy);
    _f.set(fx * 2 * Lh, hF - hB, fz * 2 * Lh).normalize(); _l.set(fz * 2 * Wh, hL - hR, -fx * 2 * Wh).normalize(); _u.crossVectors(_f, _l).normalize(); _l.crossVectors(_u, _f); _bm.makeBasis(_l, _u, _f); _tq.setFromRotationMatrix(_bm); v.q.slerp(_tq, Math.min(1, dt * 12)); }
  else { _tq.setFromAxisAngle(_u.set(0, 1, 0), v.a); v.q.slerp(_tq, Math.min(1, dt * 1.5)); }
  v.g.position.set(v.x, v.y, v.z); v.g.quaternion.copy(v.q);
  v.awake = !!v.driver || Math.abs(v.vx) + Math.abs(v.vz) > .05 || !v.grounded;
}
const heliGround = (x, z) => Math.max(ground(x, z, 1e9), waterLevel(x, z) + .1);
function updHeli(v, dt, inp) {
  const T = v.t, on = !!inp, ground = heliGround(v.x, v.z), air = v.y > ground + .25;
  v.rs = lerp(v.rs, on ? 1 : 0, dt * (on ? .9 : .5)); v.rotor.rotation.y += v.rs * 26 * dt;
  let lift = on ? (inp.up ? 1 : 0) - (inp.down ? 1 : 0) : (air ? -.45 : 0); if (v.rs < .75 && lift > 0) lift = 0;
  v.vy = lerp(v.vy, lift * 24, Math.min(1, dt * 2.2));
  const fx = Math.sin(v.a), fz = Math.cos(v.a); let vf = v.vx * fx + v.vz * fz;
  if (on && air) { v.a -= inp.ix * T.turn * dt; vf = lerp(vf, inp.iy * T.max * (inp.iy < 0 ? .4 : 1), Math.min(1, dt * .7)); } else vf = lerp(vf, 0, Math.min(1, dt * (air ? .6 : 5)));
  const nfx = Math.sin(v.a), nfz = Math.cos(v.a); v.vx = nfx * vf; v.vz = nfz * vf;
  let nx = v.x + v.vx * dt, nz = v.z + v.vz * dt, ny = Math.min(v.y + v.vy * dt, 5200);
  if (collide(nx, nz, 2.4, ny + .3)) { nx = hit.x; nz = hit.z; v.vx *= .3; v.vz *= .3; }
  if (!insideCH(nx, nz)) { if (on) toast('Landesgrenze – hier endet die Schweiz.'); nx = v.x; nz = v.z; v.vx = v.vz = 0; }
  const g2 = heliGround(nx, nz); if (ny <= g2) { ny = g2; if (v.vy < 0) v.vy = 0; }
  v.x = nx; v.z = nz; v.y = ny; v.grounded = ny <= g2 + .25;
  v.tilt = lerp(v.tilt, air ? vf / T.max * .3 : 0, dt * 3); v.roll = lerp(v.roll, on && air ? inp.ix * .28 : 0, dt * 3);
  v.g.position.set(nx, ny, nz); v.g.rotation.set(v.tilt, v.a, v.roll, 'YXZ'); v.sh.position.y = g2 - ny + .08; v.sh.visible = ny - g2 < 60 && !sun.castShadow;
  v.awake = on || air || v.rs > .02;
}

/* ============================================================ Menschen */
const humanMat = new THREE.MeshLambertMaterial({ vertexColors: true });
function makeHuman(st) {
  const g = new THREE.Group(), hips = new THREE.Group(); hips.position.y = .93; g.add(hips);
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10), sph = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b), M = parts => { const m = new THREE.Mesh(merge(parts), humanMat); m.castShadow = true; return m; };
  const up = [[cap(.155, .30), st.top, TM(0, .33, 0, 1.2, 1, .8)], [sph(.17), st.bottom, TM(0, .04, 0, 1.12, .7, .85)], [new THREE.CylinderGeometry(.05, .06, .1, 8), st.skin, TM(0, .68, 0)], [sph(.112, 14, 10), st.skin, TM(0, .81, .005, .92, 1.14, 1)],
    [new THREE.SphereGeometry(.12, 14, 8, 0, TAU, 0, Math.PI * .56), st.hair, TM(0, .825, -.012, .95, 1.12, 1.04)], [sph(.014, 6, 4), 0x1b1b1b, TM(-.04, .825, .1)], [sph(.014, 6, 4), 0x1b1b1b, TM(.04, .825, .1)], [new THREE.BoxGeometry(.022, .04, .03), st.skin, TM(0, .795, .112)]];
  if (st.long) up.push([cap(.085, .16), st.hair, TM(0, .72, -.07, 1.25, 1, .7)]);
  if (st.collar) up.push([new THREE.CylinderGeometry(.075, .09, .06, 8), st.collar, TM(0, .64, 0)]);
  hips.add(M(up));
  const P = { g, hips };
  for (const s of [-1, 1]) { const n = s < 0 ? 'R' : 'L';
    const arm = new THREE.Group(); arm.position.set(s * .235, .55, 0); hips.add(arm); arm.add(M([[cap(.05, .2), st.top, TM(0, -.14, 0)]]));
    const fore = new THREE.Group(); fore.position.y = -.29; arm.add(fore); fore.add(M([[cap(.042, .2), st.sleeve || st.top, TM(0, -.13, 0)], [sph(.05, 8, 6), st.skin, TM(0, -.3, 0)]]));
    const leg = new THREE.Group(); leg.position.set(s * .095, 0, 0); hips.add(leg); leg.add(M([[cap(.078, .3), st.bottom, TM(0, -.22, 0)]]));
    const shin = new THREE.Group(); shin.position.y = -.45; leg.add(shin); shin.add(M([[cap(.058, .3), st.bottom, TM(0, -.2, 0)], [new THREE.BoxGeometry(.1, .08, .25), st.shoes, TM(0, -.435, .045)]]));
    P['arm' + n] = arm; P['fore' + n] = fore; P['leg' + n] = leg; P['shin' + n] = shin; }
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.scale.set(1.1, 1, 1.1); sh.position.y = .05; g.add(sh); P.sh = sh; blobs.push(sh);
  return P;
}
function animHuman(P, ph, amt, run, air) {
  const A = (run ? .95 : .6) * amt, s = Math.sin(ph), c = Math.cos(ph);
  P.legL.rotation.x = -s * A; P.legR.rotation.x = s * A; P.shinL.rotation.x = Math.max(0, c) * A * 1.1 + (air ? .5 : 0); P.shinR.rotation.x = Math.max(0, -c) * A * 1.1 + (air ? .5 : 0);
  P.armL.rotation.x = s * A * .8; P.armR.rotation.x = -s * A * .8; P.armL.rotation.z = .07; P.armR.rotation.z = -.07; const eb = -(run ? 1.1 : .25) * amt - .08; P.foreL.rotation.x = eb; P.foreR.rotation.x = eb;
  P.hips.position.y = .93 + Math.abs(c) * .035 * amt - (run ? .02 : 0) * amt; P.hips.rotation.x = run ? .16 * amt : 0;
}
const STYLE = [{ skin: 0xe6b594, hair: 0x2a1d14, top: 0x1f4e8c, sleeve: 0x1f4e8c, bottom: 0x23262b, shoes: 0xf1f1ee, collar: 0xe9e9e4 }, { skin: 0xc98f6a, hair: 0x14110f, top: 0xb3261e, sleeve: 0xb3261e, bottom: 0x3b4a66, shoes: 0x1a1a1a, long: true }];
const HOME = ['ZH', 'GE'];
const chars = [];
function buildChars(sv) {
  ['Charakter 1', 'Charakter 2'].forEach((name, i) => {
    const P = makeHuman(STYLE[i]), s = sv && sv.chars && sv.chars[i], ok = s && isFinite(s.x) && isFinite(s.z) && insideCH(s.x, s.z), h = PLACE[HOME[i]];
    const ch = { name, P, x: ok ? s.x : h.ax, z: ok ? s.z : h.az, y: 0, a: ok ? s.a : h.aa, vy: 0, veh: null, ph: 0, amt: 0, grounded: true, swim: false };
    P.g.visible = false; scene.add(P.g); chars.push(ch);
  });
}
let active = 0;
function updChar(ch, dt, inp) {
  let mx = 0, mz = 0, run = false;
  if (inp) { const fx = Math.sin(camYaw), fz = Math.cos(camYaw); mx = fx * inp.iy - fz * inp.ix; mz = fz * inp.iy + fx * inp.ix; run = inp.run; }
  const mag = Math.min(1, Math.hypot(mx, mz)), wl = waterLevel(ch.x, ch.z), g0 = ground(ch.x, ch.z, ch.y + 1);
  ch.swim = wl > -1e8 && wl - g0 > 1.15 && ch.y < wl + .5;
  const sp = ch.swim ? 3 : run ? 9.5 : 4.4;
  if (mag > .05) { const ml = Math.hypot(mx, mz) || 1, nx0 = mx / ml, nz0 = mz / ml; let nx = ch.x + nx0 * sp * mag * dt, nz = ch.z + nz0 * sp * mag * dt;
    if (collide(nx, nz, .42, ch.y + .3)) { nx = hit.x; nz = hit.z; }
    for (const v of vehicles) { const dx = nx - v.x, dz = nz - v.z, rr = v.t.rad * .85 + .4; if (Math.abs(dx) > rr || Math.abs(dz) > rr || Math.abs(v.y - ch.y) > 2.5) continue; const d = Math.hypot(dx, dz); if (d < rr && d > .01) { nx = v.x + dx / d * rr; nz = v.z + dz / d * rr; } }
    if (!insideCH(nx, nz)) { if (inp) toast('Landesgrenze – hier endet die Schweiz.'); } else if (ground(nx, nz, ch.y + 1) - ch.y < 1.6 || ch.swim) { ch.x = nx; ch.z = nz; }
    ch.a += angDiff(ch.a, Math.atan2(nx0, nz0)) * Math.min(1, dt * 12); }
  const g2 = ground(ch.x, ch.z, ch.y + 1);
  if (ch.swim) { ch.y = lerp(ch.y, wl - 1.25, Math.min(1, dt * 6)); ch.vy = 0; ch.grounded = false; }
  else { if (inp && inp.jump && ch.grounded) { ch.vy = 6.8; ch.grounded = false; }
    if (!ch.grounded || ch.y > g2 + .25) { ch.vy -= 20 * dt; ch.y += ch.vy * dt; ch.grounded = false; if (ch.y <= g2) { ch.y = g2; ch.vy = 0; ch.grounded = true; } } else { ch.y = g2; ch.grounded = true; } }
  ch.amt = lerp(ch.amt, mag > .05 ? 1 : 0, Math.min(1, dt * 10)); ch.ph += dt * (ch.swim ? 5 : run ? 11.5 : 7.2) * (mag > .05 ? 1 : 0);
  animHuman(ch.P, ch.ph, ch.amt, run && !ch.swim, !ch.grounded && !ch.swim);
  ch.P.g.position.set(ch.x, ch.y, ch.z); ch.P.g.rotation.y = ch.a; ch.P.g.rotation.x = ch.swim ? .9 : 0; ch.P.sh.visible = ch.grounded && !sun.castShadow;
}
function nearVehicle(ch) { let best = null, bd = 1e9; for (const v of vehicles) { if (v.driver) continue; const d = Math.hypot(v.x - ch.x, v.z - ch.z); if (d < v.t.reach && Math.abs(v.y - ch.y) < 3 && d < bd) { bd = d; best = v; } } return best; }
function enterVehicle(ch, v) { ch.veh = v; v.driver = ch; v.awake = true; v.keep = true; ch.P.g.visible = false; camYaw = v.a; lastCamInput = -9; toast(v.t.heli ? 'Helikopter: Leertaste steigt, Shift sinkt.' : v.t.name); }
function exitVehicle(ch) { const v = ch.veh; if (v.t.heli && !v.grounded) { toast('Erst landen, dann aussteigen.'); return; }
  const fx = Math.sin(v.a), fz = Math.cos(v.a), off = v.t.rad + 1.1; let ok = false;
  for (const s of [1, -1]) { const x = v.x + fz * off * s, z = v.z - fx * off * s; if (!collide(x, z, .45, v.y + .5) && insideCH(x, z)) { ch.x = x; ch.z = z; ok = true; break; } }
  if (!ok) { ch.x = v.x - fx * (v.t.L * .5 + 1.2); ch.z = v.z - fz * (v.t.L * .5 + 1.2); }
  ch.y = ground(ch.x, ch.z, v.y + 1); ch.a = v.a; ch.veh = null; v.driver = null; ch.P.g.visible = true; }
let lastBump = 0; function bump() { const n = performance.now(); if (n - lastBump > 500) { lastBump = n; thud(); } }

/* ============================================================ Verkehr auf dem echten Strassennetz */
const traffic = [], _ep = { x: 0, z: 0, tx: 0, tz: 1 }, peds = [];
function buildTraffic() { const r = rng32(9); for (let i = 0; i < (coarse ? 16 : 32); i++) { const q = r(), kind = q < .55 ? 'sedan' : q < .78 ? 'suv' : q < .9 ? 'sport' : 'bus', m = new THREE.Mesh(vehGeo(kind, PAINT[r() * PAINT.length | 0]), vehMat); m.castShadow = true; const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.scale.set(kind === 'bus' ? 4 : 3.2, 1, VT[kind].L * 1.25); sh.position.y = .07; m.add(sh); blobs.push(sh); m.rotation.order = 'YXZ'; m.visible = false; scene.add(m); traffic.push({ m, kind, t: VT[kind], rd: null, s: 0, dir: 1, sp: 0, want: 18 + r() * 10, wait: 0, x: 0, z: 0, y: 0, a: 0, live: false }); } }
function resetNPC() { for (const t of traffic) { t.live = false; t.m.visible = false; } for (const p of peds) { p.live = false; p.P.g.visible = false; } }
function placeTraffic(t, px, pz, first) { const a = Math.random() * TAU, d = (first ? 40 : 130) + Math.random() * 330, h = nearRoad(px + Math.sin(a) * d, pz + Math.cos(a) * d, 4, 60, false);
  if (h && Math.hypot(h.x - px, h.z - pz) > (first ? 25 : 100)) { t.rd = h.rd; t.s = h.s; t.dir = (h.rd.fl & 2) || Math.random() < .5 ? 1 : -1; t.sp = 6; t.live = true; t.m.visible = true; t.a = NaN; t.y = 1e9; return; } t.live = false; t.m.visible = false; }
function updTraffic(dt, px, pz, pv) {
  for (const t of traffic) {
    if (!t.live) { if (Math.random() < .12) placeTraffic(t, px, pz, false); continue; }
    const rd = t.rd; if (!roadSets.has(rd.set)) { t.live = false; t.m.visible = false; continue; }
    roadPos(rd, t.s, _ep); let want = [28, 15, 14, 12, 8][rd.cls] * (.8 + t.want / 70); const lane = rd.fl & 2 ? 0 : Math.min(rd.w / 4, 1.7), dirx = _ep.tx * t.dir, dirz = _ep.tz * t.dir; t.x = _ep.x - dirz * lane; t.z = _ep.z + dirx * lane;
    const dx = px - t.x, dz = pz - t.z, d = Math.hypot(dx, dz); if (d > 620) { placeTraffic(t, px, pz, false); continue; }
    const ahead = dx * dirx + dz * dirz, side = Math.abs(-dx * dirz + dz * dirx); if (ahead > 0 && ahead < 9 + t.sp * .8 && side < 3.2) want = 0;
    if (t.wait > 0) { t.wait -= dt; want = 0; }
    if (pv && d < pv.t.rad + t.t.rad && Math.abs(pv.y - t.y) < 3) { const ux = -dx / (d || 1), uz = -dz / (d || 1), vn = pv.vx * ux + pv.vz * uz; pv.x = t.x - ux * (pv.t.rad + t.t.rad); pv.z = t.z - uz * (pv.t.rad + t.t.rad); if (vn > 0) { pv.vx -= vn * ux * 1.3; pv.vz -= vn * uz * 1.3; if (vn > 5) bump(); } t.wait = 2; t.sp = 0; }
    t.sp += clamp(want - t.sp, -22 * dt, 7 * dt); t.s += t.sp * t.dir * dt;
    if (t.s < 0 || t.s > rd.len) { const opts = nodeOpts(t.s < 0 ? rd.k0 : rd.k1).filter(o => o.rd !== rd && o.rd.cls <= 4 && (o.end === 0 || !(o.rd.fl & 2)));
      if (opts.length) { const o = opts[Math.random() * opts.length | 0]; t.rd = o.rd; t.dir = o.end === 0 ? 1 : -1; t.s = o.end === 0 ? 0 : o.rd.len; } else if (rd.fl & 2) { t.live = false; t.m.visible = false; continue; } else { t.dir = -t.dir; t.s = clamp(t.s, 0, rd.len); } }
    const y = ground(t.x, t.z, t.y + 1), y2 = ground(t.x + dirx * 3, t.z + dirz * 3, y + 1), ta = Math.atan2(dirx, dirz); t.a = isNaN(t.a) ? ta : t.a + angDiff(t.a, ta) * Math.min(1, dt * 7); t.y = y; t.m.position.set(t.x, y, t.z); t.m.rotation.set(-Math.atan2(y2 - y, 3), t.a, 0);
  }
}

/* ============================================================ Fussgaenger */
function buildPeds() {
  const skins = [0xf0c8a8, 0xe6b594, 0xc98f6a, 0x9a6a48, 0x6e4a32], hairs = [0x2a1d14, 0x14110f, 0x6b4a2a, 0xb8925a, 0x8d8d8d, 0x5a2d1a], tops = [0x2f5d8a, 0x8a2f2f, 0x2f6a4a, 0xd9d4c7, 0x33363b, 0xc98a2b, 0x6a4a8a, 0x4a7a8a], bots = [0x23262b, 0x3b4a66, 0x5a5348, 0x2d3a2f, 0x6b6f76];
  const r = rng32(31); for (let i = 0; i < (coarse ? 14 : 26); i++) { const P = makeHuman({ skin: skins[r() * 5 | 0], hair: hairs[r() * 6 | 0], top: tops[r() * 8 | 0], bottom: bots[r() * 5 | 0], shoes: r() < .5 ? 0x1a1a1a : 0xe8e8e4, long: r() < .45 }); P.g.scale.setScalar(.92 + r() * .14); P.g.visible = false; scene.add(P.g); peds.push({ P, rd: null, s: 0, dir: 1, off: 0, x: 0, z: 0, y: 1e9, sp: 1.25 + r() * .5, ph: r() * 6, down: 0, live: false }); }
}
const SAY = ['Hoi! Pass uf!', 'Gopfridstutz!', 'He, langsam!', 'Attention!', 'Hallo?! Hier ist Zone 30!'];
function updPeds(dt, px, pz, pv) {
  const dense = !!placeAt(px, pz);
  for (const p of peds) {
    if (!p.live) { if (Math.random() < (dense ? .2 : .03)) { const a = Math.random() * TAU, d = 20 + Math.random() * 130, h = nearRoad(px + Math.sin(a) * d, pz + Math.cos(a) * d, 7, 35, false, 2); if (h && Math.hypot(h.x - px, h.z - pz) > 14 && (dense || placeAt(h.x, h.z))) { p.rd = h.rd; p.s = h.s; p.dir = Math.random() < .5 ? 1 : -1; p.off = h.rd.cls >= 6 ? (Math.random() - .5) * h.rd.w * .6 : (h.rd.w / 2 + 1.1) * (Math.random() < .5 ? 1 : -1); p.live = true; p.down = 0; p.y = 1e9; p.P.g.visible = true; p.P.g.rotation.x = 0; } } continue; }
    if (p.down > 0) { p.down -= dt; p.P.g.rotation.x = lerp(p.P.g.rotation.x, p.down > .6 ? -1.45 : 0, Math.min(1, dt * 8)); continue; }
    const rd = p.rd; if (!roadSets.has(rd.set)) { p.live = false; p.P.g.visible = false; continue; } p.s += p.sp * p.dir * dt;
    if (p.s < 0 || p.s > rd.len) { const opts = nodeOpts(p.s < 0 ? rd.k0 : rd.k1).filter(o => o.rd !== rd && o.rd.cls >= 2); if (opts.length) { const o = opts[Math.random() * opts.length | 0]; p.rd = o.rd; p.dir = o.end === 0 ? 1 : -1; p.s = o.end === 0 ? 0 : o.rd.len; if (o.rd.cls >= 6) p.off = clamp(p.off, -o.rd.w * .3, o.rd.w * .3); else p.off = (o.rd.w / 2 + 1.1) * Math.sign(p.off || 1); } else { p.dir = -p.dir; p.s = clamp(p.s, 0, rd.len); } }
    roadPos(p.rd, p.s, _ep); p.x = _ep.x - _ep.tz * p.off; p.z = _ep.z + _ep.tx * p.off; p.y = ground(p.x, p.z, p.y + 1);
    const dd = Math.hypot(p.x - px, p.z - pz), wl = waterLevel(p.x, p.z); if (dd > 240 || (wl > p.y + .4 && !(p.rd.fl & 1))) { p.live = false; p.P.g.visible = false; continue; }
    if (pv) { const dx = p.x - pv.x, dz = p.z - pv.z, d = Math.hypot(dx, dz), sp = Math.hypot(pv.vx, pv.vz); if (d < pv.t.rad + .5 && sp > 3 && Math.abs(pv.y - p.y) < 2.5) { p.down = 3.2; toast(SAY[Math.random() * SAY.length | 0]); bump(); } }
    p.ph += dt * 4.6 * p.sp; animHuman(p.P, p.ph, 1, false, false);
    p.P.g.position.set(p.x, p.y, p.z); p.P.g.rotation.set(0, Math.atan2(_ep.tx * p.dir, _ep.tz * p.dir), 0);
  }
}
