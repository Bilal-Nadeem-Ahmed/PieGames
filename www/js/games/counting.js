// Counting 123. The child's Pie Pet helps and cheers. Wrong answers just fade away - nothing is punished.
//  👆 tap and count: tap each thing; a number line lights up as you go
//  🍪 feed the pet: the pet asks for a number of treats; tap them one at a time to hand them over
//  ❓ how many: count the things and pick the number (dots under the numbers help)
//  🚂 number train: one carriage has lost its number - which one comes next?
//  🎈 pop the number, ✍️ trace the number
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getSettings, storage } from '../store.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { askPill, homeBtn, chips, ICON, shuffle, pick, rnd } from '../ui.js';
import { burst } from '../fx.js';
import { COUNT_THINGS } from '../data.js';
import { traceRound } from './trace.js';
import { popFind, makeOptions } from './popfind.js';
import { buddy, dots, wellDone, answerButtons } from './learn-kit.js';

const MODES = [
  { id: 'count', icon: '👆', label: 'Tap and count' },
  { id: 'feed', icon: '🍪', label: 'Feed the pet' },
  { id: 'howmany', icon: '❓', label: 'How many?' },
  { id: 'train', icon: '🚂', label: 'Number train' },
  { id: 'pop', icon: '🎈', label: 'Pop the number' },
  { id: 'trace', icon: '✍️', label: 'Trace the number' },
];
const TREATS = ['🍪', '🍎', '🍓', '🥕', '🍌', '🧁'];
const ENGINE = `<svg class="engine" viewBox="0 0 120 100"><rect x="8" y="38" width="70" height="38" rx="14" fill="#22c55e" stroke="#2b2118" stroke-width="4"/>
  <rect x="62" y="12" width="46" height="64" rx="8" fill="#ef4444" stroke="#2b2118" stroke-width="4"/><rect x="72" y="22" width="26" height="22" rx="5" fill="#bde7ff" stroke="#2b2118" stroke-width="3"/>
  <path d="M20 38 V20 H14 V10 H40 V20 H34 V38 Z" fill="#334155" stroke="#2b2118" stroke-width="4" stroke-linejoin="round"/>
  <rect x="2" y="70" width="112" height="10" rx="4" fill="#334155"/><circle class="wh" cx="28" cy="84" r="13" fill="#ffd23f" stroke="#2b2118" stroke-width="4"/><circle class="wh" cx="86" cy="84" r="13" fill="#ffd23f" stroke="#2b2118" stroke-width="4"/>
  <circle class="puff" cx="27" cy="2" r="7" fill="#fff"/></svg>`;

export function mount(el) {
  el.innerHTML = `<div class="screen learn counting">${homeBtn()}<button class="rbtn say-btn" aria-label="Say again">${ICON.speaker}</button>
    <div class="board"></div><div class="answers"></div></div>`;
  const root = el.firstElementChild, board = root.querySelector('.board'), answers = root.querySelector('.answers');
  const badge = levelBadge(root, 'count', () => round());
  const bud = buddy(root);
  const L = () => getLevel('count') - 1;
  const cele = (t) => { wellDone(bud, t); win('count', badge); };
  let mode = storage.read('pg.countmode', 'count');
  if (!MODES.some((m) => m.id === mode)) mode = 'count';
  root.insertBefore(chips(MODES, mode, (m) => { mode = m; storage.write('pg.countmode', m); round(); }), board);
  // numbers go up with the level (3, 5, 10, 15, 20), never past the grown-ups' 'Numbers up to' setting
  const max = () => Math.min([3, 5, 10, 15, 20][L()], Math.max(3, getSettings().countMax || 20));
  const plural = (n, thing) => `${n} ${n === 1 ? thing[1] : thing[2]}`;
  let prompt = '', timer = 0, alive = true, stopPop = null;
  root.querySelector('.say-btn').onclick = () => say(prompt);
  const next = (ms = 2600) => { clearTimeout(timer); timer = setTimeout(() => alive && round(), ms); };

  // a row of numbered boxes that light up one by one
  function track(n) {
    answers.innerHTML = `<div class="track">${Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>`;
    return (k) => { const s = answers.querySelectorAll('.track span')[k - 1]; if (s) { s.classList.add('on'); const tr = s.parentElement; tr.scrollLeft = s.offsetLeft - tr.offsetLeft - tr.clientWidth / 2 + s.offsetWidth / 2; } };
  }

  function items(n, thing, onAll) {
    board.innerHTML = '';
    const size = n <= 3 ? 22 : n <= 5 ? 17 : n <= 10 ? 11 : 8.5;
    board.style.setProperty('--szn', size);
    const light = mode === 'count' ? track(n) : null;
    let counted = 0;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('button');
      b.className = 'item';
      b.textContent = thing[0];
      b.style.animationDelay = i * 60 + 'ms';
      b.onclick = (e) => {
        if (b.dataset.n) { say(b.dataset.n); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); return; }
        counted++; b.dataset.n = counted;
        b.classList.add('counted');
        sfx.chime(counted); buzz(10); light?.(counted);
        burst(e.clientX, e.clientY, { n: 10, speed: 180, shape: 'star' });
        if (counted === n) board.querySelectorAll('.item').forEach((it, j) => { it.style.animationDelay = j * 80 + 'ms'; it.classList.add('dance'); });
        if (counted === n && onAll) say(String(counted)).then(() => alive && onAll());
        else say(String(counted), { rate: 1 });
      };
      board.appendChild(b);
    }
  }

  // number buttons; the wrong ones fade away so it gets easier
  function numberChoices(n, onRight, { near = false } = {}) {
    const want = Math.min(max(), [2, 3, 3, 4, 4][L()]), opts = new Set([n]);
    let guard = 0;
    while (opts.size < want && guard++ < 200) { const k = near ? n + pick([-2, -1, 1, 2]) : 1 + rnd(max()); if (k >= 1) opts.add(k); }
    answerButtons(answers, [...opts].map((k) => ({ key: k, html: `<span class="num">${k}</span>${L() < 3 && k <= 10 ? dots(k) : ''}` })), n, {
      bud, onRight: () => { onRight(); }, onWrong: (o) => say(String(o.key)),
    });
  }

  // ---- feed the pet: hand over exactly n treats, one tap each
  function feed() {
    const n = 1 + rnd(Math.min(max(), L() === 0 ? 3 : L() === 1 ? 5 : 8)), treat = pick(TREATS);
    board.innerHTML = `<div class="feedrow"><div class="petspot"></div><div class="wish"><b>${n}</b><div class="plate">${Array.from({ length: n }, () => `<i>${treat}</i>`).join('')}</div></div></div>`;
    board.querySelector('.petspot').appendChild(bud.el); bud.el.classList.add('big'); bud.wow();
    const extra = L() < 2 ? 0 : 2;                     // from level 3 there are a couple more treats than the pet wants
    answers.innerHTML = `<div class="ntray">${Array.from({ length: n + extra }, (_, i) => `<button class="ntreat" style="animation-delay:${i * 50}ms">${treat}</button>`).join('')}</div>`;
    prompt = `${n}! Give me ${n}!`;
    let given = 0, busy = false;
    answers.querySelectorAll('.ntreat').forEach((b) => (b.onclick = () => {
      if (busy || given >= n || b.classList.contains('gone')) return;
      busy = true; given++;
      const from = b.getBoundingClientRect(), to = bud.mouth();
      b.classList.add('gone'); sfx.tap(); buzz(8);
      const fly = document.createElement('div'); fly.className = 'fly-treat'; fly.textContent = treat;
      Object.assign(fly.style, { left: from.left + from.width / 2 + 'px', top: from.top + from.height / 2 + 'px' });
      document.body.appendChild(fly);
      const k = given;
      fly.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(calc(-50% + ${(to.left + to.width / 2 - from.left - from.width / 2) / 2}px), calc(-50% + ${to.top - from.top - 90}px)) scale(1.2)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${to.left + to.width / 2 - from.left - from.width / 2}px), calc(-50% + ${to.top + to.height / 2 - from.top - from.height / 2}px)) scale(.3)` }], { duration: 480, easing: 'ease-in' }).onfinish = () => {
        fly.remove(); if (!alive) return;
        bud.eat(); sfx.munch(); sfx.chime(k);
        board.querySelectorAll('.plate i')[k - 1]?.classList.add('on');
        busy = false;
        if (k === n) {
          answers.querySelectorAll('.ntreat:not(.gone)').forEach((x) => x.classList.add('gone'));
          say(String(k)).then(() => { if (!alive) return; bud.voice(); cele(`${n}! Yum!`); next(3200); });
        } else say(String(k), { rate: 1 });
      };
    }));
  }

  // ---- number train: which number is missing?
  function train() {
    const len = L() === 0 ? 3 : 4, a = 1 + rnd(Math.max(1, max() - len + 1)), seq = Array.from({ length: len }, (_, i) => a + i);
    const gap = L() < 2 ? len - 1 : rnd(len), n = seq[gap];
    board.innerHTML = `<div class="train">${seq.map((k, i) => `<div class="car${i === gap ? ' gap' : ''}" style="animation-delay:${i * 90}ms"><b>${i === gap ? '?' : k}</b><i></i><i></i></div>`).join('')}${ENGINE}</div>`;
    prompt = L() < 2 ? `What comes next?` : `Which number is missing?`;
    numberChoices(n, () => {
      const car = board.querySelector('.car.gap'); car.classList.remove('gap'); car.classList.add('filled'); car.querySelector('b').textContent = n;
      sfx.beep(); cele(`${n}!`);
      setTimeout(() => { if (alive) { board.querySelector('.train')?.classList.add('go'); sfx.vroom(); } }, 900);
      next(3400);
    }, { near: true });
  }

  function round() {
    clearTimeout(timer); stopPop?.(); stopPop = null; askPill(root, ''); bud.home();
    const thing = pick(COUNT_THINGS);
    answers.innerHTML = '';
    root.dataset.mode = mode;
    if (mode === 'count') {
      const n = 1 + rnd(Math.min(max(), 10));
      prompt = `Let's count the ${thing[2]}! Tap each one.`;
      items(n, thing, () => { answers.innerHTML = `<div class="bigsay">${n}</div>`; cele(`${plural(n, thing)}! ` + pick(['Well done!', 'Yay!', 'Brilliant!'])); next(3400); });
    } else if (mode === 'feed') feed();
    else if (mode === 'howmany') {
      const n = 1 + rnd(Math.min(max(), 10));
      items(n, thing, null);
      prompt = `How many ${thing[2]}?`;
      numberChoices(n, () => { cele(`Yes! ${plural(n, thing)}!`); next(3200); });
    } else if (mode === 'train') train();
    else if (mode === 'pop') {
      const n = 1 + rnd(max());
      const pool = Array.from({ length: max() }, (_, i) => String(i + 1));
      prompt = `Pop number ${n}!`; askPill(root, n);
      stopPop = popFind(board, { target: String(n), options: makeOptions(String(n), pool, [2, 3, 4, 4, 5][L()]), wrongText: (k) => `That's ${k}!`,
        onRight: () => { cele(`Yes! Number ${n}!`); next(3200); } });
    } else {
      const n = 1 + rnd(Math.min(max(), 10));
      prompt = `Trace the number ${n} with your finger!`;
      traceRound(board, String(n), () => { cele(`${n}! ` + pick(['Well done!', 'Brilliant!', 'Super tracing!'])); next(3500); });
    }
    say(prompt);
  }
  round();
  return () => { alive = false; clearTimeout(timer); stopPop?.(); bud.remove(); document.querySelectorAll('.fly-treat').forEach((x) => x.remove()); };
}
