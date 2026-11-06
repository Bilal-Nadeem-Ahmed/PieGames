// Sheep round-up: tap the wandering sheep to make them leap into the pen. They're counted out loud.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { homeBtn, rnd } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { drawSheep } from '../draw.js';
import { createMeadow } from '../scenery.js';
import { animalSound, preloadAnimals } from '../animals.js';

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="game roundup"><canvas></canvas>${homeBtn()}<div class="score"></div></div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d'), scoreEl = root.querySelector('.score');
  const meadow = createMeadow();
  let W, H, U, pen, field;
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight;
    cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); U = Math.min(W, H);
    // pen on the right (landscape) or at the bottom (portrait)
    pen = W > H ? { x: W * 0.66, y: H * 0.42, w: W * 0.3, h: H * 0.5 } : { x: W * 0.08, y: H * 0.66, w: W * 0.84, h: H * 0.28 };
    field = W > H ? { x: W * 0.06, y: H * 0.5, w: W * 0.54, h: H * 0.42 } : { x: W * 0.08, y: H * 0.36, w: W * 0.84, h: H * 0.24 };
  };
  resize(); addEventListener('resize', resize);

  let sheep = [], inPen = 0, total = 0, t = 0, last = performance.now(), raf = 0, gate = 1, alive = true, timer = 0, state = 'play';
  const size = () => U * (W > H ? 0.16 : 0.2);
  const rndIn = (r, m = 0.1) => ({ x: r.x + r.w * (m + Math.random() * (1 - 2 * m)), y: r.y + r.h * (0.35 + Math.random() * 0.6) });

  function round() {
    total = 3 + rnd(4); inPen = 0; state = 'play'; gate = 1;
    scoreEl.textContent = '';
    sheep = Array.from({ length: total }, (_, i) => {
      const p = rndIn(field);
      return { x: -100 - i * 80, y: p.y, tx: p.x, ty: p.y, state: 'enter', t: Math.random() * 5, flip: true, jump: 0, bleat: 0 };
    });
    say(`Help! ${total} sheep need to go in the pen. Tap them!`);
  }

  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state !== 'play') return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = size();
    let best = null, bd = 1e9;
    for (const sh of sheep) {
      if (sh.state === 'jump' || sh.state === 'pen') continue;
      const d = Math.hypot(x - sh.x, y - (sh.y - s * 0.45));
      if (d < s * 0.75 && d < bd) { bd = d; best = sh; }
    }
    if (!best) { sfx.tap(); return; }
    const to = rndIn(pen, 0.15);
    Object.assign(best, { state: 'jump', fx: best.x, fy: best.y, tx: to.x, ty: to.y, jt: 0, flip: to.x > best.x });
    animalSound('sheep'); buzz(15); sfx.boing();
  });

  function landed(sh) {
    sh.state = 'pen'; sh.bleat = 0.6;
    inPen++;
    scoreEl.textContent = inPen; scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    burst(cv.getBoundingClientRect().left + sh.x, cv.getBoundingClientRect().top + sh.y - size() * 0.5, { n: 12, shape: 'star' });
    say(String(inPen)); sfx.chime(inPen);
    if (inPen === total) {
      state = 'done';
      timer = setTimeout(() => {
        if (!alive) return;
        gate = 0; sfx.knock();
        celebrate(`${total} sheep in the pen! Well done!`);
        timer = setTimeout(() => {
          if (!alive) return;
          gate = 1; state = 'out';
          sheep.forEach((sh, i) => Object.assign(sh, { state: 'leave', delay: i * 0.25, flip: W > H ? false : true }));
          timer = setTimeout(() => alive && round(), 2600);
        }, 3600);
      }, 700);
    }
  }

  function drawPen() {
    const { x, y, w, h } = pen, post = U * 0.018, rail = U * 0.012;
    c.fillStyle = 'rgba(160,110,60,.18)'; c.beginPath(); c.roundRect(x, y + h * 0.25, w, h * 0.75, 10); c.fill();
    c.fillStyle = '#d8a45f'; c.strokeStyle = '#8a5a2b'; c.lineWidth = 2;
    const back = y + h * 0.25, front = y + h;
    // back rails
    for (const ry of [back - U * 0.05, back - U * 0.025]) { c.fillRect(x, ry, w, rail); c.strokeRect(x, ry, w, rail); }
    for (let i = 0; i <= 6; i++) { const px = x + (w * i) / 6; c.fillRect(px - post / 2, back - U * 0.07, post, U * 0.07); c.strokeRect(px - post / 2, back - U * 0.07, post, U * 0.07); }
    return () => {
      // front rails drawn after the sheep so they look like they're inside
      c.fillStyle = '#e0ad6a'; c.strokeStyle = '#8a5a2b';
      const gw = w * 0.28, gx = W > H ? x : x + w * 0.36;
      for (const ry of [front - U * 0.06, front - U * 0.03]) {
        c.fillRect(x, ry, gx - x, rail); c.strokeRect(x, ry, gx - x, rail);
        c.fillRect(gx + gw, ry, x + w - gx - gw, rail); c.strokeRect(gx + gw, ry, x + w - gx - gw, rail);
      }
      for (let i = 0; i <= 6; i++) { const px = x + (w * i) / 6; if (px > gx + 2 && px < gx + gw - 2) continue; c.fillRect(px - post / 2, front - U * 0.08, post, U * 0.08); c.strokeRect(px - post / 2, front - U * 0.08, post, U * 0.08); }
      // gate: swings open (1) or shut (0)
      c.save(); c.translate(gx, front - U * 0.07);
      c.scale(1 - gate * 0.85, 1);
      c.fillStyle = '#ffcf7a';
      for (const ry of [U * 0.01, U * 0.04]) { c.fillRect(0, ry, gw, rail); c.strokeRect(0, ry, gw, rail); }
      c.beginPath(); c.moveTo(0, U * 0.06); c.lineTo(gw, U * 0.01); c.lineWidth = rail * 0.8; c.strokeStyle = '#d8a45f'; c.stroke();
      c.restore();
    };
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    meadow.draw(c, W, H, t, dt, 0, H * 0.4);
    const front = drawPen(), s = size();
    for (const sh of [...sheep].sort((a, b) => a.y - b.y)) {
      sh.t += dt; sh.bleat = Math.max(0, sh.bleat - dt);
      let hop = 0, walking = false, rot = 0;
      if (sh.state === 'enter' || sh.state === 'wander') {
        const dx = sh.tx - sh.x, dy = sh.ty - sh.y, d = Math.hypot(dx, dy), sp = U * 0.12;
        if (d > 3) { sh.x += (dx / d) * sp * dt; sh.y += (dy / d) * sp * dt; walking = true; sh.flip = dx > 0; hop = Math.abs(Math.sin(sh.t * 9)) * s * 0.04; }
        else { sh.state = 'wander'; if (Math.random() < dt * 0.5) { const p = rndIn(field); sh.tx = p.x; sh.ty = p.y; } }
      } else if (sh.state === 'jump') {
        sh.jt += dt / 0.85; const k = Math.min(1, sh.jt);
        sh.x = sh.fx + (sh.tx - sh.fx) * k; sh.y = sh.fy + (sh.ty - sh.fy) * k;
        hop = Math.sin(k * Math.PI) * U * 0.32; rot = (sh.flip ? 1 : -1) * Math.sin(k * Math.PI * 2) * 0.25;
        if (k >= 1) landed(sh);
      } else if (sh.state === 'pen') {
        if (state === 'done') hop = Math.abs(Math.sin(sh.t * 7)) * s * 0.12;                           // happy dance
        else if (Math.random() < dt * 0.3) sh.flip = !sh.flip;
      } else if (sh.state === 'leave') {
        sh.delay -= dt;
        if (sh.delay < 0) {                       // run back out through the open gate and off screen
          if (W > H) sh.x -= U * 0.55 * dt; else sh.y -= U * 0.45 * dt;
          walking = true; hop = Math.abs(Math.sin(sh.t * 9)) * s * 0.05;
        }
      }
      c.save(); c.translate(sh.x, sh.y - hop); c.rotate(rot);
      drawSheep(c, 0, 0, s, { flip: sh.flip, t: sh.t, walking, bleat: sh.bleat > 0 || sh.state === 'jump' });
      c.restore();
    }
    front();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  round();
  return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); removeEventListener('resize', resize); };
}
