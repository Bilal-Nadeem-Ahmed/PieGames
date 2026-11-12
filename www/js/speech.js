// Spoken words. Uses the family's recorded voice clips (see voices.js). Anything without a clip stays
// silent, unless "phone voice for missing words" is switched on in the grown-ups area - then the
// phone's own text-to-speech says it.
import { getSettings, vol } from './store.js';
import { speak, stopVoice } from './voices.js';

let tts = null;
function plugin() {
  if (tts !== null) return tts;
  const C = window.Capacitor;
  const reg = C?.registerPlugin || window.capacitorExports?.registerPlugin;
  tts = C?.isNativePlatform?.() && reg ? reg('TextToSpeech') : false;
  return tts;
}

let seq = 0;
export async function say(text, { rate = 0.9, pitch = 1.1 } = {}) {
  if (!text || !getSettings().voice) return;
  const my = ++seq;
  stopTts();
  if (await speak(text)) return;                     // family clips
  if (my !== seq || !getSettings().phoneVoice) return; // optional fallback
  try {
    const t = plugin();
    if (t) { await t.speak({ text, lang: 'en-GB', rate, pitch, volume: vol('voice'), category: 'playback' }); return; }
    const ss = window.speechSynthesis;
    if (!ss) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB'; u.rate = rate; u.pitch = pitch; u.volume = vol('voice');
    ss.speak(u);
    await new Promise((r) => { u.onend = r; u.onerror = r; setTimeout(r, 6000); });
  } catch {}
}

function stopTts() { try { const t = plugin(); if (t) t.stop().catch(() => {}); window.speechSynthesis?.cancel(); } catch {} }

export function hush() { seq++; stopVoice(); stopTts(); }
