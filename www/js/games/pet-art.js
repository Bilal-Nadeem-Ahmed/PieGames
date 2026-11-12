// Pie Pet artwork: pets drawn as SVG for each growth stage and mood.
const O = 'stroke="#3a2a20" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';

export const PETS = {
  puppy: { name: 'Puppy', body: '#d9a066', dark: '#8a5a2b', belly: '#f6e0c0', food: '🦴', sound: 'dog' },
  kitten: { name: 'Kitten', body: '#f4a259', dark: '#d9772f', belly: '#fff1e0', food: '🐟', sound: 'cat' },
  bunny: { name: 'Bunny', body: '#f7f3ef', dark: '#d8cfc6', belly: '#ffffff', food: '🥕', sound: null },
  lamb: { name: 'Lamb', body: '#fbfaf6', dark: '#3b3633', belly: '#fbfaf6', food: '🌿', sound: 'sheep' },
  dino: { name: 'Dino', body: '#6fcf5b', dark: '#3f9a3a', belly: '#d7f5c9', food: '🍃', sound: null },
};
export const STAGES = ['Baby', 'Little', 'Big', 'Grown-up'];

const cloudPath = (cx, cy, rx, ry, n) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    if (!i) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else { const pa = ((i - 1) / n) * Math.PI * 2, px = cx + rx * Math.cos(pa), py = cy + ry * Math.sin(pa), c = Math.hypot(x - px, y - py) * 0.62; d += ` A${c.toFixed(1)} ${c.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`; }
  }
  return d + 'Z';
};

// mood: happy | ok | sad | sleepy | sleep | sick | eat | excited | love
export function petSVG(type, stage, mood, { dirty = false, wet = false } = {}) {
  const P = PETS[type];
  const k = [0.74, 0.85, 0.95, 1.05][stage] ?? 1;
  const headR = 60 - stage * 3.5, bRx = 46 + stage * 9, bRy = 38 + stage * 7;
  const feetY = 288, bCy = feetY - bRy - 8, hCx = 150, hCy = bCy - bRy * 0.5 - headR * 0.72;
  const eyeR = headR * (0.25 - stage * 0.012), ex = headR * 0.4, ey = hCy + headR * 0.02;
  const sick = mood === 'sick';
  const skin = P.body, dark = P.dark;

  // ---- body parts behind the body
  let back = '';
  if (type === 'puppy') back += `<path class="tail" d="M${150 + bRx * 0.8} ${bCy} q${30} -${20} ${16} -${48}" fill="none" stroke="${skin}" stroke-width="14" stroke-linecap="round"/><path d="M${150 + bRx * 0.8} ${bCy} q30 -20 16 -48" fill="none" ${O} stroke-width="3" opacity=".25"/>`;
  if (type === 'kitten') back += `<path class="tail" d="M${150 + bRx * 0.8} ${bCy + 10} C${220 + stage * 8} ${bCy - 10} ${200 + stage * 8} ${bCy - 70} ${230 + stage * 6} ${bCy - 80}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round"/>`;
  if (type === 'bunny') back += `<circle class="tail" cx="${150 + bRx * 0.9}" cy="${bCy + 6}" r="${14 + stage * 2}" fill="#fff" ${O}/>`;
  if (type === 'dino') back += `<path class="tail" d="M${150 + bRx * 0.6} ${bCy - 10} Q${250 + stage * 12} ${bCy - 4} ${262 + stage * 12} ${feetY - 30} Q${220} ${bCy + 30} ${150 + bRx * 0.5} ${bCy + bRy * 0.6} Z" fill="${skin}" ${O}/>`;
  if (type === 'dino') for (let i = 0; i < 4; i++) { const x = 120 + i * (bRx * 0.42), y = bCy - bRy * (0.95 - Math.abs(i - 1.5) * 0.1); back += `<path d="M${x - 10} ${y + 8} L${x} ${y - 14} L${x + 10} ${y + 8} Z" fill="#ffb347" ${O} stroke-width="3"/>`; }

  // ---- legs/feet
  const legC = type === 'lamb' ? dark : skin;
  let legs = '';
  for (const lx of [-0.55, -0.2, 0.2, 0.55]) legs += `<ellipse cx="${150 + lx * bRx * 1.1}" cy="${feetY - 8}" rx="${12 + stage * 2}" ry="${10 + stage}" fill="${legC}" ${O} stroke-width="4"/>`;

  // ---- body
  let body;
  if (type === 'lamb') body = `<path d="${cloudPath(150, bCy, bRx * 1.08, bRy * 1.05, 12)}" fill="#fbfaf6" ${O}/>`;
  else body = `<ellipse cx="150" cy="${bCy}" rx="${bRx}" ry="${bRy}" fill="${skin}" ${O}/><ellipse cx="150" cy="${bCy + bRy * 0.25}" rx="${bRx * 0.62}" ry="${bRy * 0.6}" fill="${P.belly}"/>`;
  if (type === 'puppy') body += `<ellipse cx="${150 - bRx * 0.45}" cy="${bCy - bRy * 0.3}" rx="${bRx * 0.25}" ry="${bRy * 0.22}" fill="${dark}" opacity=".7"/>`;
  if (type === 'kitten') for (const sx of [-0.35, 0, 0.35]) body += `<path d="M${150 + sx * bRx} ${bCy - bRy * 0.95} q6 ${bRy * 0.35} 0 ${bRy * 0.6}" fill="none" stroke="${dark}" stroke-width="6" stroke-linecap="round"/>`;

  // ---- ears (behind head) and head
  let ears = '';
  if (type === 'puppy') ears = `<ellipse class="ear l" cx="${hCx - headR * 0.88}" cy="${hCy + headR * 0.05}" rx="${headR * 0.32}" ry="${headR * 0.62}" fill="${dark}" ${O} transform="rotate(18 ${hCx - headR * 0.88} ${hCy})"/><ellipse class="ear r" cx="${hCx + headR * 0.88}" cy="${hCy + headR * 0.05}" rx="${headR * 0.32}" ry="${headR * 0.62}" fill="${dark}" ${O} transform="rotate(-18 ${hCx + headR * 0.88} ${hCy})"/>`;
  if (type === 'kitten') for (const s of [-1, 1]) ears += `<path class="ear ${s < 0 ? 'l' : 'r'}" d="M${hCx + s * headR * 0.85} ${hCy - headR * 0.15} L${hCx + s * headR * 0.7} ${hCy - headR * 1.15} L${hCx + s * headR * 0.15} ${hCy - headR * 0.75} Z" fill="${skin}" ${O}/><path d="M${hCx + s * headR * 0.72} ${hCy - headR * 0.35} L${hCx + s * headR * 0.66} ${hCy - headR * 0.92} L${hCx + s * headR * 0.32} ${hCy - headR * 0.68} Z" fill="#ffb3c1"/>`;
  if (type === 'bunny') for (const s of [-1, 1]) ears += `<g class="ear ${s < 0 ? 'l' : 'r'}"><ellipse cx="${hCx + s * headR * 0.42}" cy="${hCy - headR * 1.3}" rx="${headR * 0.26}" ry="${headR * 0.75}" fill="${skin}" ${O} transform="rotate(${s * 10} ${hCx + s * headR * 0.42} ${hCy - headR * 0.6})"/><ellipse cx="${hCx + s * headR * 0.42}" cy="${hCy - headR * 1.28}" rx="${headR * 0.12}" ry="${headR * 0.55}" fill="#ffc2cf" transform="rotate(${s * 10} ${hCx + s * headR * 0.42} ${hCy - headR * 0.6})"/></g>`;
  if (type === 'lamb') for (const s of [-1, 1]) ears += `<ellipse class="ear ${s < 0 ? 'l' : 'r'}" cx="${hCx + s * headR * 1.0}" cy="${hCy - headR * 0.1}" rx="${headR * 0.42}" ry="${headR * 0.18}" fill="${dark}" transform="rotate(${s * 22} ${hCx + s * headR} ${hCy})"/>`;

  const faceC = type === 'lamb' ? dark : skin;
  let head = `<circle cx="${hCx}" cy="${hCy}" r="${headR}" fill="${faceC}" ${O}/>`;
  if (type === 'lamb') head += `<path d="${cloudPath(hCx, hCy - headR * 0.82, headR * 0.65, headR * 0.32, 8)}" fill="#fbfaf6" ${O} stroke-width="3"/>`;
  if (type === 'dino') head += `<path d="M${hCx - 12} ${hCy - headR + 4} L${hCx - 2} ${hCy - headR - 16} L${hCx + 8} ${hCy - headR + 4} Z" fill="#ffb347" ${O} stroke-width="3"/>`;
  if (type === 'puppy' || type === 'kitten' || type === 'bunny') head += `<ellipse cx="${hCx}" cy="${hCy + headR * 0.42}" rx="${headR * 0.45}" ry="${headR * 0.3}" fill="${P.belly}"/>`;
  if (sick) head += `<circle cx="${hCx}" cy="${hCy}" r="${headR - 3}" fill="#9be36b" opacity=".35"/>`;

  // ---- eyes
  const eyeC = type === 'lamb' ? '#fff' : '#3a2a20';
  let eyes = '';
  const lid = mood === 'sleepy' || sick;
  for (const s of [-1, 1]) {
    const cx = hCx + s * ex;
    if (mood === 'sleep') eyes += `<path d="M${cx - eyeR} ${ey} Q${cx} ${ey + eyeR * 0.8} ${cx + eyeR} ${ey}" fill="none" stroke="${eyeC}" stroke-width="5" stroke-linecap="round"/>`;
    else if (mood === 'happy' || mood === 'love' || mood === 'eat') eyes += mood === 'love'
      ? `<path d="M${cx} ${ey + eyeR * 0.8} C${cx - eyeR * 1.6} ${ey - eyeR * 0.2} ${cx - eyeR * 0.6} ${ey - eyeR * 1.4} ${cx} ${ey - eyeR * 0.4} C${cx + eyeR * 0.6} ${ey - eyeR * 1.4} ${cx + eyeR * 1.6} ${ey - eyeR * 0.2} ${cx} ${ey + eyeR * 0.8} Z" fill="#ff4d7a"/>`
      : `<path d="M${cx - eyeR} ${ey + eyeR * 0.3} Q${cx} ${ey - eyeR * 1.1} ${cx + eyeR} ${ey + eyeR * 0.3}" fill="none" stroke="${eyeC}" stroke-width="6" stroke-linecap="round"/>`;
    else {
      eyes += `<g class="eye"><ellipse cx="${cx}" cy="${ey}" rx="${eyeR * 0.95}" ry="${eyeR * 1.1}" fill="#fff" ${O} stroke-width="3"/><circle cx="${cx + s * 1}" cy="${ey + eyeR * 0.15}" r="${eyeR * 0.62}" fill="#1b1b1b"/><circle cx="${cx + eyeR * 0.22}" cy="${ey - eyeR * 0.22}" r="${eyeR * 0.24}" fill="#fff"/><circle cx="${cx - eyeR * 0.25}" cy="${ey + eyeR * 0.35}" r="${eyeR * 0.1}" fill="#fff"/></g>`;
      if (lid) eyes += `<path d="M${cx - eyeR * 1.05} ${ey - eyeR * 0.05} Q${cx} ${ey - eyeR * 1.3} ${cx + eyeR * 1.05} ${ey - eyeR * 0.05} Z" fill="${faceC}" stroke="${eyeC}" stroke-width="3"/>`;
      if (mood === 'sad') eyes += `<path d="M${cx - s * eyeR * 1.1} ${ey - eyeR * 1.5} L${cx + s * eyeR * 0.6} ${ey - eyeR * 1.15}" stroke="${eyeC}" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
  if (mood === 'sad') eyes += `<path class="tear" d="M${hCx - ex + 4} ${ey + eyeR * 1.2} q-5 10 0 14 q5 -4 0 -14z" fill="#7cc8ff"/>`;

  // ---- nose, mouth, cheeks
  const my = hCy + headR * 0.45;
  let face = '';
  if (type === 'puppy') face += `<ellipse cx="${hCx}" cy="${my - headR * 0.18}" rx="${headR * 0.14}" ry="${headR * 0.1}" fill="#2b2118"/>`;
  if (type === 'kitten' || type === 'bunny') face += `<path d="M${hCx - 6} ${my - headR * 0.22} L${hCx + 6} ${my - headR * 0.22} L${hCx} ${my - headR * 0.12} Z" fill="#ff8aa0"/>`;
  if (type === 'kitten') face += `<path d="M${hCx - headR * 0.4} ${my - 4} H${hCx - headR * 1.0} M${hCx - headR * 0.4} ${my + 4} L${hCx - headR * 0.95} ${my + 14} M${hCx + headR * 0.4} ${my - 4} H${hCx + headR * 1.0} M${hCx + headR * 0.4} ${my + 4} L${hCx + headR * 0.95} ${my + 14}" stroke="#3a2a20" stroke-width="2.5" stroke-linecap="round"/>`;
  const mouthC = type === 'lamb' ? '#fff' : '#3a2a20';
  const open = mood === 'eat' || mood === 'excited';
  face += `<g class="mouth">` + (open
    ? `<ellipse cx="${hCx}" cy="${my + 4}" rx="${headR * 0.2}" ry="${headR * 0.17}" fill="#7a1f2b" ${O} stroke-width="3"/><ellipse cx="${hCx}" cy="${my + 9}" rx="${headR * 0.11}" ry="${headR * 0.06}" fill="#ff7a8a"/>`
    : mood === 'sad' || sick
      ? `<path d="M${hCx - headR * 0.18} ${my + 8} Q${hCx} ${my - 4} ${hCx + headR * 0.18} ${my + 8}" fill="none" stroke="${mouthC}" stroke-width="4.5" stroke-linecap="round"/>`
      : mood === 'sleep'
        ? `<circle cx="${hCx}" cy="${my + 4}" r="${headR * 0.06}" fill="${mouthC}"/>`
        : `<path d="M${hCx - headR * 0.22} ${my} Q${hCx - headR * 0.1} ${my + headR * 0.16} ${hCx} ${my} Q${hCx + headR * 0.1} ${my + headR * 0.16} ${hCx + headR * 0.22} ${my}" fill="none" stroke="${mouthC}" stroke-width="4.5" stroke-linecap="round"/>`) + `</g>`;
  if (type === 'bunny' && !open) face += `<rect x="${hCx - 6}" y="${my + 2}" width="12" height="9" rx="2" fill="#fff" ${O} stroke-width="2"/>`;
  if (!sick) face += `<ellipse cx="${hCx - headR * 0.62}" cy="${my - 6}" rx="${headR * 0.16}" ry="${headR * 0.1}" fill="#ff7b7b" opacity=".45"/><ellipse cx="${hCx + headR * 0.62}" cy="${my - 6}" rx="${headR * 0.16}" ry="${headR * 0.1}" fill="#ff7b7b" opacity=".45"/>`;
  if (sick) face += `<g transform="rotate(-25 ${hCx + 10} ${my})"><rect x="${hCx + 4}" y="${my - 3}" width="${headR * 0.7}" height="7" rx="3.5" fill="#fff" ${O} stroke-width="2"/><circle cx="${hCx + 6}" cy="${my + 0.5}" r="5" fill="#ef4444"/></g>`;

  // ---- extras: dirt, wet drops
  let extra = '';
  if (dirty) {
    for (const [dx, dy, r] of [[-0.4, 0.1, 0.12], [0.3, -0.2, 0.09], [0.1, 0.4, 0.1], [-0.1, -0.5, 0.07]]) extra += `<ellipse cx="${150 + dx * bRx}" cy="${bCy + dy * bRy}" rx="${bRx * r}" ry="${bRx * r * 0.7}" fill="#8b5e34" opacity=".75"/>`;
    extra += `<g class="stink" fill="none" stroke="#7fb069" stroke-width="4" stroke-linecap="round">${[-1, 0, 1].map((i) => `<path d="M${hCx + i * 34} ${hCy - headR - 14} q-8 -12 0 -24 q8 -12 0 -24"/>`).join('')}</g>`;
  }
  if (wet) extra += [-0.6, -0.2, 0.3, 0.7].map((d, i) => `<path class="drip" style="animation-delay:${i * 0.2}s" d="M${150 + d * bRx} ${bCy + bRy * 0.6} q-5 10 0 14 q5 -4 0 -14z" fill="#7cc8ff"/>`).join('');

  return `<svg viewBox="0 0 300 300" class="pet-svg"><g class="pet-scale" style="transform-origin:150px ${feetY}px;transform:scale(${k})">
    <ellipse cx="150" cy="${feetY + 4}" rx="${bRx * 1.1}" ry="10" fill="#0002"/>
    <g class="pet-body">${back}${legs}${body}${extra.includes('drip') ? '' : ''}</g>
    <g class="pet-head" style="transform-origin:150px ${hCy + headR}px">${ears}${head}${eyes}${face}</g>
    ${extra}</g></svg>`;
}
