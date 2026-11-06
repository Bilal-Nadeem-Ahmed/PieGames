// Feed the animals: drag the right food to each hungry animal. As the food comes close the animal
// opens its mouth; the right food gets munched (chewing, crunch sounds) then the animal is happy
// (happy eyes, hearts, dance, its own sound). The wrong food gets a head shake: "No thank you!"
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { homeBtn, shuffle, draggable, inside, wait } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { animalSound, preloadAnimals } from '../animals.js';

const O = 'stroke="#2b2118" stroke-width="4" stroke-linejoin="round"';
// Shared face parts. Each animal places them with (eyeY, mouthY).
const face = (ey, my, { eyeGap = 26, pupil = '#1b1b1b', muzzle = '' } = {}) => `
  ${muzzle}
  <g class="eyes">${[-1, 1].map((s) => `<g transform="translate(${100 + s * eyeGap} ${ey})"><ellipse rx="11" ry="13" fill="#fff" ${O}/><circle class="pupil" cx="0" cy="2" r="6.5" fill="${pupil}"/><circle cx="2.5" cy="-1.5" r="2.4" fill="#fff"/></g>`).join('')}</g>
  <g class="happy-eyes">${[-1, 1].map((s) => `<path d="M${100 + s * eyeGap - 11} ${ey + 3} Q${100 + s * eyeGap} ${ey - 11} ${100 + s * eyeGap + 11} ${ey + 3}" fill="none" stroke="#2b2118" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
  <path class="mouth-closed" d="M${100 - 14} ${my} Q100 ${my + 14} ${100 + 14} ${my}" fill="none" stroke="#2b2118" stroke-width="4.5" stroke-linecap="round"/>
  <g class="mouth-open"><ellipse cx="100" cy="${my + 6}" rx="18" ry="16" fill="#7a1f2b" ${O}/><ellipse cx="100" cy="${my + 14}" rx="10" ry="6" fill="#ff7a8a"/></g>
  <g class="cheeks"><ellipse cx="${100 - eyeGap - 12}" cy="${my - 4}" rx="9" ry="6" fill="#ff8a8a" opacity=".5"/><ellipse cx="${100 + eyeGap + 12}" cy="${my - 4}" rx="9" ry="6" fill="#ff8a8a" opacity=".5"/></g>`;

const ANIMALS = {
  dog: { food: '🦴', name: 'dog', sound: () => animalSound('dog'), svg: `
    <ellipse cx="100" cy="178" rx="52" ry="30" fill="#c98a4b" ${O}/>
    <ellipse cx="46" cy="96" rx="20" ry="40" fill="#8a5a2b" ${O} transform="rotate(18 46 96)"/><ellipse cx="154" cy="96" rx="20" ry="40" fill="#8a5a2b" ${O} transform="rotate(-18 154 96)"/>
    <circle cx="100" cy="95" r="58" fill="#c98a4b" ${O}/><ellipse cx="78" cy="70" rx="14" ry="10" fill="#e0a868"/>
    ${face(84, 128, { muzzle: `<ellipse cx="100" cy="122" rx="34" ry="26" fill="#f1d2a8" ${O}/><ellipse cx="100" cy="106" rx="11" ry="8" fill="#2b2118"/>` })}` },
  cat: { food: '🐟', name: 'cat', sound: () => animalSound('cat'), svg: `
    <ellipse cx="100" cy="178" rx="50" ry="30" fill="#b0b7c3" ${O}/>
    <path d="M50 70 L58 18 L92 50 Z" fill="#b0b7c3" ${O}/><path d="M150 70 L142 18 L108 50 Z" fill="#b0b7c3" ${O}/>
    <path d="M60 58 L63 32 L80 48 Z" fill="#ffb3c1"/><path d="M140 58 L137 32 L120 48 Z" fill="#ffb3c1"/>
    <circle cx="100" cy="96" r="56" fill="#b0b7c3" ${O}/>
    ${face(88, 126, { muzzle: `<ellipse cx="100" cy="122" rx="24" ry="16" fill="#f4f4f4"/><path d="M93 109 L107 109 L100 117 Z" fill="#ff8aa0" ${O}/>
      <path d="M58 116 H30 M58 124 L32 132 M142 116 H170 M142 124 L168 132" stroke="#2b2118" stroke-width="2.5" stroke-linecap="round"/>` })}` },
  bunny: { food: '🥕', name: 'bunny', sound: () => { sfx.giggle(); }, svg: `
    <ellipse cx="100" cy="180" rx="48" ry="28" fill="#f4f4f4" ${O}/>
    <ellipse cx="74" cy="34" rx="16" ry="42" fill="#f4f4f4" ${O} transform="rotate(-10 74 34)"/><ellipse cx="126" cy="34" rx="16" ry="42" fill="#f4f4f4" ${O} transform="rotate(10 126 34)"/>
    <ellipse cx="74" cy="36" rx="7" ry="30" fill="#ffc2cf" transform="rotate(-10 74 36)"/><ellipse cx="126" cy="36" rx="7" ry="30" fill="#ffc2cf" transform="rotate(10 126 36)"/>
    <circle cx="100" cy="102" r="52" fill="#f4f4f4" ${O}/>
    ${face(94, 130, { muzzle: `<ellipse cx="100" cy="116" rx="8" ry="6" fill="#ff8aa0"/><rect class="teeth" x="93" y="131" width="14" height="10" rx="2" fill="#fff" ${O}/>` })}` },
  elephant: { food: '🥜', name: 'elephant', sound: () => animalSound('elephant'), svg: `
    <ellipse cx="100" cy="182" rx="56" ry="28" fill="#9fb3c8" ${O}/>
    <circle cx="40" cy="96" r="38" fill="#9fb3c8" ${O}/><circle cx="160" cy="96" r="38" fill="#9fb3c8" ${O}/>
    <circle cx="40" cy="96" r="24" fill="#ffc2cf"/><circle cx="160" cy="96" r="24" fill="#ffc2cf"/>
    <circle cx="100" cy="94" r="56" fill="#9fb3c8" ${O}/>
    ${face(80, 136, { eyeGap: 24 })}
    <g class="trunk"><path d="M86 104 C84 150 96 172 116 168 C126 166 124 156 116 156 C104 158 106 140 114 104 Z" fill="#9fb3c8" ${O}/></g>` },
  monkey: { food: '🍌', name: 'monkey', sound: () => say('Ooh ooh, aah aah!', { pitch: 1.6, rate: 1.2 }), svg: `
    <ellipse cx="100" cy="180" rx="50" ry="30" fill="#8b5a3c" ${O}/>
    <circle cx="42" cy="92" r="22" fill="#8b5a3c" ${O}/><circle cx="158" cy="92" r="22" fill="#8b5a3c" ${O}/><circle cx="42" cy="92" r="12" fill="#f3d1a6"/><circle cx="158" cy="92" r="12" fill="#f3d1a6"/>
    <circle cx="100" cy="96" r="56" fill="#8b5a3c" ${O}/>
    ${face(86, 128, { eyeGap: 22, muzzle: `<path d="M100 66 C82 56 58 66 62 92 C52 104 62 150 100 150 C138 150 148 104 138 92 C142 66 118 56 100 66 Z" fill="#f3d1a6" ${O}/><circle cx="94" cy="110" r="3" fill="#2b2118"/><circle cx="106" cy="110" r="3" fill="#2b2118"/>` })}` },
  sheep: { food: '🌿', name: 'sheep', sound: () => animalSound('sheep'), svg: `
    <ellipse cx="100" cy="180" rx="56" ry="30" fill="#fbfaf6" ${O}/>
    <ellipse cx="52" cy="88" rx="22" ry="10" fill="#34302e" transform="rotate(-25 52 88)"/><ellipse cx="148" cy="88" rx="22" ry="10" fill="#34302e" transform="rotate(25 148 88)"/>
    <ellipse cx="100" cy="104" rx="44" ry="54" fill="#3b3633" ${O}/>
    <path d="M62 66 a14 14 0 0 1 22 -14 a14 14 0 0 1 32 0 a14 14 0 0 1 22 14 a12 12 0 0 1 -10 14 h-56 a12 12 0 0 1 -10 -14z" fill="#fbfaf6" ${O}/>
    ${face(98, 132, { eyeGap: 20 })}` },
};

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="screen feed">${homeBtn()}<div class="critters"></div><div class="tray"></div></div>`;
  const root = el.firstElementChild, critters = root.querySelector('.critters'), tray = root.querySelector('.tray');
  let alive = true, timer = 0;

  function round() {
    const kinds = shuffle(Object.keys(ANIMALS)).slice(0, 4);
    critters.innerHTML = kinds.map((k) => `<div class="critter" data-k="${k}"><svg viewBox="0 0 200 215">${ANIMALS[k].svg}</svg><div class="hearts"></div></div>`).join('');
    tray.innerHTML = '';
    let hungry = kinds.length;
    const els = [...critters.children];
    // blink now and then
    els.forEach((c, i) => setTimeout(() => c.classList.add('blinky'), i * 700));
    for (const k of shuffle([...kinds])) {
      const f = document.createElement('div');
      f.className = 'food'; f.textContent = ANIMALS[k].food; f.dataset.k = k;
      tray.appendChild(f);
      let hover = null;
      draggable(f, {
        onStart: () => sfx.tap(),
        onMove: (x, y) => {
          const near = els.find((c) => !c.classList.contains('fed') && inside(c, x, y, 40));
          if (near !== hover) { hover?.classList.remove('open'); hover = near; if (near) { near.classList.add('open'); sfx.boing(); } }
        },
        onDrop: (x, y) => {
          hover?.classList.remove('open'); hover = null;
          const c = els.find((e) => !e.classList.contains('fed') && inside(e, x, y, 40));
          if (!c) return false;
          if (c.dataset.k !== k) { refuse(c); return false; }
          eat(c, f).then(() => { if (--hungry === 0 && alive) timer = setTimeout(() => { if (!alive) return; celebrate('All the animals are full!'); timer = setTimeout(() => alive && round(), 3500); }, 600); });
          return true;
        },
      });
    }
    say('The animals are hungry! Give them their food.');
  }

  function refuse(c) {
    c.classList.remove('nope'); void c.offsetWidth; c.classList.add('nope');
    sfx.oops(); buzz(30); say('No thank you!');
  }

  async function eat(c, f) {
    f.dataset.locked = 1;
    const k = c.dataset.k, A = ANIMALS[k];
    // fly the food into the mouth
    c.classList.add('open');
    const mouth = c.querySelector('.mouth-open').getBoundingClientRect(), fr = f.getBoundingClientRect();
    const m = new DOMMatrix(getComputedStyle(f).transform);
    f.style.transition = 'transform .35s ease-in, opacity .35s';
    f.style.transform = `translate(${m.e + mouth.left + mouth.width / 2 - (fr.left + fr.width / 2)}px, ${m.f + mouth.top + mouth.height / 2 - (fr.top + fr.height / 2)}px) scale(.25)`;
    f.style.opacity = '0';
    await wait(380);
    f.remove();
    // chew chew chew
    c.classList.remove('open'); c.classList.add('chew');
    for (let i = 0; i < 3; i++) { sfx.munch(); buzz(8); await wait(260); }
    c.classList.remove('chew');
    // happy!
    c.classList.add('fed', 'happy');
    A.sound();
    sfx.ding();
    const r = c.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.35, { n: 16, colors: ['#ff5c8a', '#ff8ac2', '#fff'], shape: 'dot' });
    const hearts = c.querySelector('.hearts');
    for (let i = 0; i < 5; i++) { const h = document.createElement('span'); h.textContent = '❤️'; h.style.left = 20 + Math.random() * 60 + '%'; h.style.animationDelay = i * 0.12 + 's'; hearts.appendChild(h); }
    setTimeout(() => alive && say(`Yum! The ${A.name} is happy!`), 1100);
    await wait(1400);
  }

  round();
  return () => { alive = false; clearTimeout(timer); };
}
