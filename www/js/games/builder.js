// Build it! Pick a house, car or rocket. Saw a plank, then each part flies in loose:
// tap its nails to hammer them in and its screws to screw them in. When it's all built it gets
// painted and does something fun (smoke + wave, drive away, blast off).
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { currentPlayer } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { homeBtn, wait } from '../ui.js';
import { burst, celebrate } from '../fx.js';

const WOOD = '#e8c48e', EDGE = '#8a5a2b';
const S = `stroke="${EDGE}" stroke-width="4" stroke-linejoin="round"`;

// x,y in a 400x300 drawing. Each part: shapes (SVG with fill WOOD), paint colours, fasteners [x, y, 'nail'|'screw'].
const PROJECTS = {
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
};

export function mount(el) {
  let alive = true;
  const me = currentPlayer();
  el.innerHTML = `<div class="screen build">${homeBtn()}<div class="pick"></div></div>`;
  const root = el.firstElementChild;
  const pick = () => {
    root.innerHTML = `${homeBtn()}<div class="pick">${Object.entries(PROJECTS).map(([k, p]) => `<button class="pcard" data-k="${k}"><span>${p.icon}</span></button>`).join('')}</div>`;
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
    // paint everything + finale
    made.querySelectorAll('.part').forEach((g, i) => setTimeout(() => {
      [...g.querySelectorAll('rect,path,circle,ellipse')].filter((s) => s.getAttribute('fill') === WOOD).forEach((s, j) => s.setAttribute('fill', g.dataset.paint.split(',')[j] || g.dataset.paint.split(',')[0]));
      sfx.chime(i);
    }, i * 160));
    await wait(P.parts.length * 160 + 300);
    finale(key, bench, made, me);
    if (key === 'rocket') await wait(2700);
    if (!alive) return;
    celebrate(`We built a ${P.name}!`);
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
    } else {
      ['3', '2', '1'].forEach((n, i) => setTimeout(() => say(n), i * 700));
      setTimeout(() => { say('Blast off!'); sfx.rocket(); made.classList.add('launch');
        const fl = document.createElementNS('http://www.w3.org/2000/svg', 'text'); fl.textContent = '🔥'; fl.setAttribute('x', 178); fl.setAttribute('y', 300); fl.setAttribute('font-size', '48'); fl.setAttribute('class', 'flame'); made.appendChild(fl); }, 2100);
    }
  }

  pick();
  return () => { alive = false; };
}
