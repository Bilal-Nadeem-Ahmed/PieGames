// All sounds are generated with WebAudio - no audio files needed.
import { getSettings } from './store.js';
import { hush } from './speech.js';

let ctx = null, master = null, noiseBuf = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
  yay() {
    [0, 2, 4, 5].forEach((n, k) => tone(SCALE[n], 0.28, 'triangle', 0.2, k * 0.1));
    tone(SCALE[7], 0.7, 'sine', 0.2, 0.42); tone(SCALE[5], 0.7, 'sine', 0.12, 0.42);
  },
  oops() { tone(392, 0.16, 'sine', 0.16, 0, 330); tone(330, 0.24, 'sine', 0.14, 0.14, 262); },
  giggle() { [900, 1150, 980, 1250, 1050, 1300].forEach((f, k) => tone(f, 0.07, 'triangle', 0.13, k * 0.075, f * 0.8)); },
  boing() { tone(220, 0.3, 'sine', 0.25, 0, 520); },
  baa() {
    if (!on()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    const bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(330, t);
    o.frequency.linearRampToValueAtTime(300, t + 0.7);
    lfo.frequency.value = 7; lg.gain.value = 14;
    lfo.connect(lg).connect(o.frequency);
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 2;
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
    g.gain.setValueAtTime(0.5, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(bp).connect(lp).connect(g).connect(master);
    o.start(t); lfo.start(t); o.stop(t + 0.85); lfo.stop(t + 0.85);
  },
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
  try { a.currentTime = 0; const p = a.play(); p?.catch?.(() => {}); } catch { return false; }
  return true;
}
