// Counting 123: tap-to-count, "how many?", and "find the number".
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getSettings, storage } from '../store.js';
import { homeBtn, chips, ICON, shuffle, pick, rnd } from '../ui.js';
import { celebrate, burst } from '../fx.js';
import { COUNT_THINGS } from '../data.js';

const MODES = [
  { id: 'count', icon: '👆', label: 'Tap and count' },
  { id: 'howmany', icon: '❓', label: 'How many?' },
  { id: 'find', icon: '🔍', label: 'Find the number' },
];

export function mount(el) {
  el.innerHTML = `<div class="screen learn counting">${homeBtn()}<button class="rbtn say-btn" aria-label="Say again">${ICON.speaker}</button>
    <div class="board"></div><div class="answers"></div></div>`;
  const root = el.firstElementChild, board = root.querySelector('.board'), answers = root.querySelector('.answers');
  let mode = storage.read('pg.countmode', 'count');
  root.insertBefore(chips(MODES, mode, (m) => { mode = m; storage.write('pg.countmode', m); round(); }), board);
  const max = () => Math.max(3, Math.min(getSettings().countMax || 10, 20));
  let prompt = '', timer = 0, alive = true;
  root.querySelector('.say-btn').onclick = () => say(prompt);
  const next = (ms = 2600) => { clearTimeout(timer); timer = setTimeout(() => alive && round(), ms); };

  function items(n, thing, tappable) {
    board.innerHTML = '';
    const size = n <= 3 ? 22 : n <= 6 ? 17 : n <= 10 ? 13.5 : 10;
    board.style.setProperty('--sz', size + 'vmin');
    let counted = 0;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.className = 'item';
      b.textContent = thing[0];
      b.style.animationDelay = i * 60 + 'ms';
      b.onclick = (e) => {
        if (!tappable) { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); return; }
        if (b.dataset.n) { say(b.dataset.n); return; }
        counted++; b.dataset.n = counted;
        b.classList.add('counted');
        sfx.chime(counted); buzz(10);
        burst(e.clientX, e.clientY, { n: 10, speed: 180, shape: 'star' });
        if (counted === n && mode === 'count') {
          say(String(counted)).then(() => alive && celebrate(`${n} ${n === 1 ? thing[1] : thing[2]}! ` + pick(['Well done!', 'Yay!', 'Brilliant!'])));
          next(3500);
        } else say(String(counted), { rate: 1 });
      };
      board.appendChild(b);
    }
  }

  function choices(n, onRight, render = (k) => String(k)) {
    answers.innerHTML = '';
    const opts = new Set([n]);
    while (opts.size < 3) { const k = 1 + rnd(max()); opts.add(k); }
    for (const k of shuffle([...opts])) {
      const b = document.createElement('button');
      b.className = 'answer';
      b.innerHTML = render(k);
      b.onclick = () => {
        if (k === n) {
          b.classList.add('right'); answers.querySelectorAll('button').forEach((x) => (x.disabled = true));
          onRight(); next(3200);
        } else {
          b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
          sfx.oops(); say(`That's ${k}. Try again!`);
        }
      };
      answers.appendChild(b);
    }
  }

  function round() {
    clearTimeout(timer);
    const thing = pick(COUNT_THINGS);
    answers.innerHTML = '';
    if (mode === 'count') {
      const n = 1 + rnd(Math.min(max(), 10));
      items(n, thing, true);
      prompt = `Let's count the ${thing[2]}! Tap each one.`;
    } else if (mode === 'howmany') {
      const n = 1 + rnd(Math.min(max(), 10));
      items(n, thing, true);
      prompt = `How many ${thing[2]}?`;
      choices(n, () => celebrate(`Yes! ${n} ${n === 1 ? thing[1] : thing[2]}!`));
    } else {
      const n = 1 + rnd(max());
      board.innerHTML = `<div class="bignum-ask">?</div>`;
      prompt = `Can you find number ${n}?`;
      choices(n, () => { board.innerHTML = `<div class="bignum">${n}</div>`; celebrate(`Yes! That's ${n}!`); }, (k) => `<span class="num">${k}</span>`);
    }
    say(prompt);
  }
  round();
  return () => { alive = false; clearTimeout(timer); };
}
