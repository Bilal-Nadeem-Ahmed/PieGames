// Pie Games - simple router that swaps screens based on the URL hash.
import { unlockAudio, sfx } from './sound.js';
import { nextSong, musicOn } from './music.js';
import { getSettings, saveSettings } from './store.js';
import { hush } from './speech.js';
import { ICON } from './ui.js';
import { lockFor } from './orientation.js';
import * as home from './screens/home.js';
import * as parent from './screens/parent.js';
import * as pop from './games/pop.js';
import * as colouring from './games/colouring.js';
import * as counting from './games/counting.js';
import * as abc from './games/abc.js';
import * as runner from './games/runner.js';
import * as dino from './games/dino.js';
import * as band from './games/instruments.js';
import * as peekaboo from './games/peekaboo.js';
import * as sorter from './games/sorter.js';
import * as builder from './games/builder.js';
import * as feed from './games/feed.js';
import * as pairs from './games/pairs.js';
import * as roundup from './games/roundup.js';
import * as puzzle from './games/puzzle.js';
import * as findit from './games/findit.js';

const app = document.getElementById('app');
let cleanup = null;

const ROUTES = {
  home: () => home.mount(app),
  parent: () => parent.mount(app),
  balloons: () => pop.mount(app, { theme: 'balloons' }),
  bubbles: () => pop.mount(app, { theme: 'bubbles' }),
  colour: (arg) => colouring.mount(app, { pic: arg }),
  count: () => counting.mount(app),
  abc: () => abc.mount(app),
  runner: () => runner.mount(app),
  dino: () => dino.mount(app),
  music: () => band.mount(app),
  peekaboo: () => peekaboo.mount(app),
  sorter: () => sorter.mount(app),
  build: () => builder.mount(app),
  feed: () => feed.mount(app),
  pairs: () => pairs.mount(app),
  roundup: () => roundup.mount(app),
  puzzle: () => puzzle.mount(app),
  findit: () => findit.mount(app),
};

let routeSeq = 0;
async function route() {
  const [name, arg] = (location.hash.slice(1) || 'home').split('/');
  const my = ++routeSeq;
  try { cleanup?.(); } catch {}
  cleanup = null;
  document.getElementById('fx')?.getContext('2d')?.clearRect(0, 0, 1e5, 1e5);
  document.querySelectorAll('.cheer').forEach((c) => c.remove());
  // turn the screen upright/sideways for this game first, so it lays out at the right size
  app.innerHTML = '';
  await lockFor(ROUTES[name] ? name : 'home');
  if (my !== routeSeq) return;
  app.className = 'route-' + name;
  cleanup = (ROUTES[name] || ROUTES.home)(arg) || null;
  quick.hidden = name === 'parent' || (name === 'colour' && !!arg);
}

// Quick buttons (top-right on every screen): talking voice on/off, and music (tap to change song / turn off).
const quick = document.createElement('div');
quick.id = 'quick';
quick.innerHTML = `<button class="rbtn qb-voice" aria-label="Talking voice"></button><button class="rbtn qb-music" aria-label="Music"></button><div class="qtoast"></div>`;
document.body.appendChild(quick);
const vBtn = quick.querySelector('.qb-voice'), mBtn = quick.querySelector('.qb-music'), toast = quick.querySelector('.qtoast');
const paintQuick = () => {
  const s = getSettings();
  vBtn.innerHTML = s.voice ? ICON.voiceOn : ICON.voiceOff; vBtn.classList.toggle('off', !s.voice);
  mBtn.innerHTML = musicOn() ? ICON.musicOn : ICON.musicOff; mBtn.classList.toggle('off', !musicOn());
};
let toastT = 0;
const showToast = (t) => { toast.textContent = t; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 1600); };
vBtn.onclick = () => { const s = getSettings(); s.voice = !s.voice; saveSettings(s); if (!s.voice) hush(); sfx.tap(); paintQuick(); showToast(s.voice ? 'Voice on' : 'Voice off'); };
mBtn.onclick = () => { unlockAudio(); showToast(nextSong()); paintQuick(); };
paintQuick();
window.addEventListener('pg-settings', paintQuick);

addEventListener('hashchange', route);
// Called by the Android back button. Returns true if handled (went back to home / gallery).
window.pgBack = () => {
  const name = location.hash.slice(1) || 'home';
  if (name === 'home') return false;
  location.replace(name.startsWith('colour/') ? '#colour' : '#home');
  return true;
};
addEventListener('pointerdown', unlockAudio, { capture: true });
addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
if (!location.hash) history.replaceState(null, '', '#home');
route();
