// Gentle background music, generated live with WebAudio (music-box melody + soft bass + shaker).
// Songs are traditional public-domain nursery tunes plus one original.
import { getSettings, saveSettings, vol } from './store.js';
const level = () => Math.max(0.0001, 1.5 * vol('music'));

// Notes: "C4/1" = note C4 for 1 beat, "R/1" = rest. Chords: one per bar (4 beats unless set).
export const SONGS = [
  { name: 'Twinkle Twinkle', bpm: 100,
    notes: 'C4/1 C4/1 G4/1 G4/1 A4/1 A4/1 G4/2 F4/1 F4/1 E4/1 E4/1 D4/1 D4/1 C4/2 G4/1 G4/1 F4/1 F4/1 E4/1 E4/1 D4/2 G4/1 G4/1 F4/1 F4/1 E4/1 E4/1 D4/2 C4/1 C4/1 G4/1 G4/1 A4/1 A4/1 G4/2 F4/1 F4/1 E4/1 E4/1 D4/1 D4/1 C4/2',
    chords: 'C C F C F C G C C F C G C F C G C C F C F C G C' , bar: 2 },
  { name: 'Mary Had a Little Lamb', bpm: 116,
    notes: 'E4/1 D4/1 C4/1 D4/1 E4/1 E4/1 E4/2 D4/1 D4/1 D4/2 E4/1 G4/1 G4/2 E4/1 D4/1 C4/1 D4/1 E4/1 E4/1 E4/1 E4/1 D4/1 D4/1 E4/1 D4/1 C4/4',
    chords: 'C C G C C C G C' },
  { name: 'Old MacDonald', bpm: 120,
    notes: 'G4/1 G4/1 G4/1 D4/1 E4/1 E4/1 D4/2 B4/1 B4/1 A4/1 A4/1 G4/3 R/1 G4/1 G4/1 G4/1 D4/1 E4/1 E4/1 D4/2 B4/1 B4/1 A4/1 A4/1 G4/3 R/1',
    chords: 'G C D G G C D G' },
  { name: 'Row Your Boat', bpm: 104,
    notes: 'C4/1.5 C4/1.5 C4/1 D4/0.5 E4/1.5 E4/1 D4/0.5 E4/1 F4/0.5 G4/3 C5/0.5 C5/0.5 C5/0.5 G4/0.5 G4/0.5 G4/0.5 E4/0.5 E4/0.5 E4/0.5 C4/0.5 C4/0.5 C4/0.5 G4/1 F4/0.5 E4/1 D4/0.5 C4/3',
    chords: 'C C C C C G C C', bar: 3 },
  { name: 'Sheepy Hop', bpm: 112, // original tune
    notes: 'C4/0.5 E4/0.5 G4/1 A4/0.5 G4/0.5 E4/1 D4/0.5 E4/0.5 G4/1 E4/2 C4/0.5 E4/0.5 G4/1 A4/0.5 C5/0.5 A4/1 G4/0.5 E4/0.5 D4/1 C4/2 A4/0.5 G4/0.5 A4/1 C5/1 A4/1 G4/0.5 E4/0.5 G4/1 E4/1 D4/1 C4/0.5 D4/0.5 E4/1 G4/1 E4/0.5 D4/0.5 C4/2 R/1',
    chords: 'C C F C F C C G C C' },
];

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); const k = NOTE[m[1]] + (m[2] ? 1 : 0) + (+m[3] + 1) * 12; return 440 * 2 ** ((k - 69) / 12); };
const CHORD_ROOT = { C: 'C3', D: 'D3', E: 'E3', F: 'F3', G: 'G2', A: 'A2', B: 'B2' };

function parse(song) {
  const ev = []; let t = 0;
  for (const tok of song.notes.split(/\s+/)) { const [n, d] = tok.split('/'); ev.push({ t, n, d: +d }); t += +d; }
  return { ev, len: t };
}

let ctx = null, out = null, timer = 0, cur = -1, startAt = 0, nextIdx = 0, loopN = 0, parsed = null;

export function attachMusic(audioCtx) {
  if (ctx) return;
  ctx = audioCtx;
  out = ctx.createGain(); out.gain.value = 0.0001; out.connect(ctx.destination);
  const s = getSettings();
  if (s.music !== false && s.music != null) play(s.music);
}

function blip(f, t, d, vol, type = 'triangle') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.25, d));
  o.connect(g).connect(out); o.start(t); o.stop(t + Math.max(0.3, d) + 0.05);
}

function schedule() {
  if (!ctx || cur < 0) return;
  const song = SONGS[cur], beat = 60 / song.bpm, ahead = ctx.currentTime + 0.25;
  const chords = song.chords.split(' '), bar = song.bar || 4;
  while (true) {
    const e = parsed.ev[nextIdx];
    const at = startAt + (loopN * parsed.len + e.t) * beat;
    if (at > ahead) break;
    if (e.n !== 'R') {
      blip(freq(e.n), at, e.d * beat, 0.16);
      blip(freq(e.n) * 2, at, e.d * beat * 0.6, 0.035, 'sine');
    }
    // bass on each bar start, shaker on each beat
    for (let b = Math.ceil(e.t); b < e.t + e.d; b++) {
      const bt = startAt + (loopN * parsed.len + b) * beat;
      if (b % bar === 0) { const ch = chords[Math.floor(b / bar) % chords.length]; blip(freq(CHORD_ROOT[ch]), bt, beat * 1.8, 0.12, 'sine'); }
      shaker(bt, b % 2 ? 0.012 : 0.02);
    }
    nextIdx++;
    if (nextIdx >= parsed.ev.length) { nextIdx = 0; loopN++; }
  }
}

let noise = null;
function shaker(t, vol) {
  if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + 0.08);
}

export function play(i) {
  stop(false);
  if (!ctx || i == null || i === false || !SONGS[i]) return;
  cur = i; parsed = parse(SONGS[i]); nextIdx = 0; loopN = 0; startAt = ctx.currentTime + 0.15;
  out.gain.cancelScheduledValues(ctx.currentTime);
  out.gain.setValueAtTime(0.0001, ctx.currentTime); out.gain.exponentialRampToValueAtTime(level(), ctx.currentTime + 1);
  schedule(); timer = setInterval(schedule, 100);
}
export function stop() {
  clearInterval(timer); timer = 0; cur = -1;
  if (out && ctx) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(0.0001, ctx.currentTime); }
}

// Cycle: song 1 -> 2 -> ... -> off -> song 1. Returns the new name ("Music off" when off).
export function nextSong() {
  const s = getSettings();
  const now = s.music === false || s.music == null ? -1 : s.music;
  const n = now + 1 >= SONGS.length ? false : now + 1;
  s.music = n; saveSettings(s);
  if (n === false) { stop(); return 'Music off'; }
  play(n); return '♪ ' + SONGS[n].name;
}
export function setSong(i) { const s = getSettings(); s.music = i; saveSettings(s); if (i === false) stop(); else play(i); }
export const musicOn = () => { const s = getSettings(); return s.music !== false && s.music != null; };

// Quieter music while a voice note plays.
export function duck(ms = 2000) {
  if (!out || cur < 0) return;
  const t = ctx.currentTime;
  out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t);
  const low = level() * 0.25;
  out.gain.linearRampToValueAtTime(low, t + 0.1); out.gain.setValueAtTime(low, t + ms / 1000); out.gain.linearRampToValueAtTime(level(), t + ms / 1000 + 0.6);
}
// follow the music volume slider live
window.addEventListener('pg-settings', () => { if (out && ctx && cur >= 0) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(level(), ctx.currentTime, 0.05); } });
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend?.(); else ctx.resume?.();
});
