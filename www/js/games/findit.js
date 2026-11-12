// Find it! Two modes:
//  🐞 Ladybird hunt - ladybirds crawl around the garden and hide under leaves; tap to find them (counted),
//     each one opens its wings and flies away.
//  🔍 Find the animal - "Where's the cow?" - tap the right animal in the meadow.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { storage } from '../store.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { askPill, homeBtn, chips, shuffle, rnd, pick } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { drawLadybird } from '../draw.js';
import { createMeadow } from '../scenery.js';
import { FARM, animalSound, preloadAnimals } from '../animals.js';

const MODES = [{ id: 'ladybird', icon: '🐞', label: 'Ladybird hunt' }, { id: 'animal', icon: '🔍', label: 'Find the animal' }];
const EXTRA = [{ id: 'ladybird', e: '🐞', name: 'Ladybird' }, { id: 'lion', e: '🦁', name: 'Lion' }, { id: 'frog', e: '🐸', name: 'Frog' }, { id: 'bunny', e: '🐰', name: 'Bunny' }, { id: 'owl', e: '🦉', name: 'Owl' }];

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="game findit"><canvas></canvas>${homeBtn()}<div class="zoo"></div><div class="score"></div></div>`;
  const root = el.firstElementChild, cv = root.querySelector('canvas'), c = cv.getContext('2d'), zoo = root.querySelector('.zoo'), scoreEl = root.querySelector('.score');
  const badge = levelBadge(root, 'findit', () => start());
  const L = () => getLevel('findit') - 1;
  let mode = storage.read('pg.findmode', 'ladybird'), alive = true, timer = 0;
  root.appendChild(chips(MODES, mode, (m) => { mode = m; storage.write('pg.findmode', m); start(); }));
  const meadow = createMeadow();
  let W, H, U, t = 0, last = performance.now(), raf = 0;
  const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight; U = Math.min(W, H); cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  resize(); addEventListener('resize', resize);

  // ---------------- ladybird hunt (canvas) ----------------
  let bugs = [], leaves = [], flowers = [], found = 0, total = 0;
  const top = () => (W > H ? 90 : 150);
  function ladybirdRound() {
    zoo.innerHTML = '';
    total = [3, 4, 6, 8][L()]; found = 0; scoreEl.textContent = '';
    const area = { x: W * 0.06, y: top(), w: W * 0.88, h: H - top() - 20 };
    const spot = () => ({ x: area.x + Math.random() * area.w, y: area.y + 30 + Math.random() * (area.h - 40) });
    flowers = Array.from({ length: 8 }, () => ({ ...spot(), c: pick(['#ff6fa5', '#ffd23f', '#ffffff', '#b38cff']), s: U * (0.03 + Math.random() * 0.02) }));
    leaves = []; bugs = [];
    for (let i = 0; i < total; i++) {
      const p = spot(), hidden = i < [0, 1, Math.ceil(total / 2), total - 1][L()];
      bugs.push({ x: p.x, y: p.y, a: Math.random() * 6, v: hidden ? 0 : U * (0.03 + Math.random() * 0.04), turn: 0, state: 'walk', t: Math.random() * 5, open: 0, hidden });
      if (hidden) leaves.push({ x: p.x + (Math.random() - 0.5) * 10, y: p.y + (Math.random() - 0.5) * 10, a: Math.random() * 6, s: U * 0.15, bug: bugs[i], lift: 0 });
    }
    // a few empty leaves too, so it's a proper hunt
    for (let i = 0; i < 3; i++) { const p = spot(); leaves.push({ x: p.x, y: p.y, a: Math.random() * 6, s: U * 0.14, bug: null, lift: 0 }); }
    say(`Can you find the ${total} ladybirds? Some are hiding under the leaves!`);
  }
  function flyAway(b) {
    b.state = 'fly'; b.hidden = false; found++;
    scoreEl.textContent = found; scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    sfx.sparkle(); buzz(15); say(String(found));
    const r = cv.getBoundingClientRect(); burst(r.left + b.x, r.top + b.y, { n: 16, colors: ['#e53935', '#1b1b1b', '#fff'], shape: 'dot' });
    if (found === total) timer = setTimeout(() => { if (!alive) return; celebrate(`You found all ${total} ladybirds!`); win('findit', badge); timer = setTimeout(() => alive && mode === 'ladybird' && ladybirdRound(), 3800); }, 900);
  }
  cv.addEventListener('pointerdown', (e) => {
    if (mode !== 'ladybird') return;
    e.preventDefault();
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, s = U * 0.12;
    // visible ladybird?
    const b = bugs.find((b) => !b.hidden && b.state === 'walk' && Math.hypot(x - b.x, y - b.y) < s * 0.9);
    if (b) return flyAway(b);
    // a leaf?
    const lf = [...leaves].reverse().find((l) => l.lift === 0 && Math.hypot(x - l.x, y - l.y) < l.s * 0.8);
    if (lf) {
      lf.lift = 0.001; sfx.saw();
      if (lf.bug) setTimeout(() => alive && flyAway(lf.bug), 450);
      else setTimeout(() => alive && say('Nobody here!'), 300);
      return;
    }
    sfx.tap();
  });
  function drawLeaf(l) {
    c.save(); c.translate(l.x + l.lift * U * 0.15, l.y - l.lift * U * 0.05); c.rotate(l.a + l.lift * 1.2); c.scale(1 - l.lift * 0.3, 1 - l.lift * 0.3);
    c.globalAlpha = 1 - l.lift * 0.6;
    c.fillStyle = '#3fae4f'; c.strokeStyle = '#2b7a35'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-l.s, 0); c.quadraticCurveTo(0, -l.s * 0.75, l.s, 0); c.quadraticCurveTo(0, l.s * 0.75, -l.s, 0); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-l.s * 0.9, 0); c.lineTo(l.s * 0.9, 0); c.stroke();
    c.restore();
  }
  function ladybirdFrame(dt) {
    meadow.draw(c, W, H, t, dt, 0, top() - 20);
    for (const f of flowers) { c.fillStyle = f.c; for (let a = 0; a < 5; a++) { c.beginPath(); c.arc(f.x + Math.cos(a * 1.26) * f.s, f.y + Math.sin(a * 1.26) * f.s, f.s * 0.75, 0, 7); c.fill(); } c.fillStyle = '#ffb300'; c.beginPath(); c.arc(f.x, f.y, f.s * 0.6, 0, 7); c.fill(); }
    const s = U * 0.12;
    for (const b of bugs) {
      b.t += dt;
      if (b.state === 'walk' && b.v) {
        b.turn += (Math.random() - 0.5) * dt * 4; b.a += b.turn * dt;
        b.x += Math.sin(b.a) * b.v * dt; b.y -= Math.cos(b.a) * b.v * dt;
        if (b.x < s || b.x > W - s || b.y < top() + s * 0.5 || b.y > H - s) { b.a += Math.PI; b.x = Math.max(s, Math.min(W - s, b.x)); b.y = Math.max(top() + s * 0.5, Math.min(H - s, b.y)); }
      }
      if (b.state === 'fly') { b.open = Math.min(1, b.open + dt * 4); b.y -= U * 0.7 * dt; b.x += Math.sin(b.t * 6) * U * 0.2 * dt; b.a = Math.sin(b.t * 5) * 0.3; }
      if (b.state === 'fly' && b.y < -s) b.state = 'gone';
      if (b.state !== 'gone') drawLadybird(c, b.x, b.y, s, { t: b.v || b.state === 'fly' ? b.t : 0, open: b.open, angle: b.a });
    }
    for (const l of leaves) { if (l.lift > 0) l.lift = Math.min(1, l.lift + dt * 3); if (l.lift < 1) drawLeaf(l); }
  }

  // ---------------- find the animal (DOM) ----------------
  function animalRound() {
    bugs = []; leaves = []; flowers = []; scoreEl.textContent = '';
    const pool = shuffle([...FARM.map((a) => ({ id: a.id, e: a.e, name: a.name, sound: a.id })), ...EXTRA]).slice(0, Math.min(W > H ? 6 : 5, [3, 4, 5, 6][L()]));
    zoo.innerHTML = '';
    const cols = W > H ? 3 : 2;
    pool.forEach((a, i) => {
      const d = document.createElement('button');
      d.className = 'beast'; d.textContent = a.e; d.dataset.id = a.id;
      const col = i % cols, row = Math.floor(i / cols), rows = Math.ceil(pool.length / cols);
      d.style.left = ((col + 0.5) / cols) * 100 + (Math.random() - 0.5) * 8 + '%';
      d.style.top = ((row + 0.5) / rows) * 100 + (Math.random() - 0.5) * 6 + '%';
      d.style.animationDelay = i * 0.08 + 's';
      zoo.appendChild(d);
    });
    let targets = shuffle([...pool]).slice(0, 3), cur = null;
    const ask = () => { cur = targets.shift(); askPill(root, cur ? cur.e : ''); if (!cur) return; say(`Where is the ${cur.name.toLowerCase()}?`); };
    zoo.querySelectorAll('.beast').forEach((d) => d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!cur || d.classList.contains('got')) return;
      const a = pool.find((p) => p.id === d.dataset.id);
      d.classList.remove('wiggle', 'yes'); void d.offsetWidth;
      if (a.id === cur.id) {
        d.classList.add('yes', 'got'); sfx.ding(); buzz(20);
        if (a.sound) animalSound(a.sound);
        const r = d.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, { n: 18, shape: 'star' });
        setTimeout(() => alive && say(`Yes! The ${a.name.toLowerCase()}!`), a.sound ? 900 : 100);
        cur = null;
        if (targets.length) timer = setTimeout(() => alive && ask(), 2400);
        else timer = setTimeout(() => { if (!alive) return; celebrate('Brilliant finding!'); win('findit', badge); timer = setTimeout(() => alive && mode === 'animal' && animalRound(), 3800); }, 2000);
      } else {
        d.classList.add('wiggle'); sfx.oops(); say(`That's the ${a.name.toLowerCase()}!`);
      }
    }));
    timer = setTimeout(() => alive && ask(), 700);
  }

  function start() { clearTimeout(timer); askPill(root, ''); root.classList.toggle('animals', mode === 'animal'); mode === 'ladybird' ? ladybirdRound() : animalRound(); }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (mode === 'ladybird') ladybirdFrame(dt); else meadow.draw(c, W, H, t, dt, t * 5, H * 0.45);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  start();
  return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); removeEventListener('resize', resize); };
}
