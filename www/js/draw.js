// Canvas drawings shared by the games: balloons, bubbles, sheep, dinosaurs, clouds.
export function drawBalloon(c, x, y, r, color, t = 0) {
  c.save();
  c.strokeStyle = 'rgba(70,70,70,.55)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, y + r * 1.25);
  for (let i = 1; i <= 4; i++) c.quadraticCurveTo(x + Math.sin(t * 3 + i) * r * 0.25, y + r * (1.25 + i * 0.3 - 0.15), x, y + r * (1.25 + i * 0.3));
  c.stroke();
  c.fillStyle = color;
  c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(x, y + r * 1.1); c.lineTo(x - r * 0.13, y + r * 1.28); c.lineTo(x + r * 0.13, y + r * 1.28); c.fill();
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.2);
  g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.beginPath(); c.ellipse(x - r * 0.42, y - r * 0.45, r * 0.13, r * 0.26, -0.5, 0, 7); c.fill();
  c.restore();
}

export function drawBubble(c, x, y, r, tint, t = 0) {
  c.save();
  const g = c.createRadialGradient(x, y, r * 0.6, x, y, r);
  g.addColorStop(0, tint ? tint + '22' : 'rgba(255,255,255,0.04)');
  g.addColorStop(0.85, tint ? tint + '66' : 'rgba(180,230,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0.85)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  // rainbow sheen
  c.globalAlpha = 0.35; c.lineWidth = r * 0.08;
  const hue = (t * 40) % 360;
  c.strokeStyle = `hsl(${hue},90%,65%)`; c.beginPath(); c.arc(x, y, r * 0.9, 0.2, 1.4); c.stroke();
  c.strokeStyle = `hsl(${(hue + 140) % 360},90%,65%)`; c.beginPath(); c.arc(x, y, r * 0.9, 3.4, 4.4); c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,.9)';
  c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.42, r * 0.16, r * 0.1, -0.7, 0, 7); c.fill();
  c.beginPath(); c.arc(x + r * 0.45, y + r * 0.38, r * 0.06, 0, 7); c.fill();
  c.restore();
}

export function drawCloud(c, x, y, s) {
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(x, y, s * 0.5, 0, 7); c.arc(x + s * 0.5, y - s * 0.2, s * 0.6, 0, 7); c.arc(x + s, y, s * 0.5, 0, 7);
  c.fill();
  c.fillRect(x, y - s * 0.1, s, s * 0.6 - s * 0.1);
}

// Sheep standing on (x, y). s = overall size in px. Faces left unless flip.
export function drawSheep(c, x, y, s, { flip = false, t = 0, walking = false, bleat = false } = {}) {
  const u = s / 100;
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  const leg = (lx, ph) => {
    const sw = walking ? Math.sin(t * 12 + ph) * 6 * u : 0;
    c.fillStyle = '#2f2f33';
    c.beginPath(); c.roundRect(lx - 5 * u + sw, -30 * u, 10 * u, 30 * u, 4 * u); c.fill();
  };
  leg(-28 * u, 0); leg(-12 * u, 3); leg(14 * u, 3); leg(30 * u, 0);
  const puffs = [[0, -55, 30], [-28, -52, 22], [28, -52, 22], [-18, -72, 22], [16, -74, 22], [-34, -66, 16], [36, -66, 16], [0, -40, 22], [-22, -40, 18], [24, -40, 18]];
  c.fillStyle = '#3a3330';
  for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px * u, py * u, (pr + 3) * u, 0, 7); c.fill(); }
  c.fillStyle = '#fbfaf6';
  for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px * u, py * u, pr * u, 0, 7); c.fill(); }
  // head
  const hx = -44 * u, hy = -66 * u;
  c.fillStyle = '#34302e';
  c.beginPath(); c.ellipse(hx - 14 * u, hy - 4 * u, 14 * u, 6 * u, -0.5, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hx + 14 * u, hy - 8 * u, 14 * u, 6 * u, 0.4, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hx, hy + 4 * u, 17 * u, 21 * u, 0, 0, 7); c.fill();
  c.fillStyle = '#fbfaf6';
  c.beginPath(); c.arc(hx - 4 * u, hy - 16 * u, 8 * u, 0, 7); c.arc(hx + 6 * u, hy - 17 * u, 7 * u, 0, 7); c.fill();
  for (const ex of [-7, 7]) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(hx + ex * u, hy - 2 * u, 6.5 * u, 0, 7); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(hx + ex * u - 1.5 * u, hy - 1 * u, 3.2 * u, 0, 7); c.fill();
  }
  c.fillStyle = '#ff9a9a';
  if (bleat) { c.beginPath(); c.ellipse(hx, hy + 15 * u, 5 * u, 6 * u, 0, 0, 7); c.fill(); }
  else { c.strokeStyle = '#ff9a9a'; c.lineWidth = 2 * u; c.beginPath(); c.arc(hx, hy + 11 * u, 5 * u, 0.3, 2.8); c.stroke(); }
  c.restore();
}

// Cute baby dinosaur standing on (x, y). Faces right unless flip.
export function drawDino(c, x, y, s, color = '#6fcf5b', { flip = false, t = 0, roar = false, walking = false } = {}) {
  const u = s / 100;
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  const dark = 'rgba(0,0,0,.25)';
  c.lineWidth = 3 * u; c.strokeStyle = '#2b2118'; c.lineJoin = 'round';
  // tail
  c.fillStyle = color;
  c.beginPath(); c.moveTo(-20 * u, -40 * u); c.quadraticCurveTo(-62 * u, -30 * u, -70 * u, -10 * u); c.quadraticCurveTo(-40 * u, -16 * u, -10 * u, -20 * u); c.closePath(); c.fill(); c.stroke();
  // spikes
  c.fillStyle = '#ffb347';
  for (let i = 0; i < 4; i++) { const sx = -38 * u + i * 16 * u, sy = -58 * u - (i > 1 ? 6 * u : 0); c.beginPath(); c.moveTo(sx - 7 * u, sy + 6 * u); c.lineTo(sx, sy - 10 * u); c.lineTo(sx + 7 * u, sy + 6 * u); c.closePath(); c.fill(); c.stroke(); }
  // legs
  const sw = walking ? Math.sin(t * 12) * 6 * u : 0;
  c.fillStyle = color;
  c.beginPath(); c.roundRect(-22 * u + sw, -22 * u, 16 * u, 22 * u, 6 * u); c.fill(); c.stroke();
  c.beginPath(); c.roundRect(4 * u - sw, -22 * u, 16 * u, 22 * u, 6 * u); c.fill(); c.stroke();
  // body
  c.beginPath(); c.ellipse(0, -36 * u, 34 * u, 26 * u, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(8 * u, -30 * u, 18 * u, 15 * u, 0, 0, 7); c.fill();
  // head
  c.fillStyle = color;
  c.beginPath(); c.ellipse(30 * u, -72 * u, 28 * u, 24 * u, 0, 0, 7); c.fill(); c.stroke();
  // eye
  c.fillStyle = '#fff'; c.beginPath(); c.arc(36 * u, -80 * u, 8 * u, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(38 * u, -79 * u, 4.5 * u, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(39.5 * u, -81 * u, 1.6 * u, 0, 7); c.fill();
  // mouth
  if (roar) { c.fillStyle = '#b5473a'; c.beginPath(); c.ellipse(46 * u, -60 * u, 9 * u, 8 * u, 0, 0, 7); c.fill(); c.stroke(); }
  else { c.beginPath(); c.arc(42 * u, -66 * u, 8 * u, 0.3, 2.4); c.stroke(); }
  c.fillStyle = dark; c.beginPath(); c.arc(54 * u, -74 * u, 2 * u, 0, 7); c.fill();
  // cheeks
  c.fillStyle = 'rgba(255,120,120,.4)'; c.beginPath(); c.ellipse(24 * u, -64 * u, 6 * u, 4 * u, 0, 0, 7); c.fill();
  c.restore();
}

export function drawStar(c, x, y, R, color = '#ffd23f') {
  c.save(); c.fillStyle = color; c.strokeStyle = '#c98a00'; c.lineWidth = Math.max(2, R * 0.08); c.lineJoin = 'round';
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? R * 0.48 : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke(); c.restore();
}
