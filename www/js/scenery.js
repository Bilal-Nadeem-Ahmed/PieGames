// Layered outdoor scenes used by Balloons, Run & Jump and the home screen.
// scroll = how far the camera has moved (px); each layer moves at its own speed (parallax).
// With { zones: true } the world changes as you travel: meadow -> farm -> seaside -> snow -> sunset -> ...
import { drawCloud } from './draw.js';

const rnd = (seed) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`; };
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const THEMES = [
  { id: 'meadow', sky: ['#5bb8ff', '#a9dcff', '#e2f5ff'], far: '#b9e6a0', mid: '#9bdc7c', ground: ['#7fd35c', '#5dbb43'], tuft: '#4ea83a', sun: '#ffe36e', fence: '#f3e3c3', props: ['apple', 'apple', 'pine'], flowers: true },
  { id: 'farm', sky: ['#62b6f5', '#b3dcf7', '#eef7ff'], far: '#cfe6a0', mid: '#b6d77c', ground: ['#a5cf55', '#86b93f'], tuft: '#6f9e33', sun: '#ffe36e', fence: '#c98f55', props: ['barn', 'hay', 'windmill', 'hay', 'apple'], flowers: true },
  { id: 'beach', sky: ['#38b6ff', '#93dcff', '#fff3d1'], far: '#2f9ee0', mid: '#f4dca0', ground: ['#f6dc9e', '#e9c47c'], tuft: null, sun: '#ffe36e', fence: null, props: ['palm', 'umbrella', 'palm', 'castle'], flowers: false, sea: true },
  { id: 'snow', sky: ['#8ec3ee', '#cde4f8', '#f6fbff'], far: '#e9f2fb', mid: '#d8e7f5', ground: ['#ffffff', '#e1edf8'], tuft: null, sun: '#fff6c8', fence: null, props: ['snowpine', 'snowman', 'snowpine', 'snowpine'], flowers: false, snow: true },
  { id: 'sunset', sky: ['#ff8f6b', '#ffbd88', '#ffe6b8'], far: '#c79bd8', mid: '#93bf72', ground: ['#7cbf59', '#5aa743'], tuft: '#4e9a39', sun: '#ff7b47', fence: '#f3e3c3', props: ['apple', 'pine', 'apple'], flowers: true },
];

export function createMeadow({ zones = false } = {}) {
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: rnd(i + 1) * 1.4, y: 0.05 + rnd(i + 11) * 0.22, s: 0.5 + rnd(i + 21) * 0.7, v: 0.006 + rnd(i + 31) * 0.01 }));
  const birds = Array.from({ length: 3 }, (_, i) => ({ x: rnd(i + 41), y: 0.12 + rnd(i + 51) * 0.18, v: 0.03 + rnd(i + 61) * 0.02, ph: i * 2 }));
  const flakes = Array.from({ length: 40 }, (_, i) => ({ x: rnd(i + 71), y: rnd(i + 81), v: 0.04 + rnd(i + 91) * 0.05, r: 1.5 + rnd(i + 101) * 2.5 }));
  let zoneLen = 4000;
  const zoneAt = (worldX) => (zones ? ((Math.floor(worldX / zoneLen) % THEMES.length) + THEMES.length) % THEMES.length : 0);

  function hills(c, W, top, amp, period, offset, color) {
    c.fillStyle = color; c.beginPath(); c.moveTo(0, top + amp * 2);
    for (let x = 0; x <= W + 24; x += 24) c.lineTo(x, top - (Math.sin((x + offset) / period) * 0.6 + Math.sin((x + offset) / (period * 0.37)) * 0.4) * amp);
    c.lineTo(W, 99999); c.lineTo(0, 99999); c.fill();
  }

  function prop(c, kind, x, base, s) {
    switch (kind) {
      case 'apple': case 'pine': case 'snowpine': {
        c.fillStyle = '#8a5a35'; c.fillRect(x - s * 0.08, base - s * 0.55, s * 0.16, s * 0.55);
        if (kind === 'apple') {
          c.fillStyle = '#3fae4f'; for (const [dx, dy, r] of [[0, -0.9, 0.42], [-0.3, -0.62, 0.32], [0.3, -0.62, 0.32]]) { c.beginPath(); c.arc(x + dx * s, base + dy * s, r * s, 0, 7); c.fill(); }
          c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x - 0.12 * s, base - 1.02 * s, 0.16 * s, 0, 7); c.fill();
          c.fillStyle = '#ff5c5c'; for (const [dx, dy] of [[-0.2, -0.8], [0.15, -1], [0.3, -0.6]]) { c.beginPath(); c.arc(x + dx * s, base + dy * s, 0.05 * s, 0, 7); c.fill(); }
        } else {
          const snow = kind === 'snowpine';
          c.fillStyle = snow ? '#2e7d55' : '#2f8f47'; c.beginPath(); c.moveTo(x, base - 1.35 * s); c.lineTo(x + 0.42 * s, base - 0.45 * s); c.lineTo(x - 0.42 * s, base - 0.45 * s); c.fill();
          c.fillStyle = snow ? '#358f61' : '#38a352'; c.beginPath(); c.moveTo(x, base - 1.6 * s); c.lineTo(x + 0.32 * s, base - 0.85 * s); c.lineTo(x - 0.32 * s, base - 0.85 * s); c.fill();
          if (snow) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, base - 1.6 * s); c.lineTo(x + 0.14 * s, base - 1.27 * s); c.lineTo(x - 0.14 * s, base - 1.27 * s); c.fill();
            c.beginPath(); c.ellipse(x, base - 0.47 * s, 0.4 * s, 0.06 * s, 0, 0, 7); c.fill(); }
        }
        break;
      }
      case 'barn': {
        const w = s * 1.1, h = s * 0.75;
        c.fillStyle = '#d64545'; c.fillRect(x - w / 2, base - h, w, h);
        c.fillStyle = '#8f2a2a'; c.beginPath(); c.moveTo(x - w * 0.6, base - h); c.lineTo(x, base - h - s * 0.45); c.lineTo(x + w * 0.6, base - h); c.fill();
        c.fillStyle = '#fff'; c.fillRect(x - w * 0.18, base - h * 0.6, w * 0.36, h * 0.6);
        c.strokeStyle = '#d64545'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(x - w * 0.18, base - h * 0.6); c.lineTo(x + w * 0.18, base); c.moveTo(x + w * 0.18, base - h * 0.6); c.lineTo(x - w * 0.18, base); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x, base - h - s * 0.12, s * 0.09, 0, 7); c.fill();
        break;
      }
      case 'hay': {
        c.fillStyle = '#e9c45a'; c.beginPath(); c.ellipse(x, base - s * 0.22, s * 0.3, s * 0.22, 0, 0, 7); c.fill();
        c.strokeStyle = '#c9a03a'; c.lineWidth = s * 0.03; c.beginPath(); c.ellipse(x + s * 0.12, base - s * 0.22, s * 0.12, s * 0.17, 0, 0, 7); c.stroke();
        break;
      }
      case 'windmill': {
        c.fillStyle = '#f2ece2'; c.beginPath(); c.moveTo(x - s * 0.16, base); c.lineTo(x - s * 0.08, base - s * 1.1); c.lineTo(x + s * 0.08, base - s * 1.1); c.lineTo(x + s * 0.16, base); c.fill();
        c.save(); c.translate(x, base - s * 1.1); c.rotate(performance.now() / 900);
        c.fillStyle = '#ffffff'; c.strokeStyle = '#9a8f80'; c.lineWidth = 2;
        for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.rect(-s * 0.05, 0, s * 0.1, s * 0.5); c.fill(); c.stroke(); }
        c.restore(); c.fillStyle = '#9a8f80'; c.beginPath(); c.arc(x, base - s * 1.1, s * 0.05, 0, 7); c.fill();
        break;
      }
      case 'palm': {
        c.strokeStyle = '#a0703f'; c.lineWidth = s * 0.1; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + s * 0.2, base - s * 0.6, x + s * 0.05, base - s * 1.2); c.stroke();
        c.fillStyle = '#2fa84f';
        for (let a = 0; a < 5; a++) { c.save(); c.translate(x + s * 0.05, base - s * 1.2); c.rotate(-2.7 + a * 0.6); c.beginPath(); c.ellipse(s * 0.32, 0, s * 0.36, s * 0.08, 0, 0, 7); c.fill(); c.restore(); }
        c.fillStyle = '#7a4b23'; c.beginPath(); c.arc(x + s * 0.02, base - s * 1.15, s * 0.06, 0, 7); c.arc(x + s * 0.12, base - s * 1.14, s * 0.06, 0, 7); c.fill();
        break;
      }
      case 'umbrella': {
        c.strokeStyle = '#8a6a4a'; c.lineWidth = s * 0.04; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - s * 0.8); c.stroke();
        const cols = ['#ff5c7a', '#ffffff', '#ffd23f', '#ffffff', '#5fa8ff'];
        for (let i = 0; i < 5; i++) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(x, base - s * 0.85); c.arc(x, base - s * 0.62, s * 0.45, Math.PI + (i * Math.PI) / 5, Math.PI + ((i + 1) * Math.PI) / 5); c.fill(); }
        break;
      }
      case 'castle': {
        c.fillStyle = '#e8c27e';
        c.fillRect(x - s * 0.3, base - s * 0.35, s * 0.6, s * 0.35); c.fillRect(x - s * 0.15, base - s * 0.55, s * 0.3, s * 0.2);
        for (const dx of [-0.3, -0.12, 0.06, 0.24]) c.fillRect(x + dx * s, base - s * 0.42, s * 0.06, s * 0.07);
        c.fillStyle = '#ff5c7a'; c.beginPath(); c.moveTo(x, base - s * 0.55); c.lineTo(x, base - s * 0.75); c.lineTo(x + s * 0.12, base - s * 0.7); c.lineTo(x, base - s * 0.65); c.fill();
        break;
      }
      case 'snowman': {
        c.fillStyle = '#fff'; c.strokeStyle = '#c9d8e6'; c.lineWidth = 2;
        for (const [dy, r] of [[-0.2, 0.2], [-0.52, 0.15], [-0.76, 0.11]]) { c.beginPath(); c.arc(x, base + dy * s, r * s, 0, 7); c.fill(); c.stroke(); }
        c.fillStyle = '#ff8c2a'; c.beginPath(); c.moveTo(x, base - s * 0.76); c.lineTo(x + s * 0.16, base - s * 0.74); c.lineTo(x, base - s * 0.72); c.fill();
        c.fillStyle = '#222'; c.beginPath(); c.arc(x - s * 0.04, base - s * 0.8, s * 0.015, 0, 7); c.arc(x + s * 0.04, base - s * 0.8, s * 0.015, 0, 7); c.fill();
        c.fillStyle = '#e53935'; c.fillRect(x - s * 0.12, base - s * 0.67, s * 0.24, s * 0.04);
        break;
      }
    }
  }

  function draw(c, W, H, t, dt, scroll = 0, groundY = H * 0.86) {
    const u = Math.min(W, H);
    zoneLen = Math.max(2400, W * 5);
    // the sky/far colours follow the zone under the middle of the screen, blending near boundaries
    const z = scroll / zoneLen, zi = zones ? Math.floor(z) : 0, frac = zones ? z - zi : 0;
    const A = THEMES[zoneAt(zi * zoneLen)], B = THEMES[zoneAt((zi + 1) * zoneLen)];
    const f = smooth((frac - 0.8) / 0.2);
    const sky = (i) => mix(A.sky[i], B.sky[i], f);

    const g = c.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, sky(0)); g.addColorStop(0.7, sky(1)); g.addColorStop(1, sky(2));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sun (sinks a little at sunset)
    const sunset = (A.id === 'sunset' ? 1 - f : 0) + (B.id === 'sunset' ? f : 0);
    const sx = W * 0.7, sy = H * (0.16 + sunset * 0.3), sr = u * (0.07 + sunset * 0.03);
    c.save(); c.translate(sx, sy); c.rotate(t * 0.15);
    c.fillStyle = 'rgba(255,230,120,.35)';
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(-sr * 0.25, sr * 1.15); c.lineTo(sr * 0.25, sr * 1.15); c.lineTo(0, sr * 1.9); c.fill(); }
    c.restore();
    c.fillStyle = mix(A.sun, B.sun, f); c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(sx - sr * 0.3, sy - sr * 0.3, sr * 0.35, 0, 7); c.fill();
    // clouds + birds
    for (const cl of clouds) {
      cl.x += cl.v * dt; const x = (((cl.x * W - scroll * 0.04) % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2;
      c.globalAlpha = 0.95; drawCloud(c, x, cl.y * H, u * 0.08 * cl.s); c.globalAlpha = 1;
    }
    c.strokeStyle = '#3b4a5a'; c.lineWidth = Math.max(2, u * 0.005); c.lineCap = 'round';
    for (const b of birds) {
      b.x += b.v * dt; if (b.x > 1.1) b.x = -0.1;
      const bx = b.x * W, by = b.y * H + Math.sin(t * 1.5 + b.ph) * 6, w = u * 0.025, fl = Math.sin(t * 8 + b.ph) * w * 0.5;
      c.beginPath(); c.moveTo(bx - w, by - fl); c.quadraticCurveTo(bx - w * 0.4, by - w * 0.4, bx, by); c.quadraticCurveTo(bx + w * 0.4, by - w * 0.4, bx + w, by - fl); c.stroke();
    }
    // far layer: hills, or the sea at the seaside
    const seaAmt = (A.sea ? 1 - f : 0) + (B.sea ? f : 0);
    hills(c, W, groundY - H * 0.2, H * 0.05 * (1 - seaAmt), W * 0.22, scroll * 0.1, mix(A.far, B.far, f));
    if (seaAmt > 0.01) {
      c.globalAlpha = seaAmt; c.fillStyle = 'rgba(255,255,255,.6)';
      for (let x = -((scroll * 0.1) % 60); x < W; x += 60) c.fillRect(x + Math.sin(t * 2 + x) * 6, groundY - H * 0.19 + Math.sin(t * 1.5 + x * 0.05) * 3, 26, 3);
      c.globalAlpha = 1;
    }
    hills(c, W, groundY - H * 0.1, H * 0.045, W * 0.18, scroll * 0.25 + 400, mix(A.mid, B.mid, f));
    // props: each one belongs to the zone at its own world position, so new places slide in from the right
    const tw = W * 0.23, off = scroll * 0.25;
    for (let i = -1; i < W / tw + 2; i++) {
      const k = Math.floor((i * tw + off) / tw), x = k * tw - off + rnd(k) * tw * 0.5;
      const th = THEMES[zoneAt((k * tw - W) / 0.25 + W)]; // belongs to the place where it first comes on screen
      if (rnd(k + 7) < 0.75) prop(c, th.props[Math.floor(rnd(k + 5) * th.props.length)], x, groundY - H * 0.07, u * (0.12 + rnd(k + 3) * 0.06));
    }
    // fence (only where the zone has one)
    const fw = u * 0.09, fp = scroll * 0.6;
    c.lineWidth = 2;
    for (let i = -1; i < W / fw + 2; i++) {
      const k = Math.floor(fp / fw) + i, x = k * fw - fp, th = THEMES[zoneAt((k * fw - W) / 0.6 + W)];
      if (!th.fence) continue;
      c.fillStyle = th.fence; c.strokeStyle = 'rgba(0,0,0,.18)';
      c.fillRect(x, groundY - u * 0.075, fw, u * 0.014); c.fillRect(x, groundY - u * 0.045, fw, u * 0.014);
      c.beginPath(); c.roundRect(x, groundY - u * 0.095, u * 0.022, u * 0.1, [u * 0.011, u * 0.011, 0, 0]); c.fill(); c.stroke();
    }
    // ground, drawn in strips so each place's ground arrives with it
    const strip = 16;
    for (let x = 0; x < W; x += strip) {
      const th = THEMES[zoneAt(scroll + x)];
      const gg = c.createLinearGradient(0, groundY, 0, H); gg.addColorStop(0, th.ground[0]); gg.addColorStop(1, th.ground[1]);
      c.fillStyle = gg; c.fillRect(x, groundY, strip + 1, H - groundY);
    }
    // grass tufts, flowers, shells
    const gw = u * 0.06, gp = scroll;
    for (let i = -1; i < W / gw + 2; i++) {
      const k = Math.floor(gp / gw) + i, x = k * gw - gp, y = groundY + 4 + rnd(k + 2) * (H - groundY - 12);
      const th = THEMES[zoneAt(k * gw)];
      if (th.tuft) { c.strokeStyle = th.tuft; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y - 9); c.moveTo(x + 3, y); c.lineTo(x + 4, y - 11); c.stroke(); }
      if (th.flowers && rnd(k + 9) < 0.35) { c.fillStyle = ['#ff6fa5', '#ffd23f', '#ffffff', '#b38cff'][Math.floor(rnd(k + 4) * 4)]; c.beginPath(); c.arc(x + 8, y - 6, 4, 0, 7); c.fill(); c.fillStyle = '#ffb300'; c.beginPath(); c.arc(x + 8, y - 6, 1.6, 0, 7); c.fill(); }
      if (th.sea && rnd(k + 9) < 0.2) { c.fillStyle = '#ffd1dc'; c.beginPath(); c.arc(x + 8, y - 4, 5, Math.PI, 0); c.fill(); }
    }
    // falling snow in the snowy place
    const snowAmt = (A.snow ? 1 - f : 0) + (B.snow ? f : 0);
    if (snowAmt > 0.01) {
      c.fillStyle = `rgba(255,255,255,${0.9 * snowAmt})`;
      for (const fl of flakes) { fl.y += fl.v * dt; if (fl.y > 1) { fl.y = 0; fl.x = Math.random(); } c.beginPath(); c.arc(((fl.x * W + Math.sin(t + fl.x * 9) * 12 - scroll * 0.2) % W + W) % W, fl.y * H, fl.r, 0, 7); c.fill(); }
    }
  }
  return { draw };
}
