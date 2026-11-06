// Underwater scene for Bubble pop: light rays, lots of swimming fish, coral, seaweed,
// a crab, starfish, a jellyfish and little rising bubbles. Fish dart away when tapped.
import { drawStar } from './draw.js';

const FISH_COLOURS = [
  ['#ff8c42', '#fff'], ['#ffd23f', '#ff8c42'], ['#ff5c8a', '#ffd6e2'], ['#4dd4ac', '#fff'], ['#7b8cff', '#ffd23f'],
  ['#ff6b6b', '#fff'], ['#b98cff', '#fff'], ['#3ec1f3', '#ffe36e'], ['#ffa94d', '#2b2118'],
];

export function drawFish(c, x, y, s, [body, stripe], dir, t) {
  c.save(); c.translate(x, y); if (dir > 0) c.scale(-1, 1);
  const wag = Math.sin(t * 10) * 0.25;
  c.lineWidth = Math.max(1.5, s * 0.06); c.strokeStyle = 'rgba(43,33,24,.85)'; c.lineJoin = 'round';
  // tail
  c.save(); c.translate(s * 0.85, 0); c.rotate(wag);
  c.fillStyle = body; c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 0.6, -s * 0.45); c.lineTo(s * 0.5, 0); c.lineTo(s * 0.6, s * 0.45); c.closePath(); c.fill(); c.stroke();
  c.restore();
  // top fin
  c.fillStyle = body; c.beginPath(); c.moveTo(-s * 0.2, -s * 0.5); c.quadraticCurveTo(s * 0.2, -s * 0.95, s * 0.5, -s * 0.45); c.closePath(); c.fill(); c.stroke();
  // body
  c.beginPath(); c.ellipse(0, 0, s, s * 0.62, 0, 0, 7); c.fill(); c.stroke();
  c.save(); c.clip();
  c.fillStyle = stripe;
  c.fillRect(-s * 0.15, -s, s * 0.22, s * 2); c.fillRect(s * 0.4, -s, s * 0.18, s * 2);
  c.restore();
  c.beginPath(); c.ellipse(0, 0, s, s * 0.62, 0, 0, 7); c.stroke();
  // eye + smile
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * 0.55, -s * 0.12, s * 0.2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(-s * 0.6, -s * 0.1, s * 0.1, 0, 7); c.fill();
  c.beginPath(); c.arc(-s * 0.72, s * 0.18, s * 0.12, 0.2, 2.2); c.stroke();
  c.restore();
}

function drawCrab(c, x, y, s, t) {
  c.save(); c.translate(x, y);
  c.strokeStyle = '#2b2118'; c.lineWidth = s * 0.07; c.fillStyle = '#ff6b4a';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(side * s * 0.5, -s * 0.1 + i * s * 0.12); c.lineTo(side * s * (0.95 + Math.sin(t * 12 + i) * 0.08), s * 0.15 + i * s * 0.1); c.stroke(); }
    c.save(); c.translate(side * s * 0.75, -s * 0.55); c.rotate(side * (0.3 + Math.sin(t * 4) * 0.2));
    c.beginPath(); c.arc(0, 0, s * 0.25, 0, 7); c.fill(); c.stroke(); c.restore();
  }
  c.beginPath(); c.ellipse(0, 0, s * 0.65, s * 0.42, 0, 0, 7); c.fill(); c.stroke();
  for (const ex of [-0.18, 0.18]) {
    c.beginPath(); c.moveTo(ex * s, -s * 0.35); c.lineTo(ex * s, -s * 0.6); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex * s, -s * 0.65, s * 0.12, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#111'; c.beginPath(); c.arc(ex * s, -s * 0.65, s * 0.06, 0, 7); c.fill(); c.fillStyle = '#ff6b4a';
  }
  c.beginPath(); c.arc(0, -s * 0.05, s * 0.15, 0.3, 2.8); c.stroke();
  c.restore();
}

function drawJelly(c, x, y, s, t) {
  c.save(); c.translate(x, y);
  c.strokeStyle = 'rgba(255,140,200,.7)'; c.lineWidth = s * 0.06;
  for (let i = 0; i < 5; i++) {
    const tx = -s * 0.5 + i * s * 0.25;
    c.beginPath(); c.moveTo(tx, 0);
    for (let k = 1; k <= 4; k++) c.lineTo(tx + Math.sin(t * 3 + i + k) * s * 0.12, k * s * 0.3);
    c.stroke();
  }
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  c.fillStyle = 'rgba(255,160,210,.85)'; c.strokeStyle = 'rgba(200,80,150,.9)'; c.lineWidth = s * 0.05;
  c.beginPath(); c.ellipse(0, 0, s * 0.7 * pulse, s * 0.6 / pulse, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(-s * 0.2, -s * 0.2, s * 0.07, 0, 7); c.arc(s * 0.2, -s * 0.2, s * 0.07, 0, 7); c.fill();
  c.restore();
}

export function createSea() {
  const R = Math.random;
  const fish = [];
  const addFish = (x, y, opts = {}) => {
    const depth = opts.depth ?? 0.5 + R() * 0.7;
    fish.push({ x, y, depth, dir: opts.dir ?? (R() < 0.5 ? -1 : 1), v: 0.03 + R() * 0.05, boost: opts.boost || 0,
      col: FISH_COLOURS[(R() * FISH_COLOURS.length) | 0], ph: R() * 7 });
  };
  for (let i = 0; i < 9; i++) addFish(R(), 0.12 + R() * 0.6);
  // a little school swimming together
  const sy = 0.2 + R() * 0.3, sd = R() < 0.5 ? -1 : 1;
  for (let i = 0; i < 5; i++) fish.push({ x: 0.4 + (i % 3) * 0.05, y: sy + Math.floor(i / 3) * 0.06 + (i % 2) * 0.03, depth: 0.45, dir: sd, v: 0.05, boost: 0, col: ['#ffd23f', '#3ec1f3'], ph: i });
  fish.sort((a, b) => a.depth - b.depth);

  const weeds = Array.from({ length: 9 }, (_, i) => ({ x: i / 8 + (R() - 0.5) * 0.06, h: 0.16 + R() * 0.16, col: R() < 0.5 ? '#2e9e5b' : '#3fbf6a' }));
  const corals = Array.from({ length: 4 }, () => ({ x: 0.08 + R() * 0.84, col: ['#ff7aa8', '#ff9f5a', '#c78bff', '#ff6b6b'][(R() * 4) | 0], s: 0.6 + R() * 0.5 }));
  const rocks = Array.from({ length: 3 }, () => ({ x: R(), s: 0.5 + R() * 0.6 }));
  const stars = Array.from({ length: 2 }, () => ({ x: 0.1 + R() * 0.8, col: R() < 0.5 ? '#ff9f43' : '#ff6b8a' }));
  const tiny = Array.from({ length: 22 }, () => ({ x: R(), y: R(), v: 0.03 + R() * 0.06, r: 1.5 + R() * 3 }));
  const crab = { x: 0.3, dir: 1 };
  const jelly = { x: 0.75, y: 0.35 };

  function draw(c, W, H, t, dt) {
    const u = Math.min(W, H);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6fd6f8'); g.addColorStop(0.45, '#2b9bd6'); g.addColorStop(1, '#0f5a93');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // wavy surface sparkle
    c.fillStyle = 'rgba(255,255,255,.25)';
    for (let x = 0; x < W; x += 40) c.fillRect(x + Math.sin(t * 2 + x) * 6, 4 + Math.sin(t * 3 + x * 0.1) * 3, 22, 3);
    // light rays
    for (let i = 0; i < 6; i++) {
      c.fillStyle = `rgba(255,255,255,${0.05 + 0.04 * Math.sin(t * 0.8 + i * 1.7)})`;
      const x0 = W * (i / 5 - 0.05) + Math.sin(t * 0.3 + i) * 20;
      c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + W * 0.08, 0); c.lineTo(x0 + W * 0.22, H); c.lineTo(x0 + W * 0.06, H); c.fill();
    }
    // far reef silhouette
    c.fillStyle = 'rgba(10,60,110,.35)';
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 30) c.lineTo(x, H * 0.78 - Math.abs(Math.sin(x * 0.013)) * H * 0.08 - Math.sin(x * 0.031) * H * 0.03);
    c.lineTo(W, H); c.fill();
    // jellyfish (far)
    jelly.y += Math.sin(t * 0.7) * 0.0006; jelly.x += 0.004 * dt; if (jelly.x > 1.1) jelly.x = -0.1;
    c.globalAlpha = 0.8; drawJelly(c, jelly.x * W, jelly.y * H, u * 0.06, t); c.globalAlpha = 1;
    // fish
    for (const f of fish) {
      f.boost = Math.max(0, f.boost - dt * 1.5);
      f.x += f.dir * (f.v + f.boost) * dt * (0.6 + f.depth * 0.6);
      if (f.x > 1.15) { f.x = -0.15; f.y = 0.1 + R() * 0.62; }
      if (f.x < -0.15) { f.x = 1.15; f.y = 0.1 + R() * 0.62; }
      c.globalAlpha = Math.min(1, 0.45 + f.depth * 0.5);
      drawFish(c, f.x * W, f.y * H + Math.sin(t * 1.5 + f.ph) * 8, u * 0.045 * f.depth, f.col, f.dir, t + f.ph);
    }
    c.globalAlpha = 1;
    // sand
    c.fillStyle = '#f3d79b';
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.9); c.quadraticCurveTo(W * 0.3, H * 0.85, W * 0.55, H * 0.89); c.quadraticCurveTo(W * 0.8, H * 0.93, W, H * 0.88); c.lineTo(W, H); c.fill();
    c.fillStyle = 'rgba(180,140,80,.35)';
    for (let i = 0; i < 40; i++) { const sx = ((i * 97) % 100) / 100 * W, sy2 = H * (0.92 + ((i * 37) % 8) / 100); c.fillRect(sx, sy2, 3, 3); }
    // rocks
    for (const r of rocks) { c.fillStyle = '#8796a8'; c.beginPath(); c.ellipse(r.x * W, H * 0.92, u * 0.07 * r.s, u * 0.045 * r.s, 0, Math.PI, 0); c.fill(); }
    // coral
    for (const co of corals) {
      const bx = co.x * W, by = H * 0.92, s = u * 0.09 * co.s;
      c.strokeStyle = co.col; c.lineCap = 'round'; c.lineWidth = s * 0.22;
      for (const [a, l] of [[-0.5, 0.9], [0, 1.2], [0.5, 0.9], [-0.25, 0.6], [0.3, 0.7]]) {
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.sin(a) * s * 0.3, by - s * l * 0.5, bx + Math.sin(a) * s * l * 0.8, by - Math.cos(a) * s * l); c.stroke();
      }
    }
    // seaweed
    for (const w of weeds) {
      const sx = w.x * W, top = H * (0.95 - w.h);
      c.fillStyle = w.col;
      c.beginPath(); c.moveTo(sx - 8, H);
      c.quadraticCurveTo(sx - 26 + Math.sin(t * 1.4 + w.x * 9) * 16, (H + top) / 2, sx + Math.sin(t + w.x * 9) * 14, top);
      c.quadraticCurveTo(sx + 26 + Math.sin(t * 1.4 + w.x * 9) * 16, (H + top) / 2, sx + 12, H); c.fill();
    }
    // starfish
    for (const s of stars) drawStar(c, s.x * W, H * 0.95, u * 0.03, s.col);
    // crab scuttling along the sand
    crab.x += crab.dir * 0.05 * dt; if (crab.x > 0.95) crab.dir = -1; if (crab.x < 0.05) crab.dir = 1;
    drawCrab(c, crab.x * W, H * 0.94 - Math.abs(Math.sin(t * 10)) * 2, u * 0.05, t);
    // tiny rising bubbles
    c.fillStyle = 'rgba(255,255,255,.55)';
    for (const b of tiny) { b.y -= b.v * dt; if (b.y < -0.02) { b.y = 1; b.x = R(); } c.beginPath(); c.arc(b.x * W + Math.sin(t * 2 + b.x * 20) * 5, b.y * H, b.r, 0, 7); c.fill(); }
  }

  // Tap near a fish: it darts away. Returns true if a fish was tapped.
  function tap(x, y, W, H) {
    const u = Math.min(W, H);
    for (const f of fish) {
      const r = u * 0.045 * f.depth * 1.6;
      if (Math.abs(x - f.x * W) < r * 1.4 && Math.abs(y - f.y * H) < r) { f.boost = 0.6; return true; }
    }
    return false;
  }

  return { draw, tap, addFish };
}
