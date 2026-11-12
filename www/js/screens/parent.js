// Grown-ups area: edit the cartoon kids, names and game settings.
import { sfx, playClip } from '../sound.js';
import { animalSound } from '../animals.js';
import { say } from '../speech.js';
import { getPlayers, savePlayers, newPlayer, OPTIONS, getSettings, saveSettings, getSelectedId, setSelectedId } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { SONGS, setSong } from '../music.js';
import { VERSION } from '../version.js';
import { voicesPanel } from './voices-panel.js';
import { resetPet } from '../games/pet.js';
import { resetAllLevels } from '../levels.js';

const LABEL = {
  hair: 'Hair style', hairColor: 'Hair colour', skin: 'Skin', eyes: 'Eyes', outfit: 'Outfit', shirt: 'Clothes colour', pattern: 'Pattern',
  pants: 'Trousers / leggings', sleeves: 'Sleeves', extra: 'Extra', accent: 'Bow / hat / toy colour', brows: 'Eyebrows',
};
const PREVIEW_KEYS = ['hair', 'extra', 'outfit', 'sleeves', 'pattern', 'brows'];

export function mount(el) {
  let players = getPlayers();
  let cur = players.findIndex((p) => p.id === getSelectedId());
  if (cur < 0) cur = 0;
  const s = getSettings();
  s.pop = { speed: 'normal', amount: 'some', size: 'big', countAloud: true, surprises: true, faces: true, ...(s.pop || {}) };
  s.runner = { speed: 'normal', ...(s.runner || {}) };

  el.innerHTML = `<div class="screen parent">
    <header><h1>Grown-ups</h1><button class="done">Done ✓</button></header>
    <section class="kids-edit"><div class="tabs"></div>
      <div class="editor"><div class="preview"></div><div class="opts"></div></div></section>
    <section class="voices-sec"></section>
    <section class="settings"><h2>Settings</h2><div class="set"></div>
      <p class="tip">Tip: to stop little ones leaving the app, turn on <b>App pinning</b> in Android Settings → Security, then pin Pie Games.</p><p class="tip">Pie Games version ${VERSION}</p></section>
  </div>`;
  const tabs = el.querySelector('.tabs'), preview = el.querySelector('.preview'), opts = el.querySelector('.opts');
  const save = () => savePlayers(players);

  function renderTabs() {
    tabs.innerHTML = '';
    players.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'tab' + (i === cur ? ' on' : '');
      b.innerHTML = avatarSVG(p, { crop: true }) + `<span>${p.name || 'Player ' + (i + 1)}</span>`;
      b.onclick = () => { cur = i; renderAll(); };
      tabs.appendChild(b);
    });
    if (players.length < 4) {
      const add = document.createElement('button');
      add.className = 'tab add'; add.textContent = '+ Add';
      add.onclick = () => { players.push(newPlayer()); cur = players.length - 1; save(); renderAll(); };
      tabs.appendChild(add);
    }
  }

  function row(label, content) { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = `<label>${label}</label>`; d.appendChild(content); return d; }

  function renderOpts() {
    const p = players[cur];
    preview.innerHTML = avatarSVG(p) + avatarSVG(p, { pose: 'up' });
    opts.innerHTML = '';
    const name = document.createElement('input');
    name.value = p.name || ''; name.placeholder = 'Name (spoken in games)'; name.maxLength = 20;
    name.oninput = () => { p.name = name.value.trim(); save(); renderTabs(); };
    name.onchange = () => p.name && say(`Hello ${p.name}!`);
    opts.appendChild(row('Name', name));
    for (const k of Object.keys(LABEL)) {
      const wrap = document.createElement('div'); wrap.className = 'choices';
      for (const v of OPTIONS[k]) {
        const b = document.createElement('button');
        b.className = 'choice' + (p[k] === v ? ' on' : '');
        if (PREVIEW_KEYS.includes(k)) { b.classList.add('pv'); b.innerHTML = avatarSVG({ ...p, [k]: v }, { crop: k === 'hair' || k === 'brows' }); b.title = v; }
        else { b.style.background = v; b.title = v; }
        b.onclick = () => { p[k] = v; save(); sfx.tap(); renderOpts(); renderTabs(); };
        wrap.appendChild(b);
      }
      opts.appendChild(row(LABEL[k], wrap));
    }
    const lash = document.createElement('button');
    lash.className = 'toggle' + (p.lashes ? ' on' : ''); lash.textContent = p.lashes ? 'On' : 'Off';
    lash.onclick = () => { p.lashes = !p.lashes; save(); renderOpts(); };
    opts.appendChild(row('Eyelashes', lash));
    if (players.length > 1) {
      const del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Remove this player';
      del.onclick = () => { if (!confirm('Remove this player?')) return; players.splice(cur, 1); cur = 0; setSelectedId(players[0].id); save(); renderAll(); };
      opts.appendChild(row('', del));
    }
  }

  function renderSettings() {
    const set = el.querySelector('.set');
    set.innerHTML = '';
    const seg = (label, obj, key, values, names = values) => {
      const w = document.createElement('div'); w.className = 'seg';
      values.forEach((v, i) => {
        const b = document.createElement('button'); b.textContent = names[i]; b.className = obj[key] === v ? 'on' : '';
        b.onclick = () => { obj[key] = v; saveSettings(s); sfx.tap(); renderSettings(); };
        w.appendChild(b);
      });
      set.appendChild(row(label, w));
    };
    const onoff = (label, obj, key) => seg(label, obj, key, [true, false], ['On', 'Off']);
    onoff('Sounds', s, 'sound');
    const slider = (label, key, test) => {
      const w = document.createElement('div'); w.className = 'vol';
      const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = Math.round(s.vol[key] * 100);
      const out = document.createElement('span'); out.textContent = r.value + '%';
      r.oninput = () => { s.vol[key] = r.value / 100; out.textContent = r.value + '%'; saveSettings(s); };
      r.onchange = () => test?.();
      w.append(r, out); set.appendChild(row(label, w));
    };
    slider('Music volume', 'music');
    slider('Sound effects volume', 'sfx', () => sfx.pop());
    slider('Animal sounds volume', 'animals', () => animalSound('cow'));
    slider('Voice notes volume', 'clips', () => playClip('balloons', 0));
    slider('Voice volume', 'voice', () => say('Well done!'));
    onoff('Voice (family clips)', s, 'voice');
    onoff('Family voice notes', s, 'familyClips');
    {
      const w = document.createElement('div'); w.className = 'seg';
      [...SONGS.map((sg, i) => [i, sg.name]), [false, 'Off']].forEach(([v, n]) => {
        const b = document.createElement('button'); b.textContent = n; b.className = s.music === v ? 'on' : '';
        b.onclick = () => { s.music = v; saveSettings(s); setSong(v); renderSettings(); };
        w.appendChild(b);
      });
      set.appendChild(row('Background music', w));
    }
    seg('Numbers up to', s, 'countMax', [5, 10, 20], ['5', '10', '20']);
    seg('Pop games: speed', s.pop, 'speed', ['slow', 'normal', 'fast'], ['Slow', 'Normal', 'Fast']);
    seg('Pop games: how many', s.pop, 'amount', ['few', 'some', 'lots'], ['Few', 'Some', 'Lots']);
    seg('Pop games: size', s.pop, 'size', ['big', 'medium', 'small'], ['Big', 'Medium', 'Small']);
    onoff('Count pops out loud', s.pop, 'countAloud');
    onoff('Sheep surprises', s.pop, 'surprises');
    onoff('Kids’ faces on balloons', s.pop, 'faces');
    seg('Run & Jump speed', s.runner, 'speed', ['slow', 'normal', 'fast'], ['Slow', 'Normal', 'Fast']);
    {
      const w = document.createElement('div'); w.className = 'seg';
      for (const pl of getPlayers()) {
        const b = document.createElement('button'); b.textContent = `New pet for ${pl.name || 'player'}`;
        b.onclick = () => { if (confirm(`Let ${pl.name || 'this player'} choose a new Pie Pet? Their current pet will be gone.`)) { resetPet(pl.id); sfx.tap(); b.textContent = '✓ Done'; } };
        w.appendChild(b);
      }
      set.appendChild(row('Pie Pet', w));
    }
    {
      const w = document.createElement('div'); w.className = 'seg';
      for (const pl of getPlayers()) {
        const b = document.createElement('button'); b.textContent = `Start again for ${pl.name || 'player'}`;
        b.onclick = () => { if (confirm(`Put every game back to level 1 for ${pl.name || 'this player'}?`)) { resetAllLevels(pl.id); sfx.tap(); b.textContent = '✓ Back to level 1'; } };
        w.appendChild(b);
      }
      set.appendChild(row('Levels', w));
    }
  }

  const renderAll = () => { renderTabs(); renderOpts(); };
  renderAll(); renderSettings();
  voicesPanel(el.querySelector('.voices-sec'));
  el.querySelector('.done').onclick = () => { save(); location.hash = '#home'; };
}
