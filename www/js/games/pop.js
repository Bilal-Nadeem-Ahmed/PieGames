// Balloon pop & Bubble pop. Endless - no game over. What's inside is chosen with the chips at the top.
import { sfx, buzz, playClip, preloadClip } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, getSettings, storage } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { loadImg } from '../shapes.js';
import { homeBtn, chips, pick, rnd } from '../ui.js';
import { burst, confettiRain } from '../fx.js';
import { drawBalloon, drawBubble, drawSheep, drawCloud } from '../draw.js';
import { COLOURS, ANIMALS } from '../data.js';

const MODES = [
  { id: 'count', icon: '<b>123</b>', label: 'Count' },
  { id: 'colours', icon: '🎨', label: 'Colours' },
  { id: 'animals', icon: '🐮', label: 'Animals' },
  { id: 'letters', icon: '<b>ABC</b>', label: 'Letters' },
  { id: 'numbers', icon: '<b>7</b>', label: 'Numbers' },
];
const SPEED = { slow: 0.6, normal: 1, fast: 1.5 };
const AMOUNT = { few: 4, some: 7, lots: 11 };
const SIZE = { small: 0.75, medium: 0.9, big: 1.1 };

export function mount(el, { theme = 'balloons' } = {}) {
  const bubbles = theme === 'bubbles';
  el.innerHTML = `<div class="game pop ${theme}"><canvas></canvas>${homeBtn()}</div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d');
  const cfg = { speed: 'normal', amount: 'some', size: 'big', countAloud: true, surprises: true, faces: true, ...(getSettings().pop || {}) };
  let mode = storage.read('pg.popmode.' + theme, 'count');
  root.appendChild(chips(MODES, mode, (m) => { mode = m; storage.write('pg.popmode.' + theme, m); items.forEach(decorate); }));

  let W = 0, H = 0, dpr = 1, unit = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = Math.min(W, H);
  };
  resize(); addEventListener('resize', resize);

  const players = getPlayers();
  const kids = players.map((p, i) => ({ p, i, jump: 0, vy: 0, upT: 0, img: null, imgUp: null, face: null }));
  kids.forEach(async (k) => {
    k.img = await loadImg(avatarSVG(k.p)); k.imgUp = await loadImg(avatarSVG(k.p, { pose: 'up' }));
    k.face = await loadImg(avatarSVG(k.p, { crop: true }));
  });

  if (!bubbles) preloadClip('balloons');
  let items = [], sheep = [], floaters = [], pops = 0, t = 0, raf = 0, last = performance.now();
  const clouds = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * 1.2, y: 0.08 + i * 0.09, s: 0.6 + Math.random() * 0.6, v: 0.004 + Math.random() * 0.006 }));
  const fish = Array.from({ length: 3 }, () => ({ x: Math.random(), y: 0.3 + Math.random() * 0.4, v: (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.03), e: pick(['🐠', '🐟', '🐡']) }));

  function decorate(b) {
    b.colour = pick(bubbles && mode !== 'colours' ? [{ n: '', c: '' }] : COLOURS);
    b.letter = String.fromCharCode(65 + rnd(26));
    b.num = 1 + rnd(Math.min(getSettings().countMax || 10, 20));
    b.animal = pick(ANIMALS);
  }
  function spawn(initial = false) {
    const r = Math.max(34, Math.min(95, unit * 0.085)) * SIZE[cfg.size] * (0.85 + Math.random() * 0.3);
    const roll = Math.random();
    let type = 'normal';
    if (cfg.surprises && roll < 0.1) type = 'sheep';
    else if (cfg.faces && roll < 0.18 && kids.length) type = 'face';
    const b = { x: r + Math.random() * (W - 2 * r), y: initial ? H * (0.3 + Math.random() * 0.8) : H + r * 1.6, r, type,
      vy: -(H * 0.075 + Math.random() * H * 0.05) * SPEED[cfg.speed] * (bubbles ? 0.8 : 1), ph: Math.random() * 7, kid: rnd(kids.length || 1) };
    decorate(b);
    items.push(b);
  }
  for (let i = 0; i < AMOUNT[cfg.amount]; i++) spawn(true);

  function label(b) {
    if (mode === 'letters') return b.letter;
    if (mode === 'numbers') return String(b.num);
    if (mode === 'animals') return b.animal[0];
    return '';
  }

  function pop(b) {
    items.splice(items.indexOf(b), 1);
    pops++;
    sfx.pop(pops); buzz(15);
    const col = b.colour.c || '#9be7ff';
    burst(b.x, b.y, bubbles ? { n: 16, colors: ['#bfefff', '#ffffff', '#d5c7ff'], speed: 260, shape: 'dot' } : { n: 22, colors: [col, col, '#fff'] });
    kids.forEach((k) => { k.vy = -(260 + Math.random() * 120); k.upT = 0.7; });
    let words = '', show = '';
    if (b.type === 'sheep') { sheep.push({ x: b.x, y: b.y + b.r * 2, vy: 30, state: 'fall', t: 0, flip: b.x > W / 2 }); }
    if (b.type === 'face') { const k = kids[b.kid]; if (k) { k.vy = -520; k.upT = 1.2; sfx.giggle(); } words = k?.p.name ? k.p.name + '!' : ''; }
    if (mode === 'count') { words = String(pops); show = String(pops); }
    else if (mode === 'colours') { words = b.colour.n; show = b.colour.n; }
    else if (mode === 'animals') { words = `${b.animal[1]}! ${b.animal[2]}`; show = b.animal[0]; }
    else if (mode === 'letters') { words = b.letter + '!'; show = b.letter; }
    else if (mode === 'numbers') { words = String(b.num); show = String(b.num); }
    if (show) floaters.push({ x: b.x, y: b.y, text: show, life: 1.4, color: mode === 'colours' ? b.colour.c : '#fff' });
    // now and then, play the family "balloons" voice note instead of the spoken word
    const clipped = !bubbles && pops > 2 && Math.random() < 0.15 && playClip('balloons', 7000);
    if (!clipped && (cfg.countAloud || mode !== 'count')) say(words, { rate: 1 });
    if (pops % 10 === 0) { setTimeout(() => { confettiRain(80); sfx.yay(); }, 250); }
  }

  const onDown = (e) => {
    e.preventDefault();
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    for (let i = items.length - 1; i >= 0; i--) {
      const b = items[i];
      const dx = (x - b.x) / (b.r * 1.3), dy = (y - b.y) / (b.r * (bubbles ? 1.3 : 1.5));
      if (dx * dx + dy * dy <= 1) return pop(b);
    }
    for (const s of sheep) if (Math.abs(x - s.x) < 70 && Math.abs(y - (s.y - 40)) < 70) { sfx.baa(); s.bleat = 0.8; return; }
    for (const k of kids) if (k.box && x > k.box[0] && x < k.box[0] + k.box[2] && y > k.box[1] && y < k.box[1] + k.box[3]) {
      k.vy = -480; k.upT = 1; sfx.giggle(); if (k.p.name) say(k.p.name + '!'); return;
    }
    burst(x, y, { n: 8, speed: 150, shape: 'star' }); sfx.tap();
  };
  cv.addEventListener('pointerdown', onDown);

  function bg() {
    if (bubbles) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#7fd3f7'); g.addColorStop(1, '#2a7fc9');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(W * (i * 0.25 - 0.1), 0); c.lineTo(W * (i * 0.25 + 0.05), 0); c.lineTo(W * (i * 0.25 + 0.2), H); c.lineTo(W * (i * 0.25 + 0.05), H); c.fill(); }
      c.font = `${unit * 0.07}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const f of fish) {
        f.x += f.v * 0.016; if (f.x > 1.1) f.x = -0.1; if (f.x < -0.1) f.x = 1.1;
        c.save(); c.translate(f.x * W, f.y * H + Math.sin(t + f.y * 10) * 8); if (f.v > 0) c.scale(-1, 1); c.globalAlpha = 0.8; c.fillText(f.e, 0, 0); c.restore();
      }
      c.fillStyle = '#f3d79b'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.9); c.quadraticCurveTo(W * 0.5, H * 0.84, W, H * 0.9); c.lineTo(W, H); c.fill();
      c.fillStyle = '#2e9e5b';
      for (let i = 0; i < 6; i++) { const sx = W * (0.05 + i * 0.19); c.beginPath(); c.moveTo(sx, H); c.quadraticCurveTo(sx - 20 + Math.sin(t * 1.5 + i) * 14, H * 0.8, sx + Math.sin(t + i) * 10, H * 0.72); c.quadraticCurveTo(sx + 26, H * 0.82, sx + 16, H); c.fill(); }
    } else {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#79c6ff'); g.addColorStop(1, '#d9f1ff');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffe36e'; c.beginPath(); c.arc(W * 0.9, H * 0.1, unit * 0.06, 0, 7); c.fill();
      for (const cl of clouds) { cl.x += cl.v * 0.016; if (cl.x > 1.2) cl.x = -0.3; drawCloud(c, cl.x * W, cl.y * H, unit * 0.09 * cl.s); }
      c.fillStyle = '#8fd96b'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.9); c.quadraticCurveTo(W * 0.25, H * 0.84, W * 0.5, H * 0.89); c.quadraticCurveTo(W * 0.75, H * 0.94, W, H * 0.87); c.lineTo(W, H); c.fill();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    bg();
    // items
    while (items.length < AMOUNT[cfg.amount]) spawn();
    for (const b of [...items]) {
      b.y += b.vy * dt; b.x += Math.sin(t * (bubbles ? 1.6 : 1) + b.ph) * (bubbles ? 30 : 12) * dt;
      if (b.y < -b.r * 3) { items.splice(items.indexOf(b), 1); continue; }
      const col = b.colour.c;
      if (bubbles) drawBubble(c, b.x, b.y, b.r, mode === 'colours' ? col : '', t + b.ph);
      else drawBalloon(c, b.x, b.y, b.r, col, t + b.ph);
      if (b.type === 'sheep') drawSheep(c, b.x + 4, b.y + b.r * (bubbles ? 0.55 : 2.6), b.r * (bubbles ? 0.9 : 1.1), { t });
      if (b.type === 'face' && kids[b.kid]?.face) {
        const k = kids[b.kid], s = b.r * 1.5;
        c.save(); c.beginPath(); c.arc(b.x, b.y, b.r * 0.86, 0, 7); c.clip();
        c.drawImage(k.face, b.x - s / 2, b.y - s / 2, s, s); c.restore();
      }
      const lab = b.type === 'normal' ? label(b) : '';
      if (lab) {
        c.font = `bold ${b.r * (mode === 'animals' ? 1 : 1.05)}px "Baloo 2", system-ui, sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        if (mode !== 'animals') { c.lineWidth = b.r * 0.12; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(lab, b.x, b.y + b.r * 0.05); c.fillStyle = '#fff'; }
        c.fillText(lab, b.x, b.y + b.r * 0.05);
      }
    }
    // sheep floating down
    const ground = H * 0.93;
    for (const s of [...sheep]) {
      s.t += dt;
      if (s.state === 'fall') { s.y += 70 * dt; s.x += Math.sin(s.t * 3) * 30 * dt; if (s.y >= ground) { s.y = ground; s.state = 'walk'; sfx.baa(); s.bleat = 0.8; } }
      else { s.x += (s.flip ? 1 : -1) * 90 * dt; if (s.x < -100 || s.x > W + 100) sheep.splice(sheep.indexOf(s), 1); }
      s.bleat = Math.max(0, (s.bleat || 0) - dt);
      const hop = s.state === 'walk' ? Math.abs(Math.sin(s.t * 8)) * 6 : 0;
      c.save(); if (s.state === 'fall') { c.translate(s.x, s.y); c.rotate(Math.sin(s.t * 3) * 0.15); c.translate(-s.x, -s.y); }
      drawSheep(c, s.x, s.y - hop, unit * 0.13, { flip: s.flip, t: s.t, walking: s.state === 'walk', bleat: s.bleat > 0 });
      c.restore();
    }
    // the kids cheering at the bottom
    const kh = Math.min(H * 0.24, 190), kw = (kh * 200) / 240;
    kids.forEach((k, i) => {
      k.vy += 1400 * dt; k.jump = Math.min(0, k.jump + k.vy * dt); if (k.jump === 0) k.vy = 0;
      k.upT -= dt;
      const n = kids.length, x = n === 1 ? W * 0.12 : i < Math.ceil(n / 2) ? W * 0.03 + i * kw * 0.8 : W - kw - W * 0.03 - (n - 1 - i) * kw * 0.8;
      const y = H - kh - 6 + k.jump;
      k.box = [x, y, kw, kh];
      const im = k.upT > 0 ? k.imgUp : k.img;
      if (im) c.drawImage(im, x, y, kw, kh);
    });
    // floating words
    for (const f of [...floaters]) {
      f.life -= dt; f.y -= 60 * dt;
      if (f.life <= 0) { floaters.splice(floaters.indexOf(f), 1); continue; }
      c.save(); c.globalAlpha = Math.min(1, f.life * 1.5);
      c.font = `bold ${unit * 0.09}px "Baloo 2", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8; c.strokeStyle = '#2b2118'; c.strokeText(f.text, f.x, f.y);
      c.fillStyle = f.color === '#f8fafc' ? '#fff' : f.color; c.fillText(f.text, f.x, f.y);
      c.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);

  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); };
}
