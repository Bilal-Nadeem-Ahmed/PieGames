// Shared effects: confetti/sparkles overlay and the "well done" cheer with the player's cartoon.
import { sfx } from './sound.js';
import { say } from './speech.js';
import { currentPlayer } from './store.js';
import { avatarSVG } from './avatar.js';

export const PARTY = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f472b6'];
let cv, cx, parts = [], raf = 0, last = 0;

function ensure() {
  if (cv) return;
  cv = document.createElement('canvas');
  cv.id = 'fx';
  document.body.appendChild(cv);
  cx = cv.getContext('2d');
  resize();
  addEventListener('resize', resize);
}
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d; cv.height = innerHeight * d;
  cx.setTransform(d, 0, 0, d, 0, 0);
}
function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => (p.life -= dt) > 0);
  for (const p of parts) {
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    cx.save();
    cx.globalAlpha = Math.min(1, p.life * 2);
    cx.translate(p.x, p.y); cx.rotate(p.rot);
    cx.fillStyle = p.color;
    if (p.shape === 'star') star(cx, 0, 0, p.size, p.size * 0.45);
    else if (p.shape === 'dot') { cx.beginPath(); cx.arc(0, 0, p.size / 2, 0, 7); cx.fill(); }
    else cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    cx.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
}
export function star(c, x, y, R, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r : R;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fill();
}

export function burst(x, y, { n = 26, colors = PARTY, speed = 380, shape } = {}) {
  ensure();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.7);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 700, life: 0.7 + Math.random() * 0.6,
      color: colors[(Math.random() * colors.length) | 0], size: 8 + Math.random() * 10, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
      shape: shape || ['rect', 'star', 'dot'][(Math.random() * 3) | 0] });
  }
  start();
}
export function confettiRain(n = 140) {
  ensure();
  for (let i = 0; i < n; i++) {
    parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - 0.5) * 120, vy: 100 + Math.random() * 200, g: 120,
      life: 2.5 + Math.random() * 1.5, color: PARTY[(Math.random() * PARTY.length) | 0], size: 10 + Math.random() * 10, rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 8, shape: Math.random() < 0.3 ? 'star' : 'rect' });
  }
  start();
}

const PRAISE = ['Well done', 'Yay', 'Brilliant', 'Great job', 'Amazing', 'Super', 'Hooray'];
export function praise() {
  const p = currentPlayer();
  const w = PRAISE[(Math.random() * PRAISE.length) | 0];
  return p?.name ? `${w}, ${p.name}!` : `${w}!`;
}

// Big celebration: the current player's cartoon jumps up with confetti.
export function celebrate(text = praise()) {
  confettiRain();
  sfx.yay();
  say(text);
  const p = currentPlayer();
  const d = document.createElement('div');
  d.className = 'cheer';
  d.innerHTML = avatarSVG(p, { pose: 'up' });
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2300);
}
