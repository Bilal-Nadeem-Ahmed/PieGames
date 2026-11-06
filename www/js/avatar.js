// Cartoon kid avatars, drawn as SVG from a few simple options.
import { cloudArc } from './shapes.js';

const OUT = '#2b2118';
let uid = 0;

export function avatarSVG(p, { pose = 'down', line = false, crop = false, inner = false, idPrefix = 'a' } = {}) {
  let n = 0;
  const f = (c) => (line ? '#ffffff' : c);
  const reg = () => (line ? ` class="r" id="${idPrefix}${n++}"` : '');
  const st = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const sh = (tag, attrs, col) => `<${tag}${reg()} fill="${f(col)}" ${st} ${attrs}/>`;
  const path = (d, col) => sh('path', `d="${d}"`, col);
  const lineP = (d, col = OUT, w = 3) => `<path d="${d}" fill="none" stroke="${line ? OUT : col}" stroke-width="${w}" stroke-linecap="round" pointer-events="none"/>`;
  const up = pose === 'up';
  const run = pose === 'run1' ? 1 : pose === 'run2' ? -1 : 0;
  const hairC = p.hairColor, skin = p.skin, acc = p.accent || p.shirt;
  let defs = '', shirt = p.shirt;
  if (!line && (p.pattern === 'stripes' || p.pattern === 'hstripes')) {
    const id = 'pt' + uid++;
    const rot = p.pattern === 'stripes' ? '' : ' patternTransform="rotate(90)"';
    defs = `<defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"${rot}><rect width="16" height="16" fill="${p.shirt}"/><rect width="7" height="16" fill="${p.stripe || '#ffffff'}"/></pattern></defs>`;
    shirt = `url(#${id})`;
  }

  const arm = (sx, sy, hx, hy, rx, col) => {
    const dx = hx - sx, dy = hy - sy, L = Math.hypot(dx, dy);
    const th = (Math.atan2(-dx, dy) * 180) / Math.PI;
    const cx = (sx + hx) / 2, cy = (sy + hy) / 2;
    return sh('ellipse', `cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx}" ry="${(L / 2 + 6).toFixed(1)}" transform="rotate(${th.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"`, col);
  };
  const sleeve = (sx, sy, hx, hy) => {
    if (p.sleeves === 'none') return '';
    if (p.sleeves === 'puff') return sh('circle', `cx="${(sx + (hx - sx) * 0.12).toFixed(1)}" cy="${(sy + (hy - sy) * 0.12).toFixed(1)}" r="15"`, shirt);
    if (p.sleeves === 'long') return arm(sx, sy, hx - (hx - sx) * 0.12, hy - (hy - sy) * 0.12, 12, shirt);
    return arm(sx, sy, sx + (hx - sx) * 0.42, sy + (hy - sy) * 0.42, 13, shirt);
  };

  const L = [66, 156], R = [134, 156];
  let hl = up ? [34, 104] : [50, 198], hr = up ? [166, 104] : [150, 198];
  if (run) { hl = [66 + run * 26, 188]; hr = [134 - run * 26, 188]; }
  let s = '';

  // --- hair behind the head
  const hb = p.hair;
  if (hb === 'long') s += path('M40 92 C36 40 70 26 100 26 C130 26 164 40 160 92 L168 178 C140 190 60 190 32 178 Z', hairC);
  if (hb === 'bangsBun') {
    s += sh('circle', 'cx="100" cy="34" r="22"', hairC);
    s += path('M42 96 C40 44 160 44 158 96 L162 132 C150 140 140 132 138 128 L62 128 C60 132 50 140 38 132 Z', hairC);
  }
  if (hb === 'bun' || hb === 'topBun') s += sh('circle', `cx="100" cy="${hb === 'topBun' ? 28 : 30}" r="${hb === 'topBun' ? 21 : 24}"`, hairC);
  if (hb === 'pigtails') {
    s += sh('circle', 'cx="34" cy="112" r="22"', hairC) + sh('circle', 'cx="166" cy="112" r="22"', hairC);
    s += sh('circle', 'cx="48" cy="100" r="7"', acc) + sh('circle', 'cx="152" cy="100" r="7"', acc);
  }

  // --- legs & shoes
  const leg = (x, sx, a) => `<g transform="rotate(${a} ${x + 12} 188)">` + sh('rect', `x="${x}" y="184" width="25" height="40" rx="10"`, p.pants) + sh('ellipse', `cx="${sx}" cy="226" rx="16" ry="9"`, '#f3eeea') + '</g>';
  s += leg(72, 82, run * 28) + leg(103, 118, -run * 28);

  // --- arms (skin), sleeves on top
  s += arm(L[0], L[1], hl[0], hl[1], 10, skin) + sleeve(L[0], L[1], hl[0], hl[1]);
  s += arm(R[0], R[1], hr[0], hr[1], 10, skin) + sleeve(R[0], R[1], hr[0], hr[1]);

  // --- body
  if (p.outfit === 'dress') {
    s += path('M66 176 C66 156 76 144 100 144 C124 144 134 156 134 176 L150 210 Q142 218 134 210 Q125 220 117 210 Q108 220 100 210 Q92 220 83 210 Q75 220 66 210 Q58 218 50 210 Z', shirt);
    s += lineP('M68 178 Q100 186 132 178', OUT, 3);
  } else s += path('M60 196 C58 160 72 144 100 144 C128 144 142 160 140 196 Q100 204 60 196 Z', shirt);

  // --- toy hammer held in the right hand
  if (p.extra === 'hammer') {
    const ang = up ? 15 : 35;
    s += `<g transform="translate(${hr[0]} ${hr[1]}) rotate(${ang})">` +
      sh('rect', 'x="-4.5" y="-50" width="9" height="56" rx="4"', '#e2bd8b') +
      path('M-24 -50 C-24 -66 24 -66 26 -54 L26 -46 C10 -50 -10 -46 -24 -40 Z', acc) + '</g>';
  }
  s += sh('circle', `cx="${hl[0]}" cy="${hl[1]}" r="10"`, skin);
  s += sh('circle', `cx="${hr[0]}" cy="${hr[1]}" r="10"`, skin);

  // --- ears & head
  s += sh('circle', 'cx="45" cy="100" r="12"', skin) + sh('circle', 'cx="155" cy="100" r="12"', skin);
  s += sh('circle', 'cx="100" cy="92" r="56"', skin);

  // --- face
  for (const ex of [78, 122]) {
    s += sh('ellipse', `cx="${ex}" cy="100" rx="12" ry="14"`, '#ffffff');
    s += sh('circle', `cx="${ex}" cy="102" r="9"`, p.eyes);
    s += `<circle cx="${ex}" cy="102" r="4.6" fill="#111" pointer-events="none"/>`;
    s += `<circle cx="${ex + 3}" cy="98" r="2.8" fill="#fff" pointer-events="none"/>`;
    if (p.lashes) {
      const o = ex < 100 ? -1 : 1;
      s += lineP(`M${ex + o * 10} 90 l${o * 6} -5`) + lineP(`M${ex + o * 5} 87 l${o * 3} -6`);
    }
  }
  const bw = p.brows === 'thick' ? 6 : 4;
  s += lineP('M67 84 Q78 76 89 82', hairC, bw) + lineP('M111 82 Q122 76 133 84', hairC, bw);
  s += lineP('M97 108 Q94 115 99 116 Q102 117 104 115', OUT, 2.6);
  s += path('M86 122 Q100 138 114 122 Q100 128 86 122 Z', '#b5473a');
  if (!line) s += '<ellipse cx="66" cy="118" rx="9" ry="6" fill="#ff7b7b" opacity=".35"/><ellipse cx="134" cy="118" rx="9" ry="6" fill="#ff7b7b" opacity=".35"/>';

  // --- hair in front
  switch (hb) {
    case 'bangsBun':
      s += path('M42 104 C36 52 64 30 100 30 C136 30 164 52 158 104 L152 104 L150 82 L141 87 L133 80 L124 87 L116 80 L107 87 L99 80 L90 87 L82 80 L73 87 L65 80 L56 86 L50 82 L48 104 Z', hairC);
      break;
    case 'topBun':
      s += path('M43 100 C36 50 64 30 100 30 C136 30 164 50 157 100 C154 86 150 74 142 66 L137 72 L131 64 L124 71 L118 63 L111 70 L104 62 L97 70 L90 63 L83 71 L77 64 L70 72 L62 66 C52 74 46 86 43 100 Z', hairC);
      s += lineP('M100 32 L100 48', '#00000055', 2);
      break;
    case 'swept':
      s += path('M45 102 C38 56 62 30 98 29 C138 28 164 54 156 102 C154 90 150 80 142 72 Q134 76 124 78 Q122 70 114 66 Q106 76 92 79 Q92 70 84 66 Q72 76 60 80 Q58 76 60 70 C52 82 47 92 45 102 Z', hairC);
      s += path('M92 32 Q94 12 110 16 Q102 22 106 31 Z', hairC);
      s += lineP('M70 52 Q86 42 104 46', '#4a3528', 2.5) + lineP('M112 40 Q130 42 142 58', '#4a3528', 2.5);
      break;
    case 'mop':
      s += path(cloudArc(100, 88, 67, 60, 148, 392, 8, 0.56) + ' L153 116 Q152 84 136 74 Q124 86 108 72 Q94 88 78 76 Q64 86 50 116 Z', hairC);
      s += lineP('M74 50 Q86 38 100 46', '#5a4030', 2.5) + lineP('M112 44 Q126 38 136 50', '#5a4030', 2.5) + lineP('M52 84 Q56 70 66 64', '#5a4030', 2.5);
      break;
    case 'short':
      s += path('M44 96 C38 50 66 30 100 30 C134 30 162 50 156 96 C150 78 140 66 124 62 C112 70 90 72 72 64 C58 70 50 82 44 96 Z', hairC);
      break;
    case 'curly':
      s += path(cloudArc(100, 92, 62, 58, 170, 370, 10, 0.62) + ' L150 96 C140 64 60 64 50 96 Z', hairC);
      break;
    case 'long':
      s += path('M44 96 C38 50 66 30 100 30 C134 30 162 50 156 96 C146 70 120 56 92 58 C74 62 56 74 44 96 Z', hairC);
      break;
    case 'pigtails':
    case 'bun':
      s += path('M44 96 C38 50 66 30 100 30 C134 30 162 50 156 96 C146 70 126 58 100 54 C74 58 54 70 44 96 Z', hairC);
      break;
    case 'spiky':
      s += path('M44 96 L48 58 L60 64 L66 36 L82 50 L94 24 L106 46 L122 26 L128 52 L146 40 L144 64 L156 60 L156 96 C146 72 124 62 100 62 C76 62 54 72 44 96 Z', hairC);
      break;
    case 'fuzz':
      s += lineP('M84 40 q2 -14 12 -8 q6 -12 12 2 q10 -6 8 8', hairC, 5);
      break;
  }

  // --- extras
  if (p.extra === 'bow') {
    const onBun = hb === 'bangsBun' || hb === 'bun' || hb === 'topBun';
    const by = onBun ? 44 : 38, bx = onBun ? 100 : 136;
    s += path(`M${bx} ${by} L${bx - 26} ${by - 14} L${bx - 22} ${by + 14} Z`, acc);
    s += path(`M${bx} ${by} L${bx + 26} ${by - 14} L${bx + 22} ${by + 14} Z`, acc);
    s += sh('circle', `cx="${bx}" cy="${by}" r="7"`, acc);
  }
  if (p.extra === 'glasses') {
    s += `<g fill="none" stroke="#333" stroke-width="4" pointer-events="none"><circle cx="78" cy="100" r="17"/><circle cx="122" cy="100" r="17"/><path d="M95 98 Q100 94 105 98"/></g>`;
  }
  if (p.extra === 'cap') {
    s += path('M42 82 C42 38 70 26 100 26 C130 26 158 38 158 82 Z', acc);
    s += path('M120 78 L182 80 C180 92 150 94 126 90 Z', acc);
  }
  if (p.extra === 'band') s += lineP('M46 74 C70 40 130 40 154 74', acc, 9);

  if (inner) return defs + s;
  const vb = crop ? '30 20 140 140' : '0 0 200 240';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${defs}${s}</svg>`;
}
