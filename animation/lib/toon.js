// Spears & Tears cartoon kit — Hussain-style: big round heads, touching oval eyes,
// chunky brows, noodle arms with dark gloves, thick ink outlines, grime and scratches.
// Immediate-mode: every function returns an SVG string; scenes rebuild each frame.
(function () {
const C = {
  ink: '#2a1d17', skin: '#f3eee4', skinShade: '#d8cfc0', glove: '#3b393d',
  red: '#c4372c', redDark: '#8a231b', purple: '#6d3f91', purpleDark: '#47295f',
  bronze: '#cf9c3c', bronzeDark: '#8f6823', iron: '#a3a6ad', ironDark: '#6d7078',
  leather: '#7a5232', leatherDark: '#53361f', gold: '#e6b740', white: '#f2eee4',
  beard: '#2b211c', grey: '#8d8a86', grime: '#4f3d2c', tongue: '#d9667a', mouth: '#5a1616',
  mustard: '#d9a227', teal: '#2e8a84', sage: '#b9c79a', sepia: '#c9a46a', blue: '#3c6fb0',
};
let uid = 0;
const nid = p => p + (++uid);
const f = n => (+n).toFixed(1);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const back = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function rng(seed) {
  let a = (seed * 9301 + 49297) >>> 0 || 1;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function blobPath(cx, cy, r, R, n = 9) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (0.6 + 0.55 * R()); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); }
  const m = i => { const a = p[i % n], b = p[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  let d = `M${f(m(0)[0])},${f(m(0)[1])}`;
  for (let i = 1; i <= n; i++) { const q = p[i % n], e = m(i); d += `Q${f(q[0])},${f(q[1])} ${f(e[0])},${f(e[1])}`; }
  return d + 'Z';
}

// stains + scratch marks clipped to a shape
function grime(d, box, seed, o = {}) {
  const R = rng(seed), id = nid('g'), n = o.n ?? 7, col = o.col || C.grime;
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`;
  if (o.shade !== false) s += `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="${o.shadeW || 28}" transform="translate(${o.sx ?? 10},${o.sy ?? 8})"/>`;
  for (let i = 0; i < n; i++) {
    const x = box[0] + R() * box[2], y = box[1] + R() * box[3], r = Math.min(box[2], box[3]) * (0.06 + R() * 0.12);
    s += `<path d="${blobPath(x, y, r, R)}" fill="${col}" opacity="${f((o.op ?? 0.22) * (0.5 + R() * 0.8))}"/>`;
  }
  for (let i = 0; i < (o.scratches ?? 2); i++) s += hatch(box[0] + R() * box[2], box[1] + R() * box[3], 0.9 + R() * 0.6, R() * 60 - 30, 3);
  return s + '</g>';
}

// the signature "#"-style scratch mark
function hatch(x, y, s = 1, rot = 0, w = 3.5, col = C.ink) {
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(s)})" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none">
  <path d="M-11,-9 L8,12 M-4,-13 L13,6 M-10,8 L10,-10"/></g>`;
}

// ---------------- expressions ----------------
const EXPR = {
  neutral:    { lid: .12, tilt: 0,   lidB: 0,  look: [0, 0], pr: 6, brow: { y: -56, ang: 0,   raise: 0,  th: 14, l: 0, r: 0 }, mouth: { type: 'line', w: 24, open: 0 } },
  bored:      { lid: .5,  tilt: 0,   lidB: 0,  look: [0, 0], pr: 6, brow: { y: -50, ang: -3,  raise: 0,  th: 15, l: 0, r: 0 }, mouth: { type: 'frown', w: 22, open: 0 } },
  smug:       { lid: .48, tilt: -.15, lidB: .1, look: [0, 0], pr: 6, brow: { y: -56, ang: 6,  raise: 0,  th: 15, l: 0, r: 16 }, mouth: { type: 'smirk', w: 26, open: 0 } },
  angry:      { lid: .3,  tilt: 1,   lidB: 0,  look: [0, 0], pr: 6, brow: { y: -50, ang: 22,  raise: 0,  th: 19, l: 0, r: 0 }, mouth: { type: 'frown', w: 26, open: 0 } },
  determined: { lid: .32, tilt: .6,  lidB: .08, look: [0, 0], pr: 6, brow: { y: -52, ang: 14, raise: 0,  th: 17, l: 0, r: 0 }, mouth: { type: 'line', w: 22, open: 0 } },
  proud:      { lid: .38, tilt: -.2, lidB: 0,  look: [0, -.2], pr: 6, brow: { y: -60, ang: -6, raise: 4, th: 15, l: 0, r: 0 }, mouth: { type: 'smile', w: 26, open: 0 } },
  worried:    { lid: .05, tilt: -.6, lidB: 0,  look: [0, 0], pr: 5, brow: { y: -60, ang: -16, raise: 8, th: 14, l: 0, r: 0 }, mouth: { type: 'wavy', w: 22, open: 0 } },
  scared:     { lid: 0,   tilt: 0,   lidB: 0,  look: [0, 0], pr: 4, brow: { y: -62, ang: -20, raise: 16, th: 14, l: 0, r: 0 }, mouth: { type: 'wavy', w: 26, open: 0 } },
  shocked:    { lid: 0,   tilt: 0,   lidB: 0,  look: [0, 0], pr: 3.2, brow: { y: -64, ang: -8, raise: 26, th: 13, l: 0, r: 0 }, mouth: { type: 'o', w: 16, open: 1 } },
  shout:      { lid: .2,  tilt: 1,   lidB: 0,  look: [0, 0], pr: 5, brow: { y: -50, ang: 24, raise: 0,  th: 19, l: 0, r: 0 }, mouth: { type: 'open', w: 30, open: 1 } },
};
function expr(name, over = {}) {
  const b = JSON.parse(JSON.stringify(EXPR[name] || EXPR.neutral));
  for (const k in over) { if (typeof over[k] === 'object' && !Array.isArray(over[k])) Object.assign(b[k], over[k]); else b[k] = over[k]; }
  return b;
}
function mix(a, b, k) {
  if (typeof a === 'string') a = expr(a); if (typeof b === 'string') b = expr(b);
  const o = JSON.parse(JSON.stringify(k < .5 ? a : b));
  for (const key of ['lid', 'tilt', 'lidB', 'pr']) o[key] = lerp(a[key], b[key], k);
  o.look = [lerp(a.look[0], b.look[0], k), lerp(a.look[1], b.look[1], k)];
  for (const key of ['y', 'ang', 'raise', 'th', 'l', 'r']) o.brow[key] = lerp(a.brow[key], b.brow[key], k);
  o.mouth.w = lerp(a.mouth.w, b.mouth.w, k);
  return o;
}

// ---------------- face parts ----------------
function eye(cx, cy, rx, ry, e, side, patched) {
  const id = nid('e');
  if (patched) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 3}" ry="${ry}" fill="#1b1512" stroke="${C.ink}" stroke-width="6"/>
    <path d="M${cx - rx * .55},${cy - ry * .5} Q${cx},${cy - ry * .75} ${cx + rx * .4},${cy - ry * .55}" stroke="#4a4038" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  const top = cy - ry, h = ry * 2, tl = e.tilt * 14;
  const yOut = top + h * e.lid - tl, yIn = top + h * e.lid + tl;
  const xOut = side < 0 ? cx - rx - 6 : cx + rx + 6, xIn = side < 0 ? cx + rx + 6 : cx - rx - 6;
  const px = cx + e.look[0] * rx * .45, py = cy + e.look[1] * ry * .4 + (e.lid > .3 ? (e.lid - .3) * ry * .6 : 0);
  let s = `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff"/>
  <g clip-path="url(#${id})"><circle cx="${f(px)}" cy="${f(py)}" r="${f(e.pr)}" fill="${C.ink}"/>`;
  if (e.lid > 0.001) s += `<path d="M${xOut},${top - 20} L${xIn},${top - 20} L${xIn},${f(yIn)} L${xOut},${f(yOut)}Z" fill="${C.skin}" stroke="${C.ink}" stroke-width="6"/>`;
  if (e.lidB > 0.001) { const yb = cy + ry - h * e.lidB; s += `<path d="M${cx - rx - 6},${cy + ry + 20} L${cx + rx + 6},${cy + ry + 20} L${cx + rx + 6},${f(yb)} Q${cx},${f(yb - 6)} ${cx - rx - 6},${f(yb)}Z" fill="${C.skin}" stroke="${C.ink}" stroke-width="5"/>`; }
  return s + `</g><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ink}" stroke-width="6.5"/>`;
}
function brows(b, col = C.ink) {
  const one = (side, extra) => {
    const cx = side * 36, y = b.y - b.raise - extra, half = 30;
    const ang = side < 0 ? b.ang : -b.ang;
    return `<path transform="rotate(${f(ang)} ${cx} ${f(y)})" d="M${cx - half},${f(y + 3)} Q${cx},${f(y - 7)} ${cx + half},${f(y + 3)}" stroke="${col}" stroke-width="${f(b.th)}" stroke-linecap="round" fill="none"/>`;
  };
  return one(-1, b.l) + one(1, b.r);
}
function mouth(m, x = 0, y = 54) {
  const w = m.w, o = clamp(m.open);
  const st = `stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  switch (m.type) {
    case 'frown': return `<path d="M${x - w},${y + 7} Q${x},${y - 9} ${x + w},${y + 7}" fill="none" ${st}/>`;
    case 'smile': return `<path d="M${x - w},${y - 5} Q${x},${y + 16} ${x + w},${y - 5}" fill="none" ${st}/>`;
    case 'smirk': return `<path d="M${x - w * .8},${y + 3} Q${x + w * .2},${y + 9} ${x + w},${y - 9}" fill="none" ${st}/>`;
    case 'wavy': { let d = `M${x - w},${y}`; for (let i = 1; i <= 6; i++) d += ` L${f(x - w + i * w / 3)},${y + (i % 2 ? -5 : 5)}`; return `<path d="${d}" fill="none" ${st} stroke-width="5"/>`; }
    case 'o': return `<ellipse cx="${x}" cy="${y + 4}" rx="${f(w * (.6 + .4 * o))}" ry="${f(w * (.8 + .5 * o))}" fill="${C.mouth}" ${st}/>`;
    case 'open': case 'talk': {
      const id = nid('m'), h = 6 + o * 40, tw = w * (m.type === 'talk' ? .75 : 1);
      const d = `M${x - tw},${y - 2} Q${x},${y - 8} ${x + tw},${y - 2} Q${x + tw * .9},${f(y + h)} ${x},${f(y + h)} Q${x - tw * .9},${f(y + h)} ${x - tw},${y - 2}Z`;
      return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${C.mouth}"/>
      <g clip-path="url(#${id})"><rect x="${x - tw}" y="${y - 10}" width="${tw * 2}" height="13" fill="#fff"/><ellipse cx="${x + 4}" cy="${f(y + h + 4)}" rx="${tw * .6}" ry="${f(6 + o * 12)}" fill="${C.tongue}"/></g>
      <path d="${d}" fill="none" ${st}/>`;
    }
    default: return `<path d="M${x - w},${y} Q${x},${y + 3} ${x + w},${y}" fill="none" ${st}/>`;
  }
}

// ---------------- head ----------------
// o: { e (expression obj), shape: 'round'|'wide'|'small', patch: 'R'|'L', stubble, scars:[[x,y,rot]], beard:{col}, mustache, hair, seed, sweat, wrinkles }
function head(o) {
  const e = o.e || expr('neutral');
  const rx = o.shape === 'wide' ? 114 : o.shape === 'small' ? 92 : 100, ry = o.shape === 'wide' ? 100 : rx;
  const d = `M${-rx},0 A${rx},${ry} 0 1 0 ${rx},0 A${rx},${ry} 0 1 0 ${-rx},0Z`;
  const hid = nid('h');
  let s = '';
  if (o.hairBack) s += o.hairBack;
  s += `<clipPath id="${hid}"><path d="${d}"/></clipPath><path d="${d}" fill="${C.skin}"/>`;
  s += `<g clip-path="url(#${hid})">
    <path d="${d}" fill="none" stroke="${C.skinShade}" stroke-width="34" transform="translate(16,14)"/>`;
  if (o.stubble) {
    s += `<path d="M${-rx},20 Q0,${ry + 60} ${rx},20 L${rx},${ry} L${-rx},${ry}Z" fill="#9a948c" opacity=".35"/>`;
    const R = rng(o.seed || 7); for (let i = 0; i < 26; i++) { const a = Math.PI * (.15 + .7 * R()), r = rx * (.62 + .32 * R()); s += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r * .95 + 6)}" r="2.2" fill="${C.ink}" opacity=".55"/>`; }
  }
  const R = rng((o.seed || 3) + 11);
  for (let i = 0; i < 3; i++) s += `<path d="${blobPath(-rx * .6 + R() * rx * 1.2, -ry * .5 + R() * ry, 12 + R() * 14, R)}" fill="${C.grime}" opacity=".08"/>`;
  if (o.wrinkles) s += `<path d="M-40,-80 Q0,-86 40,-80 M-34,-70 Q0,-75 34,-70" stroke="${C.ink}" stroke-width="3.5" fill="none" opacity=".6"/>
     <path d="M-82,8 Q-76,20 -80,32 M82,8 Q76,20 80,32" stroke="${C.ink}" stroke-width="3.5" fill="none" opacity=".55"/>`;
  s += '</g>';
  s += `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="7.5"/>`;
  if (o.beard) s += beard(rx, ry, o.beard, o.seed || 5);
  const ey = -4, ex = 37, erx = 36, ery = 39;
  s += eye(-ex, ey, erx, ery, e, -1, o.patch === 'L');
  s += eye(ex, ey, erx, ery, e, 1, o.patch === 'R');
  if (o.patch) { const px = o.patch === 'R' ? ex : -ex, sx = o.patch === 'R' ? 1 : -1;
    s += `<g clip-path="url(#${hid})"><path d="M${-sx * rx},${-ry * .52} L${px - sx * 20},${ey - ery + 2} M${px + sx * 26},${ey + 4} L${sx * rx},${ey + 20}" stroke="#1b1512" stroke-width="8" fill="none"/></g>`; }
  s += brows(e.brow, o.browCol || C.ink);
  if (o.mustache) s += `<path d="M-4,36 Q-24,24 -42,40 Q-30,44 -6,42 Z M4,36 Q24,24 42,40 Q30,44 6,42 Z" fill="${o.mustache}" stroke="${C.ink}" stroke-width="4"/>`;
  s += mouth(e.mouth, 0, 56);
  for (const sc of (o.scars || [])) s += hatch(sc[0], sc[1], sc[3] || 1, sc[2] || 0);
  if (o.hair) s += o.hair;
  if (o.sweat) s += sweat(rx * .78, -ry * .45, o.sweat);
  return s;
}
function beard(rx, ry, b, seed) {
  const R = rng(seed), col = b.col || C.beard, pts = [], n = 13;
  for (let i = 0; i <= n; i++) { const a = Math.PI * (.02 + .96 * i / n), r = (b.len || 1) * (ry + 12 + R() * 12) * (1 + .18 * Math.sin(a)); pts.push([Math.cos(a) * rx * 1.04 * (r / ry), Math.sin(a) * r]); }
  let d = `M${rx * 1.02},8`;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[Math.max(0, i - 1)]; d += ` Q${f(p[0] * 1.08)},${f(p[1] * 1.08)} ${f((p[0] + q[0]) / 2)},${f((p[1] + q[1]) / 2)}`; }
  d += ` L${-rx * 1.02},8 Q${-rx * .7},${f(ry * .62)} -30,${f(ry * .72)} Q0,${f(ry * .8)} 30,${f(ry * .72)} Q${rx * .7},${f(ry * .62)} ${rx * 1.02},8Z`;
  let s = `<path d="${d}" fill="${col}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  const curl = b.curl || '#5a4636';
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + .7 * R()), r = ry * (.85 + .3 * R()); const x = Math.cos(a) * r * 1.02, y = Math.sin(a) * r;
    s += `<path d="M${f(x - 7)},${f(y)} q7,-9 13,0" stroke="${curl}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`; }
  s += `<path d="M-6,34 Q-28,20 -50,36 Q-34,46 -6,42Z M6,34 Q28,20 50,36 Q34,46 6,42Z" fill="${col}" stroke="${C.ink}" stroke-width="4.5"/>`;
  return s;
}
function sweat(x, y, k = 1) {
  return `<g opacity="${f(clamp(k))}"><path d="M${x},${y} q14,24 0,32 q-14,-8 0,-32Z" fill="#8fd0f2" stroke="${C.ink}" stroke-width="4"/>
  <path d="M${x + 18},${y + 34} q9,15 0,20 q-9,-5 0,-20Z" fill="#8fd0f2" stroke="${C.ink}" stroke-width="3.5"/></g>`;
}

// ---------------- hands & arms ----------------
const tube = (d, w, col, ow = 6) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w + ow * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
// glove at wrist (x,y) pointing along angle a (deg). pose: fist|point|open|grip|thumb
function glove(x, y, a, pose = 'fist', s = 1) {
  const fing = (x1, y1, x2, y2, w = 10) => tube(`M${x1},${y1} L${x2},${y2}`, w, C.glove, 3.5);
  let g = '';
  if (pose === 'open') {
    g += fing(14, -2, 40, -26) + fing(16, 0, 46, -9) + fing(16, 2, 45, 9) + fing(14, 4, 38, 24) + fing(6, -10, 14, -34, 11);
    g += `<ellipse cx="16" cy="0" rx="19" ry="18" fill="${C.glove}" stroke="${C.ink}" stroke-width="4"/>`;
  } else {
    if (pose === 'point') g += fing(22, -10, 56, -12, 11);
    if (pose === 'thumb') g += fing(12, -12, 14, -42, 12);
    g += `<path d="M0,-15 Q2,-22 18,-22 Q38,-23 40,-6 Q42,12 30,19 Q14,24 2,16 Q-3,0 0,-15Z" fill="${C.glove}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M28,-9 Q34,-6 34,0 M26,4 Q32,7 30,13" stroke="#1d1b1e" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (pose !== 'thumb') g += fing(8, -16, 24, -20, 11);
  }
  g += `<path d="M6,-10 Q14,-14 20,-10" stroke="#57545b" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(a)}) scale(${s})">${g}</g>`;
}
// noodle arm from (x1,y1) to (x2,y2) bending by `bend`; w=0 → thin noodle, otherwise sleeve tube
function arm(x1, y1, x2, y2, o = {}) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const bend = o.bend ?? 20, cx = mx - dy / L * bend, cy = my + dx / L * bend;
  const d = `M${f(x1)},${f(y1)} Q${f(cx)},${f(cy)} ${f(x2)},${f(y2)}`;
  const a = o.handAng ?? Math.atan2(y2 - cy, x2 - cx) * 180 / Math.PI;
  const line = o.w ? tube(d, o.w, o.col || C.red) : `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${o.lw || 6}" stroke-linecap="round"/>`;
  return line + (o.hand === false ? '' : glove(x2, y2, a, o.pose || 'fist', o.hs || 1));
}

// ---------------- headgear ----------------
function galea(o = {}) {
  const metal = o.metal || C.iron, dark = o.metalDark || C.ironDark, crest = o.crest || C.red, seed = o.seed || 2;
  const bowl = 'M-110,-26 Q-114,-120 0,-124 Q114,-120 110,-26 Q56,-44 0,-46 Q-56,-44 -110,-26Z';
  const cheekL = 'M-108,-34 L-116,40 Q-102,66 -80,44 L-78,-30Z', cheekR = 'M108,-34 L116,40 Q102,66 80,44 L78,-30Z';
  let s = '';
  for (const c of [cheekL, cheekR]) s += `<path d="${c}" fill="${metal}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` + grime(c, [-120, -40, 240, 110], seed + 9, { n: 2, scratches: 0, shadeW: 12 });
  s += `<circle cx="-97" cy="18" r="5" fill="${dark}" stroke="${C.ink}" stroke-width="3"/><circle cx="97" cy="18" r="5" fill="${dark}" stroke="${C.ink}" stroke-width="3"/>`;
  if (crest !== 'none') {
    const R = rng(seed), h = o.crestH || 120; let top = '';
    for (let i = 0; i <= 10; i++) { const x = -40 + i * 8, y = -122 - h * (0.55 + 0.45 * Math.sin(Math.PI * i / 10)) - R() * 16; top += ` L${f(x)},${f(y)} L${f(x + 4)},${f(y + 18 + R() * 10)}`; }
    const cd = `M-44,-112${top} L44,-112Z`;
    s += `<path d="${cd}" fill="${crest}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` + grime(cd, [-50, -122 - h, 100, h], seed + 4, { n: 3, scratches: 0, shadeW: 14 });
    for (let i = -3; i <= 3; i++) s += `<path d="M${i * 10},-118 L${i * 11},${-118 - h * .7}" stroke="${C.ink}" stroke-width="2.5" opacity=".45"/>`;
    s += `<rect x="-16" y="-136" width="32" height="22" rx="5" fill="${dark}" stroke="${C.ink}" stroke-width="5"/>`;
  }
  s += `<path d="${bowl}" fill="${metal}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>` + grime(bowl, [-110, -124, 220, 100], seed, { n: 4, scratches: 1, op: .2 });
  s += `<path d="M-104,-40 Q0,-64 104,-40" stroke="${dark}" stroke-width="9" fill="none"/><path d="M-70,-100 Q-40,-116 -8,-116" stroke="#fff" stroke-opacity=".45" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  return s;
}
// Carthaginian bronze helmet with a sweeping plume
function carthHelm(o = {}) {
  const metal = o.metal || C.bronze, dark = o.metalDark || C.bronzeDark, plume = o.plume || C.purple, seed = o.seed || 4;
  const bowl = 'M-112,-22 Q-118,-126 0,-128 Q118,-126 112,-22 L90,-30 Q60,-50 0,-52 Q-60,-50 -90,-30Z';
  const peak = 'M-96,-34 Q0,-70 96,-34 L104,-20 Q0,-50 -104,-20Z';
  const cheekL = 'M-110,-30 Q-124,20 -106,52 Q-88,58 -82,36 Q-90,8 -86,-28Z', cheekR = 'M110,-30 Q124,20 106,52 Q88,58 82,36 Q90,8 86,-28Z';
  const R = rng(seed); let pl = 'M-20,-120';
  for (let i = 0; i < 9; i++) { const t = i / 8, x = -20 + t * 190, y = -150 - 90 * Math.sin(Math.PI * (t * .8 + .1)) + t * 40; pl += ` Q${f(x - 6)},${f(y - 22 - R() * 14)} ${f(x + 12)},${f(y + 4)}`; }
  pl += ' Q150,-110 120,-100 Q60,-110 20,-118Z';
  let s = `<path d="${pl}" fill="${plume}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` + grime(pl, [-30, -260, 210, 170], seed + 2, { n: 3, scratches: 0, shadeW: 14 });
  for (let i = 0; i < 5; i++) s += `<path d="M${-6 + i * 26},-128 Q${30 + i * 30},${-190 + i * 14} ${60 + i * 26},${-150 + i * 10}" stroke="${C.ink}" stroke-width="2.5" fill="none" opacity=".4"/>`;
  for (const c of [cheekL, cheekR]) s += `<path d="${c}" fill="${metal}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<path d="${bowl}" fill="${metal}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>` + grime(bowl, [-112, -128, 224, 106], seed, { n: 4, scratches: 1, op: .22 });
  s += `<path d="M0,-128 L0,-56" stroke="${dark}" stroke-width="7"/><path d="${peak}" fill="${dark}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`;
  s += `<path d="M-74,-104 Q-46,-120 -14,-120" stroke="#fff" stroke-opacity=".45" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M-60,-88 q-14,-6 -20,8 q8,10 18,2" stroke="${dark}" stroke-width="5" fill="none"/><path d="M60,-88 q14,-6 20,8 q-8,10 -18,2" stroke="${dark}" stroke-width="5" fill="none"/>`;
  return s;
}
function curlyHair(col = C.beard, seed = 8) {
  const R = rng(seed); let d = 'M-96,-10';
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.05 + .9 * i / 12), r = 104 + R() * 10; d += ` Q${f(Math.cos(a - .1) * (r + 22))},${f(Math.sin(a - .1) * (r + 22))} ${f(Math.cos(a) * r)},${f(Math.sin(a) * r)}`; }
  d += ' Q60,-60 0,-66 Q-60,-62 -96,-10Z';
  return `<path d="${d}" fill="${col}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M-50,-88 q8,-10 16,0 M10,-96 q8,-10 16,0 M50,-80 q8,-10 16,0" stroke="#5a4636" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}

// ---------------- bodies ----------------
const BUST = 'M-90,86 Q-136,96 -150,160 Q-160,260 -164,440 L164,440 Q160,260 150,160 Q136,96 90,86Z';
const CHIBI = 'M-48,82 Q-70,92 -72,132 L-76,226 Q0,240 76,226 L72,132 Q70,92 48,82Z';
function body(kind, outfit, seed = 1, cloakCol) {
  const bust = kind === 'bust', d = bust ? BUST : CHIBI, box = bust ? [-164, 86, 328, 350] : [-76, 82, 152, 158];
  const W = bust ? 1 : .42;
  let s = '';
  const base = (col) => `<path d="${d}" fill="${col}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
  const clip = (inner) => { const id = nid('b'); return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
  if (outfit === 'legion') {
    if (!bust) s += tunicSkirt(C.red, seed);
    s += base(C.iron);
    let bands = '';
    const y0 = bust ? 150 : 108, step = bust ? 40 : 22;
    for (let y = y0; y < (bust ? 440 : 230); y += step) bands += `<path d="M-200,${y} Q0,${y + (bust ? 16 : 8)} 200,${y}" stroke="${C.ink}" stroke-width="${bust ? 6 : 4.5}" fill="none"/><path d="M-200,${y + 5} Q0,${y + (bust ? 21 : 12)} 200,${y + 5}" stroke="#fff" stroke-opacity=".35" stroke-width="${bust ? 5 : 3}" fill="none"/>`;
    bands += `<path d="M0,${bust ? 100 : 84} L0,${bust ? 420 : 230}" stroke="${C.ink}" stroke-width="${bust ? 5 : 3.5}"/>`;
    bands += bust ? `<path d="M-172,190 Q-150,110 -80,96 M-180,236 Q-160,140 -100,128 M172,190 Q150,110 80,96 M180,236 Q160,140 100,128" stroke="${C.ink}" stroke-width="6" fill="none"/>`
                  : `<path d="M-72,128 Q-62,92 -36,86 M72,128 Q62,92 36,86" stroke="${C.ink}" stroke-width="4.5" fill="none"/>`;
    s += clip(bands) + grime(d, box, seed, { n: 5, scratches: 2 });
    if (bust) {
      for (const sx of [-1, 1]) for (let i = 2; i >= 0; i--) {
        const o = i * 26, pd = `M${sx * (54 + o * .3)},${96 + o} Q${sx * (140 + o * .4)},${92 + o} ${sx * (160 + o * .2)},${178 + o} L${sx * (126 + o * .2)},${190 + o} Q${sx * (110 + o * .3)},${128 + o} ${sx * (50 + o * .3)},${124 + o}Z`;
        s += `<path d="${pd}" fill="${C.iron}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/><path d="M${sx * (70 + o * .3)},${104 + o} Q${sx * (128 + o * .4)},${104 + o} ${sx * (146 + o * .2)},${160 + o}" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none"/>`;
      }
      s += `<path d="M-74,90 Q0,140 74,90 Q60,126 0,132 Q-60,126 -74,90Z" fill="${C.red}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
    }
    if (!bust) s += `<rect x="-72" y="210" width="144" height="16" rx="4" fill="${C.leather}" stroke="${C.ink}" stroke-width="4.5"/><path d="M-20,226 L-22,262 M-6,226 L-6,266 M8,226 L9,264 M22,226 L24,260" stroke="${C.leatherDark}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (outfit === 'cuirass' || outfit === 'consul') {
    const metal = outfit === 'consul' ? C.gold : C.bronze, cloak = cloakCol || (outfit === 'consul' ? C.red : C.purple);
    if (!bust) s += tunicSkirt(outfit === 'consul' ? C.white : C.purple, seed, outfit === 'consul' ? C.red : C.gold);
    s += base(metal);
    s += clip(bust ? `<path d="M-60,200 Q-30,240 -4,206 M4,206 Q30,240 60,200 M-50,290 Q-26,316 -4,296 M4,296 Q26,316 50,290 M0,140 L0,420" stroke="${C.bronzeDark}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-120,180 Q-90,130 -40,120" stroke="#fff" stroke-opacity=".45" stroke-width="9" fill="none" stroke-linecap="round"/>`
                   : `<path d="M-30,130 Q-16,146 -2,132 M2,132 Q16,146 30,130 M0,100 L0,230" stroke="${C.bronzeDark}" stroke-width="4" fill="none"/>`);
    s += grime(d, box, seed, { n: 4, scratches: 2 });
    const cl = bust ? `M-90,86 Q-136,96 -150,160 Q-160,260 -164,440 L-100,440 Q-114,260 -106,150 Q-100,110 -66,94Z M90,86 Q136,96 150,160 Q160,260 164,440 L100,440 Q114,260 106,150 Q100,110 66,94Z`
                    : `M-48,82 Q-70,92 -72,132 L-80,240 L-50,236 Q-56,150 -40,90Z M48,82 Q70,92 72,132 L80,240 L50,236 Q56,150 40,90Z`;
    s += `<path d="${cl}" fill="${cloak}" stroke="${C.ink}" stroke-width="6.5" stroke-linejoin="round"/>` + grime(cl, box, seed + 3, { n: 4, scratches: 1, op: .25 });
    const bx = bust ? 84 : 40, by = bust ? 108 : 94, br = bust ? 16 : 8;
    s += `<circle cx="${-bx}" cy="${by}" r="${br}" fill="${C.gold}" stroke="${C.ink}" stroke-width="4"/><circle cx="${bx}" cy="${by}" r="${br}" fill="${C.gold}" stroke="${C.ink}" stroke-width="4"/>`;
  } else if (outfit === 'tunic' || outfit === 'gaul' || outfit === 'spain' || outfit === 'robe') {
    const col = outfit === 'gaul' ? C.skin : outfit === 'spain' ? C.white : outfit === 'robe' ? '#8a5a3a' : C.white;
    if (!bust && outfit !== 'robe') s += tunicSkirt(outfit === 'gaul' ? '#c9a23a' : col, seed, outfit === 'spain' ? C.red : outfit === 'gaul' ? '#7a3a2a' : C.purple, outfit === 'gaul');
    s += base(col);
    if (outfit === 'gaul') s += clip(`<path d="M-40,120 Q-20,134 -4,122 M4,122 Q20,134 40,120" stroke="${C.ink}" stroke-width="4" fill="none"/><path d="M-60,150 q10,-14 20,0 q10,14 20,0" stroke="${C.blue}" stroke-width="5" fill="none"/>`);
    if (outfit === 'spain') s += clip(`<rect x="-200" y="${bust ? 380 : 200}" width="400" height="${bust ? 16 : 10}" fill="${C.red}"/><path d="M-30,${bust ? 92 : 84} L0,${bust ? 150 : 108} L30,${bust ? 92 : 84}" stroke="${C.red}" stroke-width="${bust ? 12 : 6}" fill="none"/>`);
    if (outfit === 'tunic') s += clip(`<path d="M-40,${bust ? 92 : 84} Q0,${bust ? 150 : 110} 40,${bust ? 92 : 84}" stroke="${C.purple}" stroke-width="${bust ? 14 : 7}" fill="none"/>`);
    s += grime(d, box, seed, { n: 5, scratches: 2, op: .12, col: '#7a6a55' });
    if (outfit !== 'gaul') s += tornHem(d, box, seed, bust);
  }
  return s;
}
function tunicSkirt(col, seed, trim, check) {
  const R = rng(seed + 5); let d = 'M-74,210 L-80,262';
  for (let i = 0; i <= 10; i++) { const x = -80 + i * 16; d += ` L${f(x + 8)},${f(270 + R() * 10)} L${f(x + 16)},${f(260 + R() * 6)}`; }
  d += ' L74,210Z';
  let s = `<path d="${d}" fill="${col}" stroke="${C.ink}" stroke-width="5.5" stroke-linejoin="round"/>`;
  if (check) s += `<path d="M-60,215 L-64,262 M-30,215 L-32,268 M0,215 L0,270 M30,215 L32,268 M60,215 L64,262 M-78,240 L78,240" stroke="#7a3a2a" stroke-width="5" opacity=".7"/>`;
  return s + grime(d, [-80, 210, 160, 60], seed + 1, { n: 2, scratches: 0, shadeW: 10 });
}
function tornHem(d, box, seed, bust) {
  if (bust) return '';
  return '';
}
function legs(o = {}) {
  const col = o.col || C.skin, step = o.step || 0;
  const l = `M-26,250 L${f(-28 - step * 10)},300`, r = `M26,250 L${f(28 + step * 10)},300`;
  const shoe = (x) => `<path d="M${f(x - 18)},300 Q${f(x - 20)},286 ${f(x)},288 Q${f(x + 22)},290 ${f(x + 24)},302 Z" fill="${o.shoe || C.leatherDark}" stroke="${C.ink}" stroke-width="5"/>`;
  return tube(l, 18, col, 5) + tube(r, 18, col, 5) + shoe(-28 - step * 10) + shoe(28 + step * 10);
}

// ---------------- props ----------------
function scutum(x, y, s = 1, seed = 3, col = C.red) {
  const d = 'M-62,-110 Q0,-122 62,-110 L64,110 Q0,122 -64,110Z';
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="${d}" fill="${col}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M-52,-98 Q0,-108 52,-98 L54,98 Q0,108 -54,98Z" fill="none" stroke="${C.gold}" stroke-width="7"/>
  <path d="M-40,-60 L-8,-14 M40,-60 L8,-14 M-40,60 L-8,14 M40,60 L8,14" stroke="${C.gold}" stroke-width="9" stroke-linecap="round"/>
  <circle r="22" fill="${C.iron}" stroke="${C.ink}" stroke-width="6"/><circle cx="-6" cy="-7" r="6" fill="#fff" opacity=".5"/>
  ${grime(d, [-64, -116, 128, 232], seed, { n: 4, scratches: 2 })}</g>`;
}
function spear(x1, y1, x2, y2, tip = C.iron) {
  const a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return tube(`M${x1},${y1} L${x2},${y2}`, 9, '#9a6a3a', 4.5) + `<g transform="translate(${x2},${y2}) rotate(${f(a)})"><path d="M-4,-9 L40,0 L-4,9Z" fill="${tip}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/></g>`;
}
function standard(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})">${tube('M0,0 L0,-360', 12, '#9a6a3a', 5)}
  <path d="M-70,-300 L70,-300 L70,-180 L35,-200 L0,-180 L-35,-200 L-70,-180Z" fill="${C.red}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <text x="0" y="-232" font-family="Lilita, sans-serif" font-size="40" fill="${C.gold}" text-anchor="middle" stroke="${C.ink}" stroke-width="3" paint-order="stroke">SPQR</text>
  <rect x="-80" y="-306" width="160" height="12" rx="6" fill="${C.gold}" stroke="${C.ink}" stroke-width="4"/>
  <path d="M0,-360 Q-40,-400 -70,-380 Q-50,-375 -40,-360 Q-60,-350 -66,-330 Q-30,-350 0,-340 Q30,-350 66,-330 Q60,-350 40,-360 Q50,-375 70,-380 Q40,-400 0,-360Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="0" cy="-372" r="12" fill="${C.gold}" stroke="${C.ink}" stroke-width="4"/></g>`;
}

// ---------------- characters ----------------
// common opts: x,y,s,flip,e (expression),pose:'bust'|'chibi', arms:{l:{...},r:{...}}, talk, t, seed, bob
function wrap(o, inner) {
  const s = o.s || 1, fl = o.flip ? -1 : 1, rot = o.rot || 0;
  return `<g transform="translate(${f(o.x || 0)},${f((o.y || 0) + (o.bob || 0))}) rotate(${rot}) scale(${f(s * fl)},${f(s)})">${inner}</g>`;
}
function talkMouth(e, o) {
  if (!o.talk) return e;
  const t = o.t || 0, open = Math.abs(Math.sin(t * 13)) * .6 + Math.abs(Math.sin(t * 21)) * .25;
  e = JSON.parse(JSON.stringify(e)); e.mouth.type = 'talk'; e.mouth.open = open * (o.talk === true ? 1 : o.talk); return e;
}
function armsFor(o, kind, sleeve) {
  const A = o.arms || {}, out = { back: '', front: '' };
  const sh = kind === 'bust' ? [128, 160] : [62, 108];
  for (const side of ['l', 'r']) {
    const a = A[side]; if (!a) continue;
    const sx = side === 'l' ? -sh[0] : sh[0];
    const str = arm(sx, sh[1], a.x, a.y, { bend: a.bend ?? (side === 'l' ? 20 : -20), pose: a.pose, w: kind === 'bust' ? (a.w ?? 46) : (a.w || 0), col: a.col || sleeve, hs: kind === 'bust' ? 2.2 : 1.1, handAng: a.ang });
    if (a.behind) out.back += str; else out.front += str;
  }
  return out;
}
function legionary(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 1;
  const e = talkMouth(o.e || expr('neutral'), o);
  const A = armsFor(o, kind, C.red);
  let s = '';
  if (o.spear) s += spear(...o.spear);
  s += A.back;
  if (kind === 'chibi') s += legs({ step: o.step || 0 });
  s += body(kind, 'legion', seed);
  s += head({ e, seed, stubble: o.stubble ?? true, scars: o.scars || [[58, 40, 10, .9]], sweat: o.sweat, shape: o.shape });
  s += galea({ seed, crest: o.crest, metal: o.metal, crestH: o.crestH });
  if (o.shield) s += scutum(o.shield[0], o.shield[1], o.shield[2] || .9, seed);
  s += A.front;
  return wrap(o, s);
}
function hannibal(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 21;
  const e = talkMouth(o.e || expr('bored'), o);
  const A = armsFor(o, kind, C.purple);
  let s = A.back;
  if (kind === 'chibi') s += legs({});
  s += body(kind, 'cuirass', seed);
  s += head({ e, seed, patch: 'R', beard: { col: C.beard }, scars: [[-62, 44, -20, .9]], sweat: o.sweat });
  s += carthHelm({ seed });
  s += A.front;
  return wrap(o, s);
}
function varro(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 33;
  const e = talkMouth(o.e || expr('smug'), o);
  const A = armsFor(o, kind, C.red);
  let s = A.back;
  if (kind === 'chibi') s += legs({});
  s += body(kind, 'consul', seed);
  s += head({ e, seed, shape: 'wide', sweat: o.sweat, hair: `<path d="M-60,96 Q0,124 60,96" stroke="${C.ink}" stroke-width="5" fill="none"/>` });
  s += galea({ seed, metal: C.gold, metalDark: C.bronzeDark, crest: '#f2eee4', crestH: 190 });
  s += A.front;
  return wrap(o, s);
}
function hamilcar(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 44;
  const e = talkMouth(o.e || expr('angry'), o);
  const A = armsFor(o, kind, '#7a2a2a');
  let s = A.back;
  if (kind === 'chibi') s += legs({});
  s += body(kind, 'cuirass', seed, '#7a2a2a');
  s += head({ e, seed, beard: { col: '#8d8a86', curl: '#5f5c58', len: 1.1 }, wrinkles: true, scars: [[60, 30, 20, 1.1], [-40, -78, 0, .8]], browCol: '#5f5c58' });
  s += carthHelm({ seed, metal: '#a07a3a', plume: '#7a2a2a' });
  s += A.front;
  return wrap(o, s);
}
function boyHannibal(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 55;
  const e = talkMouth(o.e || expr('determined'), o);
  const A = armsFor(o, kind, C.white);
  let s = A.back;
  if (kind === 'chibi') s += legs({});
  s += body(kind, 'tunic', seed);
  s += head({ e, seed, shape: 'small', hair: curlyHair(C.beard, seed) });
  s += A.front;
  return wrap(o, s);
}
function gaul(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 66;
  const e = talkMouth(o.e || expr('bored'), o);
  const A = armsFor(o, kind, C.skin);
  let s = A.back;
  if (o.sword) s += spear(...o.sword);
  if (kind === 'chibi') s += legs({ col: '#c9a23a' });
  s += body(kind, 'gaul', seed);
  const R = rng(seed); let spikes = 'M-98,-20';
  for (let i = 0; i <= 9; i++) { const a = Math.PI * (1.05 + .9 * i / 9); spikes += ` L${f(Math.cos(a - .08) * 170)},${f(Math.sin(a - .08) * 175 - R() * 20)} L${f(Math.cos(a + .1) * 98)},${f(Math.sin(a + .1) * 98)}`; }
  spikes += 'Z';
  s += head({ e, seed, mustache: '#e8c35a', scars: [[-58, 40, 0, .9]], hair: `<path d="${spikes}" fill="#efd27a" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` });
  s += A.front;
  return wrap(o, s);
}
function iberian(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 77;
  const e = talkMouth(o.e || expr('bored'), o);
  const A = armsFor(o, kind, C.white);
  let s = A.back;
  if (o.spear) s += spear(...o.spear);
  if (kind === 'chibi') s += legs({});
  s += body(kind, 'spain', seed);
  s += head({ e, seed, stubble: true, scars: [[50, 44, 15, .8]] });
  s += `<path d="M-104,-30 Q-108,-118 0,-120 Q108,-118 104,-30 Q0,-56 -104,-30Z" fill="#5b3a26" stroke="${C.ink}" stroke-width="7"/><path d="M-60,-104 L-50,-50 M-20,-118 L-16,-54 M20,-118 L16,-54 M60,-104 L50,-50" stroke="#3a2416" stroke-width="5"/><path d="M0,-120 q-6,-30 10,-44 q4,24 -10,44" fill="${C.red}" stroke="${C.ink}" stroke-width="5"/>`;
  s += A.front;
  return wrap(o, s);
}

// ---------------- scenery & text ----------------
function defs(W = 1920, H = 1080) {
  return `<defs>
  <filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
  <filter id="blur8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .5"/></feComponentTransfer></filter>
  <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .9 -.25"/></filter>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="0" flood-color="#000" flood-opacity=".35"/></filter>
  <radialGradient id="vig" cx="50%" cy="48%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  </defs>`;
}
function bg(col, o = {}) {
  let s = `<rect width="1920" height="1080" fill="${col}"/>`;
  if (o.sil) s += `<g filter="url(#blur8)" fill="${o.sil}" opacity="${o.silOp ?? .55}">${o.silShapes || crowd(o.seed || 1)}</g>`;
  return s;
}
function crowd(seed = 1, y = 620, n = 9, col) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const x = i * 1920 / (n - 1) + (R() - .5) * 120, r = 80 + R() * 50, yy = y + R() * 80;
    s += `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(r)}"/><path d="M${f(x - r * 1.5)},1080 Q${f(x - r * 1.4)},${f(yy + r * .9)} ${f(x)},${f(yy + r * .8)} Q${f(x + r * 1.4)},${f(yy + r * .9)} ${f(x + r * 1.5)},1080Z"/>`; }
  return s;
}
function overlay(o = {}) {
  return `<rect width="1920" height="1080" filter="url(#paper)" opacity="${o.paper ?? .35}" pointer-events="none"/>
  <rect width="1920" height="1080" fill="url(#vig)" opacity="${o.vig ?? 1}"/>`;
}
function text(str, x, y, size, o = {}) {
  const sw = o.sw ?? size * .14, font = o.font || 'Luckiest';
  const k = o.k ?? 1, sc = o.scale ?? 1;
  return `<g transform="translate(${f(x)},${f(y)}) scale(${f(sc)}) rotate(${o.rot || 0})" opacity="${f(k)}">
  <text x="0" y="${f(size * .1)}" font-family="${font}" font-size="${size}" text-anchor="middle" fill="${o.shadow || '#1a120e'}" opacity=".45" stroke="${o.shadow || '#1a120e'}" stroke-width="${f(sw)}" stroke-linejoin="round" letter-spacing="${o.ls || 0}">${str}</text>
  <text x="0" y="0" font-family="${font}" font-size="${size}" text-anchor="middle" fill="${o.fill || '#fff'}" stroke="${o.stroke || C.ink}" stroke-width="${f(sw)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="${o.ls || 0}">${str}</text></g>`;
}
// stamp-in animation helper: returns {scale, k} for an element appearing at t0
function pop(t, t0, d = .35) { const x = (t - t0) / d; return { scale: x <= 0 ? 0 : back(x), k: x <= 0 ? 0 : 1 }; }

window.T = { C, nid, f, lerp, clamp, ease, back, rng, blobPath, grime, hatch, EXPR, expr, mix, eye, brows, mouth, head, beard, sweat,
  tube, glove, arm, galea, carthHelm, curlyHair, body, legs, scutum, spear, standard,
  legionary, hannibal, varro, hamilcar, boyHannibal, gaul, iberian, defs, bg, crowd, overlay, text, pop,
  reset() { uid = 0; } };
})();
