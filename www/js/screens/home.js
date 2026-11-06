// Home: the kids' cartoons (tap to choose who's playing), big game tiles, and a hold-to-open parent button.
import { sfx } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, getSelectedId, setSelectedId } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { ICON } from '../ui.js';

const GAMES = [
  { href: '#balloons', icon: '🎈', label: 'Balloons', bg: '#ff8fab' },
  { href: '#bubbles', icon: '🫧', label: 'Bubbles', bg: '#7dd3fc' },
  { href: '#runner', icon: '🏃', label: 'Run & Jump', bg: '#86efac' },
  { href: '#dino', icon: '🥚', label: 'Dino Eggs', bg: '#fdba74' },
  { href: '#colour', icon: '🎨', label: 'Colouring', bg: '#c4b5fd' },
  { href: '#count', icon: '<b class="ico-txt">123</b>', label: 'Counting', bg: '#fde047' },
  { href: '#abc', icon: '<b class="ico-txt">ABC</b>', label: 'Letters', bg: '#f9a8d4' },
];

const SHEEP_SVG = `<svg viewBox="0 0 120 90"><g stroke="#3a3330" stroke-width="3">
<rect x="34" y="58" width="9" height="26" rx="4" fill="#2f2f33"/><rect x="50" y="62" width="9" height="24" rx="4" fill="#2f2f33"/><rect x="74" y="62" width="9" height="24" rx="4" fill="#2f2f33"/><rect x="88" y="58" width="9" height="26" rx="4" fill="#2f2f33"/>
<path d="M40 30 a14 14 0 0 1 24 -10 a14 14 0 0 1 26 4 a14 14 0 0 1 14 22 a14 14 0 0 1 -10 22 a14 14 0 0 1 -24 4 a14 14 0 0 1 -26 -2 a14 14 0 0 1 -12 -20 a14 14 0 0 1 8 -20z" fill="#fbfaf6"/>
<ellipse cx="22" cy="30" rx="12" ry="5" fill="#34302e" transform="rotate(-25 22 30)"/><ellipse cx="46" cy="27" rx="12" ry="5" fill="#34302e" transform="rotate(20 46 27)"/>
<ellipse cx="33" cy="40" rx="14" ry="17" fill="#34302e"/></g>
<circle cx="27" cy="38" r="5.5" fill="#fff"/><circle cx="39" cy="38" r="5.5" fill="#fff"/><circle cx="26" cy="39" r="2.8"/><circle cx="38" cy="39" r="2.8"/>
<circle cx="29" cy="25" r="6" fill="#fbfaf6"/><circle cx="37" cy="24" r="5" fill="#fbfaf6"/></svg>`;

export function mount(el) {
  const players = getPlayers();
  const sel = getSelectedId();
  el.innerHTML = `<div class="screen home">
    <div class="sky"><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div><div class="sun"></div></div>
    <div class="hill"></div>
    <div class="walker">${SHEEP_SVG}</div>
    <div class="players"></div>
    <div class="tiles"></div>
    <button class="rbtn parent-btn" aria-label="Grown-ups (hold)">${ICON.gear}<svg class="ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"/></svg></button>
  </div>`;
  const pl = el.querySelector('.players');
  for (const p of players) {
    const b = document.createElement('button');
    b.className = 'player' + (p.id === sel ? ' on' : '');
    b.innerHTML = avatarSVG(p) + (p.name ? `<span>${p.name}</span>` : '');
    b.onclick = () => {
      setSelectedId(p.id);
      pl.querySelectorAll('.player').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      b.innerHTML = avatarSVG(p, { pose: 'up' }) + (p.name ? `<span>${p.name}</span>` : '');
      setTimeout(() => { b.innerHTML = avatarSVG(p) + (p.name ? `<span>${p.name}</span>` : ''); }, 900);
      b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop');
      sfx.giggle(); say(p.name ? `Hello ${p.name}!` : 'Hello!');
    };
    pl.appendChild(b);
  }
  const tiles = el.querySelector('.tiles');
  GAMES.forEach((g, i) => {
    const a = document.createElement('a');
    a.className = 'tile'; a.href = g.href; a.style.background = g.bg; a.style.animationDelay = i * 70 + 'ms';
    a.innerHTML = `<span class="ico">${g.icon}</span><span class="lbl">${g.label}</span>`;
    a.onclick = () => sfx.chime(i);
    tiles.appendChild(a);
  });
  const walker = el.querySelector('.walker');
  walker.onclick = () => { sfx.baa(); walker.classList.remove('hop'); void walker.offsetWidth; walker.classList.add('hop'); };

  // grown-ups button: hold for 2 seconds
  const pb = el.querySelector('.parent-btn');
  let hold = 0;
  const start = (e) => { e.preventDefault(); pb.classList.add('holding'); hold = setTimeout(() => { pb.classList.remove('holding'); location.hash = '#parent'; }, 2000); };
  const stop = () => { clearTimeout(hold); pb.classList.remove('holding'); };
  pb.addEventListener('pointerdown', start);
  pb.addEventListener('pointerup', stop); pb.addEventListener('pointerleave', stop); pb.addEventListener('pointercancel', stop);
  return () => clearTimeout(hold);
}
