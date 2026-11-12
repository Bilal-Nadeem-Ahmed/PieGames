// Colouring: tap a shape to fill it (plain or with a pattern), or switch to a brush (pen, crayon, spray, glitter,
// dots, stars) and draw freehand, or pick stickers. Work is saved automatically.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getPictures } from '../pictures.js';
import { storage } from '../store.js';
import { homeBtn, ICON } from '../ui.js';
import { burst } from '../fx.js';

const PALETTE = ['#ef4444', '#fb923c', '#facc15', '#a3e635', '#22c55e', '#38bdf8', '#3b82f6', '#a855f7', '#f472b6', '#a16207', '#fde7d3', '#111827', '#ffffff', '#f5b301', '#b8c2cc', '#14b8a6', '#c4b5fd', '#991b1b', 'rainbow'];
const NAMES = { '#ef4444': 'red', '#fb923c': 'orange', '#facc15': 'yellow', '#a3e635': 'light green', '#22c55e': 'green', '#38bdf8': 'light blue', '#3b82f6': 'blue', '#a855f7': 'purple', '#f472b6': 'pink', '#a16207': 'brown', '#fde7d3': 'peach', '#111827': 'black', '#ffffff': 'white', '#f5b301': 'gold', '#b8c2cc': 'silver', '#14b8a6': 'teal', '#c4b5fd': 'lavender', '#991b1b': 'dark red', rainbow: 'rainbow' };
const RES = 1024;
const STICKERS = ['⭐', '❤️', '🌈', '☀️', '🌙', '☁️', '🌸', '🌻', '🌷', '🍄', '🦋', '🐞', '🐝', '🐑', '🐘', '🐶', '🐱', '🐰', '🐥', '🦆', '🐄', '🐴', '🦕', '🐟',
  '🐢', '🦄', '🎈', '🎁', '🍓', '🍎', '🍌', '🧁', '🍦', '🚗', '🚂', '🚀', '⛵', '👑', '💎', '🎀'];
const FILLS = ['plain', 'stripes', 'spots', 'stars', 'hearts', 'shiny', 'glitter'];
const BRUSHES = [['pen', '✏️'], ['crayon', '🖍️'], ['spray', '💨'], ['glitter', '✨'], ['dots', '🔵'], ['stars', '⭐']];
const SIZES = [10, 22, 46];

// Fills are stored as a colour ('#ef4444') or a pattern ('pat:stripes:#ef4444'). paintRef turns that into an
// SVG fill, adding the <pattern>/<linearGradient> to that SVG's <defs> the first time it's used.
function patternDef(kind, col, id) {
  const bgc = `<rect width="24" height="24" fill="${col}"/>`, W = 'fill="#fff" fill-opacity=".7"';
  if (kind === 'shiny') return `<linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity=".85"/></linearGradient>`;
  const body = {
    stripes: `${bgc}<path d="M-6 6 L6 -6 M0 24 L24 0 M18 30 L30 18" stroke="#fff" stroke-opacity=".6" stroke-width="5"/>`,
    spots: `${bgc}<circle cx="6" cy="6" r="4" ${W}/><circle cx="18" cy="18" r="4" ${W}/>`,
    stars: `${bgc}<path d="M12 4 l2.4 5 5.4.6 -4 3.7 1.1 5.3 -4.9-2.7 -4.9 2.7 1.1-5.3 -4-3.7 5.4-.6z" ${W}/>`,
    hearts: `${bgc}<path d="M12 19 C4 13 4 7 8.5 6.5 C10.5 6.3 12 8 12 9 C12 8 13.5 6.3 15.5 6.5 C20 7 20 13 12 19Z" ${W}/>`,
    glitter: `${bgc}<circle cx="4" cy="5" r="1.3" fill="#fff"/><circle cx="15" cy="3" r="1" fill="#ffe680"/><circle cx="20" cy="12" r="1.4" fill="#fff"/><circle cx="9" cy="14" r="1" fill="#ffe680"/><circle cx="3" cy="20" r="1.2" fill="#fff"/><circle cx="16" cy="20" r="1" fill="#fff"/><path d="M11 6 v4 M9 8 h4" stroke="#fff" stroke-width="1"/>`,
  }[kind];
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24">${body}</pattern>`;
}
export function paintRef(svgEl, val) {
  if (!val || !val.startsWith('pat:')) return val;
  const [, kind, col] = val.split(':');
  const id = `pg-${kind}-${col.replace(/[^a-z0-9]/gi, '')}`;
  if (!svgEl.querySelector('#' + id)) {
    let defs = svgEl.querySelector('defs');
    if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svgEl.prepend(defs); }
    defs.insertAdjacentHTML('beforeend', patternDef(kind, col, id));
  }
  return `url(#${id})`;
}
const key = (id) => 'pg.colour.' + id;

export function mount(el, { pic } = {}) {
  if (!pic) return gallery(el);
  const d = storage.read(key(pic), null);
  const hasWork = d && (d.img || Object.keys(d.fills || {}).length);
  if (!hasWork) return editor(el, pic);
  // Coming back to a coloured picture: choose "keep going" or "start again" (no reading needed).
  let stop = null;
  chooser(el, pic, (fresh) => {
    if (fresh) storage.write(key(pic), null);
    stop = editor(el, pic);
  });
  return () => stop?.();
}

function chooser(el, id, done) {
  const p = getPictures().find((x) => x.id === id);
  if (!p) { location.hash = '#colour'; return; }
  el.innerHTML = `<div class="screen gallery chooser">${homeBtn()}
    <div class="choose">
      <button class="thumb keep" aria-label="Keep colouring">${p.svg()}<span class="badge">▶</span></button>
      <button class="thumb fresh" aria-label="Start again">${p.svg()}<span class="badge">✨</span></button>
    </div></div>`;
  const keep = el.querySelector('.keep'), fresh = el.querySelector('.fresh');
  const d = applySaved(keep.querySelector('svg'), id);
  if (d?.img) { const im = new Image(); im.src = d.img; im.className = 'thumb-ink'; keep.appendChild(im); }
  keep.onclick = () => { sfx.tap(); done(false); };
  fresh.onclick = () => { sfx.sparkle(); done(true); };
}

function applySaved(svgEl, id) {
  const d = storage.read(key(id), null);
  if (!d?.fills) return d;
  for (const [rid, col] of Object.entries(d.fills)) svgEl.querySelector('#' + CSS.escape(rid))?.setAttribute('fill', paintRef(svgEl, col));
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
      <button class="rbtn tool sticker-btn" data-t="sticker" aria-label="Stickers">⭐</button>
      <button class="rbtn size mid" data-a="size" aria-label="Brush size"><span></span></button>
      <button class="rbtn" data-a="undo" aria-label="Undo">${ICON.undo}</button>
      <button class="rbtn" data-a="clear" aria-label="Start again">${ICON.trash}</button>
    </div>
    <div class="stage"><div class="opts"></div><div class="paperwrap"><div class="paper">${pic.svg()}<canvas width="${RES}" height="${RES}"></canvas></div></div></div>
    <div class="palette"></div>
  </div>`;
  const root = el.firstElementChild, stage = root.querySelector('.stage'), paper = root.querySelector('.paper');
  const svg = paper.querySelector('svg'), cv = paper.querySelector('canvas'), c = cv.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';

  let tool = 'fill', colour = PALETTE[0], hue = 0, size = 1, fillKind = 'plain', brush = 'pen', sticker = null;
  const opts = root.querySelector('.opts'), wrap = root.querySelector('.paperwrap');
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
      if (tool === 'eraser') setTool('fill'); else renderOpts();
    };
    pal.appendChild(b);
  });

  const nextColour = () => (colour === 'rainbow' ? `hsl(${(hue = (hue + 40) % 360)},90%,60%)` : colour);

  // the options row above the paper changes with the tool: fill patterns, brush types or stickers
  function renderOpts() {
    const col = colour === 'rainbow' ? '#ef4444' : colour;
    if (tool === 'fill') opts.innerHTML = FILLS.map((k, i) => `<button class="opt${k === fillKind ? ' on' : ''}" data-k="${k}" aria-label="${k}"><svg viewBox="0 0 40 40">${k === 'plain' ? '' : `<defs>${patternDef(k, col, 'o' + i)}</defs>`}<circle cx="20" cy="20" r="17" fill="${k === 'plain' ? col : `url(#o${i})`}" stroke="#2b2118" stroke-width="2"/></svg></button>`).join('');
    else if (tool === 'brush') opts.innerHTML = BRUSHES.map(([k, e]) => `<button class="opt${k === brush ? ' on' : ''}" data-k="${k}" aria-label="${k}">${e}</button>`).join('');
    else if (tool === 'sticker') opts.innerHTML = `<button class="opt${sticker === null ? ' on' : ''}" data-k="" aria-label="surprise">🎲</button>` + STICKERS.map((e) => `<button class="opt${e === sticker ? ' on' : ''}" data-k="${e}">${e}</button>`).join('');
    else opts.innerHTML = '';
    opts.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
      sfx.tap(); buzz(6);
      if (tool === 'fill') fillKind = b.dataset.k; else if (tool === 'brush') brush = b.dataset.k; else sticker = b.dataset.k || null;
      opts.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === b));
    }));
  }

  function setTool(t) {
    tool = t; renderOpts();
    root.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    cv.style.pointerEvents = t === 'fill' ? 'none' : 'auto';
  }
  root.querySelectorAll('.tool').forEach((b) => (b.onclick = () => { sfx.tap(); setTool(b.dataset.t); }));
  root.querySelector('[data-a=pics]').onclick = () => { location.hash = '#colour'; };
  const sizeBtn = root.querySelector('[data-a=size]');
  sizeBtn.onclick = () => { size = (size + 1) % 3; sizeBtn.classList.toggle('big', size === 2); sizeBtn.classList.toggle('mid', size === 1); sfx.tap(); if (tool === 'fill') setTool('brush'); };
  root.querySelector('[data-a=undo]').onclick = () => {
    const u = undo.pop(); if (!u) return sfx.oops();
    sfx.boing();
    if (u.t === 'fill') { svg.querySelector('#' + CSS.escape(u.id)).setAttribute('fill', paintRef(svg, u.prev)); if (u.prev === '#fff') delete fills[u.id]; else fills[u.id] = u.prev; }
    if (u.t === 'ink') c.putImageData(u.data, 0, 0);
    if (u.t === 'clear') { c.putImageData(u.data, 0, 0); Object.assign(fills, u.fills); for (const [k, v] of Object.entries(u.fills)) svg.querySelector('#' + CSS.escape(k))?.setAttribute('fill', paintRef(svg, v)); }
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
    const col = nextColour(), val = fillKind === 'plain' ? col : `pat:${fillKind}:${col}`;
    undo.push({ t: 'fill', id: r.id, prev: fills[r.id] || '#fff' });
    if (undo.length > 60) undo.shift();
    r.setAttribute('fill', paintRef(svg, val)); fills[r.id] = val;
    if (fillKind !== 'plain') sfx.sparkle();
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
    if (tool === 'sticker') {
      const [x, y] = pos(e), st = sticker || STICKERS[(Math.random() * STICKERS.length) | 0];
      c.save(); c.translate(x, y); c.rotate((Math.random() - 0.5) * 0.6);
      c.font = `${[80, 130, 200][size]}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(st, 0, 0); c.restore();
      sfx.pop(); buzz(12); burst(e.clientX, e.clientY, { n: 14, shape: 'star' });
      inkUsed = true; save(); return;
    }
    drawing = { id: e.pointerId, p: pos(e), col: nextColour(), gap: 0 };
    c.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    c.lineWidth = tool === 'eraser' ? [40, 70, 110][size] : SIZES[size];
    c.strokeStyle = drawing.col; c.fillStyle = drawing.col;
    if (tool === 'eraser' || brush === 'pen') { c.beginPath(); c.arc(...drawing.p, c.lineWidth / 2, 0, 7); c.fill(); }
    else stroke(drawing.p, drawing.p);
    inkUsed = true;
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing || e.pointerId !== drawing.id) return;
    const p = pos(e);
    if (colour === 'rainbow' && tool === 'brush') { hue = (hue + 3) % 360; c.strokeStyle = `hsl(${hue},90%,60%)`; }
    if (tool === 'eraser' || brush === 'pen') { c.beginPath(); c.moveTo(...drawing.p); c.lineTo(...p); c.stroke(); }
    else stroke(drawing.p, p);
    drawing.p = p;
  });
  // the textured brushes stamp little marks along the line
  function star(x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function stroke([x0, y0], [x1, y1]) {
    const w = c.lineWidth, d = Math.hypot(x1 - x0, y1 - y0), col = c.strokeStyle;
    const step = brush === 'dots' ? w * 1.6 : brush === 'stars' ? w * 2.2 : Math.max(2, w * 0.25);
    drawing.gap -= d;
    const n = Math.max(1, Math.ceil(d / Math.max(1, w * 0.25)));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (brush === 'crayon') {
        c.globalAlpha = 0.55; c.fillStyle = col;
        for (let k = 0; k < 7; k++) { const a = Math.random() * 7, rr = Math.random() * w * 0.5; c.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 2.5); }
        c.globalAlpha = 1;
      } else if (brush === 'spray') {
        c.fillStyle = col;
        for (let k = 0; k < 6; k++) { const a = Math.random() * 7, rr = Math.sqrt(Math.random()) * w * 1.4; c.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2, 2); }
      } else if (brush === 'glitter') {
        c.fillStyle = col; c.beginPath(); c.arc(x, y, w * 0.32, 0, 7); c.fill();
        if (Math.random() < 0.5) { c.fillStyle = Math.random() < 0.5 ? '#f5b301' : '#ff8ac2'; const a = Math.random() * 7, rr = Math.random() * w; c.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 3, 3); }
      }
    }
    if (brush === 'dots' || brush === 'stars') {
      // place a dot / star every `step` along the line
      let t = drawing.gap <= 0 ? 0 : -1;
      while (drawing.gap <= 0) {
        const k = d ? Math.min(1, (d + drawing.gap) / d) : 0, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        c.fillStyle = colour === 'rainbow' ? `hsl(${(hue = (hue + 30) % 360)},90%,60%)` : col;
        if (brush === 'dots') { c.beginPath(); c.arc(x, y, w * 0.5, 0, 7); c.fill(); } else star(x, y, w * 0.75);
        drawing.gap += step; t++;
        if (t > 200) break;
      }
    }
    c.fillStyle = col;
  }
  const end = (e) => { if (drawing && e.pointerId === drawing.id) { drawing = null; c.globalCompositeOperation = 'source-over'; save(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  // keep the paper square and as big as possible
  const fit = () => { const s = Math.min(wrap.clientWidth, wrap.clientHeight) - 8; paper.style.width = paper.style.height = s + 'px'; };
  fit(); addEventListener('resize', fit);
  setTool('fill');
  return () => { removeEventListener('resize', fit); clearTimeout(saveT); let img = null; try { img = inkUsed ? cv.toDataURL('image/png') : null; } catch {} storage.write(key(id), { fills, img }); };
}
