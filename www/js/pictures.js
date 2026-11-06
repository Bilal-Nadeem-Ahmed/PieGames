// Colouring pages. Every closed shape with class "r" can be tapped to fill.
import { cloud } from './shapes.js';
import { avatarSVG } from './avatar.js';
import { getPlayers } from './store.js';

const S = 'stroke="#2b2118" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

function pic(build) {
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

const flower = ({ r }, x, y, s = 1) =>
  [0, 72, 144, 216, 288].map((a) => r('circle', `cx="${(x + Math.cos((a * Math.PI) / 180) * 11 * s).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * 11 * s).toFixed(1)}" r="${8 * s}"`)).join('') +
  r('circle', `cx="${x}" cy="${y}" r="${7 * s}"`);

const band = (cx, cy, R1, R2) => `M${cx - R1} ${cy} A${R1} ${R1} 0 0 1 ${cx + R1} ${cy} L${cx + R2} ${cy} A${R2} ${R2} 0 0 0 ${cx - R2} ${cy} Z`;

const PICS = [
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

export function getPictures() {
  const kids = getPlayers().map((pl, i) => ({
    id: 'me-' + pl.id,
    player: pl,
    svg: () => pic(({ bg, p, r }) => bg() + p('M0 340 Q200 312 400 340 L400 400 L0 400 Z') + r('circle', 'cx="350" cy="56" r="30"') +
      p(cloud(70, 56, 46, 18, 8)) +
      `<g transform="translate(50 18) scale(1.5)">${avatarSVG(pl, { line: true, inner: true, pose: i % 2 ? 'up' : 'down', idPrefix: 'a' })}</g>`),
  }));
  return [...kids, ...PICS];
}
