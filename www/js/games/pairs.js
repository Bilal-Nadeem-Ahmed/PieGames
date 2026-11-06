// Match pairs: flip two cards; if they match they stay up with a happy bounce and sound.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, storage } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { homeBtn, chips, shuffle, wait } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { FARM, animalSound, preloadAnimals } from '../animals.js';

const LEVELS = [
  { id: 2, icon: '<b>2</b>', label: '2 pairs' }, { id: 3, icon: '<b>3</b>', label: '3 pairs' },
  { id: 4, icon: '<b>4</b>', label: '4 pairs' }, { id: 6, icon: '<b>6</b>', label: '6 pairs' },
];
const EXTRA = [{ id: 'ladybird', e: '🐞', name: 'Ladybird' }, { id: 'lion', e: '🦁', name: 'Lion' }, { id: 'frog', e: '🐸', name: 'Frog' }, { id: 'dino', e: '🦕', name: 'Dinosaur' }, { id: 'bunny', e: '🐰', name: 'Bunny' }];

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="screen pairs">${homeBtn()}<div class="deck"></div></div>`;
  const root = el.firstElementChild, deck = root.querySelector('.deck');
  let level = storage.read('pg.pairs', 2), alive = true, timer = 0;
  root.appendChild(chips(LEVELS, level, (l) => { level = l; storage.write('pg.pairs', l); deal(); }));

  function faces() {
    const kids = getPlayers().map((p) => ({ id: 'kid-' + p.id, html: avatarSVG(p, { crop: true }), name: p.name || '', kid: true }));
    const animals = [...FARM.map((a) => ({ id: a.id, html: a.e, name: a.name, sound: a.id })), ...EXTRA.map((a) => ({ id: a.id, html: a.e, name: a.name }))];
    // always include the ladybird and one of the kids when there's room
    const must = [animals.find((a) => a.id === 'ladybird'), ...(level >= 3 ? [shuffle(kids)[0]] : [])].filter(Boolean);
    const rest = shuffle([...animals.filter((a) => a.id !== 'ladybird'), ...kids.filter((k) => !must.includes(k))]);
    return shuffle([...must, ...rest].slice(0, level));
  }

  function deal() {
    clearTimeout(timer);
    const set = faces(), cards = shuffle([...set, ...set]);
    deck.dataset.n = cards.length;
    layout(cards.length);
    deck.innerHTML = cards.map((f, i) => `<button class="mcard" data-id="${f.id}" style="animation-delay:${i * 50}ms">
      <div class="inner"><div class="back"><span>⭐</span></div><div class="front ${f.kid ? 'kidface' : ''}">${f.html}</div></div></button>`).join('');
    let open = [], busy = false, matched = 0;
    deck.querySelectorAll(".mcard").forEach((c, i) => {
      c.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        if (busy || c.classList.contains('up')) return;
        c.classList.add('up'); sfx.tap(); buzz(8);
        open.push(c);
        if (open.length < 2) return;
        busy = true;
        const [a, b] = open; open = [];
        await wait(450);
        if (!alive) return;
        if (a.dataset.id === b.dataset.id) {
          a.classList.add('matched'); b.classList.add('matched');
          const f = set.find((x) => x.id === a.dataset.id);
          sfx.ding(); buzz(20);
          for (const x of [a, b]) { const r = x.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, { n: 14, shape: 'star' }); }
          if (f.sound) animalSound(f.sound); else if (f.kid) sfx.giggle();
          setTimeout(() => alive && f.name && say(`${f.name}!`), f.sound ? 900 : 200);
          matched++;
          if (matched === set.length) timer = setTimeout(() => { if (!alive) return; celebrate('You found all the pairs!'); timer = setTimeout(() => alive && deal(), 3600); }, 900);
        } else {
          await wait(600);
          a.classList.remove('up'); b.classList.remove('up'); sfx.boing();
        }
        busy = false;
      });
    });
    say('Find the pairs!');
  }
  // pick the column count that gives the biggest cards for this screen
  function layout(n) {
    const W = deck.clientWidth, H = deck.clientHeight, gap = 12;
    let best = { s: 0, cols: n };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const w = Math.min((W - gap * (cols - 1)) / cols, ((H - gap * (rows - 1)) / rows) * 0.8);
      if (w > best.s) best = { s: w, cols };
    }
    deck.style.gridTemplateColumns = `repeat(${best.cols}, ${Math.floor(best.s)}px)`;
  }
  const onResize = () => layout(deck.children.length);
  addEventListener('resize', onResize);
  deal();
  return () => { alive = false; clearTimeout(timer); removeEventListener('resize', onResize); };
}
