// ABC: flashcards ("A is for apple") and "find the letter".
import { sfx } from '../sound.js';
import { say } from '../speech.js';
import { storage } from '../store.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { askPill, homeBtn, chips, ICON, shuffle, pick, rnd } from '../ui.js';
import { celebrate, burst } from '../fx.js';
import { ABC, letterLine } from '../data.js';
import { traceRound } from './trace.js';
import { popFind, makeOptions } from './popfind.js';

const MODES = [
  { id: 'learn', icon: '📖', label: 'Learn letters' },
  { id: 'find', icon: '🔍', label: 'Find the letter' },
  { id: 'pop', icon: '🎈', label: 'Pop the letter' },
  { id: 'trace', icon: '✍️', label: 'Trace the letter' },
];

export function mount(el) {
  el.innerHTML = `<div class="screen learn abc">${homeBtn()}<button class="rbtn say-btn" aria-label="Say again">${ICON.speaker}</button>
    <div class="board"></div><div class="answers"></div></div>`;
  const root = el.firstElementChild, board = root.querySelector('.board'), answers = root.querySelector('.answers');
  const badge = levelBadge(root, 'abc', () => show());
  const L = () => getLevel('abc') - 1;
  const low = (ch) => (L() >= 3 ? ch.toLowerCase() : ch);        // level 4 uses lowercase letters
  const cele = (t) => { celebrate(t); win('abc', badge); };
  let mode = storage.read('pg.abcmode', 'learn'), idx = storage.read('pg.abcidx', 0), prompt = '', timer = 0, alive = true, stopPop = null;
  root.insertBefore(chips(MODES, mode, (m) => { mode = m; storage.write('pg.abcmode', m); show(); }), board);
  root.querySelector('.say-btn').onclick = () => say(prompt);

  function card(e, big = true) {
    return `<div class="card ${big ? 'big' : ''}"><div class="letter">${e[0]}<small>${e[0].toLowerCase()}</small></div><div class="pic">${e[1]}</div><div class="word">${e[2]}</div></div>`;
  }

  function learn() {
    const e = ABC[idx];
    board.innerHTML = `<button class="rbtn nav prev" aria-label="Back">${ICON.prev}</button>${card(e)}<button class="rbtn nav next" aria-label="Next">${ICON.next}</button>`;
    answers.innerHTML = '';
    prompt = letterLine(e);
    say(prompt);
    const go = (d) => { idx = (idx + d + ABC.length) % ABC.length; storage.write('pg.abcidx', idx); sfx.tap(); learn(); };
    board.querySelector('.prev').onclick = () => go(-1);
    board.querySelector('.next').onclick = () => go(1);
    const c = board.querySelector('.card');
    c.onclick = (ev) => { c.classList.remove('bounce'); void c.offsetWidth; c.classList.add('bounce'); sfx.chime(idx); burst(ev.clientX, ev.clientY, { n: 12, shape: 'star' }); say(prompt); };
  }

  function find() {
    clearTimeout(timer);
    const e = pick(ABC);
    board.innerHTML = `<div class="ask-card"><span>🔍</span>${low(e[0])}</div>`;
    prompt = `Find the letter ${e[0]}!`;
    say(prompt);
    answers.innerHTML = '';
    const opts = new Set([e]);
    while (opts.size < [2, 3, 4, 4][L()]) opts.add(ABC[rnd(ABC.length)]);
    for (const o of shuffle([...opts])) {
      const b = document.createElement('button');
      b.className = 'answer';
      b.innerHTML = `<span class="num">${low(o[0])}</span>`;
      b.onclick = () => {
        if (o === e) {
          b.classList.add('right'); answers.querySelectorAll('button').forEach((x) => (x.disabled = true));
          board.innerHTML = card(e, false);
          cele(`Yes! ${letterLine(e)}`);
          timer = setTimeout(() => alive && find(), 3800);
        } else {
          b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
          sfx.oops(); say(`That's ${o[0]}. Try again!`);
        }
      };
      answers.appendChild(b);
    }
  }

  function popLetters() {
    const e = pick(ABC);
    answers.innerHTML = '';
    prompt = `Pop the letter ${e[0]}!`; say(prompt); askPill(root, low(e[0]));
    stopPop = popFind(board, { target: low(e[0]), options: makeOptions(e[0], ABC.map((x) => x[0]), [2, 3, 4, 5][L()]).map(low), wrongText: (k) => `That's ${k.toUpperCase()}!`,
      onRight: () => { cele(`Yes! ${letterLine(e)}`); timer = setTimeout(() => alive && show(), 3800); } });
  }
  function trace() {
    const e = ABC[idx];
    answers.innerHTML = `<div class="trace-hint">${e[1]} <span>${e[2]}</span></div>`;
    prompt = `Trace the letter ${e[0]}!`; say(prompt);
    traceRound(board, e[0], () => {
      cele(`${letterLine(e)}`);
      idx = (idx + 1) % ABC.length; storage.write('pg.abcidx', idx);
      timer = setTimeout(() => alive && show(), 3800);
    });
  }
  const show = () => {
    clearTimeout(timer); stopPop?.(); stopPop = null; askPill(root, '');
    ({ learn, find, pop: popLetters, trace })[mode]();
  };
  show();
  return () => { alive = false; clearTimeout(timer); stopPop?.(); };
}
