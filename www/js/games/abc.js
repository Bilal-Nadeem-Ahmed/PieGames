// Letters ABC. The child's Pie Pet helps and cheers. Wrong answers just fade away - nothing is punished.
//  📖 learn: a big letter with three pictures to tap ("B is for bear"), and an A-Z strip to jump around
//  🍎 what starts with...?: pick the picture that starts with the letter
//  🔍 find the letter (from level 3: match the big letter to its small one)
//  🎈 pop the letter, ✍️ trace the letter
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { storage } from '../store.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { askPill, homeBtn, chips, ICON, shuffle, pick, rnd } from '../ui.js';
import { burst } from '../fx.js';
import { ABC, letterLine, wordsFor } from '../data.js';
import { traceRound } from './trace.js';
import { popFind, makeOptions } from './popfind.js';
import { buddy, wellDone, answerButtons } from './learn-kit.js';

const MODES = [
  { id: 'learn', icon: '📖', label: 'Learn letters' },
  { id: 'starts', icon: '🍎', label: 'What starts with...?' },
  { id: 'find', icon: '🔍', label: 'Find the letter' },
  { id: 'pop', icon: '🎈', label: 'Pop the letter' },
  { id: 'trace', icon: '✍️', label: 'Trace the letter' },
];
const line = (L, w) => letterLine([L, '', w]);

export function mount(el) {
  el.innerHTML = `<div class="screen learn abc">${homeBtn()}<button class="rbtn say-btn" aria-label="Say again">${ICON.speaker}</button>
    <div class="board"></div><div class="answers"></div></div>`;
  const root = el.firstElementChild, board = root.querySelector('.board'), answers = root.querySelector('.answers');
  const badge = levelBadge(root, 'abc', () => show());
  const bud = buddy(root);
  const L = () => getLevel('abc') - 1;
  const low = (ch) => (L() >= 3 ? ch.toLowerCase() : ch);        // level 4 uses lowercase letters
  const cele = (t) => { wellDone(bud, t); win('abc', badge); };
  let mode = storage.read('pg.abcmode', 'learn'), idx = storage.read('pg.abcidx', 0), prompt = '', timer = 0, alive = true, stopPop = null, lastLetter = '';
  if (!MODES.some((m) => m.id === mode)) mode = 'learn';
  root.insertBefore(chips(MODES, mode, (m) => { mode = m; storage.write('pg.abcmode', m); show(); }), board);
  root.querySelector('.say-btn').onclick = () => say(prompt);
  const seen = new Set(storage.read('pg.abcseen', []));
  // a letter we didn't just have
  const fresh = () => { let e; do { e = pick(ABC); } while (e[0] === lastLetter); lastLetter = e[0]; return e; };

  // ---- learn: letter + three pictures, and the alphabet along the bottom
  function learn() {
    const e = ABC[idx], words = wordsFor(e[0]);
    seen.add(e[0]); storage.write('pg.abcseen', [...seen]);
    board.innerHTML = `<button class="rbtn nav prev" aria-label="Back">${ICON.prev}</button>
      <div class="lcard"><button class="letter">${e[0]}<small>${e[0].toLowerCase()}</small></button>
        <div class="pics">${words.map(([em, w], i) => `<button class="picbtn" data-i="${i}" style="animation-delay:${0.1 + i * 0.1}s"><span>${em}</span><em>${w}</em></button>`).join('')}</div></div>
      <button class="rbtn nav next" aria-label="Next">${ICON.next}</button>`;
    answers.innerHTML = `<div class="alpha">${ABC.map((x, i) => `<button class="${i === idx ? 'on' : ''}${seen.has(x[0]) ? ' seen' : ''}" data-i="${i}">${x[0]}</button>`).join('')}</div>`;
    { const strip = answers.querySelector('.alpha'), on = strip.querySelector('.on'); if (on) strip.scrollLeft = on.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2; }
    prompt = letterLine(e);
    say(prompt);
    const go = (i) => { idx = (i + ABC.length) % ABC.length; storage.write('pg.abcidx', idx); sfx.tap(); learn(); };
    board.querySelector('.prev').onclick = () => go(idx - 1);
    board.querySelector('.next').onclick = () => go(idx + 1);
    answers.querySelectorAll('.alpha button').forEach((b) => (b.onclick = () => go(+b.dataset.i)));
    const bounce = (b, ev) => { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); burst(ev.clientX, ev.clientY, { n: 12, shape: 'star' }); buzz(8); };
    board.querySelector('.letter').onclick = (ev) => { bounce(ev.currentTarget, ev); sfx.chime(idx); say(e[0]); bud.wow(); };
    board.querySelectorAll('.picbtn').forEach((b) => (b.onclick = (ev) => { bounce(b, ev); sfx.chime(idx + 1 + +b.dataset.i); prompt = line(e[0], words[+b.dataset.i][1]); say(prompt); bud.cheer(); }));
  }

  // ---- what starts with B? pick the picture
  function starts() {
    clearTimeout(timer);
    const e = fresh(), [em, w] = pick(wordsFor(e[0]));
    board.innerHTML = `<div class="ask-card"><span>🔍</span>${e[0]}<small>${e[0].toLowerCase()}</small></div>`;
    prompt = `What starts with ${e[0]}?`;
    say(prompt);
    const opts = [{ key: e[0], html: `<span class="pic">${em}</span>`, w }];
    let guard = 0;
    while (opts.length < [2, 3, 3, 4][L()] && guard++ < 100) {
      const o = pick(ABC); if (o[0] === 'X' || opts.some((x) => x.key === o[0])) continue;
      const [oe, ow] = pick(wordsFor(o[0])); opts.push({ key: o[0], html: `<span class="pic">${oe}</span>`, w: ow });
    }
    answerButtons(answers, opts, e[0], { bud, cls: 'picans',
      onWrong: (o) => say(line(o.key, o.w)),
      onRight: () => { board.innerHTML = `<div class="lcard small"><div class="letter">${e[0]}<small>${e[0].toLowerCase()}</small></div><div class="pics"><div class="picbtn"><span>${em}</span><em>${w}</em></div></div></div>`;
        cele(`Yes! ${line(e[0], w)}`); timer = setTimeout(() => alive && starts(), 3600); } });
  }

  // ---- find the letter (level 3: the question is a capital, the answers are small letters)
  function find() {
    clearTimeout(timer);
    const e = fresh(), match = L() === 2, show = (ch) => (match ? ch.toLowerCase() : low(ch));
    board.innerHTML = `<div class="ask-card"><span>🔍</span>${match ? e[0] : low(e[0])}</div>`;
    prompt = `Find the letter ${e[0]}!`;
    say(prompt);
    const opts = new Set([e]);
    while (opts.size < [2, 3, 4, 4][L()]) opts.add(ABC[rnd(ABC.length)]);
    answerButtons(answers, [...opts].map((o) => ({ key: o[0], html: `<span class="num">${show(o[0])}</span>` })), e[0], { bud,
      onWrong: (o) => say(o.key),
      onRight: () => { board.innerHTML = `<div class="lcard small"><div class="letter">${e[0]}<small>${e[0].toLowerCase()}</small></div><div class="pics"><div class="picbtn"><span>${e[1]}</span><em>${e[2]}</em></div></div></div>`;
        cele(`Yes! ${letterLine(e)}`); timer = setTimeout(() => alive && find(), 3600); } });
  }

  function popLetters() {
    const e = fresh();
    answers.innerHTML = '';
    prompt = `Pop the letter ${e[0]}!`; say(prompt); askPill(root, low(e[0]));
    stopPop = popFind(board, { target: low(e[0]), options: makeOptions(e[0], ABC.map((x) => x[0]), [2, 3, 4, 5][L()]).map(low), wrongText: (k) => `That's ${k.toUpperCase()}!`,
      onRight: () => { cele(`Yes! ${letterLine(e)}`); timer = setTimeout(() => alive && show(), 3600); } });
  }
  function trace() {
    const e = ABC[idx];
    answers.innerHTML = `<div class="trace-hint">${e[1]} <span>${e[2]}</span></div>`;
    prompt = `Trace the letter ${e[0]}!`; say(prompt);
    traceRound(board, low(e[0]), () => {
      cele(`${letterLine(e)}`);
      idx = (idx + 1) % ABC.length; storage.write('pg.abcidx', idx);
      timer = setTimeout(() => alive && show(), 3600);
    });
  }
  const show = () => {
    clearTimeout(timer); stopPop?.(); stopPop = null; askPill(root, '');
    root.dataset.mode = mode;
    ({ learn, starts, find, pop: popLetters, trace })[mode]();
  };
  show();
  return () => { alive = false; clearTimeout(timer); stopPop?.(); bud.remove(); };
}
