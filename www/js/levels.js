// Levels: each child has their own level in each game. Levels go up automatically after a few wins
// (with a big star celebration). Hold the ⭐ badge for 2 seconds to go back to level 1; the grown-ups
// area can reset every game for a child.
import { currentPlayer, storage } from './store.js';
import { sfx, buzz } from './sound.js';
import { say } from './speech.js';
import { confettiRain } from './fx.js';

// max level and how many wins are needed to go up a level, per game
export const GAMES = {
  balloons: { max: 5, wins: 2 }, bubbles: { max: 5, wins: 2 }, runner: { max: 5, wins: 2 },
  count: { max: 5, wins: 3 }, abc: { max: 4, wins: 3 }, sorter: { max: 4, wins: 2 },
  feed: { max: 4, wins: 2 }, roundup: { max: 4, wins: 2 }, findit: { max: 4, wins: 2 },
  dino: { max: 4, wins: 2 }, peekaboo: { max: 4, wins: 2 }, puzzle: { max: 4, wins: 2 }, pairs: { max: 4, wins: 2 },
};
const key = (pid) => 'pg.levels.' + (pid || currentPlayer()?.id || 'p1');
const all = (pid) => storage.read(key(pid), {});

export function getLevel(game) { return Math.min(GAMES[game]?.max || 1, all()[game]?.level || 1); }
export function setLevel(game, level) { const a = all(); a[game] = { level, wins: 0 }; storage.write(key(), a); }

// Call when the child finishes a round. Returns the (possibly new) level.
export function win(game, badge) {
  const g = GAMES[game]; if (!g) return 1;
  const a = all(), cur = a[game] || { level: 1, wins: 0 };
  cur.wins++;
  let up = false;
  if (cur.wins >= g.wins && cur.level < g.max) { cur.level++; cur.wins = 0; up = true; }
  a[game] = cur; storage.write(key(), a);
  badge?.update();
  if (up) setTimeout(() => levelUpShow(cur.level), 2600);   // after the round's own celebration
  return cur.level;
}

export function resetAllLevels(pid) { storage.write(key(pid), {}); }

function levelUpShow(level) {
  const d = document.createElement('div');
  d.className = 'levelup';
  d.innerHTML = `<div class="lu-star">⭐<b>${level}</b></div><div class="lu-text">Level ${level}!</div>`;
  document.body.appendChild(d);
  confettiRain(90); sfx.yay(); buzz(40);
  setTimeout(() => say('Level up!'), 800);
  setTimeout(() => d.remove(), 2600);
}

// The ⭐ badge shown in a game. Hold it for 2 seconds to start the game again from level 1.
export function levelBadge(host, game, onReset) {
  const b = document.createElement('button');
  b.className = 'lvl-badge'; b.setAttribute('aria-label', 'Level (hold to start again)');
  b.innerHTML = `<span>⭐</span><b></b><svg class="ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"/></svg>`;
  host.appendChild(b);
  const api = {
    update() {
      const g = GAMES[game], l = getLevel(game), w = all()[game]?.wins || 0;
      b.querySelector('b').textContent = l;
      b.style.setProperty('--p', l >= g.max ? 1 : w / g.wins);
    },
  };
  let hold = 0;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); b.classList.add('holding');
    hold = setTimeout(() => { b.classList.remove('holding'); setLevel(game, 1); api.update(); sfx.boing(); onReset?.(); }, 2000);
  });
  const stop = () => { clearTimeout(hold); b.classList.remove('holding'); };
  b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  api.update();
  return api;
}
