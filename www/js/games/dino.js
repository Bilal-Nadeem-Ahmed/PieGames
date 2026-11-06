// Dino eggs: tap eggs to crack them, baby dinosaurs hatch, roar and dance. Tap a dino to make it roar.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { homeBtn, pick, rnd, shuffle } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { drawDino, drawCloud } from '../draw.js';

const DINO_COLOURS = [['green', '#6fcf5b'], ['orange', '#ff9f43'], ['blue', '#5fa8ff'], ['purple', '#b98cff'], ['pink', '#ff8ac2'], ['yellow', '#ffd43b'], ['red', '#ff6b6b']];

export function mount(el) {
  el.innerHTML = `<div class="game dino"><canvas></canvas>${homeBtn()}</div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d');
  let W, H, S, dpr;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); S = Math.min(W / 900, H / 600); layout(); };
  let eggs = [], hatched = 0, t = 0, raf = 0, last = performance.now(), timer = 0, alive = true;

  function newNest() {
    const n = 3 + rnd(3);
    const cols = shuffle([...DINO_COLOURS]).slice(0, n);
    eggs = cols.map(([name, col], i) => ({ i, name, col, taps: 0, state: 'egg', wob: 0, jump: 0, vy: 0, roar: 0, t: Math.random() * 5, out: 0 }));
    layout();
  }
  function layout() {
    if (!eggs.length) return;
    const n = eggs.length, gap = W / (n + 1);
    eggs.forEach((e, i) => { e.x = gap * (i + 1); e.y = H * 0.8; });
  }
  resize(); addEventListener('resize', resize);
  newNest();

  const R = () => Math.min(70 * S * 1.4, (W / (eggs.length + 1)) * 0.38);

  cv.addEventListener('pointerdown', (ev) => {
    const b = cv.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
    for (const e of eggs) {
      const r = R();
      if (Math.abs(x - e.x) < r * 1.2 && y > e.y - r * 2.8 && y < e.y + r * 0.4) {
        if (e.state === 'egg') {
          e.taps++; e.wob = 0.5; sfx.tap(); buzz(12);
          burst(x, y, { n: 6, colors: ['#fff6dc', '#e9d8a6'], speed: 160, shape: 'dot' });
          if (e.taps >= 3) hatch(e);
        } else { roar(e); }
        return;
      }
    }
    burst(x, y, { n: 6, speed: 140, shape: 'star' });
  });

  function roar(e) {
    e.roar = 0.9; e.vy = -700 * S; sfx.boing();
    roarSound();
    say(pick(['Roar!', 'Rawr!', 'Roooar!']), { pitch: 0.8 });
  }
  function roarSound() { sfx.oops(); }

  function hatch(e) {
    e.state = 'hatched'; e.out = 0; hatched++;
    sfx.pop(4); sfx.giggle(); buzz(30);
    burst(e.x, e.y - R(), { n: 30, colors: ['#fff6dc', '#f1e3b5', e.col], speed: 380 });
    e.vy = -600 * S;
    setTimeout(() => alive && say(`A ${e.name} dinosaur!`), 300);
    if (eggs.every((x) => x.state === 'hatched')) {
      timer = setTimeout(() => {
        if (!alive) return;
        celebrate(`${eggs.length} baby dinosaurs! Hooray!`);
        timer = setTimeout(() => alive && newNest(), 4500);
      }, 1600);
    }
  }

  function drawEgg(e, r) {
    c.save(); c.translate(e.x, e.y);
    c.rotate(Math.sin(t * 30) * e.wob * 0.25);
    c.fillStyle = '#fff6dc'; c.strokeStyle = '#2b2118'; c.lineWidth = 4 * S;
    c.beginPath(); c.ellipse(0, -r, r * 0.8, r, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = e.col + 'aa';
    for (const [dx, dy, rr] of [[-0.3, -1.4, 0.16], [0.3, -1.1, 0.2], [-0.2, -0.6, 0.14], [0.35, -0.5, 0.1], [0, -1.7, 0.1]]) { c.beginPath(); c.arc(dx * r, dy * r, rr * r, 0, 7); c.fill(); }
    c.strokeStyle = '#2b2118'; c.lineWidth = 3 * S;
    if (e.taps >= 1) { c.beginPath(); c.moveTo(-r * 0.5, -r * 1.2); c.lineTo(-r * 0.25, -r * 1.05); c.lineTo(-r * 0.05, -r * 1.25); c.stroke(); }
    if (e.taps >= 2) { c.beginPath(); c.moveTo(-r * 0.05, -r * 1.25); c.lineTo(r * 0.2, -r * 1.05); c.lineTo(r * 0.45, -r * 1.3); c.lineTo(r * 0.7, -r * 1.1); c.stroke(); }
    c.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    // background: sky, volcano, palms, ground
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffcf8a'); g.addColorStop(0.6, '#ffe9c2'); g.addColorStop(1, '#ffe9c2');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    drawCloud(c, W * 0.15, H * 0.15, 60 * S); drawCloud(c, W * 0.55, H * 0.1, 45 * S);
    c.fillStyle = '#8d6e63'; c.beginPath(); c.moveTo(W * 0.62, H * 0.62); c.lineTo(W * 0.74, H * 0.28); c.lineTo(W * 0.8, H * 0.28); c.lineTo(W * 0.92, H * 0.62); c.fill();
    c.fillStyle = '#ff7043'; c.beginPath(); c.moveTo(W * 0.74, H * 0.28); c.lineTo(W * 0.8, H * 0.28); c.lineTo(W * 0.785, H * 0.35); c.lineTo(W * 0.765, H * 0.32); c.lineTo(W * 0.75, H * 0.36); c.fill();
    c.fillStyle = 'rgba(120,120,120,.35)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(W * 0.77 + Math.sin(t + i) * 10, H * 0.24 - i * 30 * S - ((t * 20) % 30) * S, (14 + i * 6) * S, 0, 7); c.fill(); }
    c.fillStyle = '#7cc46a'; c.beginPath(); c.moveTo(0, H * 0.62); c.quadraticCurveTo(W * 0.5, H * 0.55, W, H * 0.62); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    for (const px of [0.06, 0.94]) {
      c.strokeStyle = '#8d5a2b'; c.lineWidth = 14 * S; c.beginPath(); c.moveTo(W * px, H * 0.7); c.quadraticCurveTo(W * px + 20 * S, H * 0.5, W * px, H * 0.35); c.stroke();
      c.fillStyle = '#2f9e44'; for (let a = 0; a < 5; a++) { c.save(); c.translate(W * px, H * 0.35); c.rotate(-2.6 + a * 0.65); c.beginPath(); c.ellipse(45 * S, 0, 50 * S, 13 * S, 0, 0, 7); c.fill(); c.restore(); }
    }
    // nest
    c.fillStyle = '#c69c6d';
    c.beginPath(); c.ellipse(W / 2, H * 0.82, W * 0.42, H * 0.06, 0, 0, 7); c.fill();
    c.strokeStyle = '#9b7447'; c.lineWidth = 4 * S;
    for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(W * 0.1 + i * W * 0.05, H * 0.8); c.lineTo(W * 0.14 + i * W * 0.05, H * 0.85); c.stroke(); }
    const r = R();
    for (const e of eggs) {
      e.wob = Math.max(0, e.wob - dt);
      if (e.state === 'egg') drawEgg(e, r);
      else {
        e.vy += 2200 * S * dt; e.jump = Math.min(0, e.jump + e.vy * dt); if (e.jump === 0) e.vy = 0;
        e.roar = Math.max(0, e.roar - dt); e.t += dt; e.out = Math.min(1, e.out + dt * 3);
        const dance = Math.sin(e.t * 6) * 6 * S;
        c.save(); c.translate(e.x, e.y + e.jump); c.scale(e.out, e.out); c.rotate(Math.sin(e.t * 3) * 0.06);
        drawDino(c, 0, 0, r * 2.3, e.col, { roar: e.roar > 0, t: e.t });
        c.restore();
        // shell bottom
        c.fillStyle = '#fff6dc'; c.strokeStyle = '#2b2118'; c.lineWidth = 3 * S;
        c.beginPath(); c.moveTo(e.x - r * 0.8, e.y - r * 0.5); c.lineTo(e.x - r * 0.5, e.y - r * 0.75 + dance * 0); c.lineTo(e.x - r * 0.2, e.y - r * 0.5); c.lineTo(e.x + r * 0.15, e.y - r * 0.78); c.lineTo(e.x + r * 0.5, e.y - r * 0.5); c.lineTo(e.x + r * 0.8, e.y - r * 0.7);
        c.ellipse(e.x, e.y - r * 0.5, r * 0.8, r * 0.5, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
      }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  say('Tap the eggs!');
  return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); removeEventListener('resize', resize); };
}
