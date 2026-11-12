// Dreamy sky scene for Balloon pop: glowing sun with turning rays, a soft rainbow, three layers of drifting
// clouds, far-away hot-air balloons, a flock of birds, a kite, rolling hills with swaying flowers,
// butterflies and floating dandelion seeds. Tap a hot-air balloon, bird or butterfly and it reacts.

const R = Math.random;

function cloud(c, x, y, s, alpha = 1) {
  c.save(); c.globalAlpha = alpha;
  const puffs = [[0, 0.1, 0.36], [0.38, -0.16, 0.5], [0.85, -0.06, 0.42], [1.18, 0.12, 0.3]];
  const shape = (dy) => { c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(x + px * s + pr * s, y + py * s + dy); c.arc(x + px * s, y + py * s + dy, pr * s, 0, 7); } c.moveTo(x + 1.3 * s, y + 0.2 * s + dy); c.ellipse(x + 0.6 * s, y + 0.2 * s + dy, 0.75 * s, 0.24 * s, 0, 0, 7); };
  // soft blue-grey underside, then the white puffs on top (one fill, so no seams), then a highlight
  c.fillStyle = '#d6e6f7'; shape(s * 0.08); c.fill();
  c.fillStyle = '#fff'; shape(0); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x + s * 0.3, y - s * 0.32, s * 0.16, 0, 7); c.fill();
  c.restore();
}

function hotAir(c, x, y, s, cols, t) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.8) * 0.04);
  c.strokeStyle = 'rgba(80,60,40,.8)'; c.lineWidth = Math.max(1, s * 0.03);
  c.beginPath(); c.moveTo(-s * 0.32, s * 0.55); c.lineTo(-s * 0.16, s * 0.95); c.moveTo(s * 0.32, s * 0.55); c.lineTo(s * 0.16, s * 0.95); c.stroke();
  c.fillStyle = '#b07a43'; c.fillRect(-s * 0.17, s * 0.93, s * 0.34, s * 0.24);
  // envelope with stripes
  c.beginPath(); c.moveTo(0, s * 0.62); c.bezierCurveTo(-s * 0.75, s * 0.15, -s * 0.6, -s * 0.62, 0, -s * 0.62); c.bezierCurveTo(s * 0.6, -s * 0.62, s * 0.75, s * 0.15, 0, s * 0.62); c.closePath();
  c.save(); c.clip();
  cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-s + (i * 2 * s) / cols.length, -s, (2 * s) / cols.length + 1, 2 * s); });
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-s * 0.2, -s * 0.25, s * 0.14, s * 0.3, -0.3, 0, 7); c.fill();
  c.restore();
  c.restore();
}

function bird(c, x, y, s, t) {
  const f = Math.sin(t * 9) * s * 0.45;
  c.beginPath(); c.moveTo(x - s, y - f); c.quadraticCurveTo(x - s * 0.4, y - s * 0.4 - f * 0.3, x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.4 - f * 0.3, x + s, y - f); c.stroke();
}

function butterfly(c, x, y, s, col, t) {
  const flap = Math.abs(Math.sin(t * 14));
  c.save(); c.translate(x, y);
  c.fillStyle = col; c.strokeStyle = 'rgba(40,30,20,.7)'; c.lineWidth = 1.2;
  for (const sd of [-1, 1]) {
    c.save(); c.scale(sd * (0.25 + flap * 0.75), 1);
    c.beginPath(); c.ellipse(s * 0.45, -s * 0.3, s * 0.5, s * 0.38, -0.4, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(s * 0.35, s * 0.25, s * 0.32, s * 0.26, 0.4, 0, 7); c.fill(); c.stroke();
    c.restore();
  }
  c.fillStyle = '#3b2a1a'; c.beginPath(); c.ellipse(0, 0, s * 0.1, s * 0.45, 0, 0, 7); c.fill();
  c.restore();
}

function hill(c, W, H, base, amp, freq, ph, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, H * base - Math.sin(x * freq + ph) * H * amp - Math.sin(x * freq * 2.3 + ph * 1.7) * H * amp * 0.35);
  c.lineTo(W, H); c.closePath(); c.fill();
}

export function createSky() {
  const layers = [0.35, 0.65, 1].map((d, li) => Array.from({ length: 3 + li }, () => ({ x: R() * 1.3 - 0.15, y: 0.05 + R() * (0.32 - li * 0.06), d, s: 0.6 + R() * 0.5 })));
  const balloons = [
    { x: 0.2, y: 0.3, v: 0.006, s: 0.05, cols: ['#ff6b6b', '#ffd23f', '#ff6b6b', '#ffd23f'], bob: 0, ph: 0 },
    { x: 0.75, y: 0.2, v: -0.004, s: 0.035, cols: ['#5fa8ff', '#fff', '#5fa8ff', '#fff'], bob: 0, ph: 2 },
    { x: 0.5, y: 0.42, v: 0.003, s: 0.028, cols: ['#b98cff', '#ff8ac2', '#4dd4ac'], bob: 0, ph: 4 },
  ];
  let flock = null, nextFlock = 3;
  const flowers = Array.from({ length: 26 }, (_, i) => ({ x: (i + R() * 0.8) / 26, y: 0.9 + R() * 0.08, col: ['#ff6fa5', '#ffd23f', '#fff', '#b98cff', '#ff9f43'][(R() * 5) | 0], s: 0.7 + R() * 0.6 }));
  const flies = Array.from({ length: 3 }, (_, i) => ({ x: R(), y: 0.72 + R() * 0.1, tx: R(), ty: 0.7 + R() * 0.15, col: ['#ff8ac2', '#ffd23f', '#7fd3ff'][i], ph: R() * 7, boost: 0 }));
  const seeds = Array.from({ length: 16 }, () => ({ x: R(), y: R(), v: 0.012 + R() * 0.02, s: 0.6 + R() * 0.6, ph: R() * 7 }));
  const trees = Array.from({ length: 5 }, (_, i) => ({ x: 0.08 + i * 0.21 + (R() - 0.5) * 0.08, s: 0.7 + R() * 0.5 }));

  function draw(c, W, H, t, dt) {
    const u = Math.min(W, H);
    // sky: deep blue at the top fading to a warm glow at the horizon, gently breathing
    const g = c.createLinearGradient(0, 0, 0, H);
    const k = 0.5 + 0.5 * Math.sin(t * 0.05);
    g.addColorStop(0, `hsl(${205 + k * 8}, 85%, ${58 + k * 4}%)`); g.addColorStop(0.55, '#a9dcff'); g.addColorStop(0.78, '#ffe6c7');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sun with slowly turning soft rays
    const sx = W * 0.82, sy = H * 0.12, sr = u * 0.09;
    const glow = c.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 4);
    glow.addColorStop(0, 'rgba(255,240,170,.75)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    c.save(); c.translate(sx, sy); c.rotate(t * 0.08);
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = `rgba(255,236,150,${0.16 + 0.08 * Math.sin(t + i)})`; c.beginPath(); c.moveTo(-sr * 0.25, 0); c.lineTo(0, -sr * 3.2); c.lineTo(sr * 0.25, 0); c.fill(); }
    c.restore();
    c.fillStyle = '#ffe36e'; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(sx - sr * 0.25, sy - sr * 0.25, sr * 0.45, 0, 7); c.fill();
    // soft rainbow behind the hills
    c.save(); c.globalAlpha = 0.28 + 0.08 * Math.sin(t * 0.3); c.lineWidth = u * 0.025;
    ['#ff6b6b', '#ff9f43', '#ffd23f', '#4dd4ac', '#5fa8ff', '#b98cff'].forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(W * 0.3, H * 0.78, W * 0.42 - i * u * 0.025, Math.PI, 0); c.stroke(); });
    c.restore();
    // far clouds
    for (const cl of layers[0]) { cl.x += 0.006 * cl.d * dt; if (cl.x > 1.2) cl.x = -0.3; cloud(c, cl.x * W, cl.y * H, u * 0.12 * cl.s, 0.7); }
    // far hot-air balloons
    for (const b of balloons) {
      b.x += b.v * dt; if (b.x > 1.15) b.x = -0.15; if (b.x < -0.15) b.x = 1.15;
      b.bob = Math.max(0, b.bob - dt);
      const y = (b.y - Math.sin(b.bob * Math.PI) * 0.06 + Math.sin(t * 0.6 + b.ph) * 0.012) * H;
      b.px = b.x * W; b.py = y; b.pr = u * b.s * 2;
      hotAir(c, b.px, y, b.pr, b.cols, t + b.ph);
      if (b.bob > 0) { c.fillStyle = `rgba(255,160,40,${b.bob})`; c.beginPath(); c.ellipse(b.px, y + b.pr * 0.75, b.pr * 0.08, b.pr * 0.18, 0, 0, 7); c.fill(); }
    }
    // middle clouds
    for (const cl of layers[1]) { cl.x += 0.012 * cl.d * dt; if (cl.x > 1.2) cl.x = -0.3; cloud(c, cl.x * W, cl.y * H, u * 0.16 * cl.s, 0.85); }
    // a flock of birds crosses now and then
    nextFlock -= dt;
    if (!flock && nextFlock <= 0) { const dir = R() < 0.5 ? 1 : -1; flock = { x: dir > 0 ? -0.2 : 1.2, y: 0.12 + R() * 0.25, dir, scatter: 0 }; }
    if (flock) {
      flock.x += flock.dir * 0.06 * dt; flock.scatter = Math.max(0, flock.scatter - dt * 0.4);
      c.strokeStyle = 'rgba(50,50,70,.75)'; c.lineWidth = Math.max(1.5, u * 0.004); c.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, sc = flock.scatter;
        bird(c, (flock.x - flock.dir * row * 0.035) * W, (flock.y + row * side * 0.025 - sc * row * 0.05 * side) * H, u * 0.018, t + i * 0.7); }
      flock.px = flock.x * W; flock.py = flock.y * H;
      if (flock.x > 1.3 || flock.x < -0.3) { flock = null; nextFlock = 8 + R() * 10; }
    }
    // hills: far (hazy), middle, front with trees
    hill(c, W, H, 0.74, 0.04, 0.006, 1, '#b9e6b0');
    hill(c, W, H, 0.8, 0.035, 0.009, 3, '#93d67f');
    for (const tr of trees) {
      const tx = tr.x * W, ty = H * 0.8 - Math.sin(tx * 0.009 + 3) * H * 0.035 - Math.sin(tx * 0.009 * 2.3 + 5.1) * H * 0.012, s = u * 0.05 * tr.s;
      c.fillStyle = '#7a5230'; c.fillRect(tx - s * 0.12, ty - s * 0.9, s * 0.24, s * 0.95);
      c.fillStyle = '#3fae4f'; c.beginPath(); c.arc(tx, ty - s * 1.15, s * 0.55, 0, 7); c.arc(tx - s * 0.35, ty - s * 0.85, s * 0.38, 0, 7); c.arc(tx + s * 0.35, ty - s * 0.85, s * 0.38, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(tx - s * 0.15, ty - s * 1.35, s * 0.2, 0, 7); c.fill();
    }
    // kite on a string from the front hill
    const kx = W * 0.14 + Math.sin(t * 0.7) * u * 0.03, ky = H * 0.5 + Math.sin(t * 1.1) * u * 0.02, ks = u * 0.05;
    c.strokeStyle = 'rgba(80,60,40,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(kx, ky + ks); c.quadraticCurveTo(W * 0.22, H * 0.7, W * 0.28, H * 0.86); c.stroke();
    c.save(); c.translate(kx, ky); c.rotate(Math.sin(t * 1.3) * 0.15);
    c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(0, -ks); c.lineTo(ks * 0.7, 0); c.lineTo(0, ks); c.lineTo(-ks * 0.7, 0); c.closePath(); c.fill();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(0, -ks); c.lineTo(ks * 0.7, 0); c.lineTo(0, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, ks); c.lineTo(-ks * 0.7, 0); c.lineTo(0, 0); c.closePath(); c.fill();
    c.strokeStyle = '#ff8ac2'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, ks); for (let i = 1; i <= 6; i++) c.lineTo(Math.sin(t * 4 + i) * ks * 0.3, ks + i * ks * 0.35); c.stroke();
    c.restore();
    // front hill + flowers swaying
    hill(c, W, H, 0.88, 0.025, 0.012, 5, '#7cc96a');
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 30; i++) { const gx = ((i * 131) % 100) / 100 * W, gy = H * (0.9 + ((i * 53) % 9) / 100); c.fillRect(gx, gy, 2, 7); }
    for (const f of flowers) {
      const fx = f.x * W + Math.sin(t * 1.5 + f.x * 20) * 3, fy = f.y * H, s = u * 0.012 * f.s;
      c.strokeStyle = '#3f9a3f'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x * W, fy + s * 3); c.lineTo(fx, fy); c.stroke();
      c.fillStyle = f.col; for (let a = 0; a < 5; a++) { c.beginPath(); c.arc(fx + Math.cos(a * 1.26) * s, fy + Math.sin(a * 1.26) * s, s * 0.75, 0, 7); c.fill(); }
      c.fillStyle = '#ffb347'; c.beginPath(); c.arc(fx, fy, s * 0.55, 0, 7); c.fill();
    }
    // butterflies fluttering over the grass
    for (const b of flies) {
      b.boost = Math.max(0, b.boost - dt);
      const sp = 0.05 + b.boost * 0.4;
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d < 0.02) { b.tx = 0.05 + R() * 0.9; b.ty = b.boost > 0 ? 0.35 + R() * 0.2 : 0.66 + R() * 0.2; }
      else { b.x += (dx / d) * sp * dt; b.y += (dy / d) * sp * dt; }
      b.px = b.x * W; b.py = b.y * H + Math.sin(t * 3 + b.ph) * u * 0.012;
      butterfly(c, b.px, b.py, u * 0.022, b.col, t + b.ph);
    }
    // near clouds, big and see-through
    for (const cl of layers[2]) { cl.x += 0.02 * dt; if (cl.x > 1.25) cl.x = -0.4; cloud(c, cl.x * W, (cl.y + 0.02) * H, u * 0.22 * cl.s, 0.5); }
    // dandelion seeds drifting up
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1;
    for (const s of seeds) {
      s.y -= s.v * dt; if (s.y < -0.03) { s.y = 1.02; s.x = R(); }
      const x = s.x * W + Math.sin(t * 0.9 + s.ph) * u * 0.03, y = s.y * H, r = u * 0.008 * s.s;
      for (let a = 0; a < 6; a++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a * 1.05 + t * 0.5) * r, y + Math.sin(a * 1.05 + t * 0.5) * r); c.stroke(); }
    }
  }

  // Tap: hot-air balloons puff up higher, birds scatter, butterflies flutter up. Returns what was tapped.
  function tap(x, y) {
    for (const b of balloons) if (b.px != null && Math.hypot(x - b.px, y - b.py) < b.pr * 0.9) { b.bob = 1; return 'balloon'; }
    if (flock && Math.hypot(x - flock.px, y - flock.py) < 120) { flock.scatter = 1; return 'bird'; }
    for (const f of flies) if (f.px != null && Math.hypot(x - f.px, y - f.py) < 40) { f.boost = 1.2; f.ty = 0.35 + R() * 0.2; f.tx = R(); return 'butterfly'; }
    return '';
  }
  return { draw, tap };
}
