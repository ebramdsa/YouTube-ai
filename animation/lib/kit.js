// Shared scene kit for episode sections: camera, kinetic text, props, the Mediterranean map,
// top-down battle tokens, and a shot runner driven by narrator sentence timings (TIMING).
(function () {
const { C, f, lerp, clamp, ease, back, rng, pop, text } = T;

// ---------- camera & timing ----------
function cam(inner, z = 1, cx = 960, cy = 540, shake = 0, t = 0) {
  const sx = shake * Math.sin(t * 90) * 14, sy = shake * Math.cos(t * 77) * 10;
  return `<g transform="translate(${f(960 + sx)},${f(540 + sy)}) scale(${f(z * 1.03)}) translate(${f(-cx)},${f(-cy)})">${inner}</g>`;
}
const shakeAt = (t, hits, d = .25) => hits.reduce((m, h) => Math.max(m, t > h && t < h + d ? 1 - (t - h) / d : 0), 0);
const march = (t, ph = 0, sp = 6) => ({ bob: -Math.abs(Math.sin(t * sp + ph)) * 9, step: Math.sin(t * sp + ph) });
const breathe = (t, ph = 0) => Math.sin(t * 2 + ph) * 3;
const fadeIn = (t, t0, d = .4) => ease((t - t0) / d);

// ---------- kinetic text ----------
function stamp(word, x, y, t, t0, rot = 0, o = {}) {
  const p = pop(t, t0, .22); if (!p.k) return '';
  const xk = o.cross === false ? 0 : ease((t - t0 - .3) / .18);
  let s = text(word, x, y, o.size || 120, { scale: lerp(2.2, 1, ease((t - t0) / .22)), rot, fill: o.fill || '#fff' });
  if (xk > 0) s += `<g transform="translate(${x},${y - 40}) rotate(${rot})" stroke="${C.red}" stroke-width="26" stroke-linecap="round" opacity=".92">
    <path d="M-${f(240 * xk)},-${f(70 * xk)} L${f(240 * xk)},${f(70 * xk)}"/>${xk > .5 ? `<path d="M-${f(240 * (xk - .5) * 2)},${f(70 * (xk - .5) * 2)} L${f(240 * (xk - .5) * 2)},-${f(70 * (xk - .5) * 2)}"/>` : ''}</g>`;
  return s;
}
// title-style word that pops in at t0
function say(str, x, y, size, t, t0, o = {}) {
  const p = pop(t, t0, o.d || .3); if (!p.k) return '';
  const out = o.out != null ? 1 - ease((t - o.out) / .25) : 1;
  if (out <= 0) return '';
  return text(str, x, y, size, { ...o, scale: p.scale * (o.scale || 1), k: out });
}
function lowerThird(name, sub, t, t0, col = C.red) {
  const k = ease((t - t0) / .35); if (k <= 0) return '';
  const x = lerp(-700, 60, k);
  return `<g transform="translate(${f(x)},880)"><rect x="0" y="0" width="620" height="130" rx="18" fill="${C.ink}" opacity=".88"/>
  <rect x="0" y="0" width="16" height="130" rx="6" fill="${col}"/>
  <text x="44" y="66" font-family="Luckiest" font-size="58" fill="#fff">${name}</text>
  <text x="46" y="108" font-family="Lilita" font-size="32" fill="${C.gold}">${sub}</text></g>`;
}
function dateCard(str, t, t0) {
  const k = ease((t - t0) / .3); if (k <= 0) return '';
  return `<g transform="translate(${f(lerp(2000, 1360, k))},60)"><rect width="520" height="96" rx="16" fill="${C.ink}" opacity=".85"/>
  <text x="260" y="66" font-family="Luckiest" font-size="52" fill="${C.gold}" text-anchor="middle">${str}</text></g>`;
}
function poof(x, y, k, s = 1, seed = 1, col = '#d9ccb4') {
  if (k <= 0 || k >= 1) return '';
  const R = rng(seed); let g = '';
  for (let i = 0; i < 9; i++) { const a = R() * Math.PI * 2, d = ease(k) * (60 + R() * 120) * s, r = (30 + R() * 40) * s * (1 - k * .5);
    g += `<path d="${T.blobPath(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, r, R)}" fill="${col}" stroke="${C.ink}" stroke-width="5"/>`; }
  return `<g opacity="${f(1 - ease((k - .6) / .4))}">${g}</g>`;
}
function speech(str, x, y, t, t0, o = {}) {
  const p = pop(t, t0, .25); if (!p.k) return '';
  const out = o.out != null ? 1 - ease((t - o.out) / .2) : 1; if (out <= 0) return '';
  const size = o.size || 56, w = Math.max(200, str.length * size * .64 + 90), h = size * 1.9, tx = (o.tail || -1) * w * .25;
  return `<g transform="translate(${x},${y}) scale(${f(p.scale)})" opacity="${f(out)}">
  <path d="M${f(tx - 26)},${f(h / 2 - 4)} L${f(tx - 40)},${f(h / 2 + 60)} L${f(tx + 26)},${f(h / 2 - 4)}Z" fill="#fff" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
  <rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="28" fill="#fff" stroke="${C.ink}" stroke-width="7"/>
  <path d="M${f(tx - 22)},${f(h / 2 - 4)} L${f(tx + 22)},${f(h / 2 - 4)}" stroke="#fff" stroke-width="9"/>
  <text x="0" y="${f(size * .35)}" font-family="Luckiest" font-size="${size}" text-anchor="middle" fill="${C.ink}">${str}</text></g>`;
}

// ---------- props ----------
function flag(x, y, col, k = 1, t = 0, emblem = '') {
  // k: 0 = lowered at the pole foot, 1 = fully raised
  const fy = lerp(-30, -300, ease(k)), wv = Math.sin(t * 6) * 10;
  return `<g transform="translate(${x},${y})">${T.tube('M0,0 L0,-320', 12, '#9a6a3a', 5)}
  <path d="M6,${f(fy)} Q70,${f(fy - 16 + wv)} 150,${f(fy + wv * .5)} L150,${f(fy + 96 + wv * .5)} Q70,${f(fy + 80 + wv)} 6,${f(fy + 96)}Z" fill="${col}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  ${emblem ? `<text x="78" y="${f(fy + 62)}" font-family="Luckiest" font-size="44" fill="${C.gold}" text-anchor="middle" stroke="${C.ink}" stroke-width="3" paint-order="stroke">${emblem}</text>` : ''}
  <circle cx="0" cy="-326" r="13" fill="${C.gold}" stroke="${C.ink}" stroke-width="5"/></g>`;
}
function ship(x, y, s = 1, col = C.purple, o = {}) {
  const sink = o.sink || 0, rot = sink * 38, dy = sink * 150, bob = Math.sin((o.t || 0) * 2 + x) * 6;
  let oars = ''; for (let i = 0; i < 7; i++) oars += `<path d="M${-110 + i * 34},10 L${-130 + i * 34 + Math.sin((o.t || 0) * 5 + i) * 8},70" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`;
  return `<g transform="translate(${x},${f(y + dy + bob)}) rotate(${f(rot)}) scale(${s})" opacity="${f(1 - ease((sink - .7) / .3))}">
  ${oars}<path d="M-170,-10 L170,-10 Q150,50 100,56 L-110,56 Q-160,40 -170,-10Z" fill="#8a5a3a" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M-160,8 L160,8" stroke="${col}" stroke-width="12"/><path d="M170,-10 Q205,-30 200,-70" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
  ${T.tube('M0,-10 L0,-210', 10, '#9a6a3a', 5)}
  <path d="M-80,-190 Q0,-210 80,-190 L76,-60 Q0,-40 -76,-60Z" fill="${C.white}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M-76,-130 Q0,-112 76,-130" stroke="${col}" stroke-width="18" fill="none"/></g>`;
}
function waves(y, t, col = '#4f8db3', amp = 10, seed = 1) {
  let d = `M-40,${y}`; for (let x = -40; x <= 1980; x += 60) d += ` q30,${f(-amp - Math.sin(t * 2 + x * .01 + seed) * 4)} 60,0`;
  return `<path d="${d} L1980,1120 L-40,1120Z" fill="${col}" stroke="${C.ink}" stroke-width="6"/>`;
}
function sea(t, col = '#6fa8c9') {
  let s = `<rect width="1920" height="1080" fill="${col}"/>`;
  const R = rng(3); for (let i = 0; i < 40; i++) { const x = (R() * 2000 + t * 10) % 2000 - 40, y = R() * 1080;
    s += `<path d="M${f(x)},${f(y)} q14,-10 28,0 q14,10 28,0" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
  return s;
}
function elephant(x, y, s = 1, o = {}) {
  const t = o.t || 0, st = o.walk ? Math.sin(t * 5) : 0, e = o.e || T.expr('neutral');
  const leg = (lx, ph) => `<path d="M${lx},60 L${f(lx + ph * 14)},150" stroke="${C.ink}" stroke-width="58" stroke-linecap="round"/><path d="M${lx},60 L${f(lx + ph * 14)},150" stroke="#8d8f96" stroke-width="44" stroke-linecap="round"/>`;
  const trunk = o.trunkUp ? 'M150,10 Q230,-10 240,-90 Q246,-120 226,-130' : 'M150,10 Q200,40 196,110 Q194,140 214,150';
  return `<g transform="translate(${x},${f(y + (o.walk ? -Math.abs(st) * 6 : 0))}) scale(${f(s * (o.flip ? -1 : 1))},${f(s)}) rotate(${o.rot || 0})">
  ${leg(-90, st)}${leg(60, -st)}
  <path d="M-150,0 Q-160,-110 -40,-120 Q90,-130 130,-70 Q170,-20 150,30 Q140,80 60,84 L-110,84 Q-160,70 -150,0Z" fill="#9a9ca3" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
  ${T.tube(trunk, 30, '#9a9ca3', 7)}
  ${leg(-60, -st)}${leg(90, st)}
  <path d="M60,-90 Q-10,-80 0,0 Q20,40 70,20 Q90,-30 60,-90Z" fill="#8d8f96" stroke="${C.ink}" stroke-width="7"/>
  <path d="M150,30 Q200,40 210,10" stroke="${C.ink}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M150,30 Q200,40 210,10" stroke="#f2eee4" stroke-width="9" fill="none" stroke-linecap="round"/>
  <g transform="translate(118,-48) scale(.42)">${T.eye(0, 0, 36, 39, e, 1)}${T.brows({ ...e.brow, y: -56 })}</g>
  <path d="M-150,-10 Q-180,10 -176,40" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M-80,-118 L-60,-150 L60,-150 L80,-118Z" fill="${C.purple}" stroke="${C.ink}" stroke-width="6"/>
  ${o.sweat ? T.sweat(150, -110, o.sweat) : ''}</g>`;
}
function horse(x, y, s = 1, o = {}) {
  const t = o.t || 0, g = o.gallop ? t * 14 : 0, col = o.col || '#8a5a3a', dark = o.dark || '#5a3a22';
  const lg = (lx, ph) => { const a = Math.sin(g + ph) * (o.gallop ? 34 : 0) * Math.PI / 180, x2 = lx + Math.sin(a) * 100, y2 = 40 + Math.cos(a) * 100;
    return T.tube(`M${lx},40 L${f(x2)},${f(y2)}`, 22, col, 6) + `<rect x="${f(x2 - 14)}" y="${f(y2 - 4)}" width="28" height="16" rx="4" fill="${C.ink}"/>`; };
  const bob = o.gallop ? -Math.abs(Math.sin(g)) * 12 : 0;
  return `<g transform="translate(${x},${f(y + bob)}) scale(${f(s * (o.flip ? -1 : 1))},${f(s)})">
  ${lg(-90, 1.6)}${lg(80, 0)}
  ${T.tube('M-140,-20 Q-200,0 -196,70', 22, dark, 6)}
  <path d="M-150,-40 Q-150,-90 -60,-90 L90,-90 Q150,-90 160,-40 Q160,40 90,50 L-90,50 Q-150,40 -150,-40Z" fill="${col}" stroke="${C.ink}" stroke-width="8"/>
  <path d="M110,-70 Q150,-170 200,-200 L260,-170 Q262,-140 230,-130 Q200,-120 180,-90 Q170,-40 140,-30Z" fill="${col}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
  <path d="M190,-200 Q160,-170 130,-110 Q120,-80 110,-70" stroke="${dark}" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M196,-204 L186,-236 L210,-210Z" fill="${col}" stroke="${C.ink}" stroke-width="5"/>
  <circle cx="222" cy="-184" r="8" fill="${C.ink}"/><circle cx="255" cy="-158" r="4" fill="${C.ink}"/>
  ${lg(-60, 3.2)}${lg(110, 4.7)}
  ${o.blanket ? `<path d="M-60,-92 L70,-92 L60,10 L-50,10Z" fill="${o.blanket}" stroke="${C.ink}" stroke-width="6"/>` : ''}</g>`;
}
// a character (chibi) riding a horse: rider fn returns svg at origin
function rider(x, y, s, riderSvg, o = {}) {
  const bob = o.gallop ? -Math.abs(Math.sin((o.t || 0) * 14)) * 12 : 0;
  return `<g transform="translate(${x},${y}) scale(${s})"><g transform="translate(${o.flip ? 20 : -20},${f(-238 + bob)}) scale(.62)">${riderSvg}</g>${horse(0, 0, 1, o)}</g>`;
}
function altar(x, y, s = 1, t = 0, k = 1) {
  let fl = ''; const R = rng(4);
  for (let i = 0; i < 5; i++) { const h = (80 + R() * 60) * k * (1 + .15 * Math.sin(t * 9 + i)), w = 30 + R() * 20, cx = -50 + i * 25;
    fl += `<path d="M${cx - w / 2},-120 Q${cx - w / 2},${f(-120 - h * .5)} ${f(cx + Math.sin(t * 7 + i) * 8)},${f(-120 - h)} Q${cx + w / 2},${f(-120 - h * .5)} ${cx + w / 2},-120Z" fill="${i % 2 ? C.gold : '#e8742a'}" stroke="${C.ink}" stroke-width="5"/>`; }
  return `<g transform="translate(${x},${y}) scale(${s})"><circle cx="0" cy="-190" r="${f(150 * k)}" fill="${C.gold}" opacity=".25"/>${fl}
  <path d="M-130,-130 L130,-130 L110,-100 L-110,-100Z" fill="#b8ab96" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
  <rect x="-100" y="-100" width="200" height="180" fill="#cfc3ad" stroke="${C.ink}" stroke-width="7"/>
  <path d="M-70,-60 L70,-60 M-70,0 L70,0" stroke="#9a8e78" stroke-width="6"/><rect x="-130" y="80" width="260" height="30" fill="#b8ab96" stroke="${C.ink}" stroke-width="7"/></g>`;
}
function columns(t, col = '#e8dcc4', bgc = '#c9a46a', n = 5) {
  let s = `<rect width="1920" height="1080" fill="${bgc}"/><rect y="860" width="1920" height="220" fill="#a8875a"/>`;
  for (let i = 0; i < n; i++) { const x = 120 + i * (1680 / (n - 1));
    s += `<rect x="${x - 60}" y="120" width="120" height="740" fill="${col}" stroke="${C.ink}" stroke-width="7"/>
    <path d="M${x - 30},140 L${x - 30},850 M${x},140 L${x},850 M${x + 30},140 L${x + 30},850" stroke="#b8ab96" stroke-width="5"/>
    <rect x="${x - 84}" y="90" width="168" height="40" fill="${col}" stroke="${C.ink}" stroke-width="7"/><rect x="${x - 84}" y="850" width="168" height="34" fill="${col}" stroke="${C.ink}" stroke-width="7"/>`; }
  return s + `<rect x="-10" y="40" width="1940" height="56" fill="${col}" stroke="${C.ink}" stroke-width="7"/>`;
}
function mountains(t, o = {}) {
  const snow = o.snow ?? 1;
  let s = `<rect width="1920" height="1080" fill="${o.sky || '#a9c4d6'}"/>`;
  const layer = (seed, base, h, col, sc) => { const R = rng(seed); let d = `M-40,1080 L-40,${base}`, caps = '';
    for (let x = -40; x < 2000;) { const w = 200 + R() * 220, hh = h * (.6 + R() * .5); d += ` L${f(x + w / 2)},${f(base - hh)} L${f(x + w)},${base}`;
      if (snow) caps += `<path d="M${f(x + w / 2 - w * .16)},${f(base - hh * .68)} L${f(x + w / 2)},${f(base - hh)} L${f(x + w / 2 + w * .16)},${f(base - hh * .68)} L${f(x + w / 2 + w * .06)},${f(base - hh * .74)} L${f(x + w / 2 - w * .05)},${f(base - hh * .66)}Z" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`;
      x += w; }
    return `<path d="${d} L2000,${base} L2000,1080Z" fill="${col}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>${caps}`; };
  s += layer(2, 560, 420, '#8a93a6', 1) + layer(5, 760, 380, '#6d7488', 1);
  return s;
}
function snowfall(t, n = 70, wind = 1, seed = 6) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const sp = 60 + R() * 120, x = ((R() * 2200 + t * sp * wind * 2) % 2200) - 140, y = ((R() * 1180 + t * sp) % 1180) - 50;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(3 + R() * 6)}" fill="#fff" opacity=".85"/>`; }
  return s;
}
function dust(t, n = 30, dir = 1, col = '#f1dfae', seed = 9) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) { const sp = 200 + R() * 300, x = dir > 0 ? ((R() * 2400 + t * sp) % 2400) - 240 : 2160 - ((R() * 2400 + t * sp) % 2400), y = R() * 1080;
    s += `<path d="${T.blobPath(x, y + Math.sin(t * 2 + i) * 20, 30 + R() * 60, R, 7)}" fill="${col}" opacity="${f(.25 + R() * .25)}"/>`; }
  return s;
}
function fog(t, op = .6, seed = 12, y0 = 0) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < 14; i++) { const x = ((R() * 2400 + t * (20 + R() * 30)) % 2600) - 340, y = y0 + R() * 1080;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(300 + R() * 300)}" ry="${f(60 + R() * 60)}" fill="#f4f1ea" opacity="${f(op * (.4 + R() * .5))}" filter="url(#blur8)"/>`; }
  return s;
}
function ground(col = '#d8b468', horizon = 640, hill = '#c9a457') {
  return `<rect width="1920" height="1080" fill="#e9c77d"/><path d="M-20,${horizon} Q480,${horizon - 60} 960,${horizon - 20} T1940,${horizon - 40} L1940,1100 L-20,1100Z" fill="${hill}" stroke="${C.ink}" stroke-width="7"/>
  <path d="M-20,${horizon + 80} Q600,${horizon + 40} 1100,${horizon + 90} T1940,${horizon + 70} L1940,1100 L-20,1100Z" fill="${col}" stroke="${C.ink}" stroke-width="7"/>`;
}
function sunset(t) {
  return `<rect width="1920" height="1080" fill="#e8743a"/><rect y="0" width="1920" height="400" fill="#c94a3a" opacity=".6"/>
  <circle cx="960" cy="${f(640 + t * 4)}" r="190" fill="#f6c25a" stroke="${C.ink}" stroke-width="7"/>
  <path d="M-20,640 Q480,600 960,630 T1940,620 L1940,1100 L-20,1100Z" fill="#7a3e2a" stroke="${C.ink}" stroke-width="7"/>`;
}
function ring(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><ellipse rx="26" ry="20" fill="none" stroke="${C.ink}" stroke-width="16"/><ellipse rx="26" ry="20" fill="none" stroke="${C.gold}" stroke-width="9"/><circle cx="0" cy="-22" r="8" fill="#c4372c" stroke="${C.ink}" stroke-width="4"/></g>`;
}
function arrowPath(d, k, col = C.red, w = 22, dashed = false) {
  if (k <= 0) return '';
  return `<path d="${d}" pathLength="1" fill="none" stroke="${C.ink}" stroke-width="${w + 12}" stroke-linecap="round" stroke-dasharray="${f(k)} 2"/>
  <path d="${d}" pathLength="1" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${dashed ? '.015 .012' : f(k) + ' 2'}" ${dashed ? `style="stroke-dasharray:.02 .015" ` : ''}/>`;
}
// arrowhead at point along a polyline described by pts at progress k
function arrowAlong(pts, k, col = C.red, w = 22) {
  if (k <= 0) return '';
  let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  let rem = L * clamp(k), d = `M${pts[0][0]},${pts[0][1]}`, end = pts[0], ang = 0;
  for (let i = 1; i < pts.length; i++) { const l = seg[i - 1]; ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    if (rem >= l) { d += ` L${pts[i][0]},${pts[i][1]}`; end = pts[i]; rem -= l; }
    else { const q = rem / l; end = [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)]; d += ` L${f(end[0])},${f(end[1])}`; break; } }
  const a = ang * 180 / Math.PI;
  return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w + 12}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(${f(end[0])},${f(end[1])}) rotate(${f(a)})"><path d="M-10,-${w * 1.6} L${w * 2.2},0 L-10,${w * 1.6}Z" fill="${col}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/></g>`;
}
function subscribe(x, y, t, t0) {
  const p = pop(t, t0, .35); if (!p.k) return '';
  const click = t > t0 + 1.2, cur = clamp((t - t0 - .5) / .7);
  return `<g transform="translate(${x},${y}) scale(${f(p.scale * (click && t < t0 + 1.35 ? .92 : 1))})">
  <rect x="-270" y="-70" width="540" height="140" rx="30" fill="${click ? '#7a7a7a' : '#d22d2d'}" stroke="${C.ink}" stroke-width="8"/>
  <text x="0" y="24" font-family="Luckiest" font-size="72" fill="#fff" text-anchor="middle">${click ? 'SUBSCRIBED' : 'SUBSCRIBE'}</text></g>
  <g transform="translate(${f(lerp(x + 420, x + 140, ease(cur)))},${f(lerp(y + 240, y + 40, ease(cur)))})"><path d="M0,0 L0,70 L18,54 L32,86 L46,80 L32,48 L56,48Z" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/></g>`;
}

// ---------- the Mediterranean map ----------
const LAND = {
  europe: 'M-20,-20 L1940,-20 L1940,520 L1780,560 L1720,660 L1660,700 L1600,650 L1550,560 L1450,460 L1350,360 L1250,280 L1150,250 L1130,300 L1200,380 L1260,450 L1330,520 L1420,600 L1390,580 L1330,600 L1290,650 L1250,700 L1200,610 L1130,520 L1060,420 L1010,330 L980,290 L900,300 L820,320 L700,300 L600,330 L520,420 L480,560 L420,640 L300,660 L250,670 L180,640 L90,560 L120,260 L-20,230Z',
  africa: 'M-20,1100 L-20,760 L200,720 L300,700 L500,730 L700,750 L850,720 L960,690 L1010,672 L1000,720 L990,760 L1080,820 L1300,880 L1500,900 L1700,860 L1940,840 L1940,1100Z',
  sicily: 'M1110,770 L1230,752 L1205,835Z',
  sardinia: 'M900,500 Q940,480 960,520 L962,620 Q930,650 905,620Z',
  corsica: 'M935,390 Q960,380 965,410 L962,470 Q945,480 935,460Z',
};
const PLACES = { rome: [1075, 445], carthage: [990, 700], newcarthage: [430, 610], cannae: [1300, 540], trebia: [1010, 300], trasimene: [1085, 385], alps: [960, 250], pyrenees: [580, 340], zama: [930, 770] };
const ROUTE = [[430, 610], [500, 470], [580, 360], [700, 320], [820, 300], [900, 250], [990, 240], [1020, 300]];
function map(t, o = {}) {
  const tint = o.tint || {};
  let s = sea(t);
  s += `<path d="${LAND.europe}" fill="#e8d3a0" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
  if (tint.italy) s += `<path d="M980,290 L1010,330 L1060,420 L1130,520 L1200,610 L1250,700 L1290,650 L1330,600 L1390,580 L1420,600 L1330,520 L1260,450 L1200,380 L1130,300 L1150,250 L1060,240Z" fill="${C.red}" opacity="${f(tint.italy)}" stroke="${C.ink}" stroke-width="5"/>`;
  if (tint.spain) s += `<path d="M120,260 L90,560 L180,640 L300,660 L420,640 L480,560 L520,420 L600,330 L420,280 L240,260Z" fill="${C.purple}" opacity="${f(tint.spain)}" stroke="${C.ink}" stroke-width="5"/>`;
  s += `<path d="${LAND.africa}" fill="#e8d3a0" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
  if (tint.africa) s += `<path d="M500,730 L700,750 L850,720 L960,690 L1010,672 L1000,720 L990,760 L1080,820 L1200,850 L1150,1100 L520,1100Z" fill="${C.purple}" opacity="${f(tint.africa)}" stroke="${C.ink}" stroke-width="5"/>`;
  for (const k of ['sicily', 'sardinia', 'corsica']) s += `<path d="${LAND[k]}" fill="#e8d3a0" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  // mountain ranges
  const range = (pts, sc) => pts.map(([x, y]) => `<path d="M${x - 30 * sc},${y + 20 * sc} L${x},${y - 30 * sc} L${x + 30 * sc},${y + 20 * sc}Z" fill="#b5a27a" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/><path d="M${x - 10 * sc},${y - 15 * sc} L${x},${y - 30 * sc} L${x + 10 * sc},${y - 15 * sc}Z" fill="#fff"/>`).join('');
  s += range([[860, 260], [900, 235], [945, 225], [990, 220], [1035, 228], [1080, 240]], 1.1) + range([[520, 345], [570, 335], [620, 330]], .9);
  return s;
}
function city(name, key, t, t0, col = C.red, o = {}) {
  const [x, y] = PLACES[key] || key, p = pop(t, t0, .3); if (!p.k) return '';
  const pulse = 1 + .12 * Math.sin(t * 5);
  return `<g transform="translate(${x},${y})"><circle r="${f(26 * p.scale * pulse)}" fill="${col}" stroke="${C.ink}" stroke-width="6"/><circle r="${f(9 * p.scale)}" fill="#fff"/></g>`
    + (name ? text(name, x + (o.dx || 0), y + (o.dy ?? -44), o.size || 48, { scale: p.scale, fill: o.fill || '#fff' }) : '');
}
function battleMark(x, y, t, t0, s = 1) {
  const p = pop(t, t0, .3); if (!p.k) return '';
  return `<g transform="translate(${x},${y}) scale(${f(p.scale * s)}) rotate(${f(Math.sin(t * 3) * 4)})"><path d="M-40,-40 L40,40 M40,-40 L-40,40" stroke="${C.ink}" stroke-width="24" stroke-linecap="round"/><path d="M-40,-40 L40,40 M40,-40 L-40,40" stroke="#fff" stroke-width="12" stroke-linecap="round"/></g>`;
}

// ---------- top-down battle tokens ----------
function token(x, y, col, r = 11, o = {}) {
  const op = o.op ?? 1; if (op <= 0) return '';
  return `<g opacity="${f(op)}"><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${col}" stroke="${C.ink}" stroke-width="4"/>${o.helm ? `<circle cx="${f(x)}" cy="${f(y - r * .2)}" r="${f(r * .45)}" fill="${o.helm}"/>` : ''}</g>`;
}
function cavToken(x, y, col, ang = 0, r = 16, op = 1) {
  if (op <= 0) return '';
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})" opacity="${f(op)}"><path d="M${r * 1.6},0 L${-r},${-r} L${-r * .5},0 L${-r},${r}Z" fill="${col}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/></g>`;
}
function plain(t, o = {}) {
  let s = `<rect width="1920" height="1080" fill="${o.col || '#d9c07a'}"/>`;
  const R = rng(14); for (let i = 0; i < 60; i++) { const x = R() * 1920, y = R() * 1080; s += `<path d="M${f(x)},${f(y)} l6,-14 l6,14 M${f(x + 10)},${f(y)} l5,-10" stroke="#a8914f" stroke-width="3" fill="none"/>`; }
  // river Aufidus along the left edge
  s += `<path d="M150,-20 Q230,250 170,520 Q110,800 210,1100" fill="none" stroke="${C.ink}" stroke-width="84"/><path d="M150,-20 Q230,250 170,520 Q110,800 210,1100" fill="none" stroke="#5f93b8" stroke-width="70"/>`;
  if (o.label !== false) s += text('AUFIDUS', 175, 160, 34, { fill: '#cfe6f5', rot: 80, font: 'Lilita', sw: 6 });
  return s;
}
// Roman block: rows x cols grid; returns token positions
function romanBlock(cx, cy, cols, rows, gx, gy) {
  const out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([cx + (c - (cols - 1) / 2) * gx, cy + (r - (rows - 1) / 2) * gy]);
  return out;
}
// crescent of n tokens per row, 2 rows, bulge>0 toward the Romans (up), <0 caved in
function crescent(cx, cy, n, width, bulge, rows = 2, gap = 26) {
  const out = []; for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * 2 - 1, x = cx + u * width / 2, y = cy - bulge * (1 - u * u) + r * gap; out.push([x, y]); }
  return out;
}
const lerpPts = (A, B, k) => A.map((p, i) => [lerp(p[0], B[i][0], k), lerp(p[1], B[i][1], k)]);


// ---------- more props ----------
function burst(t, col = '#f2cf2e', col2 = '#f7dc55', cx = 960, cy = 600) {
  let s = `<rect width="1920" height="1080" fill="${col}"/>`;
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + t * .05; s += `<path d="M${cx},${cy} L${f(cx + Math.cos(a) * 1800)},${f(cy + Math.sin(a) * 1800)} L${f(cx + Math.cos(a + .09) * 1800)},${f(cy + Math.sin(a + .09) * 1800)}Z" fill="${col2}"/>`; }
  return s;
}
function hourglass(x, y, s, k, t) {
  // k: 0..1 sand fallen
  const top = 1 - k, rot = 0;
  return `<g transform="translate(${x},${y}) scale(${s}) rotate(${rot})">
  <rect x="-130" y="-230" width="260" height="34" rx="10" fill="#8a5a3a" stroke="${C.ink}" stroke-width="7"/><rect x="-130" y="196" width="260" height="34" rx="10" fill="#8a5a3a" stroke="${C.ink}" stroke-width="7"/>
  <path d="M-100,-196 L100,-196 Q100,-60 14,0 Q100,60 100,196 L-100,196 Q-100,60 -14,0 Q-100,-60 -100,-196Z" fill="#dff1f7" stroke="${C.ink}" stroke-width="7"/>
  <path d="M${f(-90 * top)},${f(-10 - 170 * top)} L${f(90 * top)},${f(-10 - 170 * top)} L0,-8Z" fill="${C.red}"/>
  <path d="M${f(-96)},190 L96,190 L${f(96 - 70 * (1 - k))},${f(190 - 150 * k)} L${f(-96 + 70 * (1 - k))},${f(190 - 150 * k)}Z" fill="${C.red}"/>
  ${k < 1 ? `<path d="M0,-6 L0,${f(190 - 150 * k)}" stroke="${C.red}" stroke-width="6" stroke-dasharray="10 8" stroke-dashoffset="${f(-t * 60)}"/>` : ''}</g>`;
}
function chalkboard(x, y, w, h, inner) {
  return `<g transform="translate(${x},${y})"><rect x="-16" y="-16" width="${w + 32}" height="${h + 32}" rx="10" fill="#8a5a3a" stroke="${C.ink}" stroke-width="7"/>
  <rect width="${w}" height="${h}" fill="#2f4a3a" stroke="${C.ink}" stroke-width="5"/>${inner}</g>`;
}
function sardineCan(x, y, s, heads) {
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-520" y="-200" width="1040" height="400" rx="120" fill="#b9bec7" stroke="${C.ink}" stroke-width="10"/>
  <rect x="-480" y="-165" width="960" height="330" rx="100" fill="#8d939d" stroke="${C.ink}" stroke-width="6"/>${heads}
  <path d="M520,-120 Q700,-260 760,-80 Q760,-30 700,-40" fill="#cfd4dc" stroke="${C.ink}" stroke-width="9"/></g>`;
}
function bush(x, y, s = 1, seed = 1, col = '#5f7f3a') {
  const R = rng(seed); let d = '';
  for (let i = 0; i < 5; i++) d += `<circle cx="${f(-120 + i * 60)}" cy="${f(-40 - R() * 50)}" r="${f(60 + R() * 30)}" fill="${col}" stroke="${C.ink}" stroke-width="7"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})">${d}<rect x="-180" y="-40" width="360" height="60" fill="${col}"/><path d="M-185,20 L185,20" stroke="${C.ink}" stroke-width="7"/></g>`;
}
// helmet + eyes peeking over cover (hidden ambushers)
function peeker(x, y, s = 1, t = 0, ph = 0) {
  const look = Math.sin(t * 1.5 + ph) * .4;
  return `<g transform="translate(${x},${y}) scale(${s})">${T.carthHelm({ seed: 4 + ph })}
  <ellipse cx="-37" cy="-4" rx="36" ry="39" fill="#fff" stroke="${C.ink}" stroke-width="6"/><ellipse cx="37" cy="-4" rx="36" ry="39" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
  <circle cx="${f(-37 + look * 18)}" cy="0" r="9" fill="${C.ink}"/><circle cx="${f(37 + look * 18)}" cy="0" r="9" fill="${C.ink}"/>
  <path d="M-80,-40 L-6,-24 M80,-40 L6,-24" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/></g>`;
}
function pharaoh(o = {}) {
  const e = o.e || T.expr('smug'), col = o.col || C.blue;
  let stripes = ''; for (let i = 0; i < 6; i++) stripes += `<path d="M${-150 + i * 8},${-60 + i * 40} L${150 - i * 8},${-60 + i * 40}" stroke="${col}" stroke-width="16"/>`;
  const nemes = `M-120,-70 Q-150,-150 0,-150 Q150,-150 120,-70 L170,180 L110,190 L100,40 L-100,40 L-110,190 L-170,180Z`;
  return `<g transform="translate(${o.x || 0},${o.y || 0}) scale(${o.s || 1})">${T.body('bust', 'tunic', 3)}
  <path d="${nemes}" fill="${C.gold}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>
  <clipPath id="nm${o.x || 0}"><path d="${nemes}"/></clipPath><g clip-path="url(#nm${o.x || 0})">${stripes}</g>
  ${T.head({ e, seed: o.seed || 3, shape: 'small' })}
  <path d="M-100,-56 Q0,-96 100,-56 L104,-30 Q0,-70 -104,-30Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="6"/>
  <path d="M0,-96 q-16,-20 0,-44 q16,24 0,44" fill="${C.teal}" stroke="${C.ink}" stroke-width="5"/>
  <path d="M-14,96 L14,96 L8,170 L-8,170Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="5"/></g>`;
}
function hills(t, col = '#7f9a4a', col2 = '#6a843c', y = 620) {
  return `<path d="M-20,${y} Q300,${y - 200} 700,${y - 60} T1400,${y - 120} T1940,${y - 40} L1940,1100 L-20,1100Z" fill="${col}" stroke="${C.ink}" stroke-width="7"/>
  <path d="M-20,${y + 140} Q500,${y + 40} 1000,${y + 120} T1940,${y + 100} L1940,1100 L-20,1100Z" fill="${col2}" stroke="${C.ink}" stroke-width="7"/>`;
}
function chapter(num, title, t, t0 = 0, dur = 3) {
  const k = ease((t - t0) / .4) * (1 - ease((t - t0 - dur) / .4)); if (k <= 0) return '';
  return `<g transform="translate(0,${f(lerp(-200, 0, k))})" opacity="${f(k)}"><rect x="560" y="26" width="800" height="120" rx="20" fill="${C.ink}" opacity=".9"/>
  <text x="960" y="72" font-family="Lilita" font-size="34" fill="${C.gold}" text-anchor="middle">CHAPTER ${num}</text>
  <text x="960" y="126" font-family="Luckiest" font-size="50" fill="#fff" text-anchor="middle">${title}</text></g>`;
}
function bust(svg, x, y, s, o = {}) { return `<g transform="translate(${x},${y}) scale(${s})">${svg}</g>`; }

// ---------- shot runner ----------
// shots: [[startTime, fn(t, lt, end)], ...] in section-local seconds. fn returns SVG (inside camera if wanted).
function runScene(shots, o = {}) {
  window.META = { duration: o.duration, hits: o.hits || [], fadeOut: o.fadeOut ?? .6 };
  window.render = t => {
    T.reset();
    let i = 0; while (i < shots.length - 1 && t >= shots[i + 1][0]) i++;
    const [t0, fn] = shots[i], t1 = i + 1 < shots.length ? shots[i + 1][0] : o.duration;
    const fin = o.fadeIn === false ? 1 : ease(t / .35), fout = ease((t - (o.duration - window.META.fadeOut)) / window.META.fadeOut);
    document.getElementById('s').innerHTML = T.defs() + fn(t, t - t0, t1) + T.overlay({ paper: .3 }) +
      `<rect width="1920" height="1080" fill="#000" opacity="${f(Math.max(1 - fin, fout))}"/>`;
  };
  window.render(0);
}
// helpers to read narrator timings: S(k) = sentence k start, W('word', n) = n-th occurrence of a word
function timingFor(sec) {
  const tm = TIMING[sec];
  return {
    dur: tm.duration,
    S: k => tm.s[k],
    W: (word, n = 1) => { let c = 0; for (const [w, t] of tm.w) if (w === word && ++c === n) return t; throw new Error('word not found: ' + word); },
  };
}

window.K = { cam, shakeAt, march, breathe, fadeIn, stamp, say, lowerThird, dateCard, poof, speech, flag, ship, waves, sea, elephant, horse, rider,
  altar, columns, mountains, snowfall, dust, fog, ground, sunset, ring, arrowPath, arrowAlong, subscribe, map, city, battleMark, PLACES, ROUTE, LAND,
  token, cavToken, plain, romanBlock, crescent, lerpPts, runScene, timingFor,
  burst, hourglass, chalkboard, sardineCan, bush, peeker, pharaoh, hills, chapter, bust };
})();
