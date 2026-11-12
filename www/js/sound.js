// Sound effects: real recordings from www/audio/sfx (see CREDITS.md) where we have them, played through WebAudio;
// everything else (and any recording that hasn't loaded yet) is generated with WebAudio.
import { getSettings, vol } from './store.js';
import { hush } from './speech.js';
import { attachMusic, duck } from './music.js';
import { animalSound } from './animals.js';

let ctx = null, master = null, noiseBuf = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9 * vol('sfx');
    window.addEventListener('pg-settings', () => { master.gain.setTargetAtTime(0.9 * vol('sfx'), ctx.currentTime, 0.05); });
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    attachMusic(ctx);
    loadSamples();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const on = () => ctx && getSettings().sound;

function env(g, t, a, d, peak) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(freq, dur = 0.25, type = 'sine', vol = 0.3, when = 0, slideTo) {
  if (!on()) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  env(g, t, 0.008, dur, vol);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, vol, when = 0, freq = 1800) {
  if (!on()) return;
  const t = ctx.currentTime + when;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  env(g, t, 0.003, dur, vol);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}

// ---- recorded effects: name -> how many takes (name-1.mp3 ...), and a volume trim for each name
const SAMPLES = { pop: 3, boing: 4, giggle: 2, cheer: 1, ding: 1, tada: 2, knock: 2, horn: 1, rocket: 1, firework: 1, magic: 2, poof: 1,
  creak: 1, drip: 1, coin: 2, spray: 1, whoosh: 2, roar: 1, splash: 2, drumroll: 1, brush: 1 };
const TRIM = { coin: 0.45, pop: 0.8, cheer: 0.9, firework: 1.2, splash: 1.1, spray: 0.8, brush: 0.7 };
const buffers = {};
let lastTake = {};
function loadSamples() {
  for (const [name, n] of Object.entries(SAMPLES)) {
    buffers[name] = [];
    for (let i = 1; i <= n; i++) {
      fetch(`audio/sfx/${name}-${i}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => { buffers[name].push(buf); }).catch(() => {});
    }
  }
}
// Plays a random take (not the same one twice running). Returns false if nothing is loaded, so callers fall back to synth.
function sample(name, { rate = 1, vol = 1, when = 0 } = {}) {
  if (!on()) return true;
  const list = buffers[name];
  if (!list?.length) return false;
  let k = (Math.random() * list.length) | 0;
  if (list.length > 1 && k === lastTake[name]) k = (k + 1) % list.length;
  lastTake[name] = k;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = list[k]; src.playbackRate.value = rate;
  g.gain.value = vol * (TRIM[name] ?? 1);
  src.connect(g).connect(master);
  src.start(ctx.currentTime + when);
  return true;
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];

export const sfx = {
  pop(i = (Math.random() * 8) | 0) {
    // real pop, pitched up a little as the count goes up so a run of pops still feels musical
    if (sample('pop', { rate: 0.9 + (Math.abs(i) % 8) * 0.04 })) { tone(SCALE[i % SCALE.length], 0.12, 'triangle', 0.08, 0.02); return; }
    noise(0.07, 0.6, 0, 2400);
    tone(SCALE[i % SCALE.length], 0.16, 'triangle', 0.25, 0.01, SCALE[i % SCALE.length] * 0.6);
  },
  chime(i = 0) {
    const f = SCALE[Math.abs(i) % SCALE.length];
    tone(f, 0.5, 'sine', 0.25); tone(f * 2, 0.35, 'sine', 0.06, 0.02);
  },
  tap() { tone(700, 0.07, 'triangle', 0.12); },
  sparkle() { if (sample('magic', { vol: 0.8 })) return; [0, 2, 4].forEach((n, k) => tone(SCALE[n + 4], 0.18, 'sine', 0.1, k * 0.05)); },
  // Celebration: drum roll -> cymbal + bright fanfare -> sparkly twinkles
  yay() {
    if (!on()) return;
    if (buffers.tada?.length && buffers.cheer?.length) { sample('drumroll', { vol: 0.7 }); sample('tada', { when: 0.9 }); sample('cheer', { when: 1.1, vol: 0.8 }); return; }
    for (let i = 0; i < 9; i++) noise(0.05, 0.18 + i * 0.02, i * 0.045 - i * i * 0.0012, 900);
    const t0 = 0.36;
    noise(1.1, 0.35, t0, 7000);
    const brass = (f, when, dur, vol) => {
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 1.005;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(800, t); lp.frequency.linearRampToValueAtTime(3200, t + 0.06); lp.frequency.linearRampToValueAtTime(1600, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); o2.connect(lp); lp.connect(g).connect(master); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    };
    [[523.25, 0, 0.14], [659.25, 0.13, 0.14], [783.99, 0.26, 0.14], [1046.5, 0.39, 0.6]].forEach(([f, w, d]) => brass(f, t0 + w, d, 0.09));
    brass(659.25, t0 + 0.39, 0.6, 0.05); brass(783.99, t0 + 0.39, 0.6, 0.05);
    [0, 2, 4, 7, 9, 7].forEach((n, k) => tone(SCALE[n % SCALE.length] * 2, 0.25, 'sine', 0.07, t0 + 0.75 + k * 0.07));
  },
  // small "well done" for each pop milestone / right answer
  ding() { if (sample('ding')) return; tone(SCALE[4], 0.18, 'triangle', 0.18); tone(SCALE[7], 0.4, 'triangle', 0.18, 0.1); tone(SCALE[7] * 2, 0.4, 'sine', 0.05, 0.1); },
  oops() { tone(392, 0.16, 'sine', 0.16, 0, 330); tone(330, 0.24, 'sine', 0.14, 0.14, 262); },
  giggle() { if (sample('giggle', { rate: 1 + Math.random() * 0.1 })) return; [900, 1150, 980, 1250, 1050, 1300].forEach((f, k) => tone(f, 0.07, 'triangle', 0.13, k * 0.075, f * 0.8)); },
  roar(p = 1) {
    if (!on()) return;
    // baby dinos get a higher, squeakier roar (played faster); mummy a deep one
    if (sample('roar', { rate: Math.min(2.2, p * 1.15), vol: p > 1.5 ? 0.8 : 1 })) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(150 * p, t); o.frequency.linearRampToValueAtTime(230 * p, t + 0.25); o.frequency.exponentialRampToValueAtTime(110 * p, t + 0.8);
    o2.frequency.setValueAtTime(75 * p, t); o2.frequency.linearRampToValueAtTime(115 * p, t + 0.25); o2.frequency.exponentialRampToValueAtTime(55 * p, t + 0.8);
    lfo.frequency.value = 28; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1600, t + 0.25); lp.frequency.linearRampToValueAtTime(500, t + 0.8); lp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 0.06); g.gain.setValueAtTime(0.45, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + 0.9); });
    noise(0.5, 0.12, 0.02, 500);
  },
  knock() { if (sample('knock', { rate: 0.95 + Math.random() * 0.1 })) return; tone(520, 0.08, 'sine', 0.35, 0, 300); noise(0.04, 0.35, 0, 1800); },
  screw() { tone(180, 0.12, 'sawtooth', 0.08, 0, 260); noise(0.1, 0.15, 0, 3500); },
  saw() { noise(0.16, 0.25, 0, 2200); noise(0.12, 0.12, 0.02, 4500); },
  vroom() { tone(70, 0.9, 'sawtooth', 0.12, 0, 180); tone(140, 0.9, 'square', 0.04, 0, 300); },
  beep() { if (sample('horn')) return; tone(660, 0.14, 'square', 0.08); tone(660, 0.14, 'square', 0.08, 0.2); },
  rocket() { if (sample('rocket')) return; noise(2.2, 0.35, 0, 600); tone(90, 2, 'sawtooth', 0.06, 0, 40); },
  munch() { noise(0.07, 0.4, 0, 1100); noise(0.05, 0.25, 0.08, 2200); },
  boing() { if (sample('boing', { vol: 0.8 })) return; tone(220, 0.3, 'sine', 0.25, 0, 520); },
  baa() { animalSound('sheep'); },
  // new effects (no synth version: they just stay quiet until loaded)
  splash() { sample('splash') || noise(0.4, 0.3, 0, 900); },
  whoosh() { sample('whoosh', { vol: 0.8 }) || noise(0.25, 0.2, 0, 1200); },
  poof() { sample('poof', { vol: 0.8 }); },
  creak() { sample('creak', { vol: 0.7 }); },
  drip() { sample('drip', { rate: 0.9 + Math.random() * 0.3 }); },
  coin(i = 0) { sample('coin', { rate: 1 + (Math.abs(i) % 5) * 0.06 }) || tone(SCALE[(i + 5) % SCALE.length], 0.15, 'square', 0.06); },
  spray() { sample('spray', { vol: 0.6 }); },
  brush() { sample('brush', { vol: 0.6 }); },
  firework() { sample('firework', { vol: 0.8 }); },
  cheer() { sample('cheer', { vol: 0.8 }) || this.yay(); },
};

export function buzz(ms = 12) {
  try { if (getSettings().sound) navigator.vibrate?.(ms); } catch {}
}

// Family voice clips (recorded by a parent), played now and then.
const clips = {};
let lastClip = 0;
export function preloadClip(name) {
  if (clips[name]) return clips[name];
  const a = new Audio(`audio/${name}.m4a`);
  a.preload = 'auto';
  clips[name] = a;
  return a;
}
// Plays the clip if sounds + family clips are on and one hasn't played very recently.
export function playClip(name, minGapMs = 5000) {
  const s = getSettings();
  if (!s.sound || s.familyClips === false) return false;
  const now = Date.now();
  if (now - lastClip < minGapMs) return false;
  lastClip = now;
  const a = preloadClip(name);
  hush();
  duck(2200);
  try { a.currentTime = 0; a.volume = Math.min(1, vol('clips')); const p = a.play(); p?.catch?.(() => {}); } catch { return false; }
  return true;
}

// Direct access to the audio context + effects output (used by the Music game's instruments).
export function audioOut() {
  unlockAudio();
  return ctx ? { ctx, out: master } : null;
}
