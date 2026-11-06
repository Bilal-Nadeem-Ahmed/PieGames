// Shapes & colours sorter: drag shapes into matching holes, or things into the basket of the same colour.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { storage } from '../store.js';
import { homeBtn, chips, shuffle, pick, draggable, inside } from '../ui.js';
import { burst, celebrate } from '../fx.js';

const SHAPES = {
  circle: 'M50 8 A42 42 0 1 1 49.9 8 Z',
  square: 'M12 12 H88 V88 H12 Z',
  triangle: 'M50 8 L92 88 H8 Z',
  star: 'M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37 Z',
  heart: 'M50 88 C20 66 6 50 6 32 C6 16 18 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C82 8 94 16 94 32 C94 50 80 66 50 88 Z',
  moon: 'M62 8 A42 42 0 1 0 92 70 A34 34 0 1 1 62 8 Z',
  diamond: 'M50 6 L90 50 L50 94 L10 50 Z',
};
const SHAPE_COL = { circle: '#ef4444', square: '#3b82f6', triangle: '#22c55e', star: '#facc15', heart: '#f472b6', moon: '#a855f7', diamond: '#fb923c' };
const COLOURS = {
  red: { c: '#ef4444', items: ['🍎', '🍓', '🍒', '🚒', '🌹'] },
  yellow: { c: '#facc15', items: ['🍌', '🌻', '⭐', '🐥', '🌽'] },
  green: { c: '#22c55e', items: ['🥦', '🍏', '🐸', '🥒', '🌵'] },
  blue: { c: '#3b82f6', items: ['🫐', '🐳', '💙', '🧢', '🦋'] },
  orange: { c: '#fb923c', items: ['🍊', '🥕', '🎃', '🦊', '🏀'] },
  purple: { c: '#a855f7', items: ['🍇', '🍆', '💜', '🔮', '☂️'] },
};
const MODES = [{ id: 'shapes', icon: '🔷', label: 'Shapes' }, { id: 'colours', icon: '🎨', label: 'Colours' }];
const svg = (d, fill, stroke = '#2b2118') => `<svg viewBox="0 0 100 100"><path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/></svg>`;

export function mount(el) {
  el.innerHTML = `<div class="screen learn sorter">${homeBtn()}<div class="targets"></div><div class="pieces"></div></div>`;
  const root = el.firstElementChild, targets = root.querySelector('.targets'), pieces = root.querySelector('.pieces');
  let mode = storage.read('pg.sortmode', 'shapes'), timer = 0, alive = true;
  root.insertBefore(chips(MODES, mode, (m) => { mode = m; storage.write('pg.sortmode', m); round(); }), targets);

  function finishCheck(left) {
    if (left > 0) return;
    timer = setTimeout(() => { if (!alive) return; celebrate(); timer = setTimeout(() => alive && round(), 3300); }, 500);
  }

  function shapesRound() {
    const names = shuffle(Object.keys(SHAPES)).slice(0, innerWidth > innerHeight ? 4 : 3);
    targets.className = 'targets shapeboard';
    targets.innerHTML = names.map((n) => `<div class="hole" data-k="${n}">${svg(SHAPES[n], '#5a3b22', '#3a2412')}</div>`).join('');
    pieces.innerHTML = '';
    let left = names.length;
    for (const n of shuffle([...names])) {
      const p = document.createElement('div');
      p.className = 'piece'; p.innerHTML = svg(SHAPES[n], SHAPE_COL[n]);
      pieces.appendChild(p);
      draggable(p, {
        onStart: () => { sfx.tap(); say(n); },
        onDrop: (x, y) => {
          const hole = [...targets.children].find((h) => inside(h, x, y, 30));
          if (!hole) return false;
          if (hole.dataset.k !== n || hole.dataset.done) { sfx.oops(); buzz(30); hole.classList.remove('nope'); void hole.offsetWidth; hole.classList.add('nope'); return false; }
          hole.dataset.done = 1; p.dataset.locked = 1; p.style.transform = ''; p.style.transition = '';
          hole.appendChild(p); p.classList.add('placed');
          const r = hole.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, { n: 24, colors: [SHAPE_COL[n], '#fff'] });
          sfx.chime(left); buzz(15); say(`${n}!`);
          finishCheck(--left);
          return true;
        },
      });
    }
    say('Put the shapes in their holes!');
  }

  function coloursRound() {
    const names = shuffle(Object.keys(COLOURS)).slice(0, 3);
    targets.className = 'targets baskets';
    targets.innerHTML = names.map((n) => `<div class="basket" data-k="${n}" style="--c:${COLOURS[n].c}"><div class="b-stack"></div><div class="b-body"><span>${n}</span></div></div>`).join('');
    const things = shuffle(names.flatMap((n) => shuffle([...COLOURS[n].items]).slice(0, 2).map((e) => ({ n, e }))));
    pieces.innerHTML = '';
    let left = things.length;
    for (const th of things) {
      const p = document.createElement('div');
      p.className = 'piece thing'; p.textContent = th.e;
      pieces.appendChild(p);
      draggable(p, {
        onStart: () => sfx.tap(),
        onDrop: (x, y) => {
          const b = [...targets.children].find((h) => inside(h, x, y, 30));
          if (!b) return false;
          if (b.dataset.k !== th.n) { sfx.oops(); buzz(30); say(`That one is ${th.n}!`); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return false; }
          p.dataset.locked = 1; p.style.transform = ''; p.style.transition = '';
          b.querySelector('.b-stack').appendChild(p); p.classList.add('placed');
          b.classList.remove('yum'); void b.offsetWidth; b.classList.add('yum');
          const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.3, { n: 18, colors: [COLOURS[th.n].c, '#fff'] });
          sfx.chime(left); buzz(15); say(`${th.n}!`);
          finishCheck(--left);
          return true;
        },
      });
    }
    say('Put each one in the basket of the same colour!');
  }

  const round = () => { clearTimeout(timer); mode === 'shapes' ? shapesRound() : coloursRound(); };
  round();
  return () => { alive = false; clearTimeout(timer); };
}
