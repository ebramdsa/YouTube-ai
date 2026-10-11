// Kadesh cast and props, in the same immediate-mode style as lib/toon.js: Ramesses II, Muwatalli II,
// Egyptian and Hittite soldiers, Shasu nomads, a historian, both kinds of chariot, the Middle East map,
// the walled city of Kadesh, temple walls with "carved" reliefs, clay tablets and the UN building.
(function () {
const { C, f, lerp, clamp, ease, back, rng, expr, head, body, legs, arm, tube, spear, grime, blobPath, text, pop } = T;
const P = {
  egBlue: '#2f5fa8', egBlueDark: '#1f3f75', hit: '#3f6aa8', hitDark: '#2b4a7a', hitCap: '#27395e',
  sand: '#e6c98a', stone: '#d8c39a', stoneDark: '#b49b6e', clay: '#a8774a', clayDark: '#7a5233', wig: '#1d1a1a',
  nile: '#5f93b8', lion: '#e0a640', mane: '#b8602a',
};
const BUST = 'M-90,86 Q-136,96 -150,160 Q-160,260 -164,440 L164,440 Q160,260 150,160 Q136,96 90,86Z';
const CHIBI = 'M-48,82 Q-70,92 -72,132 L-76,226 Q0,240 76,226 L72,132 Q70,92 48,82Z';
const LONG = 'M-48,82 Q-70,92 -74,132 L-84,292 Q0,304 84,292 L74,132 Q70,92 48,82Z';

// the stone-relief look for carvings and statues
const baseDefs = T.defs;
T.defs = () => baseDefs().replace('</defs>', `
  <filter id="stone" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="0.13 0.43 0.04 0 0.24  0.11 0.37 0.04 0 0.18  0.08 0.27 0.03 0 0.10  0 0 0 1 0"/></filter>
  <filter id="clayf" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="0.10 0.30 0.03 0 0.36  0.07 0.22 0.02 0 0.22  0.05 0.15 0.01 0 0.12  0 0 0 1 0"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);

// ---------- helpers copied from toon.js (not exported there) ----------
function wrap(o, inner) {
  const s = o.s || 1, fl = o.flip ? -1 : 1;
  return `<g transform="translate(${f(o.x || 0)},${f((o.y || 0) + (o.bob || 0))}) rotate(${o.rot || 0}) scale(${f(s * fl)},${f(s)})">${inner}</g>`;
}
function talk(e, o) {
  if (!o.talk) return e;
  const t = o.t || 0, open = Math.abs(Math.sin(t * 13)) * .6 + Math.abs(Math.sin(t * 21)) * .25;
  e = JSON.parse(JSON.stringify(e)); e.mouth.type = 'talk'; e.mouth.open = open * (o.talk === true ? 1 : o.talk); return e;
}
function armsFor(o, kind, sleeve) {
  const A = o.arms || {}, out = { back: '', front: '' }, sh = kind === 'bust' ? [128, 160] : [62, 108];
  for (const side of ['l', 'r']) {
    const a = A[side]; if (!a) continue;
    const str = arm(side === 'l' ? -sh[0] : sh[0], sh[1], a.x, a.y, { bend: a.bend ?? (side === 'l' ? 20 : -20), pose: a.pose, w: kind === 'bust' ? (a.w ?? 46) : (a.w || 0), col: a.col || sleeve, hs: kind === 'bust' ? 2.2 : 1.1, handAng: a.ang });
    if (a.behind) out.back += str; else out.front += str;
  }
  return out;
}
const path = (d, fill, sw = 7, extra = '') => `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
// a wink: cover the left eye and draw a closed lid
const winkLeft = `<ellipse cx="-37" cy="-2" rx="41" ry="44" fill="${C.skin}"/><path d="M-68,-2 Q-37,18 -6,-2" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
function curlShoes(step = 0, col = C.leatherDark) {
  const one = x => `<path d="M${f(x - 18)},302 Q${f(x - 20)},286 ${f(x)},288 Q${f(x + 24)},290 ${f(x + 32)},282 Q${f(x + 42)},270 ${f(x + 34)},262 Q${f(x + 50)},264 ${f(x + 46)},286 Q${f(x + 40)},304 ${f(x + 18)},304Z" fill="${col}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`;
  return one(-28 - step * 10) + one(28 + step * 10);
}

// ---------- headgear ----------
function khepresh(seed = 1) {
  const d = 'M-106,-24 Q-126,-110 -96,-178 Q-58,-254 10,-252 Q88,-248 110,-172 Q126,-100 106,-24 Q0,-54 -106,-24Z';
  const id = T.nid('kp'); let dots = '';
  for (let y = -220; y < -40; y += 30) for (let x = -100; x < 110; x += 30) dots += `<circle cx="${x + (y / 30 % 2 ? 15 : 0)}" cy="${y}" r="5.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="2"/>`;
  return path(d, P.egBlue) + `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${dots}</g>` + grime(d, [-110, -250, 220, 230], seed, { n: 3, scratches: 1 })
    + `<path d="M-60,-200 Q-30,-232 10,-232" stroke="#fff" stroke-opacity=".4" stroke-width="9" fill="none" stroke-linecap="round"/>`
    + path('M-110,-22 Q0,-58 110,-22 L106,-2 Q0,-38 -106,-2Z', C.gold, 6)
    + path('M-9,-34 Q-16,-64 0,-84 Q20,-96 18,-70 Q12,-54 6,-40Z', C.gold, 5) + `<circle cx="6" cy="-74" r="3.5" fill="${C.ink}"/>`;
}
function hittiteCap(col = P.hitCap) {
  return path('M-98,-28 Q-84,-150 -16,-300 Q0,-322 16,-300 Q84,-150 98,-28 Q0,-62 -98,-28Z', col)
    + `<path d="M-40,-150 Q-20,-240 -6,-286" stroke="#fff" stroke-opacity=".3" stroke-width="9" fill="none" stroke-linecap="round"/>`
    + path('M-100,-30 Q0,-64 100,-30 L98,-8 Q0,-44 -98,-8Z', C.gold, 6) + path('M-14,-104 L0,-130 L14,-104 L0,-90Z', C.gold, 4);
}
function bronzeCone(seed = 1) {
  const d = 'M-104,-24 Q-110,-118 0,-212 Q110,-118 104,-24 Q0,-52 -104,-24Z';
  return path(d, C.bronze) + grime(d, [-104, -212, 208, 190], seed, { n: 3, scratches: 1 })
    + `<path d="M0,-200 L0,-46" stroke="${C.bronzeDark}" stroke-width="6"/><path d="M-60,-120 Q-36,-170 -8,-196" stroke="#fff" stroke-opacity=".45" stroke-width="8" fill="none" stroke-linecap="round"/>`
    + path('M-106,-22 L-112,40 Q-100,60 -82,44 L-80,-26Z', C.bronze, 5) + path('M106,-22 L112,40 Q100,60 82,44 L80,-26Z', C.bronze, 5);
}
const wig = `<path d="M-108,4 Q-120,-120 0,-122 Q120,-120 108,4 L112,74 L82,78 L80,-36 Q0,-80 -80,-36 L-82,78 L-112,74Z" fill="${P.wig}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M-96,10 L-96,70 M96,10 L96,70" stroke="#3a3535" stroke-width="5"/>`;

// ---------- characters ----------
function ramesses(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 201;
  const e = talk(o.e || expr('smug'), o), A = armsFor(o, kind, C.skin);
  let s = A.back;
  if (kind === 'chibi') s += legs({ step: o.step || 0, shoe: C.gold });
  s += body(kind, 'tunic', seed);
  s += kind === 'bust'
    ? path('M-98,90 Q0,214 98,90 L124,112 Q0,262 -124,112Z', C.gold, 6) + `<path d="M-108,104 Q0,236 108,104" stroke="${P.egBlue}" stroke-width="14" fill="none"/><path d="M-116,116 Q0,252 116,116" stroke="${C.red}" stroke-width="6" fill="none"/>`
    : path('M-50,86 Q0,142 50,86 L60,98 Q0,164 -60,98Z', C.gold, 4.5) + `<path d="M-54,92 Q0,152 54,92" stroke="${P.egBlue}" stroke-width="6" fill="none"/>`;
  s += head({ e, seed, sweat: o.sweat });
  s += `<path d="M-74,-6 L-98,-16 M74,-6 L98,-16" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`;
  s += path('M-12,98 L12,98 L9,146 Q0,154 -9,146Z', P.egBlue, 4.5) + `<path d="M-11,112 L11,112 M-10,126 L10,126 M-9,140 L9,140" stroke="${C.gold}" stroke-width="4"/>`;
  s += khepresh(seed);
  if (o.glow) s = `<g filter="url(#glow)"><circle r="${f(260 * o.glow)}" fill="${C.gold}" opacity="${f(.35 * o.glow)}"/></g>` + s;
  s += A.front;
  return wrap(o, s);
}
function muwatalli(o = {}) {
  const kind = o.pose || 'bust', seed = o.seed || 211;
  const e = talk(o.e || expr('smug', { lid: .55 }), o), A = armsFor(o, kind, P.hit);
  let s = '';
  if (o.staff) s += tube(`M${o.staff[0]},${o.staff[1]} L${o.staff[0]},${o.staff[1] - o.staff[2]}`, 10, '#6a4a2a', 5) + `<path d="M${o.staff[0]},${o.staff[1] - o.staff[2]} q0,-60 40,-60 q34,0 30,30" stroke="${C.ink}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M${o.staff[0]},${o.staff[1] - o.staff[2]} q0,-60 40,-60 q34,0 30,30" stroke="${C.gold}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  s += A.back;
  if (kind === 'chibi') { s += path(LONG, P.hit, 7) + `<path d="M-80,270 Q0,282 80,270" stroke="${C.gold}" stroke-width="10" fill="none"/>` + curlShoes(); }
  else s += path(BUST, P.hit) + `<path d="M-30,96 L0,150 L30,96" stroke="${C.gold}" stroke-width="12" fill="none"/>` + grime(BUST, [-164, 86, 328, 350], seed, { n: 5, scratches: 2 })
    + `<path d="M-150,300 L150,300" stroke="${C.gold}" stroke-width="14"/><path d="M-150,300 L150,300" stroke="${C.ink}" stroke-width="3" stroke-dasharray="14 10"/>`;
  const hairBack = `<path d="M-96,-30 Q-140,90 -120,210 L-64,196 Q-86,100 -70,10Z M96,-30 Q140,90 120,210 L64,196 Q86,100 70,10Z" fill="${C.beard}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  s += head({ e, seed, beard: { col: C.beard, len: .9 }, hairBack, wrinkles: true, sweat: o.sweat });
  s += hittiteCap();
  s += A.front;
  return wrap(o, s);
}
function egyptian(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 221;
  const e = talk(o.e || expr('neutral'), o), A = armsFor(o, kind, C.skin);
  let s = '';
  if (o.spear) s += spear(...o.spear);
  s += A.back;
  if (kind === 'chibi') s += legs({ step: o.step || 0 });
  s += body(kind, 'tunic', seed);
  if (kind === 'chibi') s += `<rect x="-72" y="200" width="144" height="16" rx="5" fill="${o.col || P.egBlue}" stroke="${C.ink}" stroke-width="4.5"/>`;
  s += head({ e, seed, hair: wig, sweat: o.sweat, shape: o.shape });
  if (o.shield) { const [x, y, sc] = o.shield, R = rng(seed);
    let spots = ''; for (let i = 0; i < 4; i++) spots += `<path d="${blobPath(-30 + R() * 60, -80 + R() * 160, 12 + R() * 10, R)}" fill="#6a4a2a"/>`;
    s += `<g transform="translate(${x},${y}) scale(${sc || .8})">${path('M-52,-92 Q-52,-124 0,-124 Q52,-124 52,-92 L52,104 L-52,104Z', '#efe6d2')}${spots}<path d="M-52,-92 Q-52,-124 0,-124 Q52,-124 52,-92 L52,104 L-52,104Z" fill="none" stroke="${C.ink}" stroke-width="7"/></g>`; }
  s += A.front;
  return wrap(o, s);
}
function figure8(x, y, sc = .8, seed = 1) {
  const d = 'M0,-120 Q72,-120 70,-60 Q68,-22 48,0 Q68,22 70,60 Q72,120 0,120 Q-72,120 -70,60 Q-68,22 -48,0 Q-68,-22 -70,-60 Q-72,-120 0,-120Z';
  return `<g transform="translate(${x},${y}) scale(${sc})">${path(d, C.leather)}${grime(d, [-70, -120, 140, 240], seed, { n: 3, scratches: 1 })}<circle r="16" fill="${C.bronze}" stroke="${C.ink}" stroke-width="5"/></g>`;
}
function hittite(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 231;
  const e = talk(o.e || expr('determined'), o), A = armsFor(o, kind, P.hit);
  let s = '';
  if (o.spear) s += spear(...o.spear);
  s += A.back + `<path d="M70,30 Q140,110 116,230" stroke="${C.ink}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M70,30 Q140,110 116,230" stroke="${C.beard}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
  if (kind === 'chibi') s += legs({ step: o.step || 0 }) + curlShoes(o.step || 0) + path('M-74,206 L-82,262 Q0,276 82,262 L74,206Z', P.hitDark, 5.5);
  s += kind === 'bust' ? path(BUST, P.hit) + grime(BUST, [-164, 86, 328, 350], seed, { n: 4 }) : path(CHIBI, P.hit, 7) + `<rect x="-72" y="200" width="144" height="16" rx="5" fill="${C.leather}" stroke="${C.ink}" stroke-width="4.5"/>`;
  s += head({ e, seed, stubble: true, sweat: o.sweat, scars: [[54, 44, 10, .8]] });
  if (o.cap) s += hittiteCap('#6a4a2a'); else if (o.helm !== false) s += bronzeCone(seed);
  if (o.shield) s += figure8(...o.shield, seed);
  s += A.front;
  return wrap(o, s);
}
function nomad(o = {}) {
  const kind = o.pose || 'chibi', seed = o.seed || 241;
  const e = talk(o.e || expr('smug'), o), A = armsFor(o, kind, '#a07a4a');
  let s = A.back;
  if (kind === 'chibi') s += path(LONG, '#a07a4a', 7) + `<path d="M-40,90 L-50,296 M0,110 L0,300 M40,90 L50,296" stroke="#7a5232" stroke-width="10" opacity=".7"/>` + curlShoes(0, '#5a3a22');
  else s += path(BUST, '#a07a4a') + `<path d="M-90,140 L-110,440 M0,150 L0,440 M90,140 L110,440" stroke="#7a5232" stroke-width="22" opacity=".7"/>`;
  const R = rng(seed); let tuft = '';
  for (let i = 0; i < 7; i++) { const x = -80 + i * 27; tuft += ` L${f(x + 10)},${f(-112 - R() * 26)} L${f(x + 22)},-96`; }
  const hair = `<path d="M-96,-40 Q-100,-100 -80,-100${tuft} Q100,-100 96,-40 Q0,-74 -96,-40Z" fill="#3b2a1e" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`
    + `<path d="M-100,-44 Q0,-80 100,-44" stroke="${C.ink}" stroke-width="24" fill="none"/><path d="M-100,-44 Q0,-80 100,-44" stroke="${o.band || C.red}" stroke-width="14" fill="none"/>`
    + `<path d="M98,-44 q26,20 18,60 M98,-44 q36,10 40,46" stroke="${o.band || C.red}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  s += head({ e, seed, beard: { col: '#3b2a1e', len: .7 }, stubble: true, hair, sweat: o.sweat });
  if (o.wink) s += winkLeft;
  s += A.front;
  return wrap(o, s);
}
function historian(o = {}) {
  const seed = o.seed || 251, e = talk(o.e || expr('neutral', { lid: .35, brow: { r: 22 }, mouth: { type: 'frown', w: 18 } }), o);
  const A = armsFor(o, 'bust', '#7a5a3a');
  let s = A.back + path(BUST, '#7a5a3a') + path('M-60,90 L0,190 L60,90Z', '#f2eee4', 6) + grime(BUST, [-164, 86, 328, 350], seed, { n: 4 })
    + path('M-40,110 L0,128 L-40,146Z M40,110 L0,128 L40,146Z', C.red, 5);
  s += head({ e, seed, wrinkles: true, beard: { col: '#e8e4dc', curl: '#bdb6aa', len: .6 }, browCol: '#8d8a86',
    hair: `<path d="M-100,-6 Q-112,-56 -84,-66 Q-90,-30 -78,-4Z M100,-6 Q112,-56 84,-66 Q90,-30 78,-4Z" fill="#e8e4dc" stroke="${C.ink}" stroke-width="5"/>` });
  s += `<g fill="#cfe6f5" fill-opacity=".35" stroke="${C.ink}" stroke-width="7"><circle cx="-38" cy="-2" r="46"/><circle cx="38" cy="-2" r="46"/></g><path d="M-8,-6 Q0,-14 8,-6 M-84,-8 L-100,-14 M84,-8 L100,-14" stroke="${C.ink}" stroke-width="7" fill="none"/>`;
  s += A.front;
  return wrap(o, s);
}
function princess(o = {}) {
  const seed = o.seed || 261, kind = o.pose || 'bust', e = talk(o.e || expr('neutral', { lid: .3, mouth: { type: 'smile', w: 18 } }), o);
  const A = armsFor(o, kind, '#e6eef8');
  let s = A.back;
  s += kind === 'chibi' ? path(LONG, '#e6eef8', 7) + curlShoes() : path(BUST, '#e6eef8') + `<path d="M-150,300 L150,300" stroke="${P.hit}" stroke-width="16"/>`;
  const hairBack = `<path d="M-100,-30 Q-140,110 -110,230 L-56,210 Q-84,110 -66,20Z M100,-30 Q140,110 110,230 L56,210 Q84,110 66,20Z" fill="${C.beard}" stroke="${C.ink}" stroke-width="6"/>`;
  s += head({ e, seed, shape: 'small', hairBack, hair: `<path d="M-92,-20 Q-96,-106 0,-108 Q96,-106 92,-20 Q40,-70 0,-60 Q-40,-70 -92,-20Z" fill="${C.beard}" stroke="${C.ink}" stroke-width="6"/>` });
  s += path('M-80,-80 L-60,-130 L-30,-96 L0,-140 L30,-96 L60,-130 L80,-80 Q0,-100 -80,-80Z', C.gold, 5);
  s += A.front;
  return wrap(o, s);
}

// ---------- animals & vehicles ----------
function lion(x, y, s = 1, o = {}) {
  const t = o.t || 0, e = o.e || expr('smug'), R = rng(7); let mane = '';
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; mane += `<circle cx="${f(Math.cos(a) * 88)}" cy="${f(Math.sin(a) * 84 - 10)}" r="${f(36 + R() * 10)}" fill="${P.mane}" stroke="${C.ink}" stroke-width="6"/>`; }
  const tail = Math.sin(t * 3) * 20;
  return `<g transform="translate(${x},${y}) scale(${f(s * (o.flip ? -1 : 1))},${f(s)})">
  <path d="M-150,110 Q-230,${f(60 + tail)} -240,${f(-10 + tail)}" stroke="${C.ink}" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="-240" cy="${f(-14 + tail)}" r="18" fill="${P.mane}" stroke="${C.ink}" stroke-width="5"/>
  ${path('M-200,60 Q-210,-10 -120,-10 L40,-10 Q90,0 90,80 L90,170 L50,170 L50,120 L-140,120 L-140,170 L-180,170 Z', P.lion)}
  <g transform="translate(60,-70)">${mane}<circle r="78" fill="${P.lion}" stroke="${C.ink}" stroke-width="7"/>
  <g transform="scale(.55) translate(0,-10)">${T.eye(-37, -4, 36, 39, e, -1)}${T.eye(37, -4, 36, 39, e, 1)}${T.brows(e.brow)}</g>
  <path d="M-16,22 L16,22 L0,38Z" fill="${C.ink}"/><path d="M0,38 Q-14,54 -26,46 M0,38 Q14,54 26,46" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>`;
}
function wheel(cx, cy, r, rot, col = '#8a5a3a', spokes = 6) {
  let sp = ''; for (let i = 0; i < spokes; i++) { const a = rot + i / spokes * Math.PI * 2; sp += `<path d="M${cx},${cy} L${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)}" stroke="${C.ink}" stroke-width="7"/>`; }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="20"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="10"/>${sp}<circle cx="${cx}" cy="${cy}" r="12" fill="${col}" stroke="${C.ink}" stroke-width="5"/>`;
}
// side-view chariot on ground line y. o.kind 'eg' (light, 2 crew, gold) or 'hit' (heavy, 3 crew, wood); o.crew = [svg, ...]
// crew svgs are drawn at (cx, -230) in chariot space and should be chibi characters at s≈.45
function chariot(o = {}) {
  const t = o.t || 0, eg = o.kind !== 'hit', sp = o.speed ?? 1, gal = sp > 0;
  const boxX = eg ? [-50, 110] : [-80, 140], wx = eg ? -10 : 30, wr = eg ? 70 : 76;
  const horseCol = o.horseCol || (eg ? '#c9a46a' : '#6a4a32'), dark = eg ? '#8a6a3a' : '#3f2a1c';
  let s = K.horse(450, -112, .8, { t: t + .13, gallop: gal, col: dark, dark: C.ink, blanket: eg ? P.egBlue : C.red });
  s += `<path d="M${boxX[1] - 10},-110 Q260,-120 340,-170" stroke="${C.ink}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M${boxX[1] - 10},-110 Q260,-120 340,-170" stroke="#8a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  (o.crew || []).forEach((c, i) => { const n = (o.crew || []).length, cx = lerp(boxX[0] + 40, boxX[1] - 30, n > 1 ? i / (n - 1) : .5); s += `<g transform="translate(${f(cx)},${f(-232 + (gal ? Math.sin(t * 14 + i) * 4 : 0))})">${c}</g>`; });
  const box = `M${boxX[0]},-95 L${boxX[1]},-95 L${boxX[1] + 12},-165 Q${(boxX[0] + boxX[1]) / 2},-180 ${boxX[0] + 6},-160Z`;
  s += path(box, eg ? C.gold : '#8a5a3a') + `<path d="M${boxX[0] + 20},-110 L${boxX[1] - 6},-110" stroke="${eg ? P.egBlue : C.red}" stroke-width="10"/>`;
  if (eg && o.stripes) s += `<path d="M${boxX[0] + 10},-140 L${boxX[1]},-140 M${boxX[0] + 10},-126 L${boxX[1]},-126" stroke="${C.red}" stroke-width="6"/>`;
  s += wheel(wx, -70, wr, t * 9 * sp, eg ? C.gold : '#8a5a3a', 6);
  s += K.horse(420, -112, .8, { t, gallop: gal, col: horseCol, dark: dark, blanket: eg ? P.egBlue : C.red });
  return `<g transform="translate(${f(o.x || 0)},${f(o.y || 0)}) scale(${f((o.s || 1) * (o.flip ? -1 : 1))},${f(o.s || 1)})">${s}</g>`;
}

// ---------- places ----------
// map of the eastern Mediterranean: Hittites north, Egypt south, Syria & Canaan between
const PL = { kadesh: [930, 470], aleppo: [1010, 300], hattusa: [760, 150], piramesses: [660, 800], memphis: [620, 880], megiddo: [850, 640], coast: [800, 560] };
const SEA = 'M-20,330 Q200,300 420,340 Q560,370 640,330 Q720,300 790,370 L805,440 Q795,560 778,660 Q758,740 705,782 Q640,800 560,780 Q420,760 300,770 Q120,780 -20,770Z';
const HIT = 'M-20,-20 L1940,-20 L1940,240 Q1500,300 1300,280 Q1200,300 1060,290 Q900,320 790,370 Q720,300 640,330 Q560,370 420,340 Q200,300 -20,330Z';
const STRIP = 'M790,370 Q900,320 1060,290 L1110,420 Q1070,600 1010,800 L760,790 Q760,740 778,660 Q795,560 805,440Z';
const EGY = 'M-20,770 Q120,780 300,770 Q420,760 560,780 Q640,800 705,782 L760,790 L790,1100 L-20,1100Z';
function memap(t, o = {}) {
  const tn = o.tint || {};
  let s = `<rect width="1920" height="1080" fill="#e8d3a0"/>`;
  s += `<path d="${SEA}" fill="#6fa8c9" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><path d="M200,-20 L1100,-20 Q1000,60 700,72 Q400,60 200,-20Z" fill="#6fa8c9" stroke="${C.ink}" stroke-width="7"/>`;
  s += path('M600,420 Q640,404 690,416 L660,440 Q620,446 600,420Z', '#e8d3a0', 5);
  if (tn.hit) s += `<path d="${HIT}" fill="#5f8fd0" opacity="${f(tn.hit)}" stroke="${C.ink}" stroke-width="6"/>`;
  if (tn.egypt) s += `<path d="${EGY}" fill="${C.gold}" opacity="${f(tn.egypt)}"/>`;
  if (tn.strip) s += `<path d="${STRIP}" fill="${o.stripCol || '#fff2b0'}" opacity="${f(tn.strip)}" stroke="${C.ink}" stroke-width="6" stroke-dasharray="18 12"/>`;
  if (tn.spread) { const id = T.nid('sp'); s += `<clipPath id="${id}"><rect x="0" y="0" width="1920" height="${f(lerp(300, 560, tn.spread))}"/></clipPath><path d="${STRIP}" fill="${P.hit}" opacity=".55" clip-path="url(#${id})"/>`; }
  s += `<path d="M660,790 Q680,900 630,1100" stroke="${C.ink}" stroke-width="22" fill="none"/><path d="M660,790 Q680,900 630,1100" stroke="${P.nile}" stroke-width="12" fill="none"/>`;
  s += `<path d="M985,650 Q945,560 932,480 Q918,400 880,330" stroke="${C.ink}" stroke-width="16" fill="none"/><path d="M985,650 Q945,560 932,480 Q918,400 880,330" stroke="${P.nile}" stroke-width="8" fill="none"/>`;
  s += `<path d="M1180,-20 Q1220,180 1310,380 Q1440,600 1640,720" stroke="${C.ink}" stroke-width="18" fill="none"/><path d="M1180,-20 Q1220,180 1310,380 Q1440,600 1640,720" stroke="${P.nile}" stroke-width="10" fill="none"/>`;
  const mt = (x, y, sc = 1) => `<path d="M${x - 30 * sc},${y + 20 * sc} L${x},${y - 30 * sc} L${x + 30 * sc},${y + 20 * sc}Z" fill="#b5a27a" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/><path d="M${x - 10 * sc},${y - 15 * sc} L${x},${y - 30 * sc} L${x + 10 * sc},${y - 15 * sc}Z" fill="#fff"/>`;
  for (const [x, y] of [[300, 230], [380, 200], [470, 240], [560, 210], [880, 230], [960, 200], [1040, 230]]) s += mt(x, y, 1.1);
  if (o.labels !== false) {
    if (tn.egypt) s += text('EGYPT', 330, 930, 84, { fill: C.gold, k: clamp(tn.egypt * 2) });
    if (tn.hit) s += text('HITTITES', 560, 120, 84, { fill: '#cfe0ff', k: clamp(tn.hit * 2) });
  }
  return s;
}
function city(x, y, s = 1, t = 0, o = {}) {
  let tw = '';
  const tower = (tx, h) => { let c = ''; for (let i = 0; i < 3; i++) c += `<rect x="${tx - 44 + i * 32}" y="${-h - 26}" width="22" height="28" fill="${P.stone}" stroke="${C.ink}" stroke-width="5"/>`;
    return c + `<rect x="${tx - 50}" y="${-h}" width="100" height="${h}" fill="${P.stone}" stroke="${C.ink}" stroke-width="7"/><rect x="${tx - 10}" y="${-h + 40}" width="20" height="40" rx="10" fill="${C.ink}"/>`; };
  let wall = ''; for (let i = 0; i < 14; i++) wall += `<rect x="${-420 + i * 60}" y="-224" width="34" height="30" fill="${P.stone}" stroke="${C.ink}" stroke-width="5"/>`;
  tw += wall + `<rect x="-430" y="-200" width="860" height="200" fill="${P.stone}" stroke="${C.ink}" stroke-width="7"/>`;
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) tw += `<path d="M${-430 + i * 100 + (r % 2) * 50},${-170 + r * 45} l60,0" stroke="${P.stoneDark}" stroke-width="5"/>`;
  tw += tower(-420, 290) + tower(420, 290) + tower(0, 330) + `<path d="M-50,0 L-50,-90 Q0,-140 50,-90 L50,0Z" fill="#3a2a1e" stroke="${C.ink}" stroke-width="7"/>`;
  const fl = o.flag ? `<g transform="translate(0,-356)">${tube('M0,0 L0,-120', 8, '#9a6a3a', 4)}${path(`M4,-118 Q50,${f(-130 + Math.sin(t * 6) * 8)} 100,-112 L100,-62 Q50,${f(-74 + Math.sin(t * 6) * 8)} 4,-62Z`, o.flag, 5)}</g>` : '';
  const mound = path('M-620,40 Q-520,-40 -440,-10 L440,-10 Q520,-40 620,40Z', '#b8955a');
  return `<g transform="translate(${x},${y}) scale(${s})">${mound}${fl}${tw}</g>`;
}
function river(y, t, h = 120, col = P.nile) {
  let d = `M-40,${y}`; for (let x = -40; x <= 1980; x += 80) d += ` q40,${f(-10 - Math.sin(t * 2 + x * .02) * 5)} 80,0`;
  let r = `<path d="${d} L1980,${y + h} L-40,${y + h}Z" fill="${col}" stroke="${C.ink}" stroke-width="7"/>`;
  const R = rng(2); for (let i = 0; i < 12; i++) { const x = (R() * 2000 + t * 60) % 2000 - 40; r += `<path d="M${f(x)},${f(y + 30 + R() * (h - 50))} q14,-8 28,0" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
  return r;
}
function desert(t, o = {}) {
  const hz = o.horizon || 600;
  return `<rect width="1920" height="1080" fill="${o.sky || '#f0d79a'}"/><circle cx="${o.sunX || 1500}" cy="${o.sunY || 230}" r="110" fill="#fff1c0" opacity=".9"/>
  <path d="M-20,${hz} Q400,${hz - 70} 900,${hz - 20} T1940,${hz - 30} L1940,1100 L-20,1100Z" fill="${o.far || '#d9b56a'}" stroke="${C.ink}" stroke-width="6"/>
  <path d="M-20,${hz + 120} Q600,${hz + 70} 1100,${hz + 130} T1940,${hz + 110} L1940,1100 L-20,1100Z" fill="${o.near || '#cfa458'}" stroke="${C.ink}" stroke-width="7"/>`;
}
function tent(x, y, s = 1, col = '#efe2c4', k = 0, flag) {
  // k: 0 standing, 1 flattened
  const h = lerp(150, 30, ease(k)), lean = k * 60;
  return `<g transform="translate(${x},${y}) scale(${s})">${path(`M-130,0 L${f(-10 + lean)},${f(-h)} L${f(10 + lean)},${f(-h)} L130,0Z`, col)}<path d="M0,0 L${f(lean)},${f(-h)}" stroke="${C.ink}" stroke-width="5"/>${path(`M-26,0 L${f(lean * .4)},${f(-h * .55)} L26,0Z`, '#5a4636', 5)}
  ${flag && k < .5 ? `<path d="M${f(lean)},${f(-h)} L${f(lean)},${f(-h - 60)}" stroke="${C.ink}" stroke-width="5"/>${path(`M${f(lean)},${f(-h - 60)} l46,12 l-46,14Z`, flag, 4)}` : ''}</g>`;
}
function campfire(x, y, s = 1, t = 0) {
  let fl = ''; for (let i = 0; i < 3; i++) { const h = 70 + 20 * Math.sin(t * 9 + i * 2); fl += path(`M${-30 + i * 30 - 18},0 Q${-30 + i * 30 - 20},${f(-h * .5)} ${f(-30 + i * 30 + Math.sin(t * 7 + i) * 8)},${f(-h)} Q${-30 + i * 30 + 20},${f(-h * .5)} ${-30 + i * 30 + 18},0Z`, i % 2 ? C.gold : '#e8742a', 5); }
  return `<g transform="translate(${x},${y}) scale(${s})"><circle cy="-40" r="110" fill="${C.gold}" opacity=".2"/>${fl}<path d="M-60,4 L60,-10 M-60,-10 L60,4" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/><path d="M-60,4 L60,-10 M-60,-10 L60,4" stroke="#7a5232" stroke-width="12" stroke-linecap="round"/></g>`;
}
// sandstone wall; `carving` is svg placed at (cx,cy) scale cs and turned to stone
function wall(t, o = {}) {
  let s = `<rect width="1920" height="1080" fill="${o.bg || '#f0d79a'}"/><rect x="${o.x ?? 60}" y="${o.y ?? 60}" width="${o.w ?? 1800}" height="${o.h ?? 960}" fill="${P.stone}" stroke="${C.ink}" stroke-width="9"/>`;
  for (let r = 0; r < 8; r++) for (let i = 0; i < 7; i++) s += `<rect x="${(o.x ?? 60) + i * 270 + (r % 2) * 135 - 135}" y="${(o.y ?? 60) + r * 120}" width="270" height="120" fill="none" stroke="${P.stoneDark}" stroke-width="4"/>`;
  const id = T.nid('wl');
  s = `<clipPath id="${id}"><rect x="${o.x ?? 60}" y="${o.y ?? 60}" width="${o.w ?? 1800}" height="${o.h ?? 960}"/></clipPath>` + s.replace(/(<rect x="[-\d.]+" y="[-\d.]+" width="270")/g, `$1 clip-path="url(#${id})"`);
  if (o.glyphs) s += glyphs(o.glyphs[0], o.glyphs[1], o.glyphs[2] || 6, o.glyphs[3] || 8, o.glyphs[4] || 1);
  return s;
}
const carve = (svg, x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#stone)">${svg}</g>`;
function glyphs(x, y, cols, rows, s = 1, seed = 3) {
  const R = rng(seed), G = [
    'M-14,10 Q0,-20 14,10Z', 'M-12,-12 L12,-12 L12,12 L-12,12Z', 'M0,-14 Q14,-14 14,0 Q14,14 0,14 Q-14,14 -14,0 Q-14,-14 0,-14Z M-4,0 L4,0',
    'M-14,8 Q-6,-14 4,-6 Q12,0 14,12', 'M-12,14 L0,-14 L12,14', 'M-14,0 Q-7,-10 0,0 Q7,10 14,0', 'M0,-14 L0,14 M-10,-4 L10,-4', 'M-10,12 Q-14,-6 0,-12 Q10,-14 8,0 Q4,8 -2,6'];
  let g = '';
  for (let c = 0; c < cols; c++) { g += `<path d="M${x + c * 60 - 30},${y - 34} L${x + c * 60 - 30},${y + rows * 48}" stroke="${P.stoneDark}" stroke-width="4"/>`;
    for (let r = 0; r < rows; r++) g += `<path transform="translate(${x + c * 60},${y + r * 48}) scale(${s})" d="${G[Math.floor(R() * G.length)]}" fill="none" stroke="#8a744e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; }
  return g;
}
function tablet(x, y, s = 1, rot = 0, o = {}) {
  const R = rng(o.seed || 4), col = o.col || P.clay, dark = o.dark || P.clayDark; let marks = '';
  for (let r = 0; r < 7; r++) { marks += `<path d="M-90,${-100 + r * 32 + 14} L90,${-100 + r * 32 + 14}" stroke="${dark}" stroke-width="3" opacity=".6"/>`;
    for (let i = 0; i < 6; i++) { const mx = -84 + i * 30 + R() * 8, my = -96 + r * 32; marks += `<path d="M${f(mx)},${f(my)} l12,5 l-12,5Z M${f(mx + 14)},${f(my + 2)} l0,8" fill="${dark}" stroke="${dark}" stroke-width="2"/>`; } }
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">${path('M-100,-120 Q-110,-120 -110,-100 L-110,110 Q-110,124 -96,124 L96,124 Q110,124 110,110 L110,-100 Q110,-122 96,-122Z', col, 7)}${marks}${o.crack ? `<path d="M40,-122 L20,-60 L50,-20 L30,40" stroke="${C.ink}" stroke-width="5" fill="none"/>` : ''}</g>`;
}
function un(x, y, s = 1, t = 0) {
  let win = ''; for (let r = 0; r < 18; r++) for (let c = 0; c < 6; c++) win += `<rect x="${-150 + c * 52}" y="${-860 + r * 46}" width="40" height="34" fill="#9ec9e2" stroke="${C.ink}" stroke-width="3"/>`;
  let flags = ''; for (let i = 0; i < 9; i++) { const fx = -440 + i * 110, cols = [C.red, P.egBlue, C.gold, C.teal, C.purple, '#2f8a3a', C.red, P.hit, C.gold];
    flags += `<path d="M${fx},0 L${fx},-170" stroke="${C.ink}" stroke-width="6"/>${path(`M${fx + 3},-168 Q${fx + 30},${f(-176 + Math.sin(t * 5 + i) * 6)} ${fx + 60},-164 L${fx + 60},-130 Q${fx + 30},${f(-140 + Math.sin(t * 5 + i) * 6)} ${fx + 3},-132Z`, cols[i], 4)}`; }
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-180" y="-900" width="360" height="900" fill="#cfd8de" stroke="${C.ink}" stroke-width="9"/>${win}${flags}</g>`;
}
function sunFace(x, y, r, t, e = expr('proud'), o = {}) {
  let rays = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * .4; rays += `<path d="M${f(Math.cos(a) * r * 1.1)},${f(Math.sin(a) * r * 1.1)} L${f(Math.cos(a + .12) * r * 1.6)},${f(Math.sin(a + .12) * r * 1.6)} L${f(Math.cos(a - .12) * r * 1.6)},${f(Math.sin(a - .12) * r * 1.6)}Z" fill="${C.gold}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`; }
  return `<g transform="translate(${x},${y})">${rays}<circle r="${r}" fill="#f6d34a" stroke="${C.ink}" stroke-width="8"/><g transform="scale(${f(r / 110)})">${T.eye(-37, -4, 30, 34, e, -1)}${T.eye(37, -4, 30, 34, e, 1)}${T.brows(e.brow)}${T.mouth(e.mouth, 0, 50)}</g>${o.thumb ? `<path d="M${f(r * .8)},${f(r * .6)} Q${f(r * 1.2)},${f(r * .9)} ${f(r * 1.3)},${f(r * .7)}" stroke="${C.ink}" stroke-width="8" fill="none"/>` + T.glove(r * 1.3, r * .7, 0, 'thumb', 2.2) : ''}</g>`;
}
function scissors(x, y, s = 1, open = 0) {
  const a = 4 + open * 20;
  const half = (col, sy) => path(`M-20,${-10 * sy} L360,${-6 * sy} Q384,0 360,${8 * sy} L-20,${10 * sy}Z`, col, 6) + tube('M-20,0 L-80,0', 20, C.red, 6)
    + `<circle cx="-130" cy="0" r="46" fill="none" stroke="${C.ink}" stroke-width="28"/><circle cx="-130" cy="0" r="46" fill="none" stroke="${C.red}" stroke-width="15"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})"><g transform="rotate(${-a})">${half('#cfd4dc', 1)}</g><g transform="rotate(${a})">${half('#b9bec7', -1)}</g><circle r="14" fill="${C.iron}" stroke="${C.ink}" stroke-width="5"/></g>`;
}
function car(x, y, s = 1, t = 0) {
  return `<g transform="translate(${x},${y}) scale(${s})">${path('M-200,0 L-190,-50 Q-120,-70 -60,-70 L0,-120 L110,-120 L170,-60 Q220,-56 220,-20 L220,0Z', C.red)}${path('M-30,-74 L10,-110 L60,-110 L60,-74Z', '#9ec9e2', 5)}${path('M76,-74 L76,-110 L104,-110 L140,-74Z', '#9ec9e2', 5)}
  ${wheel(-120, 0, 40, t * 12, C.iron, 5)}${wheel(140, 0, 40, t * 12, C.iron, 5)}<path d="M-180,-30 L200,-30" stroke="#fff" stroke-width="10"/></g>`;
}
function tank(x, y, s = 1, t = 0) {
  let tr = ''; for (let i = 0; i < 6; i++) tr += `<circle cx="${-160 + i * 64}" cy="0" r="26" fill="${C.ironDark}" stroke="${C.ink}" stroke-width="5"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})">${path('M-210,-30 Q-210,30 -170,30 L170,30 Q210,30 210,-30Z', '#3f4a32')}${tr}${path('M-180,-30 L-150,-90 L160,-90 L190,-30Z', '#5f6f44')}${path('M-80,-90 L-60,-150 L70,-150 L90,-90Z', '#5f6f44')}${tube('M70,-122 L300,-130', 22, '#5f6f44', 6)}</g>`;
}
function pylon(x, y, s = 1, name = '') {
  const tw = sx => path(`M${sx * 40},0 L${sx * 40},-520 L${sx * 300},-480 L${sx * 340},0Z`, P.stone);
  return `<g transform="translate(${x},${y}) scale(${s})">${tw(-1)}${tw(1)}${path('M-60,0 L-60,-380 L60,-380 L60,0Z', '#3a2a1e')}${glyphs(-260, -420, 3, 6, .8, 5)}${glyphs(120, -420, 3, 6, .8, 6)}
  ${name ? text(name, 0, 90, 76, { fill: C.gold }) : ''}</g>`;
}
function abuSimbel(t, k = 1) {
  let s = `<rect width="1920" height="1080" fill="#f0c879"/>` + path('M-20,1100 L-20,200 Q400,120 960,140 Q1520,120 1940,200 L1940,1100Z', '#d9a85a');
  for (let i = 0; i < 4; i++) { const x = 300 + i * 440 - (i > 1 ? 0 : 0); s += carve(ramesses({ x, y: 360, s: .9, e: expr('smug', { look: [0, .1] }) }), 0, 0, 1); }
  s += path('M-20,1100 L-20,930 L1940,930 L1940,1100Z', '#c9954a');
  return s;
}

window.EP = { P, ramesses, muwatalli, egyptian, hittite, nomad, historian, princess, lion, chariot, wheel, figure8, memap, PL, city, river, desert, tent, campfire,
  wall, carve, glyphs, tablet, un, sunFace, scissors, car, tank, pylon, abuSimbel, winkLeft, khepresh, hittiteCap, path };

// ---------- shared scene helpers ----------
// bronze helmet + eyes peeking over cover
function hitPeeker(x, y, s = 1, t = 0, ph = 0) {
  const look = Math.sin(t * 1.5 + ph) * .4;
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s})">${bronzeCone(5 + ph)}
  <ellipse cx="-37" cy="-4" rx="36" ry="39" fill="#fff" stroke="${C.ink}" stroke-width="6"/><ellipse cx="37" cy="-4" rx="36" ry="39" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
  <circle cx="${f(-37 + look * 18)}" cy="0" r="9" fill="${C.ink}"/><circle cx="${f(37 + look * 18)}" cy="0" r="9" fill="${C.ink}"/>
  <path d="M-80,-40 L-6,-24 M80,-40 L6,-24" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/></g>`;
}
function rock(x, y, s = 1, seed = 1, col = '#b89a6a') {
  const R = rng(seed);
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="${blobPath(0, -60, 150, R, 7)}" fill="${col}" stroke="${C.ink}" stroke-width="8"/><rect x="-220" y="-6" width="440" height="60" fill="${col}"/><path d="M-220,0 L220,0" stroke="${C.ink}" stroke-width="7"/></g>`;
}
function mirror(x, y, s, inner) {
  const id = T.nid('mr');
  return `<g transform="translate(${x},${y}) scale(${s})">${tube('M0,90 L0,200', 22, C.bronzeDark, 6)}<clipPath id="${id}"><circle r="100"/></clipPath>
  <circle r="104" fill="#e9dcb6" stroke="${C.ink}" stroke-width="9"/><g clip-path="url(#${id})">${inner}</g><circle r="104" fill="none" stroke="${C.bronze}" stroke-width="14"/><circle r="111" fill="none" stroke="${C.ink}" stroke-width="5"/>
  <path d="M-60,-50 Q-40,-76 -10,-80" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}
function sparkle(x, y, s, t, ph = 0) {
  const k = .6 + .4 * Math.sin(t * 8 + ph);
  return `<g transform="translate(${x},${y}) scale(${f(s * k)}) rotate(${f(t * 60 + ph * 20)})"><path d="M0,-40 Q6,-6 40,0 Q6,6 0,40 Q-6,6 -40,0 Q-6,-6 0,-40Z" fill="#fff" stroke="${C.ink}" stroke-width="5"/></g>`;
}
// a marching column of chibis, fn(i) → svg for soldier i drawn at its own origin
function column(n, x0, y0, gap, t, fn, sc = .45, o = {}) {
  let s = '';
  for (let i = 0; i < n; i++) { const m = K.march(t, i * .9, o.sp || 6), x = x0 + i * gap + (o.dx || 0);
    s += `<g transform="translate(${f(x)},${f(y0 + (o.dy || 0) * i + m.bob * sc)}) scale(${o.flip ? -sc : sc},${sc})">${fn(i, m)}</g>`; }
  return s;
}
const egSoldier = (col, e) => (i, m) => egyptian({ step: m ? m.step : 0, seed: 300 + i, col, e: e || expr(i % 3 ? 'determined' : 'neutral'), spear: [50, 270, 110, -250], shield: [-40, 170, .7] });
const hitSoldier = e => (i, m) => hittite({ step: m ? m.step : 0, seed: 400 + i, e: e || expr(i % 2 ? 'angry' : 'determined'), spear: [50, 270, 110, -250], shield: [-40, 170, .7] });
// top-down board: sand plain with the Orontes and the walled city of Kadesh
function board(t, o = {}) {
  let s = `<rect width="1920" height="1080" fill="#dcc488"/>`;
  const R = rng(14); for (let i = 0; i < 70; i++) { const x = R() * 1920, y = R() * 1080; s += `<path d="M${f(x)},${f(y)} l6,-14 l6,14" stroke="#b39a5a" stroke-width="3" fill="none"/>`; }
  const rv = 'M1300,-40 Q1240,200 1260,380 Q1300,560 1220,760 Q1160,900 1220,1120';
  s += `<path d="${rv}" fill="none" stroke="${C.ink}" stroke-width="92"/><path d="${rv}" fill="none" stroke="${P.nile}" stroke-width="78"/>`;
  s += `<g transform="translate(980,330)">${path('M-110,-90 L110,-90 L130,0 L110,90 L-110,90 L-130,0Z', P.stone, 8)}${path('M-70,-50 L70,-50 L80,0 L70,50 L-70,50 L-80,0Z', '#c9b48a', 5)}</g>`;
  if (o.label !== false) s += text('KADESH', 980, 470, 52, { fill: C.gold }) + text('ORONTES', 1300, 980, 40, { fill: '#cfe6f5', rot: -70, font: 'Lilita', sw: 7 });
  return s;
}
function tentTop(x, y, s = 1, k = 0) {
  return `<g transform="translate(${f(x)},${f(y)}) scale(${s}) rotate(${f(k * 25)})" opacity="${f(1 - k * .3)}">${path(`M-30,-24 L30,-24 L30,24 L-30,24Z`, k > .5 ? '#bfae8a' : '#efe2c4', 5)}<path d="M-30,-24 L30,24 M30,-24 L-30,24" stroke="${C.ink}" stroke-width="3"/></g>`;
}
Object.assign(window.EP, { hitPeeker, rock, mirror, sparkle, column, egSoldier, hitSoldier, board, tentTop });
})();
