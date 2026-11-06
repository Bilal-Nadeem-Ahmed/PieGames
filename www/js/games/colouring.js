// Colouring: tap a shape to fill it, or switch to the brush and draw freehand. Work is saved automatically.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getPictures } from '../pictures.js';
import { storage } from '../store.js';
import { homeBtn, ICON } from '../ui.js';
import { burst } from '../fx.js';

const PALETTE = ['#ef4444', '#fb923c', '#facc15', '#a3e635', '#22c55e', '#38bdf8', '#3b82f6', '#a855f7', '#f472b6', '#a16207', '#fde7d3', '#111827', '#ffffff', 'rainbow'];
const NAMES = { '#ef4444': 'red', '#fb923c': 'orange', '#facc15': 'yellow', '#a3e635': 'light green', '#22c55e': 'green', '#38bdf8': 'light blue', '#3b82f6': 'blue', '#a855f7': 'purple', '#f472b6': 'pink', '#a16207': 'brown', '#fde7d3': 'peach', '#111827': 'black', '#ffffff': 'white', rainbow: 'rainbow' };
const RES = 1024;
const key = (id) => 'pg.colour.' + id;

export function mount(el, { pic } = {}) {
  return pic ? editor(el, pic) : gallery(el);
}

function applySaved(svgEl, id) {
  const d = storage.read(key(id), null);
  if (!d?.fills) return d;
  for (const [rid, col] of Object.entries(d.fills)) svgEl.querySelector('#' + CSS.escape(rid))?.setAttribute('fill', col);
  return d;
}

function gallery(el) {
  el.innerHTML = `<div class="screen gallery">${homeBtn()}<div class="grid"></div></div>`;
  const grid = el.querySelector('.grid');
  for (const p of getPictures()) {
    const b = document.createElement('button');
    b.className = 'thumb';
    b.innerHTML = p.svg();
    const d = applySaved(b.querySelector('svg'), p.id);
    if (d?.img) { const im = new Image(); im.src = d.img; im.className = 'thumb-ink'; b.appendChild(im); }
    b.onclick = () => { sfx.tap(); location.hash = '#colour/' + p.id; };
    grid.appendChild(b);
  }
}

function editor(el, id) {
  const pic = getPictures().find((p) => p.id === id);
  if (!pic) { location.hash = '#colour'; return; }
  el.innerHTML = `<div class="screen colour">
    <div class="tools">
      ${homeBtn()}
      <button class="rbtn" data-a="pics" aria-label="Pictures">${ICON.pics}</button>
      <button class="rbtn tool on" data-t="fill" aria-label="Fill">${ICON.bucket}</button>
      <button class="rbtn tool" data-t="brush" aria-label="Brush">${ICON.brush}</button>
      <button class="rbtn tool" data-t="eraser" aria-label="Eraser">${ICON.eraser}</button>
      <button class="rbtn size" data-a="size" aria-label="Brush size"><span></span></button>
      <button class="rbtn" data-a="undo" aria-label="Undo">${ICON.undo}</button>
      <button class="rbtn" data-a="clear" aria-label="Start again">${ICON.trash}</button>
    </div>
    <div class="stage"><div class="paper">${pic.svg()}<canvas width="${RES}" height="${RES}"></canvas></div></div>
    <div class="palette"></div>
  </div>`;
  const root = el.firstElementChild, stage = root.querySelector('.stage'), paper = root.querySelector('.paper');
  const svg = paper.querySelector('svg'), cv = paper.querySelector('canvas'), c = cv.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';

  let tool = 'fill', colour = PALETTE[0], hue = 0, big = false;
  const undo = [];
  const saved = applySaved(svg, id) || {};
  const fills = { ...(saved.fills || {}) };
  if (saved.img) { const im = new Image(); im.onload = () => c.drawImage(im, 0, 0, RES, RES); im.src = saved.img; }

  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => {
    let img = null;
    try { img = inkUsed ? cv.toDataURL('image/png') : null; } catch {}
    storage.write(key(id), { fills, img });
  }, 500); };
  let inkUsed = !!saved.img;

  // palette
  const pal = root.querySelector('.palette');
  PALETTE.forEach((col, i) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (i === 0 ? ' on' : '') + (col === 'rainbow' ? ' rainbow' : '');
    if (col !== 'rainbow') b.style.background = col;
    b.setAttribute('aria-label', NAMES[col]);
    b.onclick = () => {
      colour = col; pal.querySelectorAll('.swatch').forEach((s) => s.classList.remove('on')); b.classList.add('on');
      sfx.chime(i); say(NAMES[col]);
      if (tool === 'eraser') setTool('fill');
    };
    pal.appendChild(b);
  });

  const nextColour = () => (colour === 'rainbow' ? `hsl(${(hue = (hue + 40) % 360)},90%,60%)` : colour);

  function setTool(t) {
    tool = t;
    root.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    cv.style.pointerEvents = t === 'fill' ? 'none' : 'auto';
  }
  root.querySelectorAll('.tool').forEach((b) => (b.onclick = () => { sfx.tap(); setTool(b.dataset.t); }));
  root.querySelector('[data-a=pics]').onclick = () => { location.hash = '#colour'; };
  const sizeBtn = root.querySelector('[data-a=size]');
  sizeBtn.onclick = () => { big = !big; sizeBtn.classList.toggle('big', big); sfx.tap(); if (tool === 'fill') setTool('brush'); };
  root.querySelector('[data-a=undo]').onclick = () => {
    const u = undo.pop(); if (!u) return sfx.oops();
    sfx.boing();
    if (u.t === 'fill') { svg.querySelector('#' + CSS.escape(u.id)).setAttribute('fill', u.prev); if (u.prev === '#fff') delete fills[u.id]; else fills[u.id] = u.prev; }
    if (u.t === 'ink') c.putImageData(u.data, 0, 0);
    if (u.t === 'clear') { c.putImageData(u.data, 0, 0); Object.assign(fills, u.fills); for (const [k, v] of Object.entries(u.fills)) svg.querySelector('#' + CSS.escape(k))?.setAttribute('fill', v); }
    save();
  };
  root.querySelector('[data-a=clear]').onclick = () => {
    undo.push({ t: 'clear', data: c.getImageData(0, 0, RES, RES), fills: { ...fills } });
    c.clearRect(0, 0, RES, RES);
    for (const k of Object.keys(fills)) { svg.querySelector('#' + CSS.escape(k))?.setAttribute('fill', '#fff'); delete fills[k]; }
    sfx.boing(); save();
  };

  // fill by tapping
  svg.addEventListener('pointerdown', (e) => {
    if (tool !== 'fill') return;
    const r = e.target.closest('.r'); if (!r) return;
    const col = nextColour();
    undo.push({ t: 'fill', id: r.id, prev: r.getAttribute('fill') });
    if (undo.length > 60) undo.shift();
    r.setAttribute('fill', col); fills[r.id] = col;
    sfx.chime((Math.random() * 8) | 0); buzz(10);
    burst(e.clientX, e.clientY, { n: 12, colors: [col, '#fff'], speed: 200, shape: 'star' });
    save();
  });

  // brush / eraser
  let drawing = null;
  const pos = (e) => { const b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * RES, ((e.clientY - b.top) / b.height) * RES]; };
  cv.addEventListener('pointerdown', (e) => {
    if (tool === 'fill') return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    if (!drawing) {
      undo.push({ t: 'ink', data: c.getImageData(0, 0, RES, RES) });
      const inks = undo.filter((u) => u.t !== 'fill'); if (inks.length > 8) undo.splice(undo.indexOf(inks[0]), 1);
    }
    drawing = { id: e.pointerId, p: pos(e), col: nextColour() };
    c.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    c.lineWidth = tool === 'eraser' ? 70 : big ? 46 : 20;
    c.strokeStyle = drawing.col; c.fillStyle = drawing.col;
    c.beginPath(); c.arc(...drawing.p, c.lineWidth / 2, 0, 7); c.fill();
    inkUsed = true;
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing || e.pointerId !== drawing.id) return;
    const p = pos(e);
    if (colour === 'rainbow' && tool === 'brush') { hue = (hue + 3) % 360; c.strokeStyle = `hsl(${hue},90%,60%)`; }
    c.beginPath(); c.moveTo(...drawing.p); c.lineTo(...p); c.stroke();
    drawing.p = p;
  });
  const end = (e) => { if (drawing && e.pointerId === drawing.id) { drawing = null; c.globalCompositeOperation = 'source-over'; save(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  // keep the paper square and as big as possible
  const fit = () => { const s = Math.min(stage.clientWidth, stage.clientHeight) - 8; paper.style.width = paper.style.height = s + 'px'; };
  fit(); addEventListener('resize', fit);
  setTool('fill');
  return () => { removeEventListener('resize', fit); clearTimeout(saveT); let img = null; try { img = inkUsed ? cv.toDataURL('image/png') : null; } catch {} storage.write(key(id), { fills, img }); };
}
