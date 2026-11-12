// Family voice clips.
// - Built-in voices (Dad + Rahma) ship with the app in audio/voice/<key>/<voice>-<n>.m4a (see manifest.json).
// - Anyone can add more voices and record/upload clips on the phone (kept in IndexedDB).
// - When several voices can say something, they take turns.
// - Text is turned into clips: each sentence part ("Where's the cow?") plays only if every word in it
//   has a clip; parts with missing words are skipped (optionally the phone's own voice fills in).
import { getSettings, saveSettings, getPlayers, vol } from './store.js';
import { duck } from './music.js';

export const keyOf = (w) => String(w).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const BUILTIN = [{ id: 'me', name: 'Dad' }, { id: 'pie', name: 'Rahma' }];

import { CATALOG } from './voice-catalog.js';
export { CATALOG };
export const catalog = () => [...CATALOG, ['Names', getPlayers().map((p) => p.name).filter(Boolean)]];

// words that can be left out of a sentence without changing the meaning
const FILLER = new Set('the a an is it its can you to and of in with your all them their they are me my each one this be on so who there here some'.split(' '));

// ---------- clip index ----------
let manifest = {};                 // { key: { voiceId: takes } }  (built-in, shipped with the app)
const custom = new Map();          // voiceId -> Set(keys)  (recorded on this phone)
let ready = null;
export function initVoices() {
  if (ready) return ready;
  ready = (async () => {
    try { manifest = await (await fetch('audio/voice/manifest.json')).json(); } catch { manifest = {}; }
    try { for (const r of await dbAll()) { if (!custom.has(r.voice)) custom.set(r.voice, new Set()); custom.get(r.voice).add(r.key); } } catch {}
  })();
  return ready;
}

export function voiceList() {
  const s = getSettings(), names = s.voiceNames || {};
  const builtin = s.defaultVoices === false ? [] : BUILTIN.map((v) => ({ ...v, name: names[v.id] || v.name, builtin: true }));
  return [...builtin, ...(s.voices || []).map((v) => ({ ...v, builtin: false }))];
}
const activeIds = () => voiceList().map((v) => v.id);

export function hasClip(voice, key) {
  return !!(custom.get(voice)?.has(key) || (manifest[key]?.[voice] && BUILTIN.some((b) => b.id === voice)));
}
export const isCustom = (voice, key) => !!custom.get(voice)?.has(key);
export const isBundled = (voice, key) => !!manifest[key]?.[voice];
const voicesFor = (key) => activeIds().filter((v) => hasClip(v, key));
export const canSay = (key) => voicesFor(key).length > 0;

// ---------- turning text into clips ----------
function segments(text) {
  const out = [];
  for (const part of String(text).split(/[!?.,;:]+/)) {
    const raw = part.trim().split(/\s+/).filter(Boolean);
    if (!raw.length) continue;
    const keys = []; let ok = true;
    for (let i = 0; i < raw.length;) {
      // a capital letter on its own is a letter name ("Pop the B", "B is for balloon")
      const prev = keyOf(raw[i - 1] || ''), next = keyOf(raw[i + 1] || '');
      if (/^[A-Z]$/.test(raw[i]) && (raw.length === 1 || next === 'is' || prev === 'letter' || prev === 'the' || prev === 'thats')) {
        const k = raw[i].toLowerCase(); if (canSay(k)) { keys.push(k); i++; continue; } ok = false; break;
      }
      let matched = 0;
      for (let n = Math.min(4, raw.length - i); n >= 1; n--) {          // longest phrase first ("where's the", "well done")
        const k = keyOf(raw.slice(i, i + n).join(' '));
        if (k && canSay(k)) { keys.push(k); matched = n; break; }
      }
      if (matched) { i += matched; continue; }
      if (FILLER.has(keyOf(raw[i])) || !keyOf(raw[i])) { i++; continue; }
      ok = false; break;
    }
    if (ok && keys.length) out.push(keys);
  }
  return out;
}
// Can this text be spoken (at least partly) with the clips we have?
export const canSpeak = (text) => segments(text).length > 0;

// ---------- playback ----------
// How often each voice is used when several can say the same thing (0-100). Rahma is used most by default.
export const DEFAULT_WEIGHT = { pie: 80, me: 20 };
export function voiceWeight(id) { const w = getSettings().voiceWeights || {}; return w[id] ?? DEFAULT_WEIGHT[id] ?? 50; }
export function setVoiceWeight(id, v) { const s = getSettings(); s.voiceWeights = { ...(s.voiceWeights || {}), [id]: v }; saveSettings(s); }
function pickVoice(keys) {
  const all = activeIds();
  const both = all.filter((v) => keys.every((k) => hasClip(v, k)));
  const pool = both.length ? both : all;
  // weighted random choice (a slider at 0 means never, unless no other voice can say it)
  const weights = pool.map((v) => voiceWeight(v));
  const total = weights.reduce((x, y) => x + y, 0);
  if (!total) return pool[(Math.random() * pool.length) | 0];
  let r = Math.random() * total, pick = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0 && weights[i] > 0) { pick = pool[i]; break; } }
  return pick;
}
async function urlFor(voice, key) {
  if (custom.get(voice)?.has(key)) { const r = await dbGet(`${voice}|${key}`); if (r?.blob) return URL.createObjectURL(r.blob); }
  const takes = manifest[key]?.[voice];
  if (takes) return `audio/voice/${key}/${voice}-${1 + Math.floor(Math.random() * takes)}.m4a`;
  return null;
}

let seq = 0, playing = null;
export function stopVoice() { seq++; try { playing?.pause(); } catch {} playing = null; }
function play(url, my) {
  return new Promise((res) => {
    if (my !== seq) return res();
    const a = new Audio(url); playing = a;
    a.volume = Math.min(1, vol('voice'));
    const done = () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); res(); };
    a.onended = done; a.onerror = done;
    a.play()?.catch?.(done);
    setTimeout(done, 6000);
  });
}

// Speak text with family clips. Returns true if anything was (or will be) said.
export async function speak(text) {
  await initVoices();
  const segs = segments(text);
  if (!segs.length) return false;
  stopVoice();
  const my = seq;
  duck(1800);
  for (const keys of segs) {
    const v = pickVoice(keys);
    for (const k of keys) {
      const voice = hasClip(v, k) ? v : voicesFor(k)[0];
      const url = voice && (await urlFor(voice, k));
      if (my !== seq) return true;
      if (url) await play(url, my);
    }
  }
  return true;
}
// Say the first of these phrases that has a clip (e.g. a random praise word). Returns the phrase used.
export function pickSayable(list) { const ok = list.filter((t) => canSpeak(t)); return ok.length ? ok[(Math.random() * ok.length) | 0] : null; }

// Preview one clip in the grown-ups area.
export async function previewClip(voice, key) {
  await initVoices(); stopVoice();
  const url = await urlFor(voice, key);
  if (url) await play(url, seq);
}

// ---------- recording / uploading (grown-ups area) ----------
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise((res) => {
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
      rec.stop();
    }),
  };
}
export async function saveClip(voice, key, blob) {
  await dbPut({ id: `${voice}|${key}`, voice, key, blob });
  if (!custom.has(voice)) custom.set(voice, new Set());
  custom.get(voice).add(key);
}
export async function deleteClip(voice, key) {
  await dbDel(`${voice}|${key}`);
  custom.get(voice)?.delete(key);
}
export function addVoice(name) {
  const s = getSettings(); s.voices = [...(s.voices || []), { id: 'v' + Date.now().toString(36), name }]; saveSettings(s);
}
export async function removeVoice(id) {
  const s = getSettings(); s.voices = (s.voices || []).filter((v) => v.id !== id); saveSettings(s);
  for (const k of [...(custom.get(id) || [])]) await deleteClip(id, k);
}

// ---------- tiny IndexedDB wrapper ----------
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open('pg-voices', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('clips', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return dbp;
}
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('clips', mode); const q = fn(t.objectStore('clips')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
const dbAll = () => tx('readonly', (s) => s.getAll());
const dbGet = (id) => tx('readonly', (s) => s.get(id));
const dbPut = (r) => tx('readwrite', (s) => s.put(r));
const dbDel = (id) => tx('readwrite', (s) => s.delete(id));
