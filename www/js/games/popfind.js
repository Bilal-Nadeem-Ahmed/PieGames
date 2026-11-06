// "Pop the B!" / "Pop number 3!": balloons with labels float up; pop the one that matches.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { burst } from '../fx.js';
import { drawBalloon } from '../draw.js';
import { COLOURS } from '../data.js';
import { pick, shuffle } from '../ui.js';

// options: list of labels; target: the label to find; onRight(); speakWrong(label)
export function popFind(host, { target, options, onRight, wrongText }) {
  host.innerHTML = '<canvas class="popfind"></canvas>';
  const cv = host.firstElementChild, c = cv.getContext('2d');
  let W, H, raf = 0, last = performance.now(), t = 0, won = false;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  fit();
  const cols = shuffle(COLOURS.filter((x) => x.n !== 'white'));
  const R = () => Math.max(36, Math.min(W / (options.length * 2.4), H * 0.14));
  const balloons = shuffle([...options]).map((label, i) => ({
    label, x: ((i + 0.5) / options.length) * W, y: H * (0.45 + Math.random() * 0.5), v: H * (0.07 + Math.random() * 0.04),
    col: cols[i % cols.length].c, ph: Math.random() * 6, popped: false,
  }));

  cv.addEventListener('pointerdown', (e) => {
    if (won) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, rad = R();
    for (const b of balloons) {
      if (b.popped) continue;
      const bx = b.x + Math.sin(t + b.ph) * 14;
      if ((x - bx) ** 2 / (rad * 1.3) ** 2 + (y - b.y) ** 2 / (rad * 1.5) ** 2 <= 1) {
        b.popped = true; sfx.pop(); buzz(15);
        burst(r.left + bx, r.top + b.y, { n: 22, colors: [b.col, '#fff'] });
        if (b.label === target) { won = true; onRight(); }
        else { say(wrongText(b.label)); setTimeout(() => { b.popped = false; b.y = H + rad * 2; }, 900); }
        return;
      }
    }
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    c.clearRect(0, 0, W, H);
    const rad = R();
    for (const b of balloons) {
      if (b.popped) continue;
      b.y -= b.v * dt;
      if (b.y < -rad * 3) b.y = H + rad * 1.5;   // float round again until found
      const bx = b.x + Math.sin(t + b.ph) * 14;
      drawBalloon(c, bx, b.y, rad, b.col, t + b.ph);
      c.font = `900 ${rad * 1.1}px "Baloo 2", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = rad * 0.14; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(b.label, bx, b.y + rad * 0.05);
      c.fillStyle = '#fff'; c.fillText(b.label, bx, b.y + rad * 0.05);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  addEventListener('resize', fit);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); };
}

export const makeOptions = (target, pool, n = 4) => { const s = new Set([target]); while (s.size < Math.min(n, pool.length)) s.add(pick(pool)); return [...s]; };
