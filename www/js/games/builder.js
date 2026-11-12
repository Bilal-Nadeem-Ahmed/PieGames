// Build it! Pick a house, car, rocket, boat, train, plane or dog kennel. Saw a plank, then each part flies in loose:
// tap its nails to hammer them in and its screws to screw them in. When it's all built, pick paint pots and tap
// the parts to paint them, then it does something fun (smoke + wave, drive away, blast off, sail, choo choo, fly, puppy).
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { currentPlayer } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { homeBtn, wait } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { petSVG } from './pet-art.js';
import { animalSound, preloadAnimals } from '../animals.js';

const WOOD = '#e8c48e', EDGE = '#8a5a2b';
const S = `stroke="${EDGE}" stroke-width="4" stroke-linejoin="round"`;

// x,y in a 400x300 drawing. Each part: shapes (SVG with fill WOOD), paint colours, fasteners [x, y, 'nail'|'screw'].
export const PROJECTS = {
  house: {
    icon: '🏠', name: 'house',
    parts: [
      { svg: `<rect x="80" y="140" width="240" height="115" rx="4" ${S}/>`, paint: ['#ffd8a8'], f: [[96, 156, 'nail'], [304, 156, 'nail'], [96, 240, 'nail'], [304, 240, 'nail']] },
      { svg: `<path d="M60 146 L200 58 L340 146 Z" ${S}/>`, paint: ['#e5534b'], f: [[110, 132, 'nail'], [200, 82, 'nail'], [290, 132, 'nail']] },
      { svg: `<rect x="176" y="186" width="48" height="69" rx="4" ${S}/>`, paint: ['#3b82f6'], f: [[186, 198, 'screw'], [186, 242, 'screw']], door: true },
      { svg: `<rect x="100" y="166" width="52" height="44" rx="3" ${S}/><path d="M126 166 V210 M100 188 H152" stroke="${EDGE}" stroke-width="3"/>`, paint: ['#bde7ff'], f: [[106, 172, 'screw'], [146, 204, 'screw']] },
      { svg: `<rect x="248" y="166" width="52" height="44" rx="3" ${S}/><path d="M274 166 V210 M248 188 H300" stroke="${EDGE}" stroke-width="3"/>`, paint: ['#bde7ff'], f: [[254, 172, 'screw'], [294, 204, 'screw']] },
      { svg: `<rect x="252" y="72" width="30" height="50" ${S}/>`, paint: ['#a16207'], f: [[267, 84, 'nail']], chimney: true },
    ],
  },
  car: {
    icon: '🚗', name: 'car',
    parts: [
      { svg: `<path d="M40 200 L50 150 L110 140 L350 140 L366 160 L366 210 Z" ${S}/>`, paint: ['#ef4444'], f: [[64, 190, 'nail'], [200, 156, 'nail'], [340, 190, 'nail'], [200, 196, 'nail']] },
      { svg: `<path d="M120 142 L160 92 L270 92 L310 142 Z" ${S}/>`, paint: ['#ef4444'], f: [[150, 132, 'nail'], [280, 132, 'nail']] },
      { svg: `<path d="M140 138 L168 102 L210 102 L210 138 Z" ${S}/><path d="M222 138 L222 102 L264 102 L292 138 Z" ${S}/>`, paint: ['#bde7ff'], f: [[190, 124, 'screw'], [240, 124, 'screw']] },
      { svg: `<circle cx="110" cy="214" r="34" ${S}/><circle cx="110" cy="214" r="12" ${S}/>`, paint: ['#333', '#ccc'], f: [[110, 214, 'screw']], wheel: true },
      { svg: `<circle cx="300" cy="214" r="34" ${S}/><circle cx="300" cy="214" r="12" ${S}/>`, paint: ['#333', '#ccc'], f: [[300, 214, 'screw']], wheel: true },
      { svg: `<ellipse cx="356" cy="170" rx="10" ry="9" ${S}/>`, paint: ['#ffe36e'], f: [[356, 170, 'screw']] },
    ],
  },
  rocket: {
    icon: '🚀', name: 'rocket',
    parts: [
      { svg: `<rect x="160" y="90" width="80" height="150" rx="16" ${S}/>`, paint: ['#f1f5f9'], f: [[176, 106, 'screw'], [224, 106, 'screw'], [176, 224, 'screw'], [224, 224, 'screw']] },
      { svg: `<path d="M160 100 Q200 10 240 100 Z" ${S}/>`, paint: ['#ef4444'], f: [[200, 66, 'nail']] },
      { svg: `<path d="M160 180 L120 250 L160 240 Z" ${S}/>`, paint: ['#3b82f6'], f: [[146, 230, 'nail']] },
      { svg: `<path d="M240 180 L280 250 L240 240 Z" ${S}/>`, paint: ['#3b82f6'], f: [[254, 230, 'nail']] },
      { svg: `<circle cx="200" cy="140" r="20" ${S}/><circle cx="200" cy="140" r="12" ${S}/>`, paint: ['#94a3b8', '#7dd3fc'], f: [[200, 116, 'screw']] },
      { svg: `<rect x="180" y="240" width="40" height="16" rx="4" ${S}/>`, paint: ['#64748b'], f: [[200, 248, 'screw']] },
    ],
  },
  boat: {
    icon: '⛵', name: 'boat',
    parts: [
      { svg: `<path d="M50 196 H350 L306 252 H96 Z" ${S}/>`, paint: ['#3b82f6'], f: [[76, 206, 'nail'], [324, 206, 'nail'], [200, 234, 'nail']] },
      { svg: `<rect x="104" y="150" width="104" height="48" rx="6" ${S}/>`, paint: ['#ffffff'], f: [[118, 162, 'nail'], [194, 162, 'nail']] },
      { svg: `<circle cx="134" cy="178" r="10" ${S}/><circle cx="178" cy="178" r="10" ${S}/>`, paint: ['#bde7ff'], f: [[156, 178, 'screw']] },
      { svg: `<rect x="250" y="36" width="12" height="162" rx="4" ${S}/>`, paint: ['#a16207'], f: [[256, 184, 'nail']] },
      { svg: `<path d="M266 50 Q330 110 340 184 H266 Z" ${S}/>`, paint: ['#ffffff'], f: [[290, 160, 'screw']] },
      { svg: `<path d="M262 34 L296 44 L262 56 Z" ${S}/>`, paint: ['#ef4444'], f: [[270, 44, 'nail']], flag: true },
    ],
  },
  train: {
    icon: '🚂', name: 'train',
    parts: [
      { svg: `<rect x="60" y="136" width="200" height="76" rx="30" ${S}/><rect x="52" y="204" width="300" height="20" rx="6" ${S}/>`, paint: ['#22c55e', '#334155'], f: [[96, 160, 'nail'], [226, 160, 'nail'], [80, 214, 'nail'], [330, 214, 'nail']] },
      { svg: `<rect x="250" y="88" width="96" height="120" rx="8" ${S}/>`, paint: ['#ef4444'], f: [[264, 102, 'nail'], [332, 102, 'nail']] },
      { svg: `<rect x="270" y="108" width="56" height="42" rx="6" ${S}/>`, paint: ['#bde7ff'], f: [[298, 129, 'screw']] },
      { svg: `<path d="M94 138 V98 H82 V80 H130 V98 H118 V138 Z" ${S}/>`, paint: ['#334155'], f: [[106, 120, 'nail']], chimney: true },
      { svg: `<circle cx="108" cy="240" r="27" ${S}/><circle cx="108" cy="240" r="9" ${S}/>`, paint: ['#ef4444', '#ffd23f'], f: [[108, 240, 'screw']], wheel: true },
      { svg: `<circle cx="200" cy="240" r="27" ${S}/><circle cx="200" cy="240" r="9" ${S}/>`, paint: ['#ef4444', '#ffd23f'], f: [[200, 240, 'screw']], wheel: true },
      { svg: `<circle cx="296" cy="240" r="27" ${S}/><circle cx="296" cy="240" r="9" ${S}/>`, paint: ['#ef4444', '#ffd23f'], f: [[296, 240, 'screw']], wheel: true },
    ],
  },
  plane: {
    icon: '✈️', name: 'aeroplane',
    parts: [
      { svg: `<path d="M64 150 Q64 120 104 120 H300 Q348 122 358 150 Q348 178 300 180 H104 Q64 180 64 150 Z" ${S}/>`, paint: ['#ffd23f'], f: [[100, 150, 'nail'], [230, 166, 'nail'], [320, 166, 'nail']] },
      { svg: `<path d="M74 128 L54 64 H94 L130 122 Z" ${S}/>`, paint: ['#ef4444'], f: [[84, 96, 'nail']] },
      { svg: `<path d="M168 156 H262 L226 236 H190 Z" ${S}/>`, paint: ['#3b82f6'], f: [[214, 172, 'nail'], [208, 218, 'nail']] },
      { svg: `<path d="M288 124 H312 Q336 128 346 146 H288 Z" ${S}/>`, paint: ['#bde7ff'], f: [[304, 136, 'screw']] },
      { svg: `<circle cx="140" cy="140" r="8" ${S}/><circle cx="170" cy="140" r="8" ${S}/><circle cx="260" cy="140" r="8" ${S}/>`, paint: ['#bde7ff'], f: [[155, 140, 'screw']] },
      { svg: `<rect x="356" y="104" width="14" height="92" rx="7" ${S}/>`, paint: ['#64748b'], f: [[363, 150, 'screw']], prop: true },
    ],
  },
  kennel: {
    icon: '🐶', name: 'dog kennel',
    parts: [
      { svg: `<rect x="110" y="140" width="180" height="115" rx="4" ${S}/>`, paint: ['#f59e0b'], f: [[126, 156, 'nail'], [274, 156, 'nail'], [126, 240, 'nail'], [274, 240, 'nail']] },
      { svg: `<path d="M88 152 L200 70 L312 152 Z" ${S}/>`, paint: ['#e5534b'], f: [[140, 138, 'nail'], [200, 96, 'nail'], [260, 138, 'nail']] },
      { svg: `<path d="M166 255 V208 A34 34 0 0 1 234 208 V255 Z" ${S}/>`, paint: ['#5b3a1e'], f: [[200, 236, 'screw']], doorway: true },
      { svg: `<rect x="172" y="146" width="56" height="20" rx="6" ${S}/>`, paint: ['#ffffff'], f: [[200, 156, 'screw']] },
      { svg: `<path d="M300 255 Q300 230 332 230 Q364 230 364 255 Z" ${S}/>`, paint: ['#3b82f6'], f: [[332, 244, 'screw']] },
    ],
  },
};
const PAINTS = ['#ef4444', '#ff8ac2', '#ff9f43', '#ffd23f', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#5b3a1e', '#334155'];
const shapesOf = (g) => [...g.querySelectorAll(':scope > rect, :scope > path, :scope > circle, :scope > ellipse')];
// a painted preview of a project for the pick screen
const preview = (P) => `<svg viewBox="40 24 336 248">${P.parts.map((p) => { let j = 0; return p.svg.replace(/<(rect|path|circle|ellipse)(?![^>]*fill=)/g, (m, tag) => `<${tag} fill="${p.paint[j++] || p.paint[0]}"`); }).join('')}</svg>`;

export function mount(el) {
  let alive = true;
  preloadAnimals();
  const me = currentPlayer();
  el.innerHTML = `<div class="screen build">${homeBtn()}<div class="pick"></div></div>`;
  const root = el.firstElementChild;
  const pick = () => {
    root.innerHTML = `${homeBtn()}<div class="pick">${Object.entries(PROJECTS).map(([k, p]) => `<button class="pcard" data-k="${k}" aria-label="${p.name}">${preview(p)}</button>`).join('')}</div>`;
    root.querySelectorAll('.pcard').forEach((b) => (b.onclick = () => { sfx.tap(); build(b.dataset.k); }));
    say('What shall we build?');
  };

  async function build(key) {
    const P = PROJECTS[key];
    root.innerHTML = `${homeBtn()}<div class="workshop">
      <div class="builder">${avatarSVG(me)}</div>
      <svg class="bench" viewBox="0 0 400 300"><g class="ghost">${P.parts.map((p) => p.svg).join('')}</g><g class="made"></g><g class="work"></g><g class="fx"></g></svg>
      <div class="toolbox"><span>🪚</span><span>🔨</span><span>🪛</span></div></div>`;
    const bench = root.querySelector('.bench'), made = bench.querySelector('.made'), work = bench.querySelector('.work'), fxg = bench.querySelector('.fx');
    const builder = root.querySelector('.builder');
    const cheer = () => { builder.innerHTML = avatarSVG(me, { pose: 'up' }); builder.classList.remove('hop'); void builder.offsetWidth; builder.classList.add('hop'); setTimeout(() => { if (alive) builder.innerHTML = avatarSVG(me); }, 600); };

    await sawStep(bench, work, fxg);
    if (!alive) return;
    cheer();
    for (const part of P.parts) {
      if (!alive) return;
      await partStep(part, made, fxg);
      cheer();
    }
    if (!alive) return;
    await paintStep(made);
    if (!alive) return;
    cheer();
    await wait(300);
    finale(key, bench, made, me);
    await wait({ rocket: 2700, plane: 1200, boat: 800, train: 600 }[key] || 0);
    if (!alive) return;
    celebrate(`We built ${/^[aeiou]/.test(P.name) ? 'an' : 'a'} ${P.name}!`);
    await wait(5200);
    if (alive) pick();
  }

  // Saw: rub back and forth across the plank until the end piece drops off.
  function sawStep(bench, work, fxg) {
    return new Promise((resolve) => {
      work.innerHTML = `<g class="plank"><rect x="60" y="130" width="230" height="36" rx="5" fill="${WOOD}" ${S}/><g class="endpiece"><rect x="290" y="130" width="60" height="36" rx="5" fill="${WOOD}" ${S}/></g>
        <path d="M290 120 V176" stroke="#e5534b" stroke-width="4" stroke-dasharray="7 6"/></g><text class="saw" x="300" y="128" font-size="58">🪚</text>`;
      say('Saw the wood! Rub back and forth.');
      const saw = work.querySelector('.saw'), end = work.querySelector('.endpiece');
      let progress = 0, lastX = null, dir = 0;
      const toSvg = (e) => { const r = bench.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * 300]; };
      const move = (e) => {
        const [x] = toSvg(e);
        saw.setAttribute('x', Math.max(240, Math.min(330, x - 20)));
        if (lastX !== null) {
          const d = x - lastX, nd = Math.sign(d);
          progress += Math.abs(d);
          if (nd && nd !== dir) { dir = nd; sfx.saw(); buzz(8); sawdust(fxg, 292, 170); }
          end.setAttribute('transform', `translate(0 ${Math.min(6, progress / 60)})`);
          if (progress > 380) finish();
        }
        lastX = x;
      };
      const down = (e) => { e.preventDefault(); bench.setPointerCapture(e.pointerId); lastX = toSvg(e)[0]; bench.addEventListener('pointermove', move); };
      const up = () => { lastX = null; bench.removeEventListener('pointermove', move); };
      bench.addEventListener('pointerdown', down); bench.addEventListener('pointerup', up);
      let done = false;
      function finish() {
        if (done) return; done = true;
        bench.removeEventListener('pointerdown', down); bench.removeEventListener('pointerup', up); bench.removeEventListener('pointermove', move);
        end.classList.add('dropoff'); saw.remove(); sfx.knock(); sfx.ding();
        setTimeout(() => { work.innerHTML = ''; resolve(); }, 900);
      }
    });
  }

  // One part: flies in loose, tap each fastener 3 times.
  function partStep(part, made, fxg) {
    return new Promise((resolve) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'part loose' + (part.wheel ? ' wheel' : '') + (part.door ? ' door' : '') + (part.chimney ? ' chimney' : ''));
      g.dataset.paint = part.paint.join(',');
      g.innerHTML = part.svg.replace(/<(rect|path|circle|ellipse)(?![^>]*fill=)/g, `<$1 fill="${WOOD}"`);
      made.appendChild(g);
      let left = part.f.length;
      for (const [x, y, type] of part.f) {
        const fg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fg.setAttribute('class', 'fastener ' + type); fg.setAttribute('transform', `translate(${x} ${y})`);
        fg.innerHTML = type === 'nail'
          ? `<circle r="24" fill="transparent"/><g class="nail-out"><line x1="0" y1="0" x2="14" y2="-16" stroke="#8d99a6" stroke-width="5" stroke-linecap="round"/><circle cx="14" cy="-16" r="7" fill="#b8c2cc" stroke="#5b6670" stroke-width="2"/></g><circle class="glow" r="16" fill="none" stroke="#ffd23f" stroke-width="4"/>`
          : `<circle r="24" fill="transparent"/><g class="screw-head"><circle r="9" fill="#d4d9de" stroke="#5b6670" stroke-width="2"/><path d="M-5 0 H5 M0 -5 V5" stroke="#5b6670" stroke-width="2.5"/></g><circle class="glow" r="16" fill="none" stroke="#ffd23f" stroke-width="4"/>`;
        let hits = 0;
        fg.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (hits >= 3) return;
          hits++;
          toolHit(fxg, x, y, type);
          if (type === 'nail') { sfx.knock(); fg.querySelector('.nail-out').setAttribute('transform', `scale(${1 - hits / 3.3})`); }
          else { sfx.screw(); fg.querySelector('.screw-head').setAttribute('transform', `rotate(${hits * 70}) scale(${1 - hits * 0.12})`); }
          buzz(12);
          if (hits === 3) {
            fg.classList.add('done');
            if (--left === 0) {
              g.classList.remove('loose'); g.classList.add('fixed');
              const r = g.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, { n: 16, shape: 'star' });
              sfx.chime(4);
              setTimeout(resolve, 450);
            }
          }
        });
        g.appendChild(fg);
      }
      sfx.boing();
    });
  }

  // Paint: pick a pot, tap the parts. When every part has been painted (or ✅ is pressed) we're done.
  function paintStep(made) {
    return new Promise((resolve) => {
      const ws = root.querySelector('.workshop'), toolbox = root.querySelector('.toolbox');
      toolbox.classList.add('paints');
      toolbox.innerHTML = PAINTS.map((c, i) => `<button class="pot${i === 0 ? ' on' : ''}" style="--c:${c}"></button>`).join('') + '<button class="pdone">✅</button>';
      let colour = PAINTS[0];
      toolbox.querySelectorAll('.pot').forEach((b, i) => b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); colour = PAINTS[i]; sfx.tap(); buzz(6);
        toolbox.querySelectorAll('.pot').forEach((x) => x.classList.toggle('on', x === b));
      }));
      const parts = [...made.querySelectorAll('.part')];
      const painted = new Set();
      say('Pick a colour and paint it!');
      const finish = () => {
        if (!alive) return resolve();
        // anything not painted gets its usual colours
        parts.forEach((g) => { if (!painted.has(g)) shapesOf(g).forEach((s, j) => s.setAttribute('fill', g.dataset.paint.split(',')[j] || g.dataset.paint.split(',')[0])); });
        toolbox.classList.remove('paints'); toolbox.innerHTML = '<span>🪚</span><span>🔨</span><span>🪛</span>';
        ws.classList.remove('painting');
        resolve();
      };
      ws.classList.add('painting');
      toolbox.querySelector('.pdone').addEventListener('click', () => { sfx.ding(); finish(); });
      parts.forEach((g) => g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const def = g.dataset.paint.split(',');
        shapesOf(g).forEach((s, j) => s.setAttribute('fill', j === 0 ? colour : def[j] || colour));
        g.classList.remove('splat'); void g.getBBox(); g.classList.add('splat');
        sfx.brush(); sfx.pop(3 + painted.size % 5); buzz(10);
        burst(e.clientX, e.clientY, { n: 12, colors: [colour, colour, '#fff'], shape: 'dot', speed: 220 });
        const first = !painted.has(g); painted.add(g);
        if (first && painted.size === parts.length) { setTimeout(() => { if (!alive) return; say('Beautiful!'); sfx.ding(); setTimeout(finish, 900); }, 400); }
      }));
    });
  }

  function toolHit(fxg, x, y, type) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.textContent = type === 'nail' ? '🔨' : '🪛';
    t.setAttribute('x', x + 6); t.setAttribute('y', y - 6); t.setAttribute('font-size', '44');
    t.setAttribute('class', type === 'nail' ? 'swing' : 'twist');
    fxg.appendChild(t); setTimeout(() => t.remove(), 380);
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    star.textContent = type === 'nail' ? '💥' : '✨'; star.setAttribute('x', x - 14); star.setAttribute('y', y + 8); star.setAttribute('font-size', '22'); star.setAttribute('class', 'pow');
    fxg.appendChild(star); setTimeout(() => star.remove(), 400);
  }
  function sawdust(fxg, x, y) {
    for (let i = 0; i < 4; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x + (Math.random() - 0.5) * 16); c.setAttribute('cy', y); c.setAttribute('r', 2 + Math.random() * 3); c.setAttribute('fill', '#d9b07a'); c.setAttribute('class', 'dust');
      fxg.appendChild(c); setTimeout(() => c.remove(), 700);
    }
  }

  function finale(key, bench, made, player) {
    if (key === 'house') {
      for (let i = 0; i < 4; i++) setTimeout(() => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', 267); c.setAttribute('cy', 64); c.setAttribute('r', 10); c.setAttribute('fill', '#e5e7eb'); c.setAttribute('class', 'smoke'); made.appendChild(c); }, i * 400);
      made.querySelector('.door')?.classList.add('open');
      const kid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      kid.setAttribute('class', 'doorkid');
      kid.innerHTML = `<svg x="170" y="180" width="60" height="72" viewBox="0 0 200 240">${avatarSVG(player, { pose: 'up', inner: true })}</svg>`;
      made.insertBefore(kid, made.querySelector('.door'));
      sfx.giggle();
    } else if (key === 'car') {
      sfx.beep(); setTimeout(() => sfx.vroom(), 300);
      made.classList.add('drive');
    } else if (key === 'boat') {
      const waves = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      waves.setAttribute('class', 'waves');
      waves.innerHTML = `<path d="M-200 236 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V320 H-200 Z" fill="#60a5fa" opacity=".85"/>`;
      bench.querySelector('.fx').appendChild(waves);
      say('Sail away!'); sfx.splash();
      made.classList.add('sail');
    } else if (key === 'train') {
      for (let i = 0; i < 6; i++) setTimeout(() => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', 106); c.setAttribute('cy', 76); c.setAttribute('r', 10); c.setAttribute('fill', '#e5e7eb'); c.setAttribute('class', 'smoke'); made.appendChild(c); }, i * 300);
      say('Choo choo!'); sfx.beep();
      setTimeout(() => { if (alive) { made.classList.add('drive'); sfx.vroom(); } }, 600);
    } else if (key === 'plane') {
      made.classList.add('spinprop'); sfx.vroom();
      setTimeout(() => { if (!alive) return; say('Up, up and away!'); sfx.whoosh(); sfx.rocket(); made.classList.add('fly'); }, 900);
    } else if (key === 'kennel') {
      const pup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pup.setAttribute('class', 'doorkid');
      pup.innerHTML = `<svg x="148" y="168" width="104" height="104" viewBox="0 0 300 300">${petSVG('puppy', 1, 'excited').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
      made.appendChild(pup);
      animalSound('dog'); setTimeout(() => alive && say('Woof woof! A puppy!'), 900);
    } else {
      ['3', '2', '1'].forEach((n, i) => setTimeout(() => say(n), i * 700));
      setTimeout(() => { say('Blast off!'); sfx.rocket(); made.classList.add('launch');
        const fl = document.createElementNS('http://www.w3.org/2000/svg', 'text'); fl.textContent = '🔥'; fl.setAttribute('x', 178); fl.setAttribute('y', 300); fl.setAttribute('font-size', '48'); fl.setAttribute('class', 'flame'); made.appendChild(fl); }, 2100);
    }
  }

  pick();
  return () => { alive = false; };
}
