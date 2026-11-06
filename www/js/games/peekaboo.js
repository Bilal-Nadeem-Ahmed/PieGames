// Animal peekaboo: animals (and sometimes the kids!) hide behind bushes, barn doors, haystacks and boxes.
// Tap to peek - the hiding place opens, the animal pops out with its real sound and the voice names it.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { homeBtn, shuffle, pick } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { FARM, animalSound, preloadAnimals } from '../animals.js';
import { createMeadow } from '../scenery.js';

const COVERS = {
  bush: `<svg viewBox="0 0 100 100"><path d="M8 92 C-2 70 12 52 26 56 C24 36 46 28 56 42 C64 26 88 32 86 52 C100 56 102 80 90 92 Z" fill="#3fae4f" stroke="#2b7a35" stroke-width="3"/>
    <path d="M20 80 C30 70 40 74 46 66 M58 72 C66 62 76 66 82 60" fill="none" stroke="#2f9142" stroke-width="3" stroke-linecap="round"/>
    <circle cx="30" cy="66" r="4" fill="#ff5c7a"/><circle cx="62" cy="52" r="4" fill="#ff5c7a"/><circle cx="76" cy="76" r="4" fill="#ffd23f"/><circle cx="44" cy="84" r="4" fill="#ffd23f"/></svg>`,
  door: `<svg viewBox="0 0 100 100"><rect x="6" y="8" width="88" height="86" rx="4" fill="#d64545" stroke="#7a1f1f" stroke-width="4"/>
    <path d="M10 12 L90 90 M90 12 L10 90" stroke="#fff" stroke-width="7"/><rect x="6" y="8" width="88" height="86" rx="4" fill="none" stroke="#fff" stroke-width="7"/>
    <circle cx="80" cy="52" r="4" fill="#ffd23f"/></svg>`,
  hay: `<svg viewBox="0 0 100 100"><path d="M6 94 C4 50 26 24 50 24 C74 24 96 50 94 94 Z" fill="#f2c94c" stroke="#c99a1c" stroke-width="3"/>
    <path d="M20 90 L26 50 M34 92 L38 40 M50 92 L50 30 M64 92 L62 40 M78 90 L74 50 M14 70 L86 70" stroke="#d9a72c" stroke-width="3" stroke-linecap="round"/></svg>`,
  box: `<svg viewBox="0 0 100 100"><rect x="8" y="30" width="84" height="64" rx="4" fill="#c98b4f" stroke="#7a4f24" stroke-width="3"/>
    <path d="M8 30 L22 14 L106 14 L92 30 Z" fill="#e0a868" stroke="#7a4f24" stroke-width="3" transform="translate(-7 0)"/>
    <rect x="44" y="30" width="12" height="64" fill="#e8c27e"/><text x="50" y="72" font-size="22" text-anchor="middle" fill="#7a4f24" font-family="sans-serif" font-weight="900">?</text></svg>`,
  tree: `<svg viewBox="0 0 100 100"><rect x="38" y="46" width="24" height="50" rx="6" fill="#8a5a35" stroke="#5c3b1e" stroke-width="3"/>
    <circle cx="50" cy="34" r="30" fill="#3fae4f" stroke="#2b7a35" stroke-width="3"/><circle cx="26" cy="48" r="18" fill="#3fae4f" stroke="#2b7a35" stroke-width="3"/><circle cx="74" cy="48" r="18" fill="#3fae4f" stroke="#2b7a35" stroke-width="3"/>
    <circle cx="40" cy="26" r="4" fill="#ff5c5c"/><circle cx="62" cy="40" r="4" fill="#ff5c5c"/><circle cx="30" cy="50" r="4" fill="#ff5c5c"/></svg>`,
};

export function mount(el) {
  el.innerHTML = `<div class="screen peek"><canvas class="peek-bg"></canvas>${homeBtn()}<div class="spots"></div></div>`;
  const root = el.firstElementChild, spotsEl = root.querySelector('.spots');
  preloadAnimals();

  // animated meadow background
  const cv = root.querySelector('.peek-bg'), c = cv.getContext('2d'), meadow = createMeadow();
  let W = 0, H = 0, t = 0, last = performance.now(), raf = 0, timer = 0, alive = true;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener('resize', fit);
  const frame = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; meadow.draw(c, W, H, t, dt, t * 6, H * 0.62); raf = requestAnimationFrame(frame); };
  raf = requestAnimationFrame(frame);

  function round() {
    const n = W > H ? 4 : 3;
    const animals = shuffle([...FARM]).slice(0, n).map((a) => ({ kind: 'animal', a }));
    const players = getPlayers();
    if (Math.random() < 0.5 && players.length) animals[(Math.random() * n) | 0] = { kind: 'kid', p: pick(players) };
    const covers = shuffle(Object.keys(COVERS)).slice(0, n);
    spotsEl.innerHTML = '';
    let found = 0;
    animals.forEach((who, i) => {
      const s = document.createElement('div');
      s.className = 'spot'; s.style.animationDelay = i * 90 + 'ms';
      const hider = who.kind === 'kid' ? `<div class="hider kid">${avatarSVG(who.p, { pose: 'up' })}</div>` : `<div class="hider">${who.a.e}</div>`;
      s.innerHTML = `${hider}<div class="cover cover-${covers[i]}">${COVERS[covers[i]]}</div>`;
      const cover = s.querySelector('.cover'), hid = s.querySelector('.hider');
      let open = false;
      const speak = () => {
        if (who.kind === 'kid') { sfx.giggle(); say(who.p.name ? `Peekaboo, ${who.p.name}!` : 'Peekaboo!'); }
        else { animalSound(who.a.id); setTimeout(() => alive && say(`${/^[AEIOU]/.test(who.a.name) ? 'An' : 'A'} ${who.a.name.toLowerCase()}!`), 900); }
      };
      s.addEventListener('pointerdown', (e) => {
        e.preventDefault(); buzz(10);
        if (!open) {
          open = true; s.classList.add('open'); sfx.boing();
          const r = s.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * 0.4, { n: 18, shape: 'star' });
          setTimeout(speak, 250);
          if (++found === n) timer = setTimeout(() => { if (!alive) return; celebrate('You found them all!'); timer = setTimeout(() => alive && closeAll(), 3200); }, 1800);
        } else {
          hid.classList.remove('hop'); void hid.offsetWidth; hid.classList.add('hop'); speak();
        }
      });
      s.dataset.cover = covers[i];
      spotsEl.appendChild(s);
    });
    say('Who is hiding? Tap to find them!');
  }
  function closeAll() {
    spotsEl.querySelectorAll('.spot').forEach((s) => s.classList.add('closing'));
    sfx.tap();
    timer = setTimeout(() => alive && round(), 600);
  }
  round();
  return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); removeEventListener('resize', fit); };
}
