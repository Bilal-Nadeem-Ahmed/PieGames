// Grown-ups area: edit the cartoon kids, names and game settings.
import { sfx } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, savePlayers, newPlayer, OPTIONS, getSettings, saveSettings, getSelectedId, setSelectedId } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { SONGS, setSong } from '../music.js';

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
    <section class="settings"><h2>Settings</h2><div class="set"></div>
      <p class="tip">Tip: to stop little ones leaving the app, turn on <b>App pinning</b> in Android Settings → Security, then pin Pie Games.</p></section>
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
    onoff('Talking voice', s, 'voice');
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
  }

  const renderAll = () => { renderTabs(); renderOpts(); };
  renderAll(); renderSettings();
  el.querySelector('.done').onclick = () => { save(); location.hash = '#home'; };
}
