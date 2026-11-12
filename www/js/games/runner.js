// Run & Jump: the selected child runs through a meadow. Tap to hop, hold to jump higher (double-jump allowed).
// Low stars can be grabbed while running; high ones need a jump. Bumping into something makes the
// child topple over, see stars, and get back up - it never ends the game.
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

const SPEED = { slow: 0.7, normal: 1, fast: 1.35 };

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

  // --- the runner
  const me = currentPlayer();
  const hero = { x: 0.2, y: 0, vy: 0, onGround: true, holdT: 0, jumps: 0, landT: 0, state: 'run', fallT: 0, img: {} };
  for (const pose of ['down', 'up', 'run1', 'run2']) loadImg(avatarSVG(me, { pose })).then((i) => (hero.img[pose] = i));
  const size = () => { const ah = Math.min(H * 0.2, 150), aw = (ah * 200) / 240; return { ah, aw }; };
  const box = () => { const { ah, aw } = size(); return { ah, aw, x: hero.x * W, y: G - ah + hero.y }; };

  preloadClip('standing'); preloadAnimals();
  const meadow = createMeadow({ zones: true });
  let t = 0, dt = 0.016, dist = 0, speedNow = 0, nextObs = 2.2, nextGift = 0.8, got = 0, holding = false, raf = 0, last = performance.now();
  const obs = [], gifts = [], dust = [];
  let dustT = 0;

  let lastJumpWord = 0;
  const gravity = () => 2600 * S;
  function jump() {
    if (hero.state !== 'run' || hero.jumps >= 2) return;
    hero.vy = -Math.sqrt(2 * gravity() * H * (hero.jumps ? 0.15 : 0.19));
    hero.onGround = false; hero.jumps++; hero.holdT = 0;
    sfx.boing(); buzz(8);
    if (hero.jumps === 1 && Math.random() < 0.25 && performance.now() - lastJumpWord > 4000) { lastJumpWord = performance.now(); say('Jumping!'); }
  }
  const down = (e) => { e.preventDefault(); holding = true; jump(); };
  const up = () => { holding = false; };
  cv.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', up);

  // --- things on the path
  function spawnObstacle() {
    const type = pick(['sheep', 'sheep', 'elephant', 'log', 'bush', 'puddle', 'dino']);
    obs.push({ type, x: W + 90 * S, hit: false, t: 0, dy: 0, vy: 0, color: pick(['#6fcf5b', '#ff9f43', '#7bb7ff', '#c78bff']) });
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
  const obsSize = (o) => ({ puddle: [100, 10], log: [80, 40], bush: [80, 60], sheep: [70, 70], elephant: [90, 85], dino: [70, 70] }[o.type]);

  function fall() {
    hero.state = 'falling'; hero.fallT = 0; hero.vy = -320 * S; hero.onGround = false;
    sfx.boing(); buzz(40);
  }

  function update() {
    // world speed eases to a stop while the child is down
    const target = hero.state === 'run' ? W * 0.32 * SPEED[cfg.speed] * (1 + lv() * 0.08) : 0;
    speedNow += (target - speedNow) * Math.min(1, dt * (hero.state === 'run' ? 2 : 4));
    dist += speedNow * dt; t += dt;

    // hero physics
    const g = holding && hero.vy < 0 && hero.holdT < 0.32 && hero.state === 'run' ? gravity() * 0.35 : gravity();
    hero.holdT += dt; hero.vy += g * dt; hero.y += hero.vy * dt;
    if (hero.y >= 0) {
      if (!hero.onGround) {
        hero.landT = 0.18;
        const b = box();
        for (let i = 0; i < 7; i++) dust.push({ x: b.x + b.aw / 2 + (Math.random() - 0.5) * 50 * S, y: G, r: 6 * S, vx: (Math.random() - 0.5) * 120 * S, life: 0.5 });
      }
      hero.y = 0; hero.vy = 0; hero.onGround = true; hero.jumps = 0;
    }
    hero.landT = Math.max(0, hero.landT - dt);

    // fall over -> lie down seeing stars -> get back up
    if (hero.state !== 'run') {
      hero.fallT += dt;
      if (hero.state === 'falling' && hero.fallT > 0.35 && hero.onGround) { hero.state = 'down'; hero.fallT = 0; }
      else if (hero.state === 'down' && hero.fallT > 1.1) { hero.state = 'rising'; hero.fallT = 0; if (Math.random() < 0.5) playClip('standing', 3000); }
      else if (hero.state === 'rising' && hero.fallT > 0.4) { hero.state = 'run'; }
    }

    // dust while running
    dustT -= dt;
    if (hero.state === 'run' && hero.onGround && dustT <= 0) { dustT = 0.1; const b = box(); dust.push({ x: b.x + b.aw * 0.4, y: G, r: 4 * S, vx: -speedNow * 0.3, life: 0.45 }); }
    for (const d of dust) { d.life -= dt; d.x += d.vx * dt - speedNow * dt * 0.5; d.r += 30 * S * dt; }
    while (dust.length && dust[0].life <= 0) dust.shift();

    nextObs -= dt * (speedNow / (W * 0.32)); nextGift -= dt * (speedNow / (W * 0.32));
    if (nextObs <= 0) { spawnObstacle(); nextObs = (2.4 + Math.random() * 2) * (1 - lv() * 0.1); }
    if (nextGift <= 0) { spawnGifts(); nextGift = 1.5 + Math.random() * 1.6; }
    for (const o of obs) {
      o.t += dt; o.bounceT = Math.max(0, (o.bounceT || 0) - dt); o.squash = Math.max(0, (o.squash || 0) - dt);
      const walk = (o.type === 'sheep' || o.type === 'elephant' || o.type === 'dino') && !o.hit ? 0.15 : 0;
      o.x -= (speedNow * (1 + walk) + (walk && !speedNow ? 0 : 0)) * dt;
      if (o.hit && o.type !== 'puddle') { o.vy += gravity() * dt; o.dy += o.vy * dt; o.x += 260 * S * dt; }
    }
    for (const gf of gifts) gf.x -= speedNow * dt;
    while (obs.length && obs[0].x < -200) obs.shift();
    while (gifts.length && gifts[0].x < -100) gifts.shift();

    // collisions
    const b = box();
    const hx0 = b.x + b.aw * 0.28, hx1 = b.x + b.aw * 0.72, hy0 = b.y + b.ah * 0.05, hy1 = b.y + b.ah;
    if (hero.state === 'run' || hero.state === 'falling') {
      for (const gf of [...gifts]) {
        const r = (gf.big ? 30 : 24) * S;
        if (gf.x + r > hx0 && gf.x - r < hx1 && gf.y + r > hy0 && gf.y - r < hy1) {
          gifts.splice(gifts.indexOf(gf), 1); got += gf.big ? 2 : 1;
          sfx.pop(got); if (gf.big) sfx.sparkle(); buzz(10);
          burst(gf.x, gf.y, { n: gf.big ? 26 : 14, colors: gf.type === 'star' ? ['#ffd23f', '#fff', '#ffb300'] : [gf.col, '#fff'], speed: gf.big ? 340 : 240 });
          scoreEl.textContent = got;
          scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
          if (Math.floor(got / 10) > Math.floor((got - (gf.big ? 2 : 1)) / 10)) { confettiRain(70); setTimeout(() => sfx.yay(), 200); win('runner', badge); }
        }
      }
    }
    if (hero.state === 'run') {
      for (const o of obs) {
        if (o.hit) continue;
        const [w0, h0] = obsSize(o), w = w0 * S, h = h0 * S;
        if (o.x + w / 2 > hx0 && o.x - w / 2 < hx1 && G - h < hy1 - 6 * S) {
          // Coming down on top of it (feet in its upper half) = bounce off it, not a fall.
          const feetBefore = hy1 - Math.max(0, hero.vy) * dt;
          if (o.type !== 'puddle' && !hero.onGround && feetBefore <= G - h * 0.5) {
            if (o.bounceT > 0) continue;
            o.bounceT = 0.35; o.squash = 0.3;
            hero.vy = -Math.sqrt(2 * gravity() * H * 0.13); hero.jumps = 1; hero.holdT = 0;
            sfx.boing(); buzz(15);
            if (o.type === 'sheep') animalSound('sheep'); else if (o.type === 'elephant') animalSound('elephant'); else if (o.type === 'dino') sfx.roar(); else sfx.pop(5);
            burst(o.x, G - h, { n: 12, speed: 220, shape: 'star' });
            continue;
          }
          if (o.bounceT > 0) continue; // just bounced off it: don't trip over it on the way down
          o.hit = true;
          if (o.type === 'puddle') { sfx.pop(2); burst(o.x, G, { n: 24, colors: ['#7cc8ff', '#bfe8ff', '#fff'], speed: 300, shape: 'dot' }); continue; }
          o.vy = -420 * S;
          if (o.type === 'sheep') animalSound('sheep'); else if (o.type === 'elephant') animalSound('elephant'); else if (o.type === 'dino') sfx.roar();
          burst(o.x, G - h, { n: 10, speed: 200, shape: 'star' });
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

  function draw() {
    meadow.draw(c, W, H, t, dt, dist, G);
    // gifts
    for (const gf of gifts) {
      const bob = Math.sin(t * 3 + gf.ph) * 6;
      if (gf.big) { c.save(); c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 6 + gf.ph); c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(gf.x, gf.y + bob, 40 * S, 0, 7); c.fill(); c.restore(); }
      if (gf.type === 'balloon') drawBalloon(c, gf.x, gf.y + bob, 22 * S, gf.col, t + gf.ph);
      else { c.save(); c.translate(gf.x, gf.y + bob); c.rotate(Math.sin(t * 2 + gf.ph) * 0.2); drawStar(c, 0, 0, (gf.big ? 30 : 22) * S); c.restore(); }
    }
    // obstacles
    for (const o of obs) {
      c.save(); c.translate(0, o.dy);
      if (o.squash > 0) { const q = o.squash / 0.3; c.translate(o.x, G); c.scale(1 + q * 0.25, 1 - q * 0.3); c.translate(-o.x, -G); }
      if (o.hit && o.type !== 'puddle') { c.translate(o.x, G - 40 * S); c.rotate(o.t * 6); c.translate(-o.x, -(G - 40 * S)); }
      if (o.type === 'sheep') drawSheep(c, o.x, G, 95 * S, { t: o.t, walking: true, bleat: o.hit });
      else if (o.type === 'elephant') drawEmoji('🐘', o.x, G + Math.abs(Math.sin(o.t * 6)) * -4 * S, 100 * S, false);
      else if (o.type === 'dino') drawDino(c, o.x, G, 80 * S, o.color, { flip: true, t: o.t, walking: true, roar: o.hit });
      else if (o.type === 'log') {
        c.fillStyle = '#9b6a3c'; c.strokeStyle = '#5c3b1e'; c.lineWidth = 3;
        c.beginPath(); c.roundRect(o.x - 40 * S, G - 40 * S, 80 * S, 40 * S, 18 * S); c.fill(); c.stroke();
        c.fillStyle = '#d9a86a'; c.beginPath(); c.ellipse(o.x + 34 * S, G - 20 * S, 9 * S, 18 * S, 0, 0, 7); c.fill(); c.stroke();
        c.strokeStyle = '#b07a45'; c.beginPath(); c.ellipse(o.x + 34 * S, G - 20 * S, 4 * S, 9 * S, 0, 0, 7); c.stroke();
      } else if (o.type === 'bush') {
        c.fillStyle = '#2f9e44';
        for (const [dx, dy, r] of [[-26, -24, 24], [0, -40, 30], [26, -24, 24], [0, -18, 26]]) { c.beginPath(); c.arc(o.x + dx * S, G + dy * S, r * S, 0, 7); c.fill(); }
        c.fillStyle = '#ff5c7a'; for (const [dx, dy] of [[-14, -40], [12, -54], [20, -26]]) { c.beginPath(); c.arc(o.x + dx * S, G + dy * S, 5 * S, 0, 7); c.fill(); }
      } else if (o.type === 'puddle') {
        c.fillStyle = '#5bb8f5'; c.beginPath(); c.ellipse(o.x, G + 6 * S, 55 * S, 12 * S, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(o.x - 15 * S, G + 3 * S, 16 * S, 3 * S, 0, 0, 7); c.fill();
      }
      c.restore();
    }
    // dust
    for (const d of dust) { c.fillStyle = `rgba(255,255,255,${Math.max(0, d.life) * 1.4})`; c.beginPath(); c.arc(d.x, d.y - d.r * 0.5, d.r, 0, 7); c.fill(); }
    // the runner
    const b = box(), cx = b.x + b.aw / 2;
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(cx, G + 3, b.aw * 0.35 * (1 + hero.y / H), 7 * S, 0, 0, 7); c.fill();
    let im, rot = 0, sx = 1, sy = 1, bob = 0;
    if (hero.state === 'run') {
      const phase = Math.sin(t * 13);
      im = !hero.onGround ? hero.img.up : phase > 0 ? hero.img.run1 : hero.img.run2;
      bob = hero.onGround ? Math.abs(phase) * 9 * S : 0;
      rot = hero.onGround ? 0.12 + phase * 0.03 : -0.1;          // lean forward while running
      if (hero.landT > 0) { sx = 1.14; sy = 0.84; }
      if (!hero.onGround && hero.vy < 0) { sx = 0.92; sy = 1.08; }  // stretch going up
    } else if (hero.state === 'falling') { im = hero.img.up; rot = -Math.min(1, hero.fallT / 0.35) * 1.45; }
    else if (hero.state === 'down') { im = hero.img.down; rot = -1.45; }
    else { im = hero.img.up; rot = -1.45 * (1 - Math.min(1, hero.fallT / 0.4)); bob = Math.sin(Math.min(1, hero.fallT / 0.4) * Math.PI) * 18 * S; }
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
  }

  function frame(now) {
    dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(); draw();
    raf = requestAnimationFrame(frame);
  }
  root.__dbg = { hero, obs, get W() { return W; }, get H() { return H; }, get S() { return S; }, box }; // for automated tests
  raf = requestAnimationFrame(frame);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); document.removeEventListener('visibilitychange', vis); };
}
