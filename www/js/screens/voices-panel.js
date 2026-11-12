// Grown-ups area: the Voices section. Pick a voice, then play / record / upload / delete each word.
import { getSettings, saveSettings } from '../store.js';
import { sfx } from '../sound.js';
import {
  initVoices, voiceList, catalog, keyOf, hasClip, isCustom, isBundled, previewClip,
  startRecording, saveClip, deleteClip, addVoice, removeVoice, BUILTIN, voiceWeight, setVoiceWeight,
} from '../voices.js';

export async function voicesPanel(host) {
  await initVoices();
  let cur = voiceList()[0]?.id || null;
  const open = new Set(['Praise']);

  const render = () => {
    const s = getSettings(), voices = voiceList();
    if (!voices.find((v) => v.id === cur)) cur = voices[0]?.id || null;
    host.innerHTML = `<h2>Voices</h2>
      <p class="tip">The games speak using recorded voices. Where more than one voice has said a word, they take turns.
      Pick a voice, then tap <b>●</b> to record a word (tap again to stop) or <b>⬆</b> to upload a sound file.</p>
      <div class="vchips"></div>
      <div class="vbar"></div>
      <div class="vgroups"></div>`;
    const chipsEl = host.querySelector('.vchips');
    for (const v of voices) {
      const b = document.createElement('button');
      b.className = 'vchip' + (v.id === cur ? ' on' : '');
      b.innerHTML = `🎙️ ${v.name}${v.builtin ? ' <small>(default)</small>' : ''}`;
      b.onclick = () => { cur = v.id; render(); };
      chipsEl.appendChild(b);
    }
    const add = document.createElement('button');
    add.className = 'vchip add'; add.textContent = '+ Add a voice';
    add.onclick = () => { const n = prompt('Whose voice is it? (e.g. Ibrahim, Grandma)'); if (n && n.trim()) { addVoice(n.trim()); cur = voiceList().at(-1).id; render(); } };
    chipsEl.appendChild(add);

    // how often each voice is used
    if (voices.length > 1) {
      const wbox = document.createElement('div'); wbox.className = 'vweights';
      wbox.innerHTML = '<b>How often each voice is used</b>';
      for (const vv of voices) {
        const r = document.createElement('label'); r.className = 'vweight';
        r.innerHTML = `<span>${vv.name}</span><small>rarely</small><input type="range" min="0" max="100" value="${voiceWeight(vv.id)}"><small>mostly</small>`;
        r.querySelector('input').oninput = (e) => setVoiceWeight(vv.id, +e.target.value);
        wbox.appendChild(r);
      }
      host.insertBefore(wbox, host.querySelector('.vbar'));
    }
    // bar: rename / remove voice, default voices on/off, phone voice fallback
    const bar = host.querySelector('.vbar');
    const btn = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = fn; bar.appendChild(b); };
    const v = voices.find((x) => x.id === cur);
    if (v) {
      btn('✎ Rename', 'seg-b', () => {
        const n = prompt('Name for this voice', v.name); if (!n || !n.trim()) return;
        const st = getSettings();
        if (v.builtin) st.voiceNames = { ...(st.voiceNames || {}), [v.id]: n.trim() };
        else st.voices = st.voices.map((x) => (x.id === v.id ? { ...x, name: n.trim() } : x));
        saveSettings(st); render();
      });
      if (!v.builtin) btn('Delete this voice', 'danger', async () => { if (confirm(`Delete ${v.name}'s voice and all its recordings?`)) { await removeVoice(v.id); render(); } });
    }
    if (s.defaultVoices !== false) btn(`Remove default voices (${BUILTIN.map((b) => (s.voiceNames || {})[b.id] || b.name).join(' & ')})`, 'danger', () => {
      if (!confirm('Turn off the default voices? The games will only use voices you add. You can bring them back later.')) return;
      const st = getSettings(); st.defaultVoices = false; saveSettings(st); render();
    });
    else btn('Bring back default voices', 'seg-b', () => { const st = getSettings(); st.defaultVoices = true; saveSettings(st); render(); });
    btn(s.phoneVoice ? 'Phone voice for missing words: On' : 'Phone voice for missing words: Off', 'seg-b' + (s.phoneVoice ? ' on' : ''), () => {
      const st = getSettings(); st.phoneVoice = !st.phoneVoice; saveSettings(st); render();
    });

    // word groups
    const groups = host.querySelector('.vgroups');
    if (!v) { groups.innerHTML = '<p class="tip">No voices yet - add one above.</p>'; return; }
    for (const [name, words] of catalog()) {
      if (!words.length) continue;
      const done = words.filter((w) => hasClip(v.id, keyOf(w))).length;
      const d = document.createElement('details');
      d.className = 'vgroup'; d.open = open.has(name);
      d.ontoggle = () => (d.open ? open.add(name) : open.delete(name));
      d.innerHTML = `<summary>${name} <span class="vcount ${done === words.length ? 'full' : ''}">${done} / ${words.length}</span></summary><div class="vrows"></div>`;
      const rows = d.querySelector('.vrows');
      for (const w of words) rows.appendChild(row(v, w));
      groups.appendChild(d);
    }
  };

  function row(v, word) {
    const key = keyOf(word);
    const r = document.createElement('div');
    r.className = 'vrow';
    const has = hasClip(v.id, key), mine = isCustom(v.id, key), shipped = v.builtin && isBundled(v.id, key);
    r.innerHTML = `<span class="vdot ${has ? 'ok' : ''}">${has ? '✓' : '·'}</span><span class="vword">${word}</span>
      <button class="vb play" ${has ? '' : 'disabled'} aria-label="Play">▶</button>
      <button class="vb rec" aria-label="Record">●</button>
      <label class="vb up" aria-label="Upload">⬆<input type="file" accept="audio/*" hidden></label>
      <button class="vb del" ${mine ? '' : 'disabled'} aria-label="${shipped ? 'Back to default recording' : 'Delete'}">${shipped ? '↺' : '🗑'}</button>`;
    r.querySelector('.play').onclick = () => previewClip(v.id, key);
    let rec = null, timer = 0;
    const recBtn = r.querySelector('.rec');
    recBtn.onclick = async () => {
      if (!rec) {
        try { rec = await startRecording(); } catch { alert('Could not use the microphone. Check the app has microphone permission in Android Settings → Apps → Pie Games → Permissions.'); return; }
        recBtn.classList.add('on'); recBtn.textContent = '■';
        timer = setTimeout(() => recBtn.click(), 5000);           // stop automatically after 5 seconds
      } else {
        clearTimeout(timer);
        const blob = await rec.stop(); rec = null;
        await saveClip(v.id, key, blob); sfx.ding();
        render(); previewClip(v.id, key);
      }
    };
    r.querySelector('.up input').onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      await saveClip(v.id, key, f); sfx.ding(); render(); previewClip(v.id, key);
    };
    r.querySelector('.del').onclick = async () => { await deleteClip(v.id, key); render(); };
    return r;
  }
  render();
}
