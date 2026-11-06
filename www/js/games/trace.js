// Trace a big letter or number with a finger. A rainbow trail follows the finger; when most of the
// shape is covered the child gets a celebration.
import { sfx, buzz } from '../sound.js';
import { burst } from '../fx.js';

export function traceRound(host, glyph, onDone) {
  host.innerHTML = '<div class="trace"><canvas class="t-guide"></canvas><canvas class="t-ink"></canvas></div>';
  const box = host.firstElementChild, guide = box.querySelector('.t-guide'), ink = box.querySelector('.t-ink');
  const gc = guide.getContext('2d'), ic = ink.getContext('2d');
  let W = 0, H = 0, dpr = 1, samples = [], done = false, hue = 0, last = null, lastChime = 0;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = box.clientWidth; H = box.clientHeight;
    for (const cv of [guide, ink]) { cv.width = W * dpr; cv.height = H * dpr; }
    gc.setTransform(dpr, 0, 0, dpr, 0, 0); ic.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fs = Math.min(H * 0.9, W * (glyph.length > 1 ? 0.5 : 0.85));
    const font = `900 ${fs}px "Baloo 2", "Nunito", system-ui, sans-serif`;
    // soft filled shape + dotted outline as the guide
    gc.clearRect(0, 0, W, H);
    gc.font = font; gc.textAlign = 'center'; gc.textBaseline = 'middle';
    gc.fillStyle = '#ffffffcc'; gc.fillText(glyph, W / 2, H / 2 + fs * 0.04);
    gc.setLineDash([fs * 0.03, fs * 0.04]); gc.lineWidth = Math.max(3, fs * 0.012); gc.strokeStyle = '#7a8aa8';
    gc.strokeText(glyph, W / 2, H / 2 + fs * 0.04); gc.setLineDash([]);
    // sample points inside the shape (used to measure how much has been traced)
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const oc = off.getContext('2d'); oc.font = font; oc.textAlign = 'center'; oc.textBaseline = 'middle';
    oc.fillText(glyph, W / 2, H / 2 + fs * 0.04);
    const data = oc.getImageData(0, 0, W, H).data;
    samples = [];
    const step = Math.max(4, Math.round(fs / 40));
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3] > 128) samples.push([x, y]);
    ic.lineCap = 'round'; ic.lineJoin = 'round'; ic.lineWidth = Math.max(18, fs * 0.09);
  }
  layout();

  function coverage() {
    const d = ic.getImageData(0, 0, W * dpr, H * dpr).data;
    let hit = 0;
    for (const [x, y] of samples) if (d[((Math.round(y * dpr)) * W * dpr + Math.round(x * dpr)) * 4 + 3] > 60) hit++;
    return samples.length ? hit / samples.length : 0;
  }

  const pos = (e) => { const r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  ink.addEventListener('pointerdown', (e) => { if (done) return; ink.setPointerCapture(e.pointerId); last = pos(e); draw(last, last); });
  ink.addEventListener('pointermove', (e) => { if (!last || done) return; const p = pos(e); draw(last, p); last = p; });
  const end = () => {
    if (!last || done) return; last = null;
    if (coverage() > 0.62) { done = true; box.classList.add('done'); const r = box.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, { n: 50, speed: 500 }); onDone?.(); }
  };
  ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);

  function draw(a, b) {
    hue = (hue + 4) % 360;
    ic.strokeStyle = `hsl(${hue},90%,60%)`;
    ic.beginPath(); ic.moveTo(...a); ic.lineTo(...b); ic.stroke();
    const now = performance.now();
    if (now - lastChime > 140) { lastChime = now; sfx.chime((hue / 40) | 0); buzz(5); }
  }
  return { layout };
}
