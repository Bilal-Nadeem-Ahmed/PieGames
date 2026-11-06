// Pie Games - simple router that swaps screens based on the URL hash.
import { unlockAudio } from './sound.js';
import * as home from './screens/home.js';
import * as parent from './screens/parent.js';
import * as pop from './games/pop.js';
import * as colouring from './games/colouring.js';
import * as counting from './games/counting.js';
import * as abc from './games/abc.js';
import * as runner from './games/runner.js';
import * as dino from './games/dino.js';

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
};

function route() {
  const [name, arg] = (location.hash.slice(1) || 'home').split('/');
  try { cleanup?.(); } catch {}
  cleanup = null;
  document.getElementById('fx')?.getContext('2d')?.clearRect(0, 0, 1e5, 1e5);
  document.querySelectorAll('.cheer').forEach((c) => c.remove());
  app.className = 'route-' + name;
  cleanup = (ROUTES[name] || ROUTES.home)(arg) || null;
}

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
