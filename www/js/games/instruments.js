// Music: play a drum kit, a guitar or a piano. All sounds are synthesised live.
// Every part lights up / moves when played so little ones can see what they touched.
import { audioOut, buzz } from '../sound.js';
import { pauseMusic, resumeMusic } from '../music.js';
import { storage } from '../store.js';
import { homeBtn, chips } from '../ui.js';

const INSTRUMENTS = [
  { id: 'drums', icon: '🥁', label: 'Drums' },
  { id: 'guitar', icon: '🎸', label: 'Guitar' },
  { id: 'piano', icon: '🎹', label: 'Piano' },
  { id: 'xylo', icon: '🎼', label: 'Xylophone' },
  { id: 'bells', icon: '🔔', label: 'Bells' },
];
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// ---------- sound makers ----------
function env(ctx, g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
let noiseBuf = null;
function noise(ctx) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
}

function pianoNote(midi) {
  const a = audioOut(); if (!a) return;
  const { ctx, out } = a, t = ctx.currentTime, f = hz(midi);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2), t + 1.2);
  const g = ctx.createGain(); env(ctx, g, t, 0.004, 0.32, 1.8);
  lp.connect(g).connect(out);
  [[1, 1, 'triangle'], [2, 0.45, 'sine'], [3, 0.2, 'sine'], [4, 0.1, 'sine'], [1.003, 0.35, 'sine']].forEach(([m, v, type]) => {
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f * m; og.gain.value = v;
    o.connect(og).connect(lp); o.start(t); o.stop(t + 2);
  });
  // little hammer "tock"
  const n = noise(ctx), ng = ctx.createGain(), nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f * 4; env(ctx, ng, t, 0.001, 0.05, 0.03);
  n.connect(nf).connect(ng).connect(out); n.start(t); n.stop(t + 0.05);
}

// Karplus-Strong plucked string, rendered once per string and cached.
const pluckCache = {};
function pluck(midi) {
  const a = audioOut(); if (!a) return;
  const { ctx, out } = a;
  if (!pluckCache[midi]) {
    const sr = ctx.sampleRate, len = Math.floor(sr * 2.2), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const period = Math.round(sr / hz(midi)), ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % period;
      const v = 0.996 * 0.5 * (ring[idx] + ring[next]);
      d[i] = ring[idx]; ring[idx] = v; idx = next;
    }
    pluckCache[midi] = buf;
  }
  const s = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  s.buffer = pluckCache[midi]; lp.type = 'lowpass'; lp.frequency.value = 3200; g.gain.value = 0.55;
  s.connect(lp).connect(g).connect(out); s.start();
}

const DRUM = {
  kick(ctx, out, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.35);
    env(ctx, g, t, 0.003, 1, 0.45); o.connect(g).connect(out); o.start(t); o.stop(t + 0.5);
    const n = noise(ctx), ng = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
    env(ctx, ng, t, 0.001, 0.3, 0.02); n.connect(f).connect(ng).connect(out); n.start(t); n.stop(t + 0.05);
  },
  snare(ctx, out, t) {
    const n = noise(ctx), ng = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
    env(ctx, ng, t, 0.002, 0.55, 0.22); n.connect(f).connect(ng).connect(out); n.start(t); n.stop(t + 0.3);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.1);
    env(ctx, g, t, 0.002, 0.45, 0.12); o.connect(g).connect(out); o.start(t); o.stop(t + 0.2);
  },
  tom(ctx, out, t, f0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.4);
    env(ctx, g, t, 0.003, 0.8, 0.45); o.connect(g).connect(out); o.start(t); o.stop(t + 0.5);
  },
  hat(ctx, out, t) {
    const n = noise(ctx), ng = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    env(ctx, ng, t, 0.001, 0.35, 0.07); n.connect(f).connect(ng).connect(out); n.start(t); n.stop(t + 0.1);
  },
  cymbal(ctx, out, t, long) {
    const n = noise(ctx), ng = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = long ? 4000 : 5500;
    env(ctx, ng, t, 0.002, 0.4, long ? 1.6 : 0.9); n.connect(f).connect(ng).connect(out); n.start(t); n.stop(t + 1.8);
    [3.1, 4.7, 6.3].forEach((m) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 300 * m; env(ctx, g, t, 0.002, 0.012, long ? 1.2 : 0.6); o.connect(g).connect(f); o.start(t); o.stop(t + 1.4); });
  },
};
function drum(kind, arg) { const a = audioOut(); if (!a) return; DRUM[kind](a.ctx, a.out, a.ctx.currentTime, arg); }

// wooden xylophone bar: bright sine + a quickly-fading overtone and a mallet click
function xyloNote(midi) {
  const a = audioOut(); if (!a) return;
  const { ctx, out } = a, t = ctx.currentTime, f = hz(midi);
  [[1, 0.5, 0.9], [3.93, 0.16, 0.12], [9.2, 0.05, 0.05]].forEach(([m, v, d]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
    env(ctx, g, t, 0.002, v, d); o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.05);
  });
  const n = noise(ctx), ng = ctx.createGain(), nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2500;
  env(ctx, ng, t, 0.001, 0.12, 0.02); n.connect(nf).connect(ng).connect(out); n.start(t); n.stop(t + 0.04);
}
// handbell: inharmonic partials with a long shimmering ring
function bellNote(midi) {
  const a = audioOut(); if (!a) return;
  const { ctx, out } = a, t = ctx.currentTime, f = hz(midi);
  [[1, 0.28, 2.6], [2.0, 0.14, 2.0], [2.76, 0.1, 1.4], [5.4, 0.05, 0.8], [8.9, 0.025, 0.4]].forEach(([m, v, d]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5 + m; lg.gain.value = f * m * 0.002; lfo.connect(lg).connect(o.frequency);
    env(ctx, g, t, 0.004, v, d); o.connect(g).connect(out); o.start(t); lfo.start(t); o.stop(t + d + 0.1); lfo.stop(t + d + 0.1);
  });
}

// floating note / sparkle at a point, coloured
function floatNote(host, x, y, color, text = pickNote()) {
  const n = document.createElement('div');
  n.className = 'float-note'; n.textContent = text; n.style.left = x + 'px'; n.style.top = y + 'px'; n.style.color = color;
  n.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
  host.appendChild(n); setTimeout(() => n.remove(), 1100);
}
const pickNote = () => ['♪', '♫', '♩', '♬'][(Math.random() * 4) | 0];

// ---------- the screen ----------
export function mount(el) {
  pauseMusic();
  el.innerHTML = `<div class="screen band">${homeBtn()}<div class="stage-area"></div></div>`;
  const root = el.firstElementChild, area = root.querySelector('.stage-area');
  let inst = storage.read('pg.instrument', 'piano');
  root.appendChild(chips(INSTRUMENTS, inst, (id) => { inst = id; storage.write('pg.instrument', id); show(); }));
  let cleanup = null;
  let wasNarrow = area.clientWidth < area.clientHeight;
  const onResize = () => { const n = area.clientWidth < area.clientHeight; if (n !== wasNarrow && inst === 'piano') { wasNarrow = n; show(); } };
  addEventListener('resize', onResize);
  const show = () => { cleanup?.(); cleanup = ({ drums, guitar, piano, xylo, bells })[inst](area, root); };
  show();
  return () => { cleanup?.(); removeEventListener('resize', onResize); resumeMusic(); };
}

// ---------- piano ----------
function piano(area, root) {
  const COLS = ['#ff6b6b', '#ff9f43', '#ffd23f', '#6bd66b', '#4dd4ac', '#5fa8ff', '#9b8cff', '#ff8ac2', '#ff6b6b', '#ff9f43', '#ffd23f'];
  // 11 white keys (C4..F5) when there's room, 8 (C4..C5) on an upright phone
  const narrow = area.clientWidth < area.clientHeight;
  const WHITE = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77].slice(0, narrow ? 8 : 11);
  const BLACK = Object.fromEntries(Object.entries({ 61: 0, 63: 1, 66: 3, 68: 4, 70: 5, 73: 7, 75: 8 }).filter(([, i]) => i < WHITE.length - 1)); // midi -> white key it follows
  const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  area.innerHTML = `<div class="piano"><div class="piano-top"><span>♪</span><span>♫</span><span>♪</span></div><div class="keys"></div></div>`;
  const keys = area.querySelector('.keys');
  keys.style.setProperty('--bw', `calc(100% / ${WHITE.length} * 0.58)`);
  const make = (midi, black, i) => {
    const k = document.createElement('div');
    k.className = 'pkey ' + (black ? 'black' : 'white');
    k.dataset.midi = midi;
    if (!black) { k.style.setProperty('--c', COLS[i]); k.innerHTML = `<span>${NAMES[i % 7]}</span>`; }
    else k.style.left = `calc(${(BLACK[midi] + 1) * (100 / WHITE.length)}% - var(--bw) / 2)`;
    keys.appendChild(k);
  };
  WHITE.forEach((m, i) => make(m, false, i));
  Object.keys(BLACK).forEach((m) => make(+m, true));

  // multi-touch: each finger presses the key under it; sliding moves to the next key (glissando)
  const held = new Map();
  const press = (pid, k, e) => {
    if (held.get(pid) === k) return;
    release(pid);
    if (!k) return;
    held.set(pid, k); k.classList.add('down');
    pianoNote(+k.dataset.midi); buzz(6);
    const r = k.getBoundingClientRect(), ar = area.getBoundingClientRect();
    floatNote(area, r.left - ar.left + r.width / 2, r.top - ar.top + (k.classList.contains('black') ? r.height * 0.6 : r.height * 0.75), k.classList.contains('black') ? '#333' : getComputedStyle(k).getPropertyValue('--c'));
  };
  const release = (pid) => { const k = held.get(pid); if (k) { held.delete(pid); if (![...held.values()].includes(k)) k.classList.remove('down'); } };
  const keyAt = (x, y) => document.elementsFromPoint(x, y).find((n) => n.classList?.contains('pkey'));
  keys.addEventListener('pointerdown', (e) => { e.preventDefault(); keys.setPointerCapture(e.pointerId); press(e.pointerId, keyAt(e.clientX, e.clientY), e); });
  keys.addEventListener('pointermove', (e) => { if (held.has(e.pointerId)) press(e.pointerId, keyAt(e.clientX, e.clientY), e); });
  const up = (e) => release(e.pointerId);
  keys.addEventListener('pointerup', up); keys.addEventListener('pointercancel', up);
  return () => held.clear();
}

// ---------- guitar ----------
function guitar(area) {
  const STRINGS = [43, 47, 50, 55, 59, 67];   // open G major: G2 B2 D3 G3 B3 G4 - every strum sounds nice
  const COLS = ['#ff6b6b', '#ff9f43', '#ffd23f', '#6bd66b', '#5fa8ff', '#c78bff'];
  area.innerHTML = `<div class="guitar">
    <div class="g-body"><div class="g-hole"></div><div class="g-bridge"></div></div>
    <div class="g-neck"><div class="frets">${'<i></i>'.repeat(7)}</div></div>
    <div class="g-head"><b></b><b></b><b></b><b></b><b></b><b></b></div>
    <div class="g-strings">${STRINGS.map((m, i) => `<div class="gstring" data-i="${i}" style="--c:${COLS[i]};--w:${5 - i * 0.6}px"><span></span></div>`).join('')}</div>
  </div>`;
  const zone = area.querySelector('.g-strings'), strings = [...zone.querySelectorAll('.gstring')];
  const hole = area.querySelector('.g-hole');
  const play = (i, x, y) => {
    const s = strings[i]; pluck(STRINGS[i]); buzz(5);
    s.classList.remove('ring'); void s.offsetWidth; s.classList.add('ring');
    hole.classList.remove('glow'); void hole.offsetWidth; hole.classList.add('glow');
    const ar = area.getBoundingClientRect(); floatNote(area, x - ar.left, y - ar.top - 20, COLS[i]);
  };
  // which string is nearest the finger (strings are spread vertically)
  const stringAt = (y) => {
    let best = -1, bd = 1e9;
    strings.forEach((s, i) => { const r = s.getBoundingClientRect(), d = Math.abs(y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = i; } });
    const gap = strings.length > 1 ? Math.abs(strings[1].getBoundingClientRect().top - strings[0].getBoundingClientRect().top) : 40;
    return bd < gap * 0.6 ? best : -1;
  };
  const last = new Map();
  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault(); zone.setPointerCapture(e.pointerId);
    const i = stringAt(e.clientY); last.set(e.pointerId, { i, y: e.clientY });
    if (i >= 0) play(i, e.clientX, e.clientY);
  });
  zone.addEventListener('pointermove', (e) => {
    const L = last.get(e.pointerId); if (!L) return;
    // strum: play every string crossed since the last move
    for (const [i, s] of strings.entries()) {
      const r = s.getBoundingClientRect(), sy = r.top + r.height / 2;
      if ((L.y - sy) * (e.clientY - sy) < 0) play(i, e.clientX, sy);
    }
    L.y = e.clientY;
  });
  const up = (e) => last.delete(e.pointerId);
  zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up);
  return () => last.clear();
}

// ---------- drums ----------
function drums(area) {
  const PARTS = [
    { id: 'crash', cls: 'cymbal', x: 14, y: 22, s: 24, play: () => drum('cymbal', true) },
    { id: 'ride', cls: 'cymbal', x: 86, y: 24, s: 24, play: () => drum('cymbal', false) },
    { id: 'hat', cls: 'cymbal hat', x: 9, y: 58, s: 18, play: () => drum('hat') },
    { id: 'tom1', cls: 'drum', x: 38, y: 30, s: 17, c: '#5fa8ff', play: () => drum('tom', 220) },
    { id: 'tom2', cls: 'drum', x: 62, y: 30, s: 17, c: '#c78bff', play: () => drum('tom', 170) },
    { id: 'snare', cls: 'drum', x: 27, y: 66, s: 20, c: '#ffd23f', play: () => drum('snare') },
    { id: 'floor', cls: 'drum', x: 80, y: 66, s: 21, c: '#6bd66b', play: () => drum('tom', 110) },
    { id: 'kick', cls: 'drum kick', x: 52, y: 70, s: 30, c: '#ff6b6b', play: () => drum('kick') },
  ];
  area.innerHTML = `<div class="drums"></div>`;
  const kit = area.firstElementChild;
  for (const p of PARTS) {
    const d = document.createElement('button');
    d.className = 'dpart ' + p.cls; d.style.cssText = `left:${p.x}%;top:${p.y}%;--s:${p.s}vmin;--c:${p.c || '#f6c945'}`;
    d.innerHTML = p.cls.includes('cymbal') ? '<i></i>' : '<i></i><b></b>';
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault(); p.play(); buzz(p.id === 'kick' ? 25 : 10);
      d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
      const ar = area.getBoundingClientRect(), r = d.getBoundingClientRect();
      const ring = document.createElement('div'); ring.className = 'ripple'; ring.style.left = r.left - ar.left + r.width / 2 + 'px'; ring.style.top = r.top - ar.top + r.height / 2 + 'px';
      ring.style.borderColor = p.c || '#f6c945'; area.appendChild(ring); setTimeout(() => ring.remove(), 600);
      floatNote(area, e.clientX - ar.left, e.clientY - ar.top - 10, p.c || '#d9a400', p.id === 'kick' ? 'BOOM' : p.cls.includes('cymbal') ? '✨' : pickNote());
    });
    kit.appendChild(d);
  }
  return () => {};
}

// ---------- xylophone ----------
function xylo(area) {
  const NOTES = [72, 74, 76, 77, 79, 81, 83, 84];            // C5 .. C6
  const COLS = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
  area.innerHTML = `<div class="xylo"><div class="x-rail top"></div><div class="x-rail bottom"></div><div class="x-bars"></div><div class="mallet">🥢</div></div>`;
  const bars = area.querySelector('.x-bars'), mallet = area.querySelector('.mallet');
  NOTES.forEach((m, i) => {
    const b = document.createElement('div');
    b.className = 'x-bar'; b.dataset.i = i; b.style.setProperty('--c', COLS[i]); b.style.setProperty('--h', 100 - i * 7 + '%');
    b.innerHTML = '<i></i><i></i>';
    bars.appendChild(b);
  });
  const held = new Map();
  const hit = (pid, bar, x, y) => {
    if (held.get(pid) === bar) return; held.set(pid, bar);
    if (!bar) return;
    xyloNote(NOTES[+bar.dataset.i]); buzz(6);
    bar.classList.remove('hit'); void bar.offsetWidth; bar.classList.add('hit');
    const ar = area.getBoundingClientRect();
    mallet.style.left = x - ar.left + 'px'; mallet.style.top = y - ar.top + 'px'; mallet.classList.remove('tap'); void mallet.offsetWidth; mallet.classList.add('tap');
    floatNote(area, x - ar.left, y - ar.top - 30, getComputedStyle(bar).getPropertyValue('--c'));
  };
  const barAt = (x, y) => document.elementsFromPoint(x, y).find((n) => n.classList?.contains('x-bar'));
  bars.addEventListener('pointerdown', (e) => { e.preventDefault(); bars.setPointerCapture(e.pointerId); hit(e.pointerId, barAt(e.clientX, e.clientY), e.clientX, e.clientY); });
  bars.addEventListener('pointermove', (e) => { if (held.has(e.pointerId)) hit(e.pointerId, barAt(e.clientX, e.clientY), e.clientX, e.clientY); });
  const up = (e) => held.delete(e.pointerId);
  bars.addEventListener('pointerup', up); bars.addEventListener('pointercancel', up);
  return () => held.clear();
}

// ---------- bells ----------
function bells(area) {
  const NOTES = [72, 74, 76, 77, 79, 81, 84];
  const COLS = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  area.innerHTML = `<div class="bells"></div>`;
  const row = area.firstElementChild;
  NOTES.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'bell'; b.style.setProperty('--c', COLS[i]); b.style.setProperty('--s', 1.15 - i * 0.06);
    b.innerHTML = `<svg viewBox="0 0 100 140"><rect x="44" y="2" width="12" height="34" rx="6" fill="#8a5a2b"/><circle cx="50" cy="40" r="7" fill="#d4a017"/>
      <path d="M50 42 C24 42 22 70 20 96 C18 108 10 112 8 118 H92 C90 112 82 108 80 96 C78 70 76 42 50 42 Z" fill="var(--c)" stroke="#3a2a20" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 66 C32 56 38 50 46 49" fill="none" stroke="#fff8" stroke-width="6" stroke-linecap="round"/>
      <rect x="6" y="114" width="88" height="10" rx="5" fill="#d4a017" stroke="#3a2a20" stroke-width="3"/>
      <circle class="clapper" cx="50" cy="130" r="8" fill="#5b4636"/></svg>`;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); bellNote(m); buzz(10);
      b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring');
      const ar = area.getBoundingClientRect(), r = b.getBoundingClientRect();
      floatNote(area, r.left - ar.left + r.width / 2, r.top - ar.top, COLS[i], pickNote());
      for (let k = 0; k < 3; k++) floatNote(area, r.left - ar.left + r.width * (0.2 + Math.random() * 0.6), r.top - ar.top + r.height * 0.4, '#ffd23f', '✨');
    });
    row.appendChild(b);
  });
  return () => {};
}
