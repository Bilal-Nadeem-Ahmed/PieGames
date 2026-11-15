// Balloon pop & Bubble pop. Endless - no game over. What's inside is chosen with the chips at the top.
// Tap or swipe to pop. Near misses nudge. Special ones turn up now and then: a giant (3 taps), a tied bunch that
// pops in a chain, a gold star / rainbow bubble that pops lots at once, presents, sea creatures, a treasure chest.
// Every 30 pops there's a little moment (parade, rain of tiny ones, all one colour), and in the colour / letter /
// number / animal modes a gentle "find it" round appears now and then. The scene changes as they play.
import { sfx, buzz, playClip, preloadClip } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, getSettings, storage } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { loadImg } from '../shapes.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { homeBtn, chips, pick, rnd, askPill } from '../ui.js';
import { burst, confettiRain } from '../fx.js';
import { drawBubble, drawSheep } from '../draw.js';
import { COLOURS, ANIMALS } from '../data.js';
import { createSea, drawFish } from '../sea.js';
import { canSpeak } from '../voices.js';
import { createSky } from '../sky.js';
import { FARM, animalSound, preloadAnimals, SOUND_FOR_NAME } from '../animals.js';

const MODES = [
  { id: 'count', icon: '🎈', label: 'Count the pops' },
  { id: 'colours', icon: '🎨', label: 'Colours' },
  { id: 'animals', icon: '🐮', label: 'Animals' },
  { id: 'letters', icon: '<b>ABC</b>', label: 'Letters' },
  { id: 'numbers', icon: '<b>123</b>', label: 'Numbers' },
];
const SPEED = { slow: 0.6, normal: 1, fast: 1.5 };
const AMOUNT = { few: 4, some: 7, lots: 11 };
const SIZE = { small: 0.75, medium: 0.9, big: 1.1 };
const RAINBOW = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f472b6'];
const TOYS = ['🧸', '🚗', '🪀', '⚽', '🦆', '🚂', '🎺', '🪁', '🦄', '🍭'];
const CREATURES = ['fish', 'fish', '🐢', '🐙', '🐠', '🐬', '🦀', '🐡', '🦑'];
const GEMS = ['💎', '👑', '🪙', '⭐', '🐚', '🔱'];

// Emoji animals are drawn facing left by default (most emoji face left); flip makes them face right.
function drawEmoji(c, e, x, y, s, flip, big) {
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  if (big) c.scale(1.1, 1.1);
  c.font = `${s}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'bottom';
  c.fillText(e, 0, s * 0.12);
  c.restore();
}

// Balloon outline for each shape, centred on 0,0. Returns [path, y of the knot].
function shapePath(shape, r) {
  const p = new Path2D();
  if (shape === 'heart') { p.moveTo(0, r * 1.15); p.bezierCurveTo(-r * 1.55, r * 0.1, -r * 0.95, -r * 1.25, 0, -r * 0.5); p.bezierCurveTo(r * 0.95, -r * 1.25, r * 1.55, r * 0.1, 0, r * 1.15); return [p, r * 1.1]; }
  if (shape === 'long') { p.ellipse(0, 0, r * 0.62, r * 1.5, 0, 0, 7); return [p, r * 1.45]; }
  if (shape === 'bear') { p.arc(-r * 0.68, -r * 0.92, r * 0.36, 0, 7); p.moveTo(r * 1.04, -r * 0.92); p.arc(r * 0.68, -r * 0.92, r * 0.36, 0, 7); p.moveTo(r, 0); p.ellipse(0, 0, r, r * 1.1, 0, 0, 7); return [p, r * 1.05]; }
  if (shape === 'star') { for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = (i % 2 ? 0.62 : 1.3) * r; p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath(); return [p, r * 0.95]; }
  p.ellipse(0, 0, r, r * 1.15, 0, 0, 7); return [p, r * 1.1];
}

export function mount(el, { theme = 'balloons' } = {}) {
  const bubbles = theme === 'bubbles';
  el.innerHTML = `<div class="game pop ${theme}"><canvas></canvas>${homeBtn()}</div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d');
  const badge = levelBadge(root, theme, () => {});
  const lv = () => getLevel(theme) - 1;           // each level: a bit faster, one more balloon, slightly smaller
  const amount = () => AMOUNT[cfg.amount] + lv();
  const cfg = { speed: 'normal', amount: 'some', size: 'big', countAloud: true, surprises: true, faces: true, ...(getSettings().pop || {}) };
  let mode = storage.read('pg.popmode.' + theme, 'count');
  root.appendChild(chips(MODES.map((m) => (m.id === 'count' && bubbles ? { ...m, icon: '🫧' } : m)), mode, (m) => { mode = m; storage.write('pg.popmode.' + theme, m); endFind(); items.forEach(decorate); }));

  let W = 0, H = 0, dpr = 1, unit = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    unit = Math.min(W, H);
  };
  resize(); addEventListener('resize', resize);

  const players = getPlayers();
  // Bubbles: no kids on screen. Balloons: the kids cheer at the bottom.
  const kids = bubbles ? [] : players.map((p, i) => ({ p, i, jump: 0, vy: 0, upT: 0, img: null, imgUp: null, face: null }));
  kids.forEach(async (k) => {
    k.img = await loadImg(avatarSVG(k.p)); k.imgUp = await loadImg(avatarSVG(k.p, { pose: 'up' }));
    k.face = await loadImg(avatarSVG(k.p, { crop: true }));
  });

  if (!bubbles) preloadClip('balloons');
  preloadAnimals();
  let items = [], fallers = [], floaters = [], scraps = [], rings = [], trail = [], freed = [], pending = [];
  let pops = 0, t = 0, raf = 0, last = performance.now(), alive = true;
  let combo = 0, lastPopT = -9, tieId = 0, sinceSpecial = 0, forceColour = null, forceUntil = 0, mood = 0;
  let find = null;                                  // { value, html, got, t }
  const chest = { pops: 0, open: 0, wig: 0 };
  const sea = bubbles ? createSea() : null;
  const sky = bubbles ? null : createSky();
  const later = (delay, fn) => pending.push({ at: t + delay, fn });
  const baseR = () => Math.max(34, Math.min(95, unit * 0.085)) * SIZE[cfg.size] * (1 - lv() * 0.05);
  const baseVy = () => -(H * 0.075 + Math.random() * H * 0.05) * SPEED[cfg.speed] * (1 + lv() * 0.12) * (bubbles ? 0.8 : 1);

  // ---------- what each one carries
  function decorate(b) {
    b.colour = forceColour || pick(bubbles && mode !== 'colours' ? [{ n: '', c: '' }] : COLOURS);
    b.letter = String.fromCharCode(65 + rnd(26));
    b.num = 1 + rnd(Math.min(getSettings().countMax || 10, 20));
    b.animal = pick(ANIMALS);
    if (find && b.type === 'normal' && Math.random() < 0.45) setValue(b, find.value);
  }
  const valueOf = (b) => (mode === 'colours' ? b.colour.n : mode === 'letters' ? b.letter : mode === 'numbers' ? String(b.num) : mode === 'animals' ? b.animal[1] : '');
  function setValue(b, v) {
    if (mode === 'colours') b.colour = COLOURS.find((x) => x.n === v) || b.colour;
    else if (mode === 'letters') b.letter = v; else if (mode === 'numbers') b.num = +v;
    else if (mode === 'animals') b.animal = ANIMALS.find((a) => a[1] === v) || b.animal;
  }
  const matches = (b) => find && (b.type === 'normal' || (mode === 'colours' && !bubbles)) && valueOf(b) === find.value;

  function make(o = {}) {
    const r = (o.r || baseR() * (0.85 + Math.random() * 0.3));
    const b = { x: r + Math.random() * Math.max(1, W - 2 * r), y: H + r * 1.6, r, type: 'normal', shape: 'round', hp: 1, sq: 0, vx: 0, vy: baseVy(), ph: Math.random() * 7, kid: rnd(kids.length || 1), ...o };
    if (!o.shape && !bubbles && b.type === 'normal') { const k = Math.random(); b.shape = k < 0.14 ? 'heart' : k < 0.26 ? 'long' : k < 0.36 ? 'bear' : 'round'; }
    decorate(b);
    if (o.colour) b.colour = o.colour;
    b.farm = pick(FARM); b.cre = pick(CREATURES); b.toy = pick(TOYS);
    items.push(b);
    return b;
  }
  function spawn(initial = false) {
    const roll = Math.random();
    sinceSpecial++;
    let b;
    // a special one every so often (never two in a row)
    if (!initial && cfg.surprises && sinceSpecial > 5 && roll < 0.2) {
      sinceSpecial = 0;
      const kind = pick(bubbles ? ['giant', 'star', 'giant', 'bunch'] : ['giant', 'bunch', 'star', 'gift', 'gift']);
      if (kind === 'giant') b = make({ type: 'giant', r: baseR() * 1.9, hp: 3, vy: baseVy() * 0.6, shape: 'round' });
      else if (kind === 'star') b = make({ type: 'star', r: baseR() * 1.15, shape: bubbles ? 'round' : 'star', colour: bubbles ? null : pick(COLOURS.filter((x) => x.n !== 'white')) });
      else if (kind === 'gift') b = make({ type: 'gift', shape: 'round' });
      else {
        const tie = ++tieId, r = baseR() * 0.85, x = r * 2.2 + Math.random() * Math.max(1, W - r * 4.4), vy = baseVy();
        [[-0.95, 0.25], [0, -0.55], [0.95, 0.25]].forEach(([dx, dy]) => make({ tie, r, x: x + dx * r, y: H + r * 2 + dy * r, vy, shape: 'round' }));
      }
      return;
    }
    let type = 'normal';
    if (cfg.surprises && roll < 0.13) type = bubbles ? 'fish' : 'sheep';
    else if (cfg.faces && roll < 0.17 && kids.length) type = 'face';
    b = make({ type, ...(type === 'normal' ? {} : { shape: 'round' }) });
    if (initial) b.y = H * (0.3 + Math.random() * 0.8);
  }
  for (let i = 0; i < amount(); i++) spawn(true);

  function label(b) {
    if (b.type !== 'normal') return '';
    if (mode === 'letters') return b.letter;
    if (mode === 'numbers') return String(b.num);
    if (mode === 'animals') return b.animal[0];
    return '';
  }

  // ---------- popping
  function popFx(b) {
    const col = b.colour?.c || '#9be7ff';
    if (bubbles) {
      rings.push({ x: b.x, y: b.y, r: b.r, life: 0.45 });
      burst(b.x, b.y, { n: 10 + (b.r > 80 ? 14 : 0), colors: ['#bfefff', '#ffffff', '#d5c7ff'], speed: 240, shape: 'dot' });
    } else {
      rings.push({ x: b.x, y: b.y, r: b.r * 0.9, life: 0.3, col });
      burst(b.x, b.y, { n: 10, colors: [col, '#fff'], speed: 300 });
      // rubber scraps that flutter down
      const n = b.r > 80 ? 12 : 6;
      for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 120 + Math.random() * 220; scraps.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 10, s: b.r * (0.16 + Math.random() * 0.14), col, life: 1.6 + Math.random() * 0.8, ph: Math.random() * 7 }); }
    }
  }

  // a tap or swipe landed on b
  function hit(b, x, y) {
    if (b.hp > 1) {
      b.hp--; b.sq = 1; sfx.boing(); buzz(10);
      burst(x, y, { n: 8, colors: bubbles ? ['#bfefff', '#fff'] : [b.colour.c, '#fff'], speed: 180, shape: 'dot' });
      return;
    }
    pop(b);
  }

  function pop(b, quiet = false) {
    const idx = items.indexOf(b); if (idx < 0) return;
    items.splice(idx, 1);
    pops++; chest.pops++;
    // quick runs climb the scale, so fast popping plays a little tune
    combo = t - lastPopT < 0.7 ? combo + 1 : 0; lastPopT = t;
    sfx.pop(combo); buzz(15);
    popFx(b);
    kids.forEach((k) => { k.vy = -(260 + Math.random() * 120); k.upT = 0.7; });
    let words = '', show = '';
    if (b.type === 'fish') freeCreature(b);
    if (b.type === 'sheep') fallers.push({ kind: 'animal', x: b.x, y: b.y + b.r * 2, state: 'fall', t: 0, flip: b.x > W / 2, farm: b.farm });
    if (b.type === 'gift') fallers.push({ kind: 'gift', x: b.x, y: b.y + b.r * 2, state: 'fall', t: 0, toy: b.toy });
    if (b.type === 'face') { const k = kids[b.kid]; if (k) { k.vy = -520; k.upT = 1.2; sfx.giggle(); } words = k?.p.name ? k.p.name + '!' : ''; }
    if (b.type === 'giant') {
      confettiRain(50); sfx.sparkle(); buzz(40);
      if (bubbles) for (let i = 0; i < 5; i++) make({ r: b.r * 0.34, x: b.x + (i - 2) * b.r * 0.4, y: b.y + (Math.random() - 0.5) * b.r, vx: (i - 2) * 60, bonus: true });
      else for (let i = 0; i < 4; i++) later(i * 0.12, () => burst(b.x + (Math.random() - 0.5) * b.r * 2, b.y + (Math.random() - 0.5) * b.r * 2, { n: 14, shape: 'star' }));
    }
    if (b.type === 'star') {
      // gold star balloon: every balloon of its colour goes too. Rainbow bubble: every bubble near it.
      sfx.sparkle(); buzz(30);
      const same = items.filter((o) => (bubbles ? Math.hypot(o.x - b.x, o.y - b.y) < unit * 0.55 : o.colour.n === b.colour.n) && o.hp === 1);
      same.sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y)).forEach((o, i) => later(0.1 + i * 0.09, () => pop(o, true)));
      rings.push({ x: b.x, y: b.y, r: unit * 0.1, life: 0.7, grow: unit * 0.9, col: '#ffd23f' });
    }
    if (b.tie) items.filter((o) => o.tie === b.tie).forEach((o, i) => later(0.13 * (i + 1), () => pop(o, true)));
    if (mode === 'count') { words = String(pops); show = String(pops); }
    else if (mode === 'colours') { words = b.colour.n; show = b.colour.n; }
    else if (b.type === 'normal' && mode === 'animals') {
      const snd = SOUND_FOR_NAME[b.animal[1]];
      // real animal recording when we have one, then the voice says its name
      if (!quiet && snd && animalSound(snd)) { words = ''; later(0.9, () => say(`${b.animal[1]}! ${b.animal[2]}`)); } else words = `${b.animal[1]}! ${b.animal[2]}`;
      show = b.animal[0];
    }
    else if (b.type === 'normal' && mode === 'letters') { words = b.letter + '!'; show = b.letter; }
    else if (b.type === 'normal' && mode === 'numbers') { words = String(b.num); show = String(b.num); }
    if (show) floaters.push({ x: b.x, y: b.y, text: show, life: 1.4, color: mode === 'colours' ? b.colour.c : '#fff' });
    // find-it round: the right ones get a star and count towards finishing it
    if (matches(b)) {
      find.got++; sfx.ding(); burst(b.x, b.y, { n: 18, shape: 'star', colors: ['#ffd23f', '#fff'] });
      floaters.push({ x: b.x, y: b.y - b.r, text: '⭐', life: 1.2, color: '#fff' });
      if (find.got >= 3) { sfx.sparkle(); confettiRain(40); later(0.5, () => say(pick(['Well done', 'Yay', 'Wow', 'Good job']))); endFind(); }
    }
    if (!quiet) {
      // now and then, play the family "balloons" voice note instead of the spoken word
      const clipped = !bubbles && pops > 2 && Math.random() < 0.12 && playClip('balloons', 9000);
      if (!clipped) {
        // Bubbles stays quiet in plain popping mode, but says the colour / animal / letter / number in the others
        if (bubbles && mode === 'count') { if (Math.random() < 0.2) say(Math.random() < 0.5 ? 'Bubble!' : 'Pop!'); }
        else if (mode !== 'count') say(words);
        else if (cfg.countAloud) say(canSpeak(words) ? words : Math.random() < 0.3 ? 'Pop!' : '');
      }
    }
    if (pops % 30 === 0) later(0.4, moment);
    else if (pops % 10 === 0) later(0.25, () => { confettiRain(60); sfx.ding(); });
    if (pops % 10 === 0) win(theme, badge);
    if (mode !== 'count' && !find && pops % 14 === 7) later(0.8, startFind);
    if (bubbles && chest.pops >= 25 && chest.open <= 0) openChest();
  }

  function freeCreature(b) {
    sfx.chime(5);
    if (b.cre === 'fish') sea.addFish(b.x / W, b.y / H, { depth: 1.1, boost: 0.8 });
    else { freed.push({ e: b.cre, x: b.x, y: b.y, dir: Math.random() < 0.5 ? -1 : 1, v: 30 + Math.random() * 40, ph: Math.random() * 7, s: b.r * 0.9, home: H * (0.25 + Math.random() * 0.5) }); if (freed.length > 9) freed.shift(); }
  }
  function openChest() {
    chest.pops = 0; chest.open = 3.2; sfx.creak(); buzz(40);
    const x = W * 0.78, y = H * 0.9;
    for (let i = 0; i < 6; i++) later(0.3 + i * 0.16, () => { sfx.coin(i); floaters.push({ x: x + (Math.random() - 0.5) * unit * 0.2, y: y - unit * 0.06, text: pick(GEMS), life: 1.8, color: '#fff', rise: 110 }); burst(x, y - unit * 0.05, { n: 10, colors: ['#ffd23f', '#fff3b0', '#f5b301'], shape: 'star', speed: 260 }); });
    later(0.3, () => say(pick(['Wow', 'Yay'])));
  }

  // ---------- little moments (every 30 pops)
  function moment() {
    sfx.yay();
    const kind = pick(bubbles ? ['parade', 'rain', 'rain'] : ['parade', 'rain', 'onecolour']);
    if (kind === 'parade') {
      const n = W > H ? 9 : 6, r = Math.min(baseR(), (W / n) * 0.42), vy = -H * 0.13;
      for (let i = 0; i < n; i++) later(i * 0.18, () => make({ bonus: true, r, x: ((i + 0.5) / n) * W, vy, shape: i % 2 ? 'heart' : 'round', colour: bubbles ? null : COLOURS[i % 7] }));
    } else if (kind === 'rain') {
      for (let i = 0; i < 22; i++) later(i * 0.14, () => make({ bonus: true, r: baseR() * 0.48, vy: baseVy() * 1.5, shape: 'round' }));
    } else {
      forceColour = pick(COLOURS.filter((x) => x.n !== 'white')); forceUntil = t + 9;
      items.forEach((b) => { if (b.type !== 'star') b.colour = forceColour; });
      floaters.push({ x: W / 2, y: H * 0.4, text: forceColour.n, life: 2, color: forceColour.c });
      const name = forceColour.n; later(1.2, () => say(name));
    }
  }

  // ---------- "find it" round
  function startFind() {
    if (find || mode === 'count' || !alive) return;
    const pool = items.filter((b) => b.type === 'normal');
    if (!pool.length) return;
    const value = valueOf(pick(pool)); if (!value) return;
    const col = COLOURS.find((x) => x.n === value);
    const html = mode === 'colours' ? `<i style="display:inline-block;width:1em;height:1em;border-radius:50%;background:${col?.c};border:3px solid #0003;vertical-align:-0.12em"></i>` : mode === 'animals' ? ANIMALS.find((a) => a[1] === value)?.[0] || value : value;
    find = { value, html, got: 0, t: 0 };
    pool.slice(0, 2).forEach((b) => setValue(b, value));
    askPill(root, html);
    const line = mode === 'colours' ? `Pop the ${value} ones!` : mode === 'animals' ? `Find the ${value}!` : `Find ${value}!`;
    say(canSpeak(line) ? line : value);
  }
  function endFind() { if (find) { find = null; askPill(root, ''); } }

  // ---------- input: tap, swipe, near-miss nudge
  const inside = (b, x, y, k = 1) => { const dx = (x - b.x) / (b.r * 1.3 * k), dy = (y - b.y) / (b.r * (bubbles ? 1.3 : 1.5) * k); return dx * dx + dy * dy <= 1; };
  let down = null, swipe = 0;
  const xy = (e) => { const rect = cv.getBoundingClientRect(); return [e.clientX - rect.left, e.clientY - rect.top]; };
  const onDown = (e) => {
    e.preventDefault();
    const [x, y] = xy(e);
    down = { id: e.pointerId, x, y }; swipe++;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    for (let i = items.length - 1; i >= 0; i--) { const b = items[i]; if (inside(b, x, y)) { b.swipe = swipe; return hit(b, x, y); } }
    // just missed? give the nearest one a friendly nudge
    for (const b of items) if (inside(b, x, y, 1.6)) { b.vx += Math.sign(b.x - x || 1) * 160; b.vy -= 30; b.sq = 0.6; sfx.tap(); buzz(5); return; }
    if (bubbles && Math.abs(x - W * 0.78) < unit * 0.1 && y > H * 0.82) { chest.wig = 0.5; sfx.knock(); return; }
    const sk = sky && sky.tap(x, y);
    if (sk) { if (sk === 'balloon') sfx.whoosh(); else sfx.chime(rnd(8)); burst(x, y, { n: 8, speed: 140, shape: 'star' }); return; }
    if (sea && sea.tap(x, y, W, H)) { sfx.chime(rnd(8)); burst(x, y, { n: 8, colors: ['#bfefff', '#fff'], speed: 140, shape: 'dot' }); return; }
    for (const f of freed) if (Math.hypot(x - f.x, y - f.y) < f.s) { f.v = 220; sfx.chime(rnd(8)); return; }
    for (const s of fallers) if (s.kind === 'animal' && Math.abs(x - s.x) < 70 && Math.abs(y - (s.y - 40)) < 70) { animalSound(s.farm.id); s.bleat = 0.8; return; }
    for (const k of kids) if (k.box && x > k.box[0] && x < k.box[0] + k.box[2] && y > k.box[1] && y < k.box[1] + k.box[3]) {
      k.vy = -480; k.upT = 1;
      // tapping her (the first player) plays the family "balloons" voice note
      if (!(k.i === 0 && playClip('balloons', 1200))) { sfx.giggle(); if (k.p.name) say(k.p.name + '!'); }
      return;
    }
    burst(x, y, { n: 8, speed: 150, shape: 'star' }); sfx.tap();
  };
  const onMove = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const [x, y] = xy(e), d = Math.hypot(x - down.x, y - down.y), n = Math.max(1, Math.ceil(d / 14));
    for (let k = 1; k <= n; k++) {
      const px = down.x + ((x - down.x) * k) / n, py = down.y + ((y - down.y) * k) / n;
      trail.push({ x: px, y: py, life: 0.35 });
      for (let i = items.length - 1; i >= 0; i--) { const b = items[i]; if (b.swipe !== swipe && inside(b, px, py, 0.9)) { b.swipe = swipe; hit(b, px, py); } }
    }
    if (sea) sea.lure(x / W, y / H);
    down.x = x; down.y = y;
  };
  const onUp = (e) => { if (down && e.pointerId === down.id) down = null; };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);

  // ---------- drawing
  function drawBalloonShape(b, col) {
    const [path, knot] = shapePath(b.shape, b.r), r = b.r;
    // string
    c.strokeStyle = 'rgba(70,70,70,.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, knot + r * 0.15);
    for (let i = 1; i <= 4; i++) c.quadraticCurveTo(Math.sin(t * 3 + b.ph + i) * r * 0.25, knot + r * (0.15 + i * 0.3 - 0.15), 0, knot + r * (0.15 + i * 0.3));
    c.stroke();
    c.fillStyle = col; c.fill(path);
    c.beginPath(); c.moveTo(0, knot - r * 0.04); c.lineTo(-r * 0.13, knot + r * 0.16); c.lineTo(r * 0.13, knot + r * 0.16); c.fill();
    c.save(); c.clip(path);
    if (b.type === 'giant') { c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(Math.cos(i * 2.4) * r * 0.6, Math.sin(i * 2.4) * r * 0.7 + (i % 3 - 1) * r * 0.2, r * 0.13, 0, 7); c.fill(); } }
    if (b.type === 'star') { c.fillStyle = 'rgba(255,255,255,.5)'; c.save(); c.rotate(0.5); c.fillRect(-r * 2 + ((t * 0.8 + b.ph) % 2) * r * 2, -r * 2, r * 0.3, r * 4); c.restore(); }
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.5);
    g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.2)');
    c.fillStyle = g; c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.ellipse(-r * (b.shape === 'long' ? 0.24 : 0.42), -r * (b.shape === 'star' ? 0.2 : 0.45), r * 0.11, r * 0.24, -0.5, 0, 7); c.fill();
    if (b.shape === 'bear') { c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(-r * 0.32, -r * 0.5, r * 0.07, 0, 7); c.arc(r * 0.32, -r * 0.5, r * 0.07, 0, 7); c.fill(); }
    if (b.type === 'giant') for (let i = 0; i < 3 - b.hp; i++) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * (0.5 + i * 0.22), -0.4 + i, 0.5 + i); c.stroke(); }
  }

  function drawItem(b) {
    const col = b.colour.c;
    const wob = b.sq > 0 ? Math.sin(b.sq * 14) * b.sq * 0.22 : 0;
    c.save(); c.translate(b.x, b.y);
    if (b.shape === 'long') c.rotate(Math.sin(t * 3 + b.ph) * 0.14);
    c.scale(1 + wob, 1 - wob);
    if (bubbles) {
      drawBubble(c, 0, 0, b.r, mode === 'colours' && b.type !== 'star' ? col : '', t + b.ph);
      if (b.type === 'star') { c.lineWidth = b.r * 0.1; RAINBOW.forEach((rc, i) => { c.strokeStyle = rc; c.globalAlpha = 0.75; c.beginPath(); c.arc(0, 0, b.r * (0.92 - i * 0.09), t * 2 + i, t * 2 + i + 2.2); c.stroke(); }); c.globalAlpha = 1; }
      if (b.type === 'giant') for (let i = 0; i < 3 - b.hp; i++) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, b.r * (0.5 + i * 0.2), i, i + 1); c.stroke(); }
    } else drawBalloonShape(b, b.type === 'star' ? '#f5b301' : col);
    c.restore();
    if (b.type === 'star' && !bubbles) { c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r * 0.34, 0, 7); c.fill(); c.stroke(); }
    if (b.type === 'sheep') { if (b.farm.id === 'sheep') drawSheep(c, b.x + 4, b.y + b.r * 2.6, b.r * 1.1, { t }); else drawEmoji(c, b.farm.e, b.x + 4, b.y + b.r * 2.6, b.r * 1.1, false, false); }
    if (b.type === 'gift') drawEmoji(c, '🎁', b.x, b.y + b.r * 2.7, b.r * 1.1, false, false);
    if (b.type === 'fish') { if (b.cre === 'fish') drawFish(c, b.x, b.y, b.r * 0.45, ['#ff8c42', '#fff'], -1, t); else drawEmoji(c, b.cre, b.x, b.y + b.r * 0.5, b.r * 1.05, false, false); }
    if (b.type === 'face' && kids[b.kid]?.face) {
      const k = kids[b.kid], s = b.r * 1.5;
      c.save(); c.beginPath(); c.arc(b.x, b.y, b.r * 0.86, 0, 7); c.clip();
      c.drawImage(k.face, b.x - s / 2, b.y - s / 2, s, s); c.restore();
    }
    const lab = label(b);
    if (lab) {
      c.font = `bold ${b.r * (b.shape === 'long' ? 0.8 : 1.05)}px "Baloo 2", system-ui, sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (mode !== 'animals') { c.lineWidth = b.r * 0.12; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(lab, b.x, b.y + b.r * 0.05); c.fillStyle = '#fff'; }
      c.fillText(lab, b.x, b.y + b.r * 0.05);
    }
    // find-it round: after a few seconds the right ones glow as a hint
    if (find && find.t > 5 && matches(b)) { c.strokeStyle = `rgba(255,220,60,${0.5 + 0.4 * Math.sin(t * 6)})`; c.lineWidth = 6; c.beginPath(); c.arc(b.x, b.y, b.r * (1.3 + 0.06 * Math.sin(t * 6)), 0, 7); c.stroke(); }
  }

  function drawChest(dt) {
    const x = W * 0.78, y = H * 0.92, s = unit * 0.075, open = Math.min(1, chest.open > 0 ? Math.min(chest.open, 3.2 - chest.open) * 4 : 0);
    chest.wig = Math.max(0, chest.wig - dt);
    c.save(); c.translate(x, y); c.rotate(Math.sin(chest.wig * 30) * chest.wig * 0.2);
    c.strokeStyle = '#4a2c0f'; c.lineWidth = 3; c.lineJoin = 'round';
    if (open > 0) { const g = c.createRadialGradient(0, -s * 0.7, 2, 0, -s * 0.7, s * 2.2); g.addColorStop(0, 'rgba(255,230,120,.9)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(-s * 2.5, -s * 3, s * 5, s * 3); }
    c.fillStyle = '#9a5b1e'; c.beginPath(); c.rect(-s, -s * 0.7, s * 2, s * 0.7); c.fill(); c.stroke();
    c.fillStyle = '#f5b301'; c.fillRect(-s, -s * 0.42, s * 2, s * 0.12); c.fillRect(-s * 0.12, -s * 0.7, s * 0.24, s * 0.7);
    c.save(); c.translate(-s, -s * 0.7); c.rotate(-open * 1.1);
    c.fillStyle = '#b06c26'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.3); c.quadraticCurveTo(s, -s * 0.9, s * 2, -s * 0.3); c.lineTo(s * 2, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f5b301'; c.fillRect(s * 0.88, -s * 0.62, s * 0.24, s * 0.62);
    c.restore();
    // glints get busier as it fills up
    const full = chest.pops / 25;
    for (let i = 0; i < Math.floor(full * 5); i++) { const a = t * 2 + i * 1.7; c.fillStyle = `rgba(255,240,150,${0.5 + 0.5 * Math.sin(a * 2)})`; c.beginPath(); c.arc(Math.cos(a) * s * 1.2, -s * 0.5 + Math.sin(a * 1.3) * s * 0.6, 3, 0, 7); c.fill(); }
    c.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    // scheduled things
    for (const p of [...pending]) if (t >= p.at) { pending.splice(pending.indexOf(p), 1); p.fn(); }
    if (forceColour && t > forceUntil) { forceColour = null; items.forEach((b) => { if (b.type !== 'star') decorate(b); }); }
    if (find) { find.t += dt; if (find.t > 28) endFind(); }
    // the sky slowly moves from day to sunset to night as they pop (a full day every 120 pops)
    mood += (pops / 40 - mood) * Math.min(1, dt * 0.4);
    if (bubbles) sea.draw(c, W, H, t, dt); else sky.draw(c, W, H, t, dt, mood);
    if (bubbles) {
      chest.open = Math.max(0, chest.open - dt);
      drawChest(dt);
      for (const f of freed) {
        f.v += (40 - f.v) * dt; f.x += f.dir * f.v * dt; f.y += (f.home - f.y) * dt * 0.5 + Math.sin(t * 1.4 + f.ph) * 0.3;
        if (f.x < -f.s) f.dir = 1; if (f.x > W + f.s) f.dir = -1;
        c.globalAlpha = 0.95; drawEmoji(c, f.e, f.x, f.y + f.s * 0.4, f.s * 0.8, f.dir > 0, false); c.globalAlpha = 1;
      }
    }
    // keep the screen stocked
    let guard = 0;
    while (items.filter((b) => !b.bonus).length < amount() && guard++ < 30) spawn();
    // gentle bumping so they don't overlap
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = (a.r + b.r) * (a.tie && a.tie === b.tie ? 0.8 : 0.98);
      if (d < min) { const push = (min - d) * 3 * dt, ux = dx / d, uy = dy / d; a.x -= ux * push; b.x += ux * push; a.y -= uy * push * 0.4; b.y += uy * push * 0.4; }
    }
    for (const b of [...items]) {
      b.sq = Math.max(0, b.sq - dt * 1.6);
      b.vx *= 1 - Math.min(1, dt * 2.2);
      b.y += b.vy * dt; b.x += (b.vx + Math.sin(t * (bubbles ? 1.6 : 1) + b.ph) * (bubbles ? 30 : 12)) * dt;
      if (b.x < b.r * 0.8) { b.x = b.r * 0.8; b.vx = Math.abs(b.vx); } if (b.x > W - b.r * 0.8) { b.x = W - b.r * 0.8; b.vx = -Math.abs(b.vx); }
      if (b.y < -b.r * 3.2) { items.splice(items.indexOf(b), 1); continue; }
      drawItem(b);
    }
    // pop rings
    for (const r of [...rings]) {
      r.life -= dt; if (r.life <= 0) { rings.splice(rings.indexOf(r), 1); continue; }
      r.r += (r.grow || r.r * 2.2) * dt;
      c.strokeStyle = r.col || '#fff'; c.globalAlpha = Math.min(1, r.life * 3); c.lineWidth = 4; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.stroke(); c.globalAlpha = 1;
    }
    // rubber scraps flutter down
    for (const s of [...scraps]) {
      s.life -= dt; if (s.life <= 0 || s.y > H + 20) { scraps.splice(scraps.indexOf(s), 1); continue; }
      s.vx *= 1 - dt * 2.5; s.vy += (160 - s.vy) * dt * 2.5; s.x += (s.vx + Math.sin(t * 5 + s.ph) * 40) * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      c.save(); c.translate(s.x, s.y); c.rotate(s.rot); c.globalAlpha = Math.min(1, s.life * 2); c.fillStyle = s.col;
      c.beginPath(); c.moveTo(-s.s, 0); c.quadraticCurveTo(0, -s.s * 0.9, s.s, 0); c.quadraticCurveTo(0, s.s * 0.35, -s.s, 0); c.fill(); c.restore();
    }
    // things floating down: farm animals and presents
    const ground = H * 0.93;
    for (const s of [...fallers]) {
      s.t += dt;
      if (s.state === 'fall') {
        s.y += 70 * dt; s.x += Math.sin(s.t * 3) * 30 * dt;
        if (s.y >= ground) {
          s.y = ground; s.t = 0;
          if (s.kind === 'animal') { s.state = 'walk'; animalSound(s.farm.id); s.bleat = 0.8; }
          else { s.state = 'open'; sfx.sparkle(); burst(s.x, s.y - 30, { n: 22, shape: 'star' }); kids.forEach((k) => { k.vy = -520; k.upT = 1.4; }); }
        }
      } else if (s.kind === 'animal') { s.x += (s.flip ? 1 : -1) * 90 * dt; if (s.x < -100 || s.x > W + 100) { fallers.splice(fallers.indexOf(s), 1); continue; } }
      else if (s.t > 2.6) { fallers.splice(fallers.indexOf(s), 1); continue; }
      s.bleat = Math.max(0, (s.bleat || 0) - dt);
      const hop = s.state === 'walk' ? Math.abs(Math.sin(s.t * 8)) * 6 : 0;
      c.save(); if (s.state === 'fall') { c.translate(s.x, s.y); c.rotate(Math.sin(s.t * 3) * 0.15); c.translate(-s.x, -s.y); }
      if (s.kind === 'gift') {
        if (s.state === 'open') { const k = Math.min(1, s.t * 3); c.globalAlpha = Math.max(0, Math.min(1, (2.6 - s.t) * 2)); drawEmoji(c, s.toy, s.x, s.y - k * unit * 0.1 - Math.abs(Math.sin(s.t * 6)) * 8, unit * 0.14 * (0.5 + k * 0.5), false, false); c.globalAlpha = 1; }
        else drawEmoji(c, '🎁', s.x, s.y, unit * 0.11, false, false);
      } else if (s.farm.id === 'sheep') drawSheep(c, s.x, s.y - hop, unit * 0.13, { flip: s.flip, t: s.t, walking: s.state === 'walk', bleat: s.bleat > 0 });
      else drawEmoji(c, s.farm.e, s.x, s.y - hop, unit * 0.13, s.flip, s.bleat > 0);
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
    // finger trail
    for (const p of [...trail]) {
      p.life -= dt; if (p.life <= 0) { trail.splice(trail.indexOf(p), 1); continue; }
      c.fillStyle = bubbles ? `rgba(255,255,255,${p.life * 1.6})` : `hsla(${(p.x + p.y) % 360},90%,70%,${p.life * 2})`;
      c.beginPath(); c.arc(p.x, p.y, 3 + p.life * 22, 0, 7); c.fill();
    }
    // floating words
    for (const f of [...floaters]) {
      f.life -= dt; f.y -= (f.rise || 60) * dt;
      if (f.life <= 0) { floaters.splice(floaters.indexOf(f), 1); continue; }
      c.save(); c.globalAlpha = Math.min(1, f.life * 1.5);
      c.font = `bold ${unit * 0.09}px "Baloo 2", "Noto Color Emoji", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 8; c.strokeStyle = '#2b2118'; if (!/\p{Extended_Pictographic}/u.test(f.text)) c.strokeText(f.text, f.x, f.y);
      c.fillStyle = f.color === '#f8fafc' ? '#fff' : f.color; c.fillText(f.text, f.x, f.y);
      c.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);

  return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); };
}
