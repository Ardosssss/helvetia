// A* wie bei Baritone, hier auf den gerichteten Strassenstücken der geladenen Regionen.
// Start und Ziel liegen oft mitten auf einer Strasse.
function localRoadRoute(start, goal) {
  if (!start || !goal) return [];
  const finish = Symbol('Ziel'), pending = [], best = new Map(), previous = new Map();
  function offer(key, cost, estimate, parent, rd, from, to) {
    if (cost >= (best.get(key) ?? Infinity)) return;
    best.set(key, cost);
    previous.set(key, { parent, rd, from, to });
    const entry = { key, cost, rank: cost + estimate };
    let i = pending.length;
    pending.push(entry);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (entry.rank >= pending[p].rank) break;
      pending[i] = pending[p];
      i = p;
    }
    pending[i] = entry;
  }
  function pop() {
    const first = pending[0], last = pending.pop();
    if (pending.length) {
      let i = 0;
      while (2 * i + 1 < pending.length) {
        let child = 2 * i + 1;
        if (child + 1 < pending.length && pending[child + 1].rank < pending[child].rank) child++;
        if (last.rank <= pending[child].rank) break;
        pending[i] = pending[child];
        i = child;
      }
      pending[i] = last;
    }
    return first;
  }
  function toEnd(rd, forward, from, cost, parent) {
    const end = forward ? rd.len : 0, j = forward ? rd.pts.length - 2 : 0;
    const estimate = Math.hypot(rd.pts[j] - goal.x, rd.pts[j + 1] - goal.z);
    offer(forward ? rd.k1 : rd.k0, cost + Math.abs(end - from), estimate, parent, rd, from, end);
  }
  if (start.rd === goal.rd && (start.s <= goal.s || !(start.rd.fl & 2))) {
    return [{ rd: start.rd, from: start.s, to: goal.s }];
  }
  toEnd(start.rd, true, start.s, 0, null);
  if (!(start.rd.fl & 2) || start.s === 0) toEnd(start.rd, false, start.s, 0, null);
  for (let visited = 0; pending.length && visited < 5000;) {
    const node = pop();
    if (node.cost !== best.get(node.key)) continue;
    if (node.key === finish) {
      const path = [];
      for (let key = finish; key !== null;) {
        const step = previous.get(key);
        path.push(step);
        key = step.parent;
      }
      return path.reverse();
    }
    visited++;
    if (node.key === goal.rd.k0) offer(finish, node.cost + goal.s, 0, node.key, goal.rd, 0, goal.s);
    if (node.key === goal.rd.k1 && (!(goal.rd.fl & 2) || goal.s === goal.rd.len)) {
      offer(finish, node.cost + goal.rd.len - goal.s, 0, node.key, goal.rd, goal.rd.len, goal.s);
    }
    for (const { rd, end } of nodeOpts(node.key)) {
      if (rd.cls <= 5 && (!end || !(rd.fl & 2))) toEnd(rd, !end, end ? rd.len : 0, node.cost, node.key);
    }
  }
  return [];
}

let guide = null;
function drawLocalGuide(g, X, Z, px, pz, target) {
  // Lange Kurieraufträge behalten ihren Zielpunkt, bis das Zielgebiet geladen ist.
  if (!target || Math.hypot(px - target.hx, pz - target.hz) > 3500) { guide = null; return; }
  const now = performance.now();
  if (!guide || guide.target !== target || (now - guide.time > 1200 &&
      (Math.hypot(px - guide.x, pz - guide.z) > 22 || guide.sets !== roadSets.size || !guide.path.length && now - guide.time > 5000))) {
    const path = localRoadRoute(nearRoad(px, pz, 5, 75), nearRoad(target.hx, target.hz, 5, 80));
    guide = { x: px, z: pz, target, time: now, sets: roadSets.size, path };
  }
  if (!guide.path.length) return;
  const point = {};
  g.beginPath();
  guide.path.forEach(({ rd, from, to }, i) => {
    roadPos(rd, from, point);
    if (i === 0) g.moveTo(X(point.x), Z(point.z));
    for (let j = from <= to ? 1 : rd.n - 2; j > 0 && j < rd.n - 1; j += from <= to ? 1 : -1) {
      if (rd.cum[j] > Math.min(from, to) && rd.cum[j] < Math.max(from, to)) g.lineTo(X(rd.pts[2*j]), Z(rd.pts[2*j+1]));
    }
    roadPos(rd, to, point);
    g.lineTo(X(point.x), Z(point.z));
  });
  g.strokeStyle = '#2b1734'; g.lineWidth = 8; g.stroke();
  g.strokeStyle = '#ff83c6'; g.lineWidth = 4; g.stroke();
}
