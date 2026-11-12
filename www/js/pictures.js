// Colouring pages. Every closed shape with class "r" can be tapped to fill.
import { cloud } from './shapes.js';
import { avatarSVG } from './avatar.js';
import { getPlayers } from './store.js';
import { petSVG } from './games/pet-art.js';
import { PROJECTS } from './games/builder.js';
import { MORE_PICS } from './pics-more.js';

const S = 'stroke="#2b2118" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

export function pic(build) {
  let n = 0;
  const api = {
    bg: () => `<rect class="r" id="r${n++}" x="0" y="0" width="400" height="400" fill="#fff"/>`,
    r: (tag, attrs) => `<${tag} class="r" id="r${n++}" fill="#fff" ${S} ${attrs}/>`,
    p: (d) => api.r('path', `d="${d}"`),
    k: (tag, attrs) => `<${tag} fill="#2b2118" ${S} ${attrs} pointer-events="none"/>`,
    l: (d) => `<path d="${d}" fill="none" ${S} pointer-events="none"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${build(api)}</svg>`;
}

export const flower = ({ r }, x, y, s = 1) =>
  [0, 72, 144, 216, 288].map((a) => r('circle', `cx="${(x + Math.cos((a * Math.PI) / 180) * 11 * s).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * 11 * s).toFixed(1)}" r="${8 * s}"`)).join('') +
  r('circle', `cx="${x}" cy="${y}" r="${7 * s}"`);

const band = (cx, cy, R1, R2) => `M${cx - R1} ${cy} A${R1} ${R1} 0 0 1 ${cx + R1} ${cy} L${cx + R2} ${cy} A${R2} ${R2} 0 0 0 ${cx - R2} ${cy} Z`;

const PICS = [
  { id: 'ladybird', svg: () => pic((a) => { const { bg, r, p, k, l } = a; return bg() +
    r('circle', 'cx="60" cy="60" r="34"') + p(cloud(320, 60, 48, 20, 9)) +
    p('M30 330 C40 200 200 120 370 150 C330 300 180 380 30 330 Z') + l('M40 320 C140 260 260 200 360 156') +
    l('M150 200 L175 188 M150 236 L178 230 M262 202 L270 186 M266 240 L292 236') +
    l('M180 150 Q168 120 150 112') + l('M220 150 Q232 120 250 112') + r('circle', 'cx="150" cy="110" r="8"') + r('circle', 'cx="250" cy="110" r="8"') +
    r('ellipse', 'cx="200" cy="172" rx="40" ry="28"') + r('circle', 'cx="186" cy="166" r="9"') + r('circle', 'cx="214" cy="166" r="9"') +
    k('circle', 'cx="186" cy="167" r="4"') + k('circle', 'cx="214" cy="167" r="4"') +
    p('M200 192 C140 192 120 240 126 270 C132 310 170 330 200 330 Z') + p('M200 192 C260 192 280 240 274 270 C268 310 230 330 200 330 Z') +
    r('circle', 'cx="164" cy="230" r="14"') + r('circle', 'cx="152" cy="282" r="12"') + r('circle', 'cx="182" cy="300" r="10"') +
    r('circle', 'cx="236" cy="230" r="14"') + r('circle', 'cx="248" cy="282" r="12"') + r('circle', 'cx="218" cy="300" r="10"') +
    flower(a, 60, 370) + flower(a, 345, 360) + flower(a, 330, 250, 0.8); }) },
  { id: 'sheep', svg: () => pic((a) => { const { bg, r, p, k, l } = a; return bg() +
    p('M0 300 Q120 255 220 285 T400 280 L400 400 L0 400 Z') + r('circle', 'cx="62" cy="62" r="34"') + p(cloud(300, 72, 52, 22, 9)) +
    r('rect', 'x="128" y="250" width="24" height="64" rx="10"') + r('rect', 'x="166" y="262" width="24" height="56" rx="10"') +
    r('rect', 'x="234" y="262" width="24" height="56" rx="10"') + r('rect', 'x="270" y="250" width="24" height="64" rx="10"') +
    p(cloud(212, 222, 108, 66, 15)) +
    r('ellipse', 'cx="76" cy="168" rx="24" ry="11" transform="rotate(-25 76 168)"') + r('ellipse', 'cx="150" cy="168" rx="24" ry="11" transform="rotate(25 150 168)"') +
    r('ellipse', 'cx="113" cy="196" rx="40" ry="48"') + p(cloud(113, 152, 30, 14, 7)) +
    r('ellipse', 'cx="98" cy="190" rx="11" ry="13"') + r('ellipse', 'cx="128" cy="190" rx="11" ry="13"') +
    k('circle', 'cx="100" cy="193" r="5"') + k('circle', 'cx="126" cy="193" r="5"') + l('M103 222 Q113 230 123 222') +
    flower(a, 40, 350) + flower(a, 355, 345) + flower(a, 300, 375, 0.8); }) },

  { id: 'balloons', svg: () => pic(({ bg, r, p, l }) => bg() +
    p('M0 340 Q200 310 400 340 L400 400 L0 400 Z') +
    l('M128 222 Q150 290 200 360') + l('M272 212 Q250 290 200 360') + l('M200 286 Q192 322 200 360') +
    r('ellipse', 'cx="128" cy="140" rx="58" ry="72"') + p('M128 212 l-9 12 h18 z') +
    r('ellipse', 'cx="272" cy="130" rx="58" ry="72"') + p('M272 202 l-9 12 h18 z') +
    r('ellipse', 'cx="200" cy="204" rx="56" ry="70"') + p('M200 274 l-9 12 h18 z') +
    l('M96 110 Q100 92 114 84') + l('M240 100 Q244 82 258 74') + l('M170 180 Q174 162 188 154') +
    p('M200 360 L168 344 L170 380 Z') + p('M200 360 L232 344 L230 380 Z') + r('circle', 'cx="200" cy="360" r="9"') +
    p(cloud(60, 60, 40, 18, 8)) + p(cloud(350, 300, 36, 16, 7))) },

  { id: 'house', svg: () => pic((a) => { const { bg, r, p, k, l } = a; return bg() +
    p('M0 320 Q200 300 400 320 L400 400 L0 400 Z') + r('circle', 'cx="340" cy="64" r="38"') + p(cloud(90, 60, 50, 20, 9)) +
    r('rect', 'x="250" y="100" width="30" height="70"') +
    r('rect', 'x="100" y="190" width="200" height="140"') + p('M78 198 L200 92 L322 198 Z') +
    r('circle', 'cx="200" cy="150" r="20"') +
    r('rect', 'x="178" y="250" width="44" height="80" rx="6"') + k('circle', 'cx="212" cy="292" r="4"') +
    r('rect', 'x="118" y="214" width="46" height="46"') + l('M141 214 V260 M118 237 H164') +
    r('rect', 'x="236" y="214" width="46" height="46"') + l('M259 214 V260 M236 237 H282') +
    p('M178 330 L150 400 L250 400 L222 330 Z') + p(cloud(60, 316, 34, 20, 8)) + p(cloud(345, 316, 34, 20, 8)) +
    flower(a, 40, 370) + flower(a, 360, 372); }) },

  { id: 'fish', svg: () => pic(({ bg, r, p, k, l }) => bg() +
    p('M0 350 Q100 330 200 350 T400 345 L400 400 L0 400 Z') +
    p('M50 360 C30 300 70 270 50 210 C90 260 72 300 84 360 Z') + p('M340 360 C326 310 360 280 344 230 C380 270 364 310 372 360 Z') +
    p('M272 200 L346 146 L334 200 L346 254 Z') + p('M150 142 Q196 86 246 142 Z') +
    r('ellipse', 'cx="190" cy="200" rx="100" ry="70"') +
    p('M200 134 Q218 200 200 266 Q232 260 240 200 Q232 140 200 134 Z') +
    p('M170 214 Q190 256 226 222 Z') +
    r('circle', 'cx="130" cy="186" r="18"') + k('circle', 'cx="126" cy="188" r="8"') + l('M98 214 Q108 222 120 216') +
    r('circle', 'cx="92" cy="114" r="12"') + r('circle', 'cx="70" cy="76" r="9"') + r('circle', 'cx="96" cy="44" r="7"') +
    p('M232 370 l10 -22 l10 22 l24 2 l-18 14 l6 22 l-22 -12 l-22 12 l6 -22 l-18 -14 z')) },

  { id: 'flower', svg: () => pic(({ bg, r, p }) => bg() +
    r('circle', 'cx="340" cy="60" r="34"') + p(cloud(80, 56, 44, 18, 8)) +
    p('M194 290 L194 170 L206 170 L206 290 Z') +
    p('M200 252 C230 220 272 228 284 240 C262 262 230 266 200 252 Z') + p('M200 232 C170 200 128 208 116 220 C138 242 170 246 200 232 Z') +
    [0, 45, 90, 135, 180, 225, 270, 315].map((d) => r('ellipse', `cx="${(200 + Math.cos((d * Math.PI) / 180) * 52).toFixed(1)}" cy="${(132 + Math.sin((d * Math.PI) / 180) * 52).toFixed(1)}" rx="26" ry="36" transform="rotate(${d + 90} ${(200 + Math.cos((d * Math.PI) / 180) * 52).toFixed(1)} ${(132 + Math.sin((d * Math.PI) / 180) * 52).toFixed(1)})"`)).join('') +
    r('circle', 'cx="200" cy="132" r="34"') +
    p('M140 300 L260 300 L246 392 L154 392 Z') + r('rect', 'x="128" y="284" width="144" height="28" rx="8"')) },

  { id: 'car', svg: () => pic(({ bg, r, p, l }) => bg() +
    r('rect', 'x="-4" y="306" width="408" height="98"') + r('rect', 'x="30" y="350" width="60" height="12" rx="6"') +
    r('rect', 'x="170" y="350" width="60" height="12" rx="6"') + r('rect', 'x="310" y="350" width="60" height="12" rx="6"') +
    r('circle', 'cx="60" cy="64" r="36"') + p(cloud(300, 70, 56, 22, 10)) +
    p('M44 276 L54 214 L118 202 L160 150 L270 150 L312 202 L352 212 L358 276 Z') +
    p('M134 202 L170 162 L210 162 L210 202 Z') + p('M222 162 L262 162 L294 202 L222 202 Z') +
    l('M216 206 V270') + r('rect', 'x="230" y="220" width="22" height="8" rx="4"') +
    r('ellipse', 'cx="344" cy="228" rx="10" ry="9"') + r('rect', 'x="36" y="226" width="14" height="22" rx="5"') +
    r('circle', 'cx="120" cy="280" r="38"') + r('circle', 'cx="120" cy="280" r="15"') +
    r('circle', 'cx="290" cy="280" r="38"') + r('circle', 'cx="290" cy="280" r="15"')) },

  { id: 'rainbow', svg: () => pic(({ bg, r, p, l }) => bg() +
    p('M0 330 Q200 300 400 330 L400 400 L0 400 Z') +
    p(band(200, 320, 180, 155)) + p(band(200, 320, 155, 130)) + p(band(200, 320, 130, 105)) +
    p(band(200, 320, 105, 80)) + p(band(200, 320, 80, 55)) +
    p(cloud(44, 318, 60, 32, 10)) + p(cloud(356, 318, 60, 32, 10)) +
    r('circle', 'cx="340" cy="62" r="30"') + l('M340 18 V8 M384 62 H394 M372 30 l8 -8 M372 94 l8 8 M308 30 l-8 -8') +
    p(cloud(80, 70, 40, 16, 8))) },

  { id: 'duck', svg: () => pic(({ bg, r, p, k }) => bg() +
    r('circle', 'cx="340" cy="60" r="34"') + p(cloud(100, 60, 50, 20, 9)) +
    p('M0 290 Q50 270 100 290 T200 290 T300 290 T400 290 L400 400 L0 400 Z') +
    p('M96 250 C90 330 300 340 330 256 C340 224 306 230 280 240 C240 252 190 236 170 222 C130 206 100 222 96 250 Z') +
    r('circle', 'cx="150" cy="170" r="52"') + p('M104 162 L56 178 L104 196 Z') +
    p('M190 258 C210 230 266 230 284 262 C254 284 214 284 190 258 Z') +
    r('circle', 'cx="160" cy="158" r="14"') + k('circle', 'cx="156" cy="160" r="7"') +
    r('ellipse', 'cx="330" cy="350" rx="48" ry="16"') + r('ellipse', 'cx="70" cy="364" rx="40" ry="13"')) },

  { id: 'dino', svg: () => pic(({ bg, r, p, k, l }) => bg() +
    p('M0 330 Q200 300 400 330 L400 400 L0 400 Z') + r('circle', 'cx="60" cy="60" r="34"') + p(cloud(300, 66, 50, 20, 9)) +
    p('M330 330 L330 250 C330 220 380 220 380 250 L380 330 Z') + p(cloud(355, 230, 46, 34, 9)) +
    p('M150 132 L160 104 L176 128 L190 100 L202 132 L220 108 L230 144 L250 124 L254 164 L278 154 L272 196 Z') +
    p('M60 220 C60 160 110 120 160 130 C230 140 260 190 300 230 C320 250 330 280 290 270 C260 262 240 256 220 260 L100 260 C70 260 60 240 60 220 Z') +
    r('rect', 'x="104" y="240" width="34" height="70" rx="12"') + r('rect', 'x="184" y="240" width="34" height="70" rx="12"') +
    p('M74 200 C30 200 26 150 60 130 C90 112 140 130 130 170 C126 192 104 200 74 200 Z') +
    r('circle', 'cx="72" cy="150" r="13"') + k('circle', 'cx="70" cy="152" r="6"') + l('M40 176 Q58 188 80 182') +
    r('circle', 'cx="160" cy="190" r="12"') + r('circle', 'cx="200" cy="210" r="10"') + r('circle', 'cx="150" cy="226" r="8"')) },

  { id: 'bubbles', svg: () => pic(({ bg, r, p, k, l }) => bg() +
    p('M0 340 Q100 320 200 340 T400 335 L400 400 L0 400 Z') +
    r('circle', 'cx="110" cy="120" r="70"') + r('circle', 'cx="270" cy="110" r="52"') + r('circle', 'cx="300" cy="240" r="40"') +
    r('circle', 'cx="180" cy="250" r="58"') + r('circle', 'cx="60" cy="270" r="28"') + r('circle', 'cx="350" cy="40" r="20"') +
    l('M70 90 Q80 70 100 64') + l('M245 92 Q254 76 268 72') + l('M150 228 Q158 212 174 206') +
    r('ellipse', 'cx="110" cy="130" rx="26" ry="16"') + p('M134 130 L150 118 L150 142 Z') + k('circle', 'cx="98" cy="126" r="4"') +
    p('M270 92 l8 16 l18 2 l-13 12 l4 18 l-17 -9 l-17 9 l4 -18 l-13 -12 l18 -2 z')) },
];

// Turn a coloured Pie Pet drawing into colouring-in line art: every filled shape becomes a white,
// outlined, tappable region; pupils stay black. Ids are numbered in drawing order so saves are stable.
function lineArt(svg, prefix) {
  const doc = new DOMParser().parseFromString(`<body>${svg}</body>`, 'text/html');   // forgiving parser (the drawings repeat some attributes)
  const g = doc.querySelector('.pet-scale');
  let n = 0;
  for (const el of g.querySelectorAll('ellipse, circle, path, rect')) {
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    if (fill === 'none' || fill === '') { el.setAttribute('pointer-events', 'none'); if (el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', '#2b2118'); continue; }
    if (['#1b1b1b', '#111', '#2b2118', '#0002'].includes(fill)) { if (fill === '#0002') el.remove(); continue; }
    el.removeAttribute('opacity');
    el.setAttribute('fill', '#fff'); el.setAttribute('class', 'r'); el.setAttribute('id', `${prefix}${n++}`);
    if (!el.getAttribute('stroke')) { el.setAttribute('stroke', '#2b2118'); el.setAttribute('stroke-width', '3'); }
  }
  g.removeAttribute('style');
  return g.innerHTML;
}
const ANIMAL_PAGES = ['puppy', 'kitten', 'bunny', 'lamb', 'cow', 'elephant', 'duck', 'dino'].map((t) => ({
  id: 'pet-' + t,
  svg: () => pic(({ bg, p, r }) => bg() + p('M0 330 Q200 300 400 330 L400 400 L0 400 Z') + r('circle', 'cx="345" cy="58" r="30"') + p(cloud(70, 60, 46, 18, 8)) +
    `<g transform="translate(20 -10) scale(1.2)">${lineArt(petSVG(t, 3, 'happy'), 'p' + t + '-')}</g>`),
}));

// The Build it projects as colouring pages: every part becomes a tappable white region.
const BUILD_PAGES = Object.entries(PROJECTS).map(([k, P]) => ({
  id: 'build-' + k,
  svg: () => pic(({ bg, p, r }) => {
    let n = 0;
    const parts = P.parts.map((pt) => pt.svg.replace(/stroke="#8a5a2b"/g, 'stroke="#2b2118"').replace(/<(rect|path|circle|ellipse) /g, (m, tag) => `<${tag} class="r" id="b${k}-${n++}" fill="#fff" `)).join('');
    return bg() + p('M0 345 Q200 320 400 345 L400 400 L0 400 Z') + r('circle', 'cx="350" cy="50" r="28"') + p(cloud(60, 52, 42, 16, 8)) +
      `<g transform="translate(0 70)">${parts}</g>`;
  }),
}));
// a blank page for free drawing (the whole page is one region, so it can be filled with a colour or pattern too)
const BLANK = { id: 'blank', svg: () => pic(({ bg }) => bg()) };

// A short code for how a child's cartoon is set up (hair, skin, clothes, bow, toy...). It goes into the page id,
// so if their look is changed in Grown-ups they get a fresh page that matches, instead of old colours landing on new shapes.
const sig = (pl) => { const j = JSON.stringify({ ...pl, name: undefined }); let h = 0; for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const kidArt = (pl, x, y, sc, pose, prefix) => `<g transform="translate(${x} ${y}) scale(${sc})">${avatarSVG(pl, { line: true, inner: true, pose, idPrefix: prefix })}</g>`;
function petOf(pl) { try { return JSON.parse(localStorage.getItem('pg.pet.' + pl.id) || 'null'); } catch { return null; } }

export function getPictures() {
  const players = getPlayers();
  const kids = players.flatMap((pl, i) => {
    const s = sig(pl), pet = petOf(pl), petType = pet?.type || ['puppy', 'kitten'][i % 2];
    return [
      { id: `me-${pl.id}-${s}`, player: pl,
        svg: () => pic(({ bg, p, r }) => bg() + p('M0 340 Q200 312 400 340 L400 400 L0 400 Z') + r('circle', 'cx="350" cy="56" r="30"') +
          p(cloud(70, 56, 46, 18, 8)) + kidArt(pl, 50, 18, 1.5, i % 2 ? 'up' : 'down', 'a')) },
      // the child with their own Pie Pet (or a puppy/kitten if they haven't got one yet)
      { id: `mepet-${pl.id}-${s}-${petType}`, player: pl,
        svg: () => pic(({ bg, p, r }) => bg() + p('M0 345 Q200 318 400 345 L400 400 L0 400 Z') + r('circle', 'cx="355" cy="50" r="26"') + p(cloud(190, 52, 40, 16, 8)) +
          kidArt(pl, 6, 86, 1.18, 'down', 'a') + `<g transform="translate(168 88) scale(0.92)">${lineArt(petSVG(petType, Math.min(3, pet?.stage ?? 2), 'happy'), 'pp-')}</g>`) },
      // the child holding three balloons
      { id: `meballoons-${pl.id}-${s}`, player: pl,
        svg: () => pic(({ bg, p, r, l }) => bg() + p('M0 350 Q200 325 400 350 L400 400 L0 400 Z') +
          l('M106 252 L100 136 M106 252 L200 106 M106 252 L300 140') +
          r('ellipse', 'cx="100" cy="88" rx="36" ry="44"') + r('ellipse', 'cx="200" cy="58" rx="36" ry="44"') + r('ellipse', 'cx="300" cy="92" rx="36" ry="44"') +
          p('M100 132 l-7 10 h14 z') + p('M200 102 l-7 10 h14 z') + p('M300 136 l-7 10 h14 z') +
          kidArt(pl, 80, 150, 1.0, 'up', 'a') + flower({ r }, 40, 370) + flower({ r }, 360, 372)) },
    ];
  });
  // everyone together
  if (players.length > 1) {
    const n = players.length, w = Math.min(1.4, 2.25 / n), step = 400 / n;
    kids.push({ id: 'together-' + players.map((pl) => pl.id + sig(pl)).join('-'),
      svg: () => pic(({ bg, p, r }) => bg() + p('M0 345 Q200 318 400 345 L400 400 L0 400 Z') + r('circle', 'cx="200" cy="50" r="28"') + p(cloud(60, 60, 40, 16, 8)) + p(cloud(320, 60, 40, 16, 8)) +
        players.map((pl, i) => kidArt(pl, step * i + step / 2 - 100 * w, 380 - 240 * w, w, i % 2 ? 'up' : 'down', `k${i}-`)).join('')) });
  }
  return [BLANK, ...kids, ...PICS, ...MORE_PICS, ...ANIMAL_PAGES, ...BUILD_PAGES];
}
