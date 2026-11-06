// Spoken words. On Android uses the phone's own text-to-speech (works offline);
// in a browser falls back to the Web Speech API.
import { getSettings, vol } from './store.js';

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
  const t = plugin();
  try {
    if (t) {
      await t.stop().catch(() => {});
      if (my !== seq) return;
      await t.speak({ text, lang: 'en-GB', rate, pitch, volume: vol('voice'), category: 'playback' });
      return;
    }
    const ss = window.speechSynthesis;
    if (!ss) return;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB'; u.rate = rate; u.pitch = pitch; u.volume = vol('voice');
    ss.speak(u);
    await new Promise((r) => { u.onend = r; u.onerror = r; setTimeout(r, 6000); });
  } catch {}
}

export function hush() {
  seq++;
  try { const t = plugin(); if (t) t.stop().catch(() => {}); window.speechSynthesis?.cancel(); } catch {}
}
