// Top-down Cannae battle board shared by sections 5 and 6. Everything is driven by a state object P
// whose fields are tweened over time with kf(); positions are lerped per token so formations morph.
(function () {
const { C, ease, clamp, lerp, f, rng } = T;
// keyframes: [[t, value], ...] -> eased value at time t (numbers or arrays)
function kf(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) if (t < frames[i][0]) {
    const [t0, a] = frames[i - 1], [t1, b] = frames[i], k = ease((t - t0) / (t1 - t0));
    return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
  }
  return frames[frames.length - 1][1];
}
const N = 240; // Roman tokens
function romanPts(cx, cy, cols, gx, gy, spread) {
  const rows = Math.ceil(N / cols), R = rng(3), out = [];
  for (let i = 0; i < N; i++) { const r = Math.floor(i / cols), c = i % cols, w = Math.min(cols, N - r * cols);
    const gxp = [cx + (c - (w - 1) / 2) * gx, cy + (r - (rows - 1) / 2) * gy];
    const sc = [cx + (R() - .5) * 1500, cy + (R() - .5) * 600];
    out.push([lerp(gxp[0], sc[0], spread), lerp(gxp[1], sc[1], spread)]); }
  return out;
}
// P: rom {cx,cy,cols,g,spread,op,fall}, gaul {cy,bulge,width,op}, afr {k,op}, cav {...}, wind
function board(t, P) {
  let s = K.plain(t);
  const jit = (x, i, a = 1.5) => x + Math.sin(t * 9 + i * 1.7) * a * (P.jitter ?? 1);
  // Roman cavalry
  const rc = (x0, y0, flee, dir) => { let g = ''; for (let i = 0; i < 10; i++) { const x = x0 + (i % 5) * 34, y = y0 + Math.floor(i / 5) * 40;
    const fx = x + flee * dir[0] * (300 + i * 30), fy = y + flee * dir[1] * (300 + i * 20); g += K.cavToken(jit(fx, i), fy, C.red, flee > 0 ? Math.atan2(dir[1], dir[0]) * 57.3 : 90, 16, 1 - ease((flee - .5) / .5)); } return g; };
  if (P.rcav) { s += rc(320, 300, P.rcav.fleeL || 0, [-.6, -1]); s += rc(1520, 300, P.rcav.fleeR || 0, [1, -1]); }
  // Romans
  const r = P.rom, gx = r.gx ?? r.g, gy = r.gy ?? r.g * .92, pts = romanPts(r.cx, r.cy, r.cols, gx, gy, r.spread || 0);
  const fall = r.fall || 0, R = rng(8);
  pts.forEach(([x, y], i) => { const gone = fall > 0 && R() < fall; if (r.op > 0 && !gone) s += K.token(jit(x, i), y, C.red, 11, { helm: C.iron, op: r.op }); });
  // Gauls & Spaniards crescent
  if (P.gaul && P.gaul.op > 0) K.crescent(960, P.gaul.cy, 26, P.gaul.width, P.gaul.bulge, 2, 26).forEach(([x, y], i) => s += K.token(jit(x, i), y, i % 2 ? '#c9a23a' : '#e8e2d2', 11, { op: P.gaul.op }));
  // Africans: from behind the wings (k=0) to the Roman flanks (k=1)
  if (P.afr && P.afr.op > 0) {
    const w = (r.cols - 1) * gx / 2, rows = Math.ceil(N / r.cols), h = (rows - 1) * gy / 2;
    for (const side of [-1, 1]) for (let i = 0; i < 24; i++) {
      const a = [960 + side * 400 + (i % 4 - 1.5) * 26, 640 + (Math.floor(i / 4) - 2.5) * 26];
      const b = [r.cx + side * (w + 40 + (i % 3) * 26), r.cy - h + (Math.floor(i / 3)) * (2 * h / 7)];
      const k = P.afr.k; s += K.token(jit(lerp(a[0], b[0], k), i), lerp(a[1], b[1], k), C.purpleDark, 11, { helm: C.bronze, op: P.afr.op });
    }
  }
  // Carthaginian cavalry: heavy (left) follows a path parameter; Numidians (right)
  if (P.ccav) {
    const c = P.ccav, path = c.path || [[340, 600]];
    const at = u => { const L = path.length - 1; if (L === 0) return path[0]; const x = clamp(u) * L, i = Math.min(L - 1, Math.floor(x)), q = x - i; return [lerp(path[i][0], path[i + 1][0], q), lerp(path[i][1], path[i + 1][1], q), Math.atan2(path[i + 1][1] - path[i][1], path[i + 1][0] - path[i][0]) * 57.3]; };
    const [hx, hy, ha] = at(c.u || 0);
    for (let i = 0; i < 12; i++) { const ox = (i % 4) * 34 - 50, oy = Math.floor(i / 4) * 40 - 40;
      const spreadX = c.rear ? (i - 5.5) * 50 : 0;
      s += K.cavToken(jit(hx + ox * (1 - (c.rear || 0)) + spreadX * (c.rear || 0), i), hy + oy * (1 - (c.rear || 0)), C.purple, c.rear ? 90 : (ha ?? -90), 16, c.op ?? 1); }
    const nx = c.numX ?? 1560, ny = c.numY ?? 600;
    for (let i = 0; i < 10; i++) s += K.cavToken(jit(nx + (i % 5) * 34 - 60, i), ny + Math.floor(i / 5) * 40, C.teal, c.numA ?? -90, 15, c.op ?? 1);
  }
  if (P.wind > 0) { s += `<g opacity="${f(P.wind)}">${K.dust(t, 26, -1, '#f1dfae', 9)}</g>`;
    for (let i = 0; i < 6; i++) { const x = 1900 - ((t * 500 + i * 340) % 2200), y = 160 + i * 130; s += `<path d="M${f(x)},${y} q60,-30 120,0 t120,0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity="${f(P.wind * .8)}"/>`; } }
  return s;
}
window.B = { kf, board, romanPts };
})();
