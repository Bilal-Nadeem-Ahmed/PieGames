// Shared bits for the Counting and Letters games: the child's Pie Pet as a helper that reacts to answers,
// dot patterns for numbers, and gentle "narrowing" answer buttons (a wrong one fades away, nothing is punished).
import { petSVG, PETS } from './pet-art.js';
import { currentPlayer } from '../store.js';
import { animalSound } from '../animals.js';
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { confettiRain, praise } from '../fx.js';
import { canSpeak } from '../voices.js';
import { shuffle } from '../ui.js';

export function buddy(host) {
  let saved = null; try { saved = JSON.parse(localStorage.getItem('pg.pet.' + (currentPlayer()?.id || 'p1')) || 'null'); } catch {}
  const type = PETS[saved?.type] ? saved.type : 'puppy', stage = Math.min(2, saved?.stage ?? 1);
  const el = document.createElement('div'); el.className = 'buddy';
  host.appendChild(el);
  let tm = 0;
  const set = (m, ms) => { el.innerHTML = petSVG(type, stage, m); clearTimeout(tm); if (ms) tm = setTimeout(() => set('happy'), ms); };
  const anim = (cls) => { el.classList.remove('hop', 'nope'); void el.offsetWidth; el.classList.add(cls); };
  const voice = () => { const s = PETS[type].sound; if (s) animalSound(s); else if (type === 'dino') sfx.roar(1.6); else sfx.giggle(); };
  set('happy');
  el.addEventListener('pointerdown', () => { anim('hop'); voice(); set('love', 900); });
  return {
    el, type, food: PETS[type].food,
    cheer() { set('love', 1800); anim('hop'); },
    nope() { set('ok', 900); anim('nope'); },      // a little head shake, never a sad face
    eat() { set('eat', 380); },
    wow() { set('excited', 1200); },
    voice,
    mouth() { return (el.querySelector('.mouth, .beak, .trunk') || el).getBoundingClientRect(); },
    home() { host.appendChild(el); el.classList.remove('big'); },
    remove() { clearTimeout(tm); el.remove(); },
  };
}

// dice-style dots under a number, in rows of five
export const dots = (n) => `<span class="dots">${'<i></i>'.repeat(n)}</span>`;

// A small "well done": confetti, a ding, the pet cheers and the voice says the line (or a recorded praise word).
export function wellDone(bud, text) {
  confettiRain(45); sfx.ding(); buzz(25); bud?.cheer();
  setTimeout(() => say(canSpeak(text) ? text : praise()), 500);
}

// Answer buttons. opts: [{ key, html }]. The right one celebrates; a wrong one wobbles, fades out and is said aloud.
export function answerButtons(host, opts, rightKey, { onRight, onWrong, bud, cls = '' } = {}) {
  host.innerHTML = '';
  for (const o of shuffle([...opts])) {
    const b = document.createElement('button');
    b.className = 'answer ' + cls; b.innerHTML = o.html;
    b.onclick = () => {
      if (o.key === rightKey) {
        b.classList.add('right'); host.querySelectorAll('button').forEach((x) => { x.disabled = true; if (x !== b) x.classList.add('gone'); });
        onRight?.(b);
      } else {
        b.classList.add('wrong'); b.disabled = true; setTimeout(() => b.classList.add('gone'), 380);
        sfx.oops(); bud?.nope(); onWrong?.(o);
      }
    };
    host.appendChild(b);
  }
}
