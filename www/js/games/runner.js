// Run & Jump: the player's cartoon runs through a meadow. Tap to hop, hold to jump higher.
// Collect balloons and stars (counted out loud). Bumping into things never ends the game.
import { sfx, buzz, playClip, preloadClip } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, currentPlayer, getSettings } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { loadImg } from '../shapes.js';
import { homeBtn, pick, rnd } from '../ui.js';
import { burst, confettiRain } from '../fx.js';
import { drawBalloon, drawSheep, drawCloud, drawStar, drawDino } from '../draw.js';
import { COLOURS } from '../data.js';

const SPEED = { slow: 0.7, normal: 1, fast: 1.35 };

export function mount(el) {
  el.innerHTML = `<div class="game runner"><canvas></canvas>${homeBtn()}<div class="score"></div></div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d'), scoreEl = root.querySelector('.score');
  const cfg = { speed: 'normal', countAloud: true, ...(getSettings().pop || {}), ...(getSettings().runner || {}) };
  let W, H, G, S, dpr;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    G = H * 0.84; S = H / 700;
  };
  resize(); addEventListener('resize', resize);

  const me = currentPlayer();
  const friendP = getPlayers().find((p) => p.id !== me.id);
  const mk = (p, x) => ({ p, x, y: 0, vy: 0, onGround: true, holdT: 0, jumps: 0, img: null, imgUp: null, stumble: 0 });
  const hero = mk(me, 0.22), friend = friendP ? mk(friendP, 0.07) : null;
  for (const k of [hero, friend].filter(Boolean)) { loadImg(avatarSVG(k.p)).then((i) => (k.img = i)); loadImg(avatarSVG(k.p, { pose: 'up' })).then((i) => (k.imgUp = i)); }

  preloadClip('standing');
  let wantClip = false;
  let t = 0, dist = 0, nextObs = 2, nextGift = 1, got = 0, holding = false, raf = 0, last = performance.now();
  const obs = [], gifts = [], splash = [];
  const clouds = Array.from({ length: 5 }, () => ({ x: Math.random() * 1.3, y: 0.06 + Math.random() * 0.25, s: 0.5 + Math.random() * 0.7 }));
  const flowers = Array.from({ length: 14 }, () => ({ x: Math.random(), c: pick(['#ff6fa5', '#ffd23f', '#ffffff', '#b38cff']) }));

  const gravity = () => 2600 * S;
  function jump(k) {
    if (k.jumps >= 2) return;
    k.vy = -Math.sqrt(2 * gravity() * H * (k.jumps ? 0.16 : 0.2));
    k.onGround = false; k.jumps++; k.holdT = 0;
    if (k === hero) { sfx.boing(); buzz(8); }
  }
  const down = (e) => { e.preventDefault(); holding = true; jump(hero); };
  const up = () => { holding = false; };
  cv.addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', up);

  function spawnObstacle() {
    const type = pick(['sheep', 'sheep', 'log', 'bush', 'puddle', 'dino']);
    obs.push({ type, x: W + 80, hit: false, t: 0, color: pick(['#6fcf5b', '#ff9f43', '#7bb7ff', '#c78bff']) });
  }
  function spawnGifts() {
    const n = 3 + rnd(3), arc = Math.random() < 0.6, high = H * (0.14 + Math.random() * 0.14);
    for (let i = 0; i < n; i++) {
      const lift = arc ? Math.sin((i / (n - 1)) * Math.PI) * H * 0.08 : 0;
      gifts.push({ type: Math.random() < 0.6 ? 'balloon' : 'star', x: W + 60 + i * 70 * S, y: G - high - lift, col: pick(COLOURS).c, ph: Math.random() * 6 });
    }
  }

  function kidBox(k) { const ah = Math.min(H * 0.26, 210), aw = (ah * 200) / 240; return { ah, aw, x: k.x * W, y: G - ah + k.y }; }

  function update(dt) {
    const speed = W * 0.33 * SPEED[cfg.speed] * (hero.stumble > 0 ? 0.55 : 1);
    dist += speed * dt; t += dt;
    for (const k of [hero, friend].filter(Boolean)) {
      const g = k === hero && holding && k.vy < 0 && k.holdT < 0.32 ? gravity() * 0.35 : gravity();
      k.holdT += dt; k.vy += g * dt; k.y += k.vy * dt;
      if (k.y >= 0) { k.y = 0; k.vy = 0; k.onGround = true; k.jumps = 0; }
      k.stumble = Math.max(0, k.stumble - dt);
    }
    if (wantClip && hero.onGround && hero.stumble <= 0) { wantClip = false; playClip('standing', 4000); }
    // friend hops automatically over things
    if (friend) for (const o of obs) { const fx = friend.x * W; if (o.type !== 'puddle' && o.x - fx > 0 && o.x - fx < W * 0.12 && friend.onGround) jump(friend); }

    nextObs -= dt; nextGift -= dt;
    if (nextObs <= 0) { spawnObstacle(); nextObs = 2.2 + Math.random() * 2; }
    if (nextGift <= 0) { spawnGifts(); nextGift = 1.6 + Math.random() * 1.8; }
    for (const o of obs) { o.t += dt; o.x -= speed * dt * (o.type === 'sheep' && !o.hit ? 1.15 : 1); if (o.hit && o.type !== 'puddle') { o.vy = (o.vy || -500 * S) + gravity() * dt; o.dy = (o.dy || 0) + o.vy * dt; o.x += 300 * S * dt; } }
    for (const g of gifts) g.x -= speed * dt;
    while (obs.length && obs[0].x < -200) obs.shift();
    while (gifts.length && gifts[0].x < -100) gifts.shift();

    const b = kidBox(hero);
    const hx0 = b.x + b.aw * 0.3, hx1 = b.x + b.aw * 0.7, hy0 = b.y + b.ah * 0.1, hy1 = b.y + b.ah;
    for (const g of [...gifts]) {
      if (g.x > hx0 - 30 * S && g.x < hx1 + 30 * S && g.y > hy0 - 40 * S && g.y < hy1) {
        gifts.splice(gifts.indexOf(g), 1); got++;
        sfx.pop(got); buzz(10);
        burst(g.x * 1, g.y, { n: 16, colors: g.type === 'star' ? ['#ffd23f', '#fff'] : [g.col, '#fff'], speed: 260 });
        if (cfg.countAloud) say(String(got), { rate: 1.05 });
        scoreEl.textContent = got;
        scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
        if (got % 10 === 0) { confettiRain(70); setTimeout(() => sfx.yay(), 200); }
      }
    }
    for (const o of obs) {
      if (o.hit) continue;
      const w = o.type === 'puddle' ? 90 * S : 70 * S, h = o.type === 'puddle' ? 10 * S : o.type === 'log' ? 40 * S : 70 * S;
      if (o.x + w / 2 > hx0 && o.x - w / 2 < hx1 && G - h < hy1 - 4) {
        o.hit = true;
        if (o.type === 'puddle') { sfx.pop(2); burst(o.x, G, { n: 24, colors: ['#7cc8ff', '#bfe8ff', '#fff'], speed: 300, shape: 'dot' }); }
        else {
          hero.stumble = 0.6; hero.vy = -400 * S; hero.onGround = false; sfx.boing();
          if (Math.random() < 0.5) wantClip = true;
          if (o.type === 'sheep') sfx.baa(); else if (o.type === 'dino') say('Roar!');
          burst(o.x, G - h, { n: 10, speed: 200, shape: 'star' });
        }
      }
    }
  }

  function draw() {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#74c4ff'); g.addColorStop(1, '#dff3ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffe36e'; c.beginPath(); c.arc(W * 0.85, H * 0.13, H * 0.07, 0, 7); c.fill();
    for (const cl of clouds) { const x = ((cl.x * W - dist * 0.05) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15; drawCloud(c, x, cl.y * H, H * 0.08 * cl.s); }
    // far hills
    c.fillStyle = '#a6e38a';
    c.beginPath(); c.moveTo(0, G);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, G - H * 0.12 - Math.sin((x + dist * 0.2) / (W * 0.25)) * H * 0.05);
    c.lineTo(W, G); c.fill();
    // ground
    c.fillStyle = '#7ccf5a'; c.fillRect(0, G, W, H - G);
    c.fillStyle = '#6bbd4b';
    for (let x = -((dist * 1) % 60); x < W; x += 60) c.fillRect(x, G + 10 * S, 30, 6 * S);
    for (const f of flowers) { const x = ((f.x * W * 2 - dist) % (W * 2) + W * 2) % (W * 2) - 20; if (x < W + 20) { c.fillStyle = f.c; c.beginPath(); c.arc(x, G + 30 * S + (f.x * 100) % (H - G - 50 * S), 6 * S, 0, 7); c.fill(); } }
    // gifts
    for (const gf of gifts) {
      if (gf.type === 'balloon') drawBalloon(c, gf.x, gf.y + Math.sin(t * 3 + gf.ph) * 6, 26 * S, gf.col, t + gf.ph);
      else drawStar(c, gf.x, gf.y + Math.sin(t * 3 + gf.ph) * 6, 26 * S);
    }
    // obstacles
    for (const o of obs) {
      c.save(); if (o.dy) c.translate(0, o.dy);
      if (o.type === 'sheep') drawSheep(c, o.x, G, 95 * S, { t: o.t, walking: true, bleat: o.hit });
      else if (o.type === 'dino') drawDino(c, o.x, G, 80 * S, o.color, { flip: true, t: o.t, walking: true, roar: o.hit });
      else if (o.type === 'log') {
        c.fillStyle = '#9b6a3c'; c.strokeStyle = '#5c3b1e'; c.lineWidth = 3;
        c.beginPath(); c.roundRect(o.x - 40 * S, G - 40 * S, 80 * S, 40 * S, 18 * S); c.fill(); c.stroke();
        c.fillStyle = '#d9a86a'; c.beginPath(); c.ellipse(o.x + 34 * S, G - 20 * S, 9 * S, 18 * S, 0, 0, 7); c.fill(); c.stroke();
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
    // kids
    for (const k of [friend, hero].filter(Boolean)) {
      const b = kidBox(k), bob = k.onGround ? Math.abs(Math.sin(t * 12)) * 8 * S : 0;
      const im = !k.onGround || k.stumble > 0 ? k.imgUp : k.img;
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(b.x + b.aw / 2, G + 4, b.aw * 0.35 * (1 + k.y / H), 8 * S, 0, 0, 7); c.fill();
      if (im) {
        c.save(); c.translate(b.x + b.aw / 2, b.y + b.ah - bob); c.rotate(k.onGround ? Math.sin(t * 12) * 0.05 : -0.08);
        c.drawImage(im, -b.aw / 2, -b.ah, b.aw, b.ah); c.restore();
      }
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  say(me.name ? `Ready, ${me.name}? Tap to jump!` : 'Tap to jump!');
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); document.removeEventListener('visibilitychange', vis); };
}
