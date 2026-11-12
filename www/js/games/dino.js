// Dino eggs: tap the patterned eggs to crack them. A baby peeps through the crack, then hatches wearing
// its shell as a hat. Four kinds of dinosaur (T-rex, long-neck, triceratops, stegosaurus).
// Tap a baby to make it squeak-roar and jump. When the nest is all hatched, mummy dinosaur walks in.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { homeBtn, pick, shuffle } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { drawDino, drawCloud } from '../draw.js';

const DINO_COLOURS = [['green', '#6fcf5b'], ['orange', '#ff9f43'], ['blue', '#5fa8ff'], ['purple', '#b98cff'], ['pink', '#ff8ac2'], ['yellow', '#ffd43b'], ['red', '#ff6b6b']];
const KINDS = ['rex', 'longneck', 'trike', 'stego'];
const KIND_NAME = { rex: 'dinosaur', longneck: 'long-neck dinosaur', trike: 'triceratops', stego: 'stegosaurus' };
const PATTERNS = ['spots', 'stripes', 'zigzag', 'stars'];
const INK = '#2b2118';
// where the top of each kind's head is (in drawDinoKind units, size 100), for the shell hat
const HEAD = { rex: [30, -96], longneck: [52, -112], trike: [40, -60], stego: [48, -44] };

function eye(c, x, y, r) {
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(x + r * 0.25, y + r * 0.1, r * 0.58, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x + r * 0.45, y - r * 0.15, r * 0.22, 0, 7); c.fill();
}
function mouth(c, x, y, u, roar) {
  if (roar) { c.fillStyle = '#b5473a'; c.beginPath(); c.ellipse(x, y, 7 * u, 6 * u, 0, 0, 7); c.fill(); c.stroke(); }
  else { c.beginPath(); c.arc(x - 3 * u, y - 4 * u, 6 * u, 0.3, 2.4); c.stroke(); }
}
function cheek(c, x, y, u) { c.fillStyle = 'rgba(255,120,120,.45)'; c.beginPath(); c.ellipse(x, y, 6 * u, 4 * u, 0, 0, 7); c.fill(); }
function legs(c, u, col, xs, t, walking) {
  c.fillStyle = col;
  xs.forEach((lx, i) => { const sw = walking ? Math.sin(t * 12 + i * 1.6) * 5 * u : 0; c.beginPath(); c.roundRect((lx - 7) * u + sw, -20 * u, 14 * u, 20 * u, 6 * u); c.fill(); c.stroke(); });
}

// Facing right, feet at (x, y), s = about 100 units tall.
export function drawDinoKind(c, kind, x, y, s, col, o = {}) {
  if (kind === 'rex') return drawDino(c, x, y, s, col, o);
  const u = s / 100, { t = 0, roar = false, walking = false } = o;
  c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1);
  c.lineWidth = 3 * u; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round';
  const belly = 'rgba(255,255,255,.45)';
  if (kind === 'longneck') {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-26 * u, -36 * u); c.quadraticCurveTo(-66 * u, -30 * u, -78 * u, -8 * u); c.quadraticCurveTo(-50 * u, -18 * u, -18 * u, -20 * u); c.closePath(); c.fill(); c.stroke();
    legs(c, u, col, [-24, -10, 12, 26], t, walking);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -34 * u, 36 * u, 22 * u, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = belly; c.beginPath(); c.ellipse(4 * u, -28 * u, 22 * u, 11 * u, 0, 0, 7); c.fill();
    const nod = Math.sin(t * 2) * 3 * u;
    c.fillStyle = col; c.beginPath(); c.moveTo(14 * u, -50 * u); c.quadraticCurveTo(24 * u, -84 * u, 40 * u + nod, -96 * u); c.lineTo(52 * u + nod, -90 * u); c.quadraticCurveTo(36 * u, -76 * u, 32 * u, -42 * u); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(50 * u + nod, -98 * u, 15 * u, 11 * u, 0.1, 0, 7); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc((-14 + i * 14) * u, -46 * u, 4 * u, 0, 7); c.fill(); }
    eye(c, 52 * u + nod, -102 * u, 5.5 * u); mouth(c, 62 * u + nod, -92 * u, u * 0.8, roar); cheek(c, 46 * u + nod, -93 * u, u * 0.8);
  } else if (kind === 'trike') {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-26 * u, -34 * u); c.quadraticCurveTo(-58 * u, -26 * u, -66 * u, -10 * u); c.quadraticCurveTo(-40 * u, -16 * u, -20 * u, -20 * u); c.closePath(); c.fill(); c.stroke();
    legs(c, u, col, [-22, -8, 10, 22], t, walking);
    c.fillStyle = col; c.beginPath(); c.ellipse(-4 * u, -34 * u, 34 * u, 24 * u, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = belly; c.beginPath(); c.ellipse(0, -28 * u, 20 * u, 12 * u, 0, 0, 7); c.fill();
    // frill
    c.fillStyle = '#ffb347'; c.beginPath(); c.arc(28 * u, -44 * u, 24 * u, 0, 7); c.fill(); c.stroke();
    c.fillStyle = col; for (let a = -2.6; a < 0.4; a += 0.55) { c.beginPath(); c.arc(28 * u + Math.cos(a) * 21 * u, -44 * u + Math.sin(a) * 21 * u, 3 * u, 0, 7); c.fill(); }
    c.fillStyle = col; c.beginPath(); c.ellipse(40 * u, -38 * u, 20 * u, 16 * u, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#fff6dc';
    for (const [hx, hy, hl, ang] of [[34, -52, 18, -1.25], [46, -50, 18, -1.0], [56, -38, 10, -0.5]]) {
      c.save(); c.translate(hx * u, hy * u); c.rotate(ang); c.beginPath(); c.moveTo(0, -4 * u); c.lineTo(hl * u, 0); c.lineTo(0, 4 * u); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    eye(c, 42 * u, -44 * u, 5.5 * u); mouth(c, 54 * u, -30 * u, u * 0.8, roar); cheek(c, 34 * u, -34 * u, u * 0.8);
  } else { // stego
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-26 * u, -32 * u); c.quadraticCurveTo(-60 * u, -26 * u, -72 * u, -10 * u); c.quadraticCurveTo(-44 * u, -14 * u, -20 * u, -18 * u); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff6dc'; for (const [sx, sa] of [[-66, -2.3], [-60, -1.4]]) { c.save(); c.translate(sx * u, -13 * u); c.rotate(sa); c.beginPath(); c.moveTo(0, -3 * u); c.lineTo(12 * u, 0); c.lineTo(0, 3 * u); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    // back plates
    c.fillStyle = '#ff8a5c';
    for (let i = 0; i < 5; i++) { const a = Math.PI + 0.35 + i * 0.6, px = -2 * u + Math.cos(a) * 30 * u, py = -32 * u + Math.sin(a) * 26 * u, ph = (i === 2 ? 20 : 15) * u;
      c.save(); c.translate(px, py); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(-8 * u, 4 * u); c.lineTo(0, -ph); c.lineTo(8 * u, 4 * u); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    legs(c, u, col, [-22, -8, 10, 22], t, walking);
    c.fillStyle = col; c.beginPath(); c.ellipse(-2 * u, -32 * u, 34 * u, 24 * u, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = belly; c.beginPath(); c.ellipse(2 * u, -24 * u, 20 * u, 10 * u, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(42 * u, -28 * u, 14 * u, 11 * u, 0.2, 0, 7); c.fill(); c.stroke();
    eye(c, 44 * u, -33 * u, 5 * u); mouth(c, 53 * u, -24 * u, u * 0.7, roar); cheek(c, 38 * u, -24 * u, u * 0.7);
  }
  c.restore();
}

export function mount(el) {
  el.innerHTML = `<div class="game dino"><canvas></canvas>${homeBtn()}</div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d');
  const badge = levelBadge(root, 'dino', () => { clearTimeout(timer); newNest(); });
  const taps = () => [2, 3, 3, 4][getLevel('dino') - 1];
  let W, H, S, dpr;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); S = Math.min(W / 900, H / 600); layout(); };
  let eggs = [], t = 0, raf = 0, last = performance.now(), timer = 0, alive = true, mum = null, ptero = null, shells = [];

  function newNest() {
    const n = [2, 3, 4, 5][getLevel('dino') - 1];
    const cols = shuffle([...DINO_COLOURS]).slice(0, n), kinds = shuffle([...KINDS, ...KINDS]);
    eggs = cols.map(([name, col], i) => ({ i, name, col, kind: kinds[i], pat: pick(PATTERNS), taps: 0, state: 'egg', wob: 0, jump: 0, vy: 0, roar: 0, t: Math.random() * 5, out: 0, cap: 0, shake: 2 + Math.random() * 4, dance: 0 }));
    mum = null; shells = [];
    layout();
  }
  function layout() {
    if (!eggs.length) return;
    const n = eggs.length, gap = W / (n + 1);
    eggs.forEach((e, i) => { e.x = gap * (i + 1); e.y = H * 0.84; });
  }
  resize(); addEventListener('resize', resize);
  newNest();

  const R = () => Math.min(70 * S * 1.3, (W / (eggs.length + 1)) * 0.34, H * 0.16);
  const hitPtero = (x, y) => ptero && Math.hypot(x - ptero.x, y - ptero.y) < 60 * S;

  cv.addEventListener('pointerdown', (ev) => {
    const b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
    if (hitPtero(x, y)) { ptero.flap = 1; ptero.vy = -200; sfx.roar(2.4); burst(x, y, { n: 10, shape: 'star' }); return; }
    if (mum && mum.x < W && Math.abs(x - mum.x) < 130 * S && y > H * 0.3) { mum.roar = 1; sfx.roar(0.7); buzz(30); eggs.forEach((e) => { e.vy = -650 * S; }); return; }
    for (const e of eggs) {
      const r = R();
      if (Math.abs(x - e.x) < r * 1.2 && y > e.y - r * 3 && y < e.y + r * 0.4) {
        if (e.state === 'egg') {
          e.taps++; e.wob = 0.5; sfx.pop(e.taps + 2); buzz(12);
          burst(x, y, { n: 6, colors: ['#fff6dc', '#e9d8a6'], speed: 160, shape: 'dot' });
          if (e.taps >= taps()) hatch(e);
          else if (e.taps === taps() - 1) sfx.giggle();
        } else roar(e);
        return;
      }
    }
    burst(x, y, { n: 6, speed: 140, shape: 'star' });
  });

  function roar(e) { e.roar = 0.9; e.vy = -700 * S; sfx.roar(1.7); buzz(15); }

  function hatch(e) {
    const r = R();
    e.state = 'hatched'; e.out = 0; e.cap = 0;
    sfx.pop(4); sfx.giggle(); buzz(30);
    burst(e.x, e.y - r, { n: 30, colors: ['#fff6dc', '#f1e3b5', e.col], speed: 380 });
    e.vy = -600 * S;
    for (let k = 0; k < 4; k++) shells.push({ x: e.x + (k - 1.5) * r * 0.4, y: e.y - r, vx: (k - 1.5) * 160 * S, vy: -420 * S - Math.random() * 200 * S, rot: 0, vr: (Math.random() - 0.5) * 12, s: r * 0.3, life: 1.4 });
    setTimeout(() => alive && say(`A ${e.name} ${KIND_NAME[e.kind]}!`), 300);
    if (eggs.every((x) => x.state === 'hatched')) {
      timer = setTimeout(() => {
        if (!alive) return;
        mum = { x: W + 220 * S, tx: W - Math.min(170 * S, W * 0.16), roar: 0, kind: pick(eggs).kind, col: pick(eggs).col, arrived: false };
        timer = setTimeout(() => { if (!alive) return; celebrate(`${eggs.length} baby dinosaurs! Hooray!`); win('dino', badge); eggs.forEach((x) => { x.dance = 4; }); timer = setTimeout(() => alive && leave(), 4800); }, 2600);
      }, 1400);
    }
  }
  function leave() { if (mum) mum.tx = W + 400 * S; eggs.forEach((e) => { e.state = 'follow'; }); timer = setTimeout(() => alive && newNest(), 2600); }

  function eggPath(r) { c.beginPath(); c.ellipse(0, -r, r * 0.8, r, 0, 0, 7); }
  function drawEgg(e, r) {
    c.save(); c.translate(e.x, e.y);
    c.rotate(Math.sin(t * 30) * e.wob * 0.25);
    c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 4 * S;
    eggPath(r); c.fill();
    // pattern, clipped to the egg
    c.save(); eggPath(r); c.clip(); c.fillStyle = e.col; c.strokeStyle = e.col;
    if (e.pat === 'spots') for (const [dx, dy, rr] of [[-0.3, -1.4, 0.16], [0.3, -1.1, 0.2], [-0.2, -0.6, 0.14], [0.35, -0.5, 0.1], [0, -1.75, 0.1], [-0.55, -1, 0.12]]) { c.beginPath(); c.arc(dx * r, dy * r, rr * r, 0, 7); c.fill(); }
    if (e.pat === 'stripes') for (const yy of [-1.5, -1.0, -0.5]) { c.fillRect(-r, yy * r, 2 * r, r * 0.16); }
    if (e.pat === 'zigzag') { c.lineWidth = r * 0.13; for (const yy of [-1.35, -0.75]) { c.beginPath(); for (let k = 0; k <= 8; k++) c.lineTo(-r + k * r * 0.25, yy * r + (k % 2 ? -0.12 : 0.12) * r); c.stroke(); } }
    if (e.pat === 'stars') for (const [dx, dy] of [[-0.3, -1.4], [0.32, -1.0], [-0.25, -0.55], [0.3, -0.45]]) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = (k % 2 ? 0.07 : 0.16) * r; c.lineTo(dx * r + Math.cos(a) * rr, dy * r + Math.sin(a) * rr); } c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 4 * S; eggPath(r); c.stroke();
    // cracks grow with each tap
    const need = taps(), k = e.taps / need;
    c.lineWidth = 3 * S;
    if (k > 0) { c.beginPath(); c.moveTo(-r * 0.6, -r * 1.2); c.lineTo(-r * 0.35, -r * 1.05); c.lineTo(-r * 0.15, -r * 1.25); if (k > 0.4) { c.lineTo(r * 0.1, -r * 1.05); c.lineTo(r * 0.3, -r * 1.3); } if (k > 0.6) { c.lineTo(r * 0.5, -r * 1.08); c.lineTo(r * 0.72, -r * 1.25); } c.stroke(); }
    // one tap to go: a dark hole with a baby eye blinking out
    if (e.taps === need - 1 && need > 1) {
      c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(0, -r * 1.15, r * 0.24, r * 0.17, 0, 0, 7); c.fill();
      const blink = (t * 1.3 + e.i) % 3 < 0.15;
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(r * 0.02, -r * 1.15, r * 0.11, blink ? r * 0.02 : r * 0.11, 0, 0, 7); c.fill();
      if (!blink) { c.fillStyle = '#111'; c.beginPath(); c.arc(r * 0.04 + Math.sin(t * 2) * r * 0.03, -r * 1.14, r * 0.06, 0, 7); c.fill(); }
    }
    c.restore();
  }
  function drawCap(x, y, r, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 3 * S;
    c.beginPath(); c.ellipse(0, 0, r * 0.62, r * 0.5, 0, Math.PI, 0);
    for (let k = 0; k <= 6; k++) c.lineTo(r * 0.62 - k * r * 0.207, k % 2 ? r * 0.12 : 0);
    c.closePath(); c.fill(); c.stroke(); c.restore();
  }

  function scene() {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb877'); g.addColorStop(0.55, '#ffe2b3'); g.addColorStop(1, '#ffe9c2');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(W * 0.3, H * 0.22, 46 * S, 0, 7); c.fill();
    drawCloud(c, W * 0.12 + Math.sin(t * 0.1) * 20, H * 0.15, 60 * S); drawCloud(c, W * 0.52 + Math.sin(t * 0.07) * 30, H * 0.1, 45 * S);
    // far hills + volcano
    c.fillStyle = '#d9a46c'; c.beginPath(); c.moveTo(0, H * 0.62); c.quadraticCurveTo(W * 0.2, H * 0.42, W * 0.42, H * 0.6); c.lineTo(0, H * 0.7); c.fill();
    c.fillStyle = '#8d6e63'; c.beginPath(); c.moveTo(W * 0.6, H * 0.64); c.lineTo(W * 0.73, H * 0.27); c.lineTo(W * 0.8, H * 0.27); c.lineTo(W * 0.95, H * 0.64); c.fill();
    c.fillStyle = '#ff7043'; c.beginPath(); c.moveTo(W * 0.73, H * 0.27); c.lineTo(W * 0.8, H * 0.27); c.lineTo(W * 0.79, H * 0.36); c.lineTo(W * 0.77, H * 0.31); c.lineTo(W * 0.755, H * 0.38); c.lineTo(W * 0.74, H * 0.32); c.fill();
    c.fillStyle = 'rgba(120,120,120,.35)'; for (let i = 0; i < 4; i++) { const k = ((t * 0.4 + i / 4) % 1); c.beginPath(); c.arc(W * 0.765 + Math.sin(t + i) * 10 * S + k * 40 * S, H * 0.25 - k * H * 0.22, (10 + k * 26) * S, 0, 7); c.fill(); }
    c.fillStyle = '#7cc46a'; c.beginPath(); c.moveTo(0, H * 0.64); c.quadraticCurveTo(W * 0.5, H * 0.56, W, H * 0.64); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.fillStyle = '#6ab35a'; c.beginPath(); c.moveTo(0, H * 0.78); c.quadraticCurveTo(W * 0.5, H * 0.72, W, H * 0.8); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    for (const px of [0.05, 0.95]) {
      c.strokeStyle = '#8d5a2b'; c.lineWidth = 14 * S; c.beginPath(); c.moveTo(W * px, H * 0.74); c.quadraticCurveTo(W * px + 20 * S, H * 0.52, W * px, H * 0.36); c.stroke();
      c.fillStyle = '#2f9e44'; for (let a = 0; a < 5; a++) { c.save(); c.translate(W * px, H * 0.36); c.rotate(-2.6 + a * 0.65 + Math.sin(t * 1.2 + a) * 0.04); c.beginPath(); c.ellipse(45 * S, 0, 50 * S, 13 * S, 0, 0, 7); c.fill(); c.restore(); }
      c.fillStyle = '#8d5a2b'; c.beginPath(); c.arc(W * px + 8 * S, H * 0.38, 7 * S, 0, 7); c.arc(W * px - 6 * S, H * 0.39, 7 * S, 0, 7); c.fill();
    }
    // ferns
    c.strokeStyle = '#3a9a48'; c.lineWidth = 5 * S;
    for (const fx of [0.18, 0.36, 0.64, 0.82]) for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(W * fx, H * 0.72); c.quadraticCurveTo(W * fx + k * 18 * S, H * 0.64, W * fx + k * 30 * S, H * 0.66 + Math.abs(k) * 8 * S); c.stroke(); }
    // pterodactyl flies by now and then
    if (!ptero && Math.random() < 0.002) ptero = { x: -60 * S, y: H * 0.2, vy: 0, flap: 0 };
    if (ptero) {
      ptero.x += 90 * S * (1 / 60) * 1.6; ptero.vy *= 0.95; ptero.y += ptero.vy / 60 + Math.sin(t * 2) * 0.4; ptero.flap = Math.max(0, ptero.flap - 0.02);
      const w = Math.sin(t * (8 + ptero.flap * 10)) * 0.6, u = S * 1.1;
      c.save(); c.translate(ptero.x, ptero.y); c.fillStyle = '#c084fc'; c.strokeStyle = INK; c.lineWidth = 2.5 * u;
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(sd * 46 * u, -18 * u * w - 6 * u); c.lineTo(sd * 18 * u, 8 * u); c.closePath(); c.fill(); c.stroke(); }
      c.beginPath(); c.ellipse(0, 2 * u, 14 * u, 9 * u, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(10 * u, -4 * u); c.lineTo(34 * u, 0); c.lineTo(10 * u, 4 * u); c.closePath(); c.fillStyle = '#ffb347'; c.fill(); c.stroke();
      c.fillStyle = '#c084fc'; c.beginPath(); c.moveTo(4 * u, -6 * u); c.lineTo(-10 * u, -16 * u); c.lineTo(0, -2 * u); c.fill(); c.stroke();
      c.fillStyle = '#111'; c.beginPath(); c.arc(9 * u, -3 * u, 2.4 * u, 0, 7); c.fill();
      c.restore();
      if (ptero.x > W + 80 * S) ptero = null;
    }
    // nest
    c.fillStyle = '#c69c6d';
    c.beginPath(); c.ellipse(W / 2, H * 0.86, W * 0.44, H * 0.06, 0, 0, 7); c.fill();
    c.strokeStyle = '#9b7447'; c.lineWidth = 4 * S;
    for (let i = 0; i < 18; i++) { const x0 = W * 0.08 + i * W * 0.047; c.beginPath(); c.moveTo(x0, H * 0.83); c.lineTo(x0 + W * 0.04, H * 0.88); c.stroke(); c.beginPath(); c.moveTo(x0 + W * 0.04, H * 0.83); c.lineTo(x0, H * 0.89); c.stroke(); }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    scene();
    const r = R();
    // mummy dinosaur walks in behind the nest
    if (mum) {
      const d = mum.tx - mum.x; mum.x += Math.sign(d) * Math.min(Math.abs(d), 260 * S * dt);
      if (!mum.arrived && Math.abs(d) < 2) { mum.arrived = true; mum.roar = 1; sfx.roar(0.7); buzz(40); say('Mummy dinosaur!'); eggs.forEach((e) => { e.vy = -650 * S; }); }
      mum.roar = Math.max(0, mum.roar - dt);
      drawDinoKind(c, mum.kind, mum.x, H * 0.8, Math.min(H * 0.62, 300 * S), mum.col, { flip: mum.tx < mum.x || mum.arrived && mum.tx < W, t, roar: mum.roar > 0, walking: Math.abs(d) > 2 });
    }
    for (const e of eggs) {
      e.wob = Math.max(0, e.wob - dt);
      if (e.state === 'egg') {
        // eggs wiggle by themselves now and then, asking to be tapped
        e.shake -= dt; if (e.shake <= 0) { e.shake = 3 + Math.random() * 5; e.wob = 0.35; }
        drawEgg(e, r);
        continue;
      }
      e.vy += 2200 * S * dt; e.jump = Math.min(0, e.jump + e.vy * dt); if (e.jump === 0) e.vy = 0;
      e.roar = Math.max(0, e.roar - dt); e.t += dt; e.out = Math.min(1, e.out + dt * 3); e.cap = Math.min(1, e.cap + dt * 1.4);
      if (e.dance > 0) { e.dance -= dt; if (e.jump === 0 && Math.sin(e.t * 9) > 0.95) e.vy = -380 * S; }
      if (e.state === 'follow') e.x += 230 * S * dt;
      const wander = e.state === 'follow' ? 0 : e.out >= 1 ? Math.sin(e.t * 0.9 + e.i) * r * 0.45 : 0;
      const facing = e.state === 'follow' ? false : Math.cos(e.t * 0.9 + e.i) < 0;
      const sz = r * 2.3, bx = e.x + wander, by = e.y - r * (e.state === "follow" ? 0.1 : 0.55) + e.jump;
      c.save(); c.translate(bx, by); if (facing) c.scale(-1, 1); c.scale(e.out, e.out); c.rotate(Math.sin(e.t * (e.dance > 0 ? 9 : 3)) * (e.dance > 0 ? 0.15 : 0.06));
      drawDinoKind(c, e.kind, 0, 0, sz, e.col, { roar: e.roar > 0, t: e.t, walking: e.state === 'follow' || Math.abs(Math.cos(e.t * 0.9 + e.i)) > 0.3 });
      // shell hat flies up from the egg and lands on the head
      const [hx, hy] = HEAD[e.kind], k = e.cap, ease = 1 - (1 - k) * (1 - k);
      const capX = hx * sz / 100 * ease, capY = (-r * 1.6) * (1 - ease) + (hy * sz / 100) * ease - Math.sin(k * Math.PI) * r * 1.4;
      drawCap(capX, capY, r * 0.75, (1 - ease) * 4);
      c.restore();
      // bottom of the shell stays in the nest
      if (e.state !== 'follow') {
        c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 3 * S;
        c.beginPath(); c.moveTo(e.x - r * 0.8, e.y - r * 0.5); c.lineTo(e.x - r * 0.5, e.y - r * 0.75); c.lineTo(e.x - r * 0.2, e.y - r * 0.5); c.lineTo(e.x + r * 0.15, e.y - r * 0.78); c.lineTo(e.x + r * 0.5, e.y - r * 0.5); c.lineTo(e.x + r * 0.8, e.y - r * 0.7);
        c.ellipse(e.x, e.y - r * 0.5, r * 0.8, r * 0.5, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
      }
    }
    // flying shell bits
    shells = shells.filter((s) => (s.life -= dt) > 0);
    for (const s of shells) {
      s.vy += 1600 * S * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      c.save(); c.globalAlpha = Math.min(1, s.life * 2); c.translate(s.x, s.y); c.rotate(s.rot);
      c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 2 * S; c.beginPath(); c.moveTo(-s.s, 0); c.lineTo(0, -s.s * 0.7); c.lineTo(s.s, 0); c.lineTo(0, s.s * 0.4); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  say('Tap the eggs!');
  return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); removeEventListener('resize', resize); };
}
