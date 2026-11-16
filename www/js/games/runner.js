// Run & Jump: the selected child runs through changing places with their Pie Pet trotting behind.
// Tap to hop, hold to jump higher (double-jump allowed). Low stars can be grabbed while running; high ones need a jump.
// What's on the path matches the place (farm hay bales and cows, seaside sandcastles and crabs, snowmen and penguins...).
// Helpers: bouncy mushrooms (big jump into an arc of stars), a balloon bunch (float through the sky for a bit) and a
// rainbow star (a short super-run where nothing can trip you). Bumping into something makes the child topple over,
// see stars, and get back up - it never ends the game. A balloon arch marks each new place.
import { sfx, buzz, playClip, preloadClip } from '../sound.js';
import { currentPlayer, getSettings } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { loadImg } from '../shapes.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { homeBtn, pick, rnd } from '../ui.js';
import { burst, confettiRain } from '../fx.js';
import { drawBalloon, drawSheep, drawStar, drawDino } from '../draw.js';
import { COLOURS } from '../data.js';
import { createMeadow } from '../scenery.js';
import { animalSound, preloadAnimals } from '../animals.js';
import { say } from '../speech.js';
import { petSVG, PETS } from './pet-art.js';

const SPEED = { slow: 0.7, normal: 1, fast: 1.35 };
const RAINBOW = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
// what turns up in each place, its sign and what the voice says on arriving
const PLACES = {
  meadow: { obs: ['sheep', 'sheep', 'bush', 'log', 'puddle', 'elephant'], e: '🌼', say: 'The meadow!' },
  farm: { obs: ['hay', 'cow', 'sheep', 'puddle', 'hay'], e: '🚜', say: 'The farm!' },
  beach: { obs: ['castle', 'crab', 'ball', 'ball', 'castle'], e: '🏖️', say: 'The seaside!' },
  snow: { obs: ['snowman', 'penguin', 'snowman', 'log'], e: '⛄', say: 'Snow!' },
  sunset: { obs: ['dino', 'dino', 'bush', 'log', 'elephant'], e: '🦕', say: 'Dinosaurs!' },
};
const SIZES = { puddle: [100, 10], log: [80, 40], bush: [80, 60], sheep: [70, 70], elephant: [90, 85], dino: [70, 70], hay: [84, 62], cow: [90, 72],
  castle: [86, 62], crab: [62, 34], ball: [56, 56], snowman: [62, 92], penguin: [54, 66], spring: [70, 44] };
const WALKERS = { sheep: 0.15, elephant: 0.15, dino: 0.15, cow: 0.12, penguin: 0.1, crab: 0.2 };
const SOFT = { puddle: 1, ball: 1, spring: 1 };    // these never trip you up
const EMOJI = { elephant: ['🐘', 100], cow: ['🐄', 96], penguin: ['🐧', 74], crab: ['🦀', 60] };

export function mount(el) {
  el.innerHTML = `<div class="game runner"><canvas></canvas>${homeBtn()}<div class="score"></div></div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d'), scoreEl = root.querySelector('.score');
  const badge = levelBadge(root, 'runner', () => {});
  const lv = () => getLevel('runner') - 1;   // each level: a bit faster, things on the path more often, more high stars
  const cfg = { speed: 'normal', ...(getSettings().runner || {}) };
  let W, H, G, S;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    G = H * 0.86; S = H / 700;
  };
  resize(); addEventListener('resize', resize);

  // --- the runner and their pet
  const me = currentPlayer();
  const hero = { x: 0.24, y: 0, vy: 0, onGround: true, holdT: 0, jumps: 0, landT: 0, state: 'run', fallT: 0, img: {} };
  for (const pose of ['down', 'up', 'run1', 'run2']) loadImg(avatarSVG(me, { pose })).then((i) => (hero.img[pose] = i));
  const size = () => { const ah = Math.min(H * 0.2, 150), aw = (ah * 200) / 240; return { ah, aw }; };
  const box = () => { const { ah, aw } = size(); return { ah, aw, x: hero.x * W, y: G - ah + hero.y }; };
  let saved = null; try { saved = JSON.parse(localStorage.getItem('pg.pet.' + (me?.id || 'p1')) || 'null'); } catch {}
  const petType = PETS[saved?.type] ? saved.type : 'puppy';
  const pet = { y: 0, img: {}, sound: PETS[petType].sound };
  for (const mood of ['happy', 'excited']) loadImg(petSVG(petType, Math.min(2, saved?.stage ?? 1), mood)).then((i) => (pet.img[mood] = i));

  preloadClip('standing'); preloadAnimals();
  const meadow = createMeadow({ zones: true });
  let t = 0, dt = 0.016, dist = 0, speedNow = 0, nextObs = 2.2, nextGift = 0.8, nextPower = 9, nextSky = 0, got = 0, holding = false, raf = 0, last = performance.now();
  let rush = 0, float = 0, floatBoost = 0, obsCount = 0, lastZone = null, frames = 0, banner = null, hints = lv() === 0 ? 6 : 0, lastPower = 'bunch';
  const obs = [], gifts = [], dust = [];
  let dustT = 0;

  let lastJumpWord = 0;
  const gravity = () => 2600 * S;
  const cruise = () => W * 0.32 * SPEED[cfg.speed] * (1 + lv() * 0.08);
  function jump() {
    if (float > 0) { floatBoost = Math.min(H * 0.18, floatBoost + H * 0.09); sfx.whoosh(); return; }
    if (hero.state !== 'run' || hero.jumps >= 2) return;
    hero.vy = -Math.sqrt(2 * gravity() * H * (hero.jumps ? 0.15 : 0.19));
    hero.onGround = false; hero.jumps++; hero.holdT = 0;
    sfx.boing(); buzz(8);
    if (hero.jumps === 1 && Math.random() < 0.25 && performance.now() - lastJumpWord > 4000) { lastJumpWord = performance.now(); say('Jumping!'); }
  }
  const down = (e) => { e.preventDefault(); holding = true; jump(); };
  const up = () => { holding = false; };
  cv.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', up);

  function addStars(n) {
    const before = got; got += n;
    scoreEl.textContent = got;
    scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    if (Math.floor(got / 10) > Math.floor(before / 10)) { confettiRain(50); sfx.ding(); win('runner', badge); }
  }

  // --- things on the path
  function spawnObstacle() {
    obsCount++;
    const x = W + 90 * S;
    // every fourth thing is a bouncy mushroom with an arc of stars to fly through
    if (obsCount % 4 === 0) {
      obs.push({ type: 'spring', x, hit: false, t: 0, dy: 0, vy: 0 });
      const v0 = Math.sqrt(2 * gravity() * H * 0.42), T = (2 * v0) / gravity(), { ah } = size();
      for (let i = 1; i <= 5; i++) { const tt = (i / 6) * T; gifts.push({ type: 'star', big: i === 3, x: x + cruise() * tt, y: G - ah * 0.5 - (v0 * tt - 0.5 * gravity() * tt * tt), col: '#ffd23f', ph: i }); }
      return;
    }
    const place = PLACES[meadow.themeAt(dist + x)] || PLACES.meadow;
    obs.push({ type: pick(place.obs), x, hit: false, t: 0, dy: 0, vy: 0, color: pick(['#6fcf5b', '#ff9f43', '#7bb7ff', '#c78bff']) });
  }
  function spawnGifts() {
    const { ah } = size();
    const n = 3 + rnd(3), high = Math.random() < 0.4 + lv() * 0.1;
    // low: grab while running (chest height). high: only reachable with a jump.
    const baseY = high ? G - ah - H * (0.1 + Math.random() * 0.1) : G - ah * 0.55;
    for (let i = 0; i < n; i++) {
      const lift = high ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * H * 0.07 : 0;
      gifts.push({ type: high ? 'star' : Math.random() < 0.5 ? 'star' : 'balloon', big: high, x: W + 60 * S + i * 70 * S, y: baseY - lift, col: pick(COLOURS).c, ph: Math.random() * 6 });
    }
  }
  // a helper to grab at chest height: the balloon bunch (float) and the rainbow star (super-run) take turns
  function spawnPower() {
    lastPower = lastPower === 'bunch' ? 'rainbow' : 'bunch';
    gifts.push({ type: lastPower, big: true, x: W + 80 * S, y: G - size().ah * 0.6, col: '#fff', ph: 0 });
  }

  function fall() {
    hero.state = 'falling'; hero.fallT = 0; hero.vy = -320 * S; hero.onGround = false;
    sfx.boing(); buzz(40);
  }
  function noise(o) {
    if (o.type === 'sheep' || o.type === 'elephant' || o.type === 'cow') animalSound(o.type);
    else if (o.type === 'dino') sfx.roar();
    else if (o.type === 'snowman' || o.type === 'castle' || o.type === 'hay') sfx.poof();
    else sfx.pop(5);
  }

  function update() {
    frames++;
    rush = Math.max(0, rush - dt);
    // world speed eases to a stop while the child is down
    const target = hero.state === 'run' ? cruise() * (rush > 0 ? 1.45 : 1) : 0;
    speedNow += (target - speedNow) * Math.min(1, dt * (hero.state === 'run' ? 2 : 4));
    dist += speedNow * dt; t += dt;

    // hero physics
    if (float > 0) {
      // floating under the balloon bunch: drift up high and bob; taps lift a little more
      float -= dt; floatBoost = Math.max(0, floatBoost - H * 0.1 * dt);
      const want = -H * (0.34 + 0.06 * Math.sin(t * 1.8)) - floatBoost;
      hero.y += (want - hero.y) * Math.min(1, dt * 2.2); hero.vy = 0; hero.onGround = false;
      if (float <= 0) { hero.jumps = 1; sfx.pop(3); const b = box(); burst(b.x + b.aw / 2, b.y - 30 * S, { n: 18, colors: RAINBOW }); }
      nextSky -= dt;
      if (nextSky <= 0) { nextSky = 0.45; gifts.push({ type: 'star', big: Math.random() < 0.3, x: W + 40 * S, y: G - size().ah - H * (0.22 + Math.random() * 0.26), col: '#ffd23f', ph: Math.random() * 6 }); }
    } else {
      const g = holding && hero.vy < 0 && hero.holdT < 0.32 && hero.state === 'run' ? gravity() * 0.35 : gravity();
      hero.holdT += dt; hero.vy += g * dt; hero.y += hero.vy * dt;
    }
    if (hero.y >= 0) {
      if (!hero.onGround) {
        hero.landT = 0.18;
        const b = box();
        for (let i = 0; i < 7; i++) dust.push({ x: b.x + b.aw / 2 + (Math.random() - 0.5) * 50 * S, y: G, r: 6 * S, vx: (Math.random() - 0.5) * 120 * S, life: 0.5 });
      }
      hero.y = 0; hero.vy = 0; hero.onGround = true; hero.jumps = 0;
    }
    hero.landT = Math.max(0, hero.landT - dt);
    pet.y += (hero.y - pet.y) * Math.min(1, dt * 6);      // the pet copies every jump a moment later

    // fall over -> lie down seeing stars -> get back up
    if (hero.state !== 'run') {
      hero.fallT += dt;
      if (hero.state === 'falling' && hero.fallT > 0.35 && hero.onGround) { hero.state = 'down'; hero.fallT = 0; }
      else if (hero.state === 'down' && hero.fallT > 1.1) { hero.state = 'rising'; hero.fallT = 0; if (Math.random() < 0.5) playClip('standing', 3000); }
      else if (hero.state === 'rising' && hero.fallT > 0.4) { hero.state = 'run'; }
    }

    // dust while running (a rainbow trail during the super-run)
    dustT -= dt;
    if (hero.state === 'run' && dustT <= 0 && (hero.onGround || rush > 0)) {
      dustT = rush > 0 ? 0.03 : 0.1; const b = box();
      dust.push({ x: b.x + b.aw * 0.4, y: rush > 0 ? b.y + b.ah * (0.3 + Math.random() * 0.6) : G, r: (rush > 0 ? 7 : 4) * S, vx: -speedNow * 0.3, life: 0.45, col: rush > 0 ? RAINBOW[rnd(6)] : null });
    }
    for (const d of dust) { d.life -= dt; d.x += d.vx * dt - speedNow * dt * 0.5; d.r += 30 * S * dt; }
    while (dust.length && dust[0].life <= 0) dust.shift();

    const pace = speedNow / (W * 0.32);
    nextObs -= dt * pace; nextGift -= dt * pace; nextPower -= dt * pace;
    if (nextObs <= 0) { if (float <= 0) spawnObstacle(); nextObs = (2.4 + Math.random() * 2) * (1 - lv() * 0.1); }
    if (nextGift <= 0) { if (float <= 0) spawnGifts(); nextGift = 1.5 + Math.random() * 1.6; }
    if (nextPower <= 0) { if (float <= 0 && rush <= 0) spawnPower(); nextPower = 16 + Math.random() * 8; }
    for (const o of obs) {
      o.t += dt; o.bounceT = Math.max(0, (o.bounceT || 0) - dt); o.squash = Math.max(0, (o.squash || 0) - dt);
      const walk = !o.hit && WALKERS[o.type] ? WALKERS[o.type] : 0;
      o.x -= speedNow * (1 + walk) * dt;
      if (o.hit && o.type !== 'puddle' && o.type !== 'spring') { o.vy += gravity() * dt; o.dy += o.vy * dt; o.x += 260 * S * dt; }
    }
    const hb = box(), hcx = hb.x + hb.aw / 2, hcy = hb.y + hb.ah / 2;
    for (const gf of gifts) {
      gf.x -= speedNow * dt;
      // super-run: stars fly to you
      if (rush > 0 && (gf.type === 'star' || gf.type === 'balloon')) { const dx = hcx - gf.x, dy = hcy - gf.y, d = Math.hypot(dx, dy); if (d < 260 * S && d > 1) { gf.x += (dx / d) * 700 * S * dt; gf.y += (dy / d) * 700 * S * dt; } }
    }
    while (obs.length && obs[0].x < -200) { if (!SOFT[obs[0].type]) hints = Math.max(0, hints - 1); obs.shift(); }
    while (gifts.length && gifts[0].x < -100) gifts.shift();

    // arriving somewhere new: run through the balloon arch
    const zone = Math.floor((dist + hero.x * W) / meadow.zoneLen());
    if (frames < 4) lastZone = zone;
    else if (zone !== lastZone) {
      lastZone = zone;
      const place = PLACES[meadow.themeAt(dist + hero.x * W + 10)] || PLACES.meadow;
      banner = { e: place.e, life: 2.6 };
      confettiRain(70); sfx.yay(); buzz(40); setTimeout(() => say(place.say), 1500);
    }
    if (banner && (banner.life -= dt) <= 0) banner = null;

    // collisions
    const b = hb;
    const hx0 = b.x + b.aw * 0.28, hx1 = b.x + b.aw * 0.72, hy0 = b.y + b.ah * 0.05, hy1 = b.y + b.ah;
    if (hero.state === 'run' || hero.state === 'falling') {
      for (const gf of [...gifts]) {
        const r = (gf.big ? 30 : 24) * S;
        if (gf.x + r > hx0 && gf.x - r < hx1 && gf.y + r > hy0 && gf.y - r < hy1) {
          gifts.splice(gifts.indexOf(gf), 1);
          if (gf.type === 'bunch') {
            float = 6; floatBoost = 0; nextSky = 0.3; hero.state = 'run'; sfx.whoosh(); sfx.sparkle(); buzz(30);
            burst(gf.x, gf.y, { n: 24, colors: RAINBOW }); say('Wow'); if (pet.sound) animalSound(pet.sound);
            continue;
          }
          if (gf.type === 'rainbow') {
            rush = 6.5; sfx.sparkle(); sfx.whoosh(); buzz(30); burst(gf.x, gf.y, { n: 30, colors: RAINBOW, shape: 'star', speed: 380 }); say('Wow');
            addStars(2); continue;
          }
          sfx.coin(got); if (gf.big) sfx.sparkle(); buzz(10);
          burst(gf.x, gf.y, { n: gf.big ? 26 : 14, colors: gf.type === 'star' ? ['#ffd23f', '#fff', '#ffb300'] : [gf.col, '#fff'], speed: gf.big ? 340 : 240 });
          addStars(gf.big ? 2 : 1);
        }
      }
    }
    if (hero.state === 'run') {
      for (const o of obs) {
        if (o.hit) continue;
        const [w0, h0] = SIZES[o.type], w = w0 * S, h = h0 * S;
        if (o.x + w / 2 > hx0 && o.x - w / 2 < hx1 && G - h < hy1 - 6 * S) {
          if (o.type === 'spring') {
            // bouncy mushroom: a great big jump
            if (o.bounceT > 0) continue;
            o.bounceT = 1; o.squash = 0.3;
            hero.vy = -Math.sqrt(2 * gravity() * H * 0.42); hero.y = Math.min(hero.y, -1); hero.onGround = false; hero.jumps = 1; hero.holdT = 9;
            sfx.boing(); sfx.whoosh(); buzz(25); burst(o.x, G - h, { n: 16, speed: 260, shape: 'star' });
            continue;
          }
          if (o.type === 'puddle') { o.hit = true; sfx.splash(); burst(o.x, G, { n: 24, colors: ['#7cc8ff', '#bfe8ff', '#fff'], speed: 300, shape: 'dot' }); continue; }
          if (o.type === 'ball') { o.hit = true; o.vy = -620 * S; sfx.boing(); buzz(12); burst(o.x, G - h, { n: 10, speed: 200, shape: 'star' }); addStars(1); continue; }
          // Coming down on top of it (feet in its upper half) = bounce off it, not a fall.
          const feetBefore = hy1 - Math.max(0, hero.vy) * dt;
          if (!hero.onGround && feetBefore <= G - h * 0.5) {
            if (o.bounceT > 0) continue;
            o.bounceT = 0.35; o.squash = 0.3;
            hero.vy = -Math.sqrt(2 * gravity() * H * 0.13); hero.jumps = 1; hero.holdT = 0;
            sfx.boing(); buzz(15); noise(o);
            burst(o.x, G - h, { n: 12, speed: 220, shape: 'star' });
            continue;
          }
          if (o.bounceT > 0) continue; // just bounced off it: don't trip over it on the way down
          o.hit = true; o.vy = -420 * S; noise(o);
          burst(o.x, G - h, { n: 10, speed: 200, shape: o.type === 'snowman' ? 'dot' : 'star', ...(o.type === 'snowman' ? { colors: ['#fff', '#e1edf8'] } : {}) });
          // super-run: everything just gets bowled out of the way
          if (rush > 0) { o.vy = -620 * S; addStars(1); buzz(12); continue; }
          fall();
        }
      }
    }
  }

  function drawEmoji(e, x, y, s, flip) {
    c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
    c.font = `${s}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(e, 0, s * 0.12); c.restore();
  }

  function drawObstacle(o) {
    const x = o.x, ink = '#5c3b1e';
    c.lineWidth = 3; c.lineJoin = 'round';
    if (o.type === 'sheep') drawSheep(c, x, G, 95 * S, { t: o.t, walking: true, bleat: o.hit });
    else if (EMOJI[o.type]) { const [e, s] = EMOJI[o.type]; drawEmoji(e, x, G - Math.abs(Math.sin(o.t * 6)) * 4 * S, s * S, false); }
    else if (o.type === 'dino') drawDino(c, x, G, 80 * S, o.color, { flip: true, t: o.t, walking: true, roar: o.hit });
    else if (o.type === 'log') {
      c.fillStyle = '#9b6a3c'; c.strokeStyle = ink;
      c.beginPath(); c.roundRect(x - 40 * S, G - 40 * S, 80 * S, 40 * S, 18 * S); c.fill(); c.stroke();
      c.fillStyle = '#d9a86a'; c.beginPath(); c.ellipse(x + 34 * S, G - 20 * S, 9 * S, 18 * S, 0, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = '#b07a45'; c.beginPath(); c.ellipse(x + 34 * S, G - 20 * S, 4 * S, 9 * S, 0, 0, 7); c.stroke();
    } else if (o.type === 'bush') {
      c.fillStyle = '#2f9e44';
      for (const [dx, dy, r] of [[-26, -24, 24], [0, -40, 30], [26, -24, 24], [0, -18, 26]]) { c.beginPath(); c.arc(x + dx * S, G + dy * S, r * S, 0, 7); c.fill(); }
      c.fillStyle = '#ff5c7a'; for (const [dx, dy] of [[-14, -40], [12, -54], [20, -26]]) { c.beginPath(); c.arc(x + dx * S, G + dy * S, 5 * S, 0, 7); c.fill(); }
    } else if (o.type === 'puddle') {
      c.fillStyle = '#5bb8f5'; c.beginPath(); c.ellipse(x, G + 6 * S, 55 * S, 12 * S, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - 15 * S, G + 3 * S, 16 * S, 3 * S, 0, 0, 7); c.fill();
    } else if (o.type === 'hay') {
      c.fillStyle = '#edc55a'; c.strokeStyle = '#b08a2c';
      c.beginPath(); c.roundRect(x - 42 * S, G - 62 * S, 84 * S, 62 * S, 14 * S); c.fill(); c.stroke();
      c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(x - 34 * S + i * 17 * S, G - 56 * S); c.lineTo(x - 30 * S + i * 17 * S, G - 6 * S); } c.stroke();
      c.strokeStyle = '#c0392b'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 42 * S, G - 40 * S); c.lineTo(x + 42 * S, G - 40 * S); c.moveTo(x - 42 * S, G - 20 * S); c.lineTo(x + 42 * S, G - 20 * S); c.stroke();
    } else if (o.type === 'castle') {
      c.fillStyle = '#f2cf86'; c.strokeStyle = '#b98f45';
      c.beginPath(); c.rect(x - 34 * S, G - 36 * S, 68 * S, 36 * S); c.fill(); c.stroke();
      for (const dx of [-32, 16]) { c.beginPath(); c.rect(x + dx * S, G - 62 * S, 18 * S, 62 * S); c.fill(); c.stroke(); c.beginPath(); c.rect(x + (dx - 3) * S, G - 68 * S, 24 * S, 9 * S); c.fill(); c.stroke(); }
      c.fillStyle = '#8a5a2b'; c.beginPath(); c.moveTo(x - 8 * S, G); c.lineTo(x - 8 * S, G - 16 * S); c.arc(x, G - 16 * S, 8 * S, Math.PI, 0); c.lineTo(x + 8 * S, G); c.fill();
      c.strokeStyle = ink; c.beginPath(); c.moveTo(x + 25 * S, G - 68 * S); c.lineTo(x + 25 * S, G - 92 * S); c.stroke();
      c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(x + 25 * S, G - 92 * S); c.lineTo(x + 42 * S, G - 86 * S); c.lineTo(x + 25 * S, G - 80 * S); c.fill();
    } else if (o.type === 'ball') {
      const by = o.hit ? 0 : Math.abs(Math.sin(o.t * 4)) * 34 * S, r = 28 * S;
      c.save(); c.translate(x, G - r - by); c.rotate(-o.t * 4);
      ['#ef4444', '#fff', '#3b82f6', '#fff', '#facc15', '#fff'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3); c.fill(); });
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); c.restore();
    } else if (o.type === 'snowman') {
      c.fillStyle = '#fff'; c.strokeStyle = '#9db6cc';
      for (const [dy, r] of [[-24, 26], [-58, 19], [-82, 14]]) { c.beginPath(); c.arc(x, G + dy * S, r * S, 0, 7); c.fill(); c.stroke(); }
      c.fillStyle = '#2b2118'; c.beginPath(); c.arc(x - 5 * S, G - 85 * S, 2 * S, 0, 7); c.arc(x + 5 * S, G - 85 * S, 2 * S, 0, 7); c.arc(x, G - 60 * S, 2.4 * S, 0, 7); c.arc(x, G - 50 * S, 2.4 * S, 0, 7); c.fill();
      c.fillRect(x - 13 * S, G - 97 * S, 26 * S, 4 * S); c.fillRect(x - 8 * S, G - 112 * S, 16 * S, 16 * S);
      c.fillStyle = '#ff8c1a'; c.beginPath(); c.moveTo(x, G - 82 * S); c.lineTo(x - 16 * S, G - 79 * S); c.lineTo(x, G - 77 * S); c.fill();
      c.strokeStyle = '#ef4444'; c.lineWidth = 5 * S; c.beginPath(); c.arc(x, G - 72 * S, 13 * S, 0.3, 2.8); c.stroke();
    } else if (o.type === 'spring') {
      c.fillStyle = '#fff3dc'; c.strokeStyle = ink;
      c.beginPath(); c.roundRect(x - 14 * S, G - 26 * S, 28 * S, 26 * S, 8 * S); c.fill(); c.stroke();
      c.fillStyle = '#ef4444'; c.beginPath(); c.ellipse(x, G - 26 * S, 40 * S, 24 * S, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; for (const [dx, dy, r] of [[-20, -34, 6], [2, -42, 7], [22, -32, 5]]) { c.beginPath(); c.arc(x + dx * S, G + dy * S, r * S, 0, 7); c.fill(); }
      // little arrows so it reads as "bouncy"
      c.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 6)})`; c.lineWidth = 4 * S; const ay = G - (64 + ((t * 40) % 20)) * S;
      c.beginPath(); c.moveTo(x - 10 * S, ay + 10 * S); c.lineTo(x, ay); c.lineTo(x + 10 * S, ay + 10 * S); c.stroke();
    }
  }

  // balloon arch at the start of each new place
  function drawArch() {
    const zl = meadow.zoneLen(), ax = (Math.floor((dist + hero.x * W) / zl) + 1) * zl - dist;
    for (const x of [ax, ax - zl]) {
      if (x < -260 * S || x > W + 260 * S) continue;
      const R = 170 * S;
      c.strokeStyle = '#c9c9c9'; c.lineWidth = 4 * S; c.beginPath(); c.arc(x, G, R, Math.PI, 0); c.stroke();
      for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; c.fillStyle = RAINBOW[i % 6]; c.beginPath(); c.ellipse(x + Math.cos(a) * R, G + Math.sin(a) * R + Math.sin(t * 3 + i) * 3 * S, 22 * S, 26 * S, a + Math.PI / 2, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x + Math.cos(a) * R - 6 * S, G + Math.sin(a) * R - 8 * S, 5 * S, 0, 7); c.fill(); }
    }
  }

  function draw() {
    meadow.draw(c, W, H, t, dt, dist, G);
    drawArch();
    // speed lines during the super-run
    if (rush > 0) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3 * S; for (let i = 0; i < 9; i++) { const y = H * (0.2 + ((i * 0.37) % 0.6)), x = W - ((t * 900 * S + i * 211) % (W + 200)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 90 * S, y); c.stroke(); } }
    // gifts
    for (const gf of gifts) {
      const bob = Math.sin(t * 3 + gf.ph) * 6;
      if (gf.big) { c.save(); c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 6 + gf.ph); c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(gf.x, gf.y + bob, (gf.type === 'star' ? 40 : 58) * S, 0, 7); c.fill(); c.restore(); }
      if (gf.type === 'balloon') drawBalloon(c, gf.x, gf.y + bob, 22 * S, gf.col, t + gf.ph);
      else if (gf.type === 'bunch') { [[-20, -6, '#ef4444'], [20, -6, '#3b82f6'], [0, -30, '#facc15']].forEach(([dx, dy, col]) => drawBalloon(c, gf.x + dx * S, gf.y + bob + (dy - 30) * S, 24 * S, col, t)); }
      else if (gf.type === 'rainbow') { c.save(); c.translate(gf.x, gf.y + bob); c.rotate(t * 2); drawStar(c, 0, 0, 40 * S, `hsl(${(t * 200) % 360},90%,60%)`); c.rotate(-t * 4); drawStar(c, 0, 0, 20 * S, '#fff'); c.restore(); }
      else { c.save(); c.translate(gf.x, gf.y + bob); c.rotate(Math.sin(t * 2 + gf.ph) * 0.2); drawStar(c, 0, 0, (gf.big ? 30 : 22) * S); c.restore(); }
    }
    // obstacles
    for (const o of obs) {
      c.save(); c.translate(0, o.dy);
      if (o.squash > 0) { const q = o.squash / 0.3; c.translate(o.x, G); c.scale(1 + q * 0.25, 1 - q * 0.3); c.translate(-o.x, -G); }
      if (o.hit && o.type !== 'puddle') { c.translate(o.x, G - 40 * S); c.rotate(o.t * 6); c.translate(-o.x, -(G - 40 * S)); }
      drawObstacle(o);
      c.restore();
    }
    // dust
    for (const d of dust) { c.fillStyle = d.col || '#fff'; c.globalAlpha = Math.min(1, Math.max(0, d.life) * 1.4); c.beginPath(); c.arc(d.x, d.y - d.r * 0.5, d.r, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    const b = box(), cx = b.x + b.aw / 2;
    // tap hint for the first few things on the path (level 1): a bouncing hand over what's coming
    if (hints > 0 && hero.state === 'run' && hero.onGround && float <= 0) {
      const o = obs.find((q) => !q.hit && !SOFT[q.type] && q.x > cx && q.x - cx < W * 0.36);
      if (o) { const h = SIZES[o.type][1] * S, k = Math.abs(Math.sin(t * 7)); c.globalAlpha = 0.9; drawEmoji('👆', o.x, G - h - (40 + k * 24) * S, 56 * S, false); c.globalAlpha = 1; }
    }
    // the pet trots behind, copying each jump
    const pim = hero.y < -20 * S || float > 0 ? pet.img.excited || pet.img.happy : pet.img.happy;
    if (pim) {
      const ps = b.ah * 0.82, px = b.x - ps * 0.8, hop = hero.state === 'run' && pet.y > -2 ? Math.abs(Math.sin(t * 13 + 1)) * 7 * S : 0;
      c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(px + ps / 2, G + 3, ps * 0.3, 5 * S, 0, 0, 7); c.fill();
      if (float > 0) { c.strokeStyle = 'rgba(70,70,70,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + ps / 2, G - ps * 0.9 + pet.y); c.lineTo(px + ps / 2, G - ps * 1.35 + pet.y); c.stroke(); drawBalloon(c, px + ps / 2, G - ps * 1.6 + pet.y, 18 * S, '#f472b6', t); }
      c.save(); c.translate(px + ps / 2, G + pet.y - hop); c.rotate(hero.state === 'run' ? Math.sin(t * 13) * 0.06 : 0); c.drawImage(pim, -ps / 2, -ps * 0.96, ps, ps); c.restore();
    }
    // the runner
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(cx, G + 3, b.aw * 0.35 * Math.max(0.3, 1 + hero.y / H), 7 * S, 0, 0, 7); c.fill();
    let im, rot = 0, sx = 1, sy = 1, bob = 0;
    if (float > 0) { im = hero.img.up; rot = Math.sin(t * 2) * 0.12; }
    else if (hero.state === 'run') {
      const phase = Math.sin(t * (rush > 0 ? 18 : 13));
      im = !hero.onGround ? hero.img.up : phase > 0 ? hero.img.run1 : hero.img.run2;
      bob = hero.onGround ? Math.abs(phase) * 9 * S : 0;
      rot = hero.onGround ? 0.12 + phase * 0.03 + (rush > 0 ? 0.08 : 0) : -0.1;          // lean forward while running
      if (hero.landT > 0) { sx = 1.14; sy = 0.84; }
      if (!hero.onGround && hero.vy < 0) { sx = 0.92; sy = 1.08; }  // stretch going up
    } else if (hero.state === 'falling') { im = hero.img.up; rot = -Math.min(1, hero.fallT / 0.35) * 1.45; }
    else if (hero.state === 'down') { im = hero.img.down; rot = -1.45; }
    else { im = hero.img.up; rot = -1.45 * (1 - Math.min(1, hero.fallT / 0.4)); bob = Math.sin(Math.min(1, hero.fallT / 0.4) * Math.PI) * 18 * S; }
    if (float > 0) {
      // the balloon bunch carrying them (it flickers just before it lets go)
      if (float > 1.2 || Math.sin(t * 22) > 0) [[-26, 0, '#ef4444'], [26, 0, '#3b82f6'], [0, -28, '#facc15']].forEach(([dx, dy, col]) => {
        c.strokeStyle = 'rgba(70,70,70,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, b.y + b.ah * 0.2); c.lineTo(cx + dx * S, b.y - (40 - dy) * S); c.stroke();
        drawBalloon(c, cx + dx * S, b.y - (70 - dy) * S, 30 * S, col, t);
      });
    }
    if (rush > 0 && (rush > 1.2 || Math.sin(t * 22) > 0)) { c.save(); c.globalAlpha = 0.45; c.fillStyle = `hsl(${(t * 300) % 360},90%,70%)`; c.beginPath(); c.ellipse(cx, b.y + b.ah * 0.5, b.aw * 0.62, b.ah * 0.6, 0, 0, 7); c.fill(); c.restore(); }
    if (im) {
      c.save(); c.translate(cx, b.y + b.ah - bob); c.rotate(rot); c.scale(sx, sy);
      c.drawImage(im, -b.aw / 2, -b.ah, b.aw, b.ah); c.restore();
    }
    // dizzy stars circling the head while lying down
    if (hero.state === 'down' || (hero.state === 'falling' && hero.fallT > 0.25)) {
      const hx = cx - b.ah * 0.62, hy = G - b.aw * 0.35;
      for (let i = 0; i < 3; i++) {
        const a = t * 5 + (i * Math.PI * 2) / 3;
        drawStar(c, hx + Math.cos(a) * 28 * S, hy - 26 * S + Math.sin(a) * 9 * S, 9 * S, ['#ffd23f', '#ff8ac2', '#7bdcff'][i]);
      }
    }
    // sign for the new place
    if (banner) { const k = Math.min(1, (2.6 - banner.life) * 4), a = Math.min(1, banner.life * 2); c.globalAlpha = a; drawEmoji(banner.e, W / 2, H * 0.42, 150 * S * (0.4 + 0.6 * k), false); c.globalAlpha = 1; }
  }

  function frame(now) {
    dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(); draw();
    raf = requestAnimationFrame(frame);
  }
  root.__dbg = { hero, obs, gifts, get W() { return W; }, get H() { return H; }, get S() { return S; }, box, state: () => ({ rush, float, got, dist, hints }), warp: (d) => { dist += d; }, give: (type) => gifts.push({ type, big: true, x: hero.x * W + 200, y: G - size().ah * 0.6, col: '#fff', ph: 0 }) }; // for automated tests
  raf = requestAnimationFrame(frame);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); document.removeEventListener('visibilitychange', vis); };
}
