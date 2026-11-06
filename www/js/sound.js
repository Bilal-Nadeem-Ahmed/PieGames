// All sounds are generated with WebAudio - no audio files needed.
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

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];

export const sfx = {
  pop(i = (Math.random() * 8) | 0) {
    noise(0.07, 0.6, 0, 2400);
    tone(SCALE[i % SCALE.length], 0.16, 'triangle', 0.25, 0.01, SCALE[i % SCALE.length] * 0.6);
  },
  chime(i = 0) {
    const f = SCALE[Math.abs(i) % SCALE.length];
    tone(f, 0.5, 'sine', 0.25); tone(f * 2, 0.35, 'sine', 0.06, 0.02);
  },
  tap() { tone(700, 0.07, 'triangle', 0.12); },
  sparkle() { [0, 2, 4].forEach((n, k) => tone(SCALE[n + 4], 0.18, 'sine', 0.1, k * 0.05)); },
  // Celebration: drum roll -> cymbal + bright fanfare -> sparkly twinkles
  yay() {
    if (!on()) return;
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
  ding() { tone(SCALE[4], 0.18, 'triangle', 0.18); tone(SCALE[7], 0.4, 'triangle', 0.18, 0.1); tone(SCALE[7] * 2, 0.4, 'sine', 0.05, 0.1); },
  oops() { tone(392, 0.16, 'sine', 0.16, 0, 330); tone(330, 0.24, 'sine', 0.14, 0.14, 262); },
  giggle() { [900, 1150, 980, 1250, 1050, 1300].forEach((f, k) => tone(f, 0.07, 'triangle', 0.13, k * 0.075, f * 0.8)); },
  roar() {
    if (!on()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(150, t); o.frequency.linearRampToValueAtTime(230, t + 0.25); o.frequency.exponentialRampToValueAtTime(110, t + 0.8);
    o2.frequency.setValueAtTime(75, t); o2.frequency.linearRampToValueAtTime(115, t + 0.25); o2.frequency.exponentialRampToValueAtTime(55, t + 0.8);
    lfo.frequency.value = 28; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1600, t + 0.25); lp.frequency.linearRampToValueAtTime(500, t + 0.8); lp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 0.06); g.gain.setValueAtTime(0.45, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + 0.9); });
    noise(0.5, 0.12, 0.02, 500);
  },
  boing() { tone(220, 0.3, 'sine', 0.25, 0, 520); },
  baa() { animalSound('sheep'); },
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
