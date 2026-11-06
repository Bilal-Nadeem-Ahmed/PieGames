// Puzzles: a colourful picture is cut into big pieces; drag each piece onto its place on the board.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getPlayers, storage } from '../store.js';
import { avatarSVG } from '../avatar.js';
import { loadImg } from '../shapes.js';
import { homeBtn, chips, shuffle, pick, draggable, inside } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { drawSheep, drawDino, drawBalloon, drawCloud, drawLadybird } from '../draw.js';
import { drawFish } from '../sea.js';
import { animalSound, preloadAnimals } from '../animals.js';

const LEVELS = [{ id: 2, icon: '<b>2</b>' }, { id: 4, icon: '<b>4</b>' }, { id: 6, icon: '<b>6</b>' }, { id: 9, icon: '<b>9</b>' }];
const GRID = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3] };
const N = 600;

function sky(c, top = '#7cc7ff', bottom = '#d8f1ff', ground = '#8fd96b') {
  const g = c.createLinearGradient(0, 0, 0, N); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, N, N);
  if (ground) { c.fillStyle = ground; c.beginPath(); c.moveTo(0, N); c.lineTo(0, 440); c.quadraticCurveTo(300, 390, N, 450); c.lineTo(N, N); c.fill(); }
  c.fillStyle = '#ffe36e'; c.beginPath(); c.arc(510, 90, 50, 0, 7); c.fill();
  drawCloud(c, 70, 110, 70); drawCloud(c, 300, 70, 50);
}

// Each picture: draw(c) on a 600x600 canvas, a name and a sound.
const PICTURES = [
  { id: 'sheep', name: 'sheep', sound: () => animalSound('sheep'), draw: (c) => { sky(c); drawSheep(c, 320, 500, 380, {}); } },
  { id: 'dino', name: 'dinosaur', sound: () => sfx.roar(), draw: (c) => { sky(c, '#ffcf8a', '#ffe9c2', '#7cc46a'); c.fillStyle = '#8d6e63'; c.beginPath(); c.moveTo(60, 440); c.lineTo(170, 210); c.lineTo(230, 210); c.lineTo(340, 440); c.fill(); drawDino(c, 330, 520, 420, '#6fcf5b', {}); } },
  { id: 'balloons', name: 'balloons', sound: () => sfx.pop(), draw: (c) => { sky(c); drawBalloon(c, 190, 230, 95, '#ef4444'); drawBalloon(c, 410, 200, 95, '#3b82f6'); drawBalloon(c, 300, 300, 95, '#facc15'); } },
  { id: 'ladybird', name: 'ladybird', sound: () => sfx.sparkle(), draw: (c) => {
    c.fillStyle = '#a6e38a'; c.fillRect(0, 0, N, N);
    c.fillStyle = '#4caf50'; c.beginPath(); c.ellipse(300, 310, 260, 170, -0.5, 0, 7); c.fill();
    c.strokeStyle = '#2e7d32'; c.lineWidth = 8; c.beginPath(); c.moveTo(90, 470); c.lineTo(520, 150); c.stroke();
    for (const [x, y] of [[80, 80], [520, 520], [500, 70]]) { c.fillStyle = '#fff'; for (let a = 0; a < 5; a++) { c.beginPath(); c.arc(x + Math.cos(a * 1.26) * 22, y + Math.sin(a * 1.26) * 22, 16, 0, 7); c.fill(); } c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill(); }
    drawLadybird(c, 300, 320, 300, { angle: 0.3 }); } },
  { id: 'fish', name: 'fish', sound: () => sfx.chime(3), draw: (c) => {
    const g = c.createLinearGradient(0, 0, 0, N); g.addColorStop(0, '#6fd6f8'); g.addColorStop(1, '#1f78c1'); c.fillStyle = g; c.fillRect(0, 0, N, N);
    c.fillStyle = '#f3d79b'; c.beginPath(); c.moveTo(0, N); c.lineTo(0, 520); c.quadraticCurveTo(300, 480, N, 530); c.lineTo(N, N); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; for (const [x, y, r] of [[120, 120, 18], [150, 70, 12], [480, 150, 16]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    drawFish(c, 300, 300, 170, ['#ff8c42', '#fff'], -1, 0); } },
];

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="screen puzzle">${homeBtn()}<div class="pz-wrap"><div class="pz-board"></div><div class="pz-tray"></div></div></div>`;
  const root = el.firstElementChild, board = root.querySelector('.pz-board'), tray = root.querySelector('.pz-tray');
  let level = storage.read('pg.puzzle', 4), alive = true, timer = 0, lastPic = '';
  root.appendChild(chips(LEVELS, level, (l) => { level = l; storage.write('pg.puzzle', l); start(); }));

  async function picture() {
    const kids = getPlayers().map((p) => ({ id: 'kid-' + p.id, name: p.name || '', kid: p }));
    const all = [...PICTURES, ...kids].filter((p) => p.id !== lastPic);
    const P = pick(all); lastPic = P.id;
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c = cv.getContext('2d');
    if (P.kid) {
      sky(c, '#ffd6e8', '#fff3fa', '#a6e38a');
      const im = await loadImg(avatarSVG(P.kid, { pose: 'up' }));
      if (im) c.drawImage(im, 110, 90, 380, 456);
      P.sound = () => sfx.giggle();
    } else P.draw(c);
    return { P, url: cv.toDataURL('image/png') };
  }

  async function start() {
    clearTimeout(timer);
    const { P, url } = await picture();
    if (!alive) return;
    const [cols, rows] = GRID[level];
    board.style.setProperty('--img', `url(${url})`);
    board.innerHTML = '';
    tray.innerHTML = '';
    const slots = [];
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const s = document.createElement('div');
      s.className = 'pz-slot';
      Object.assign(s.style, { left: (col / cols) * 100 + '%', top: (r / rows) * 100 + '%', width: 100 / cols + '%', height: 100 / rows + '%' });
      s.dataset.i = slots.length; board.appendChild(s); slots.push(s);
    }
    let left = slots.length;
    const pieces = shuffle(slots.map((s, i) => i));
    for (const i of pieces) {
      const col = i % cols, r = Math.floor(i / cols);
      const p = document.createElement('div');
      p.className = 'pz-piece';
      p.style.setProperty('--w', 100 / cols + '%'); p.style.setProperty('--h', 100 / rows + '%');
      p.style.backgroundImage = `url(${url})`;
      p.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      p.style.backgroundPosition = `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%`;
      p.style.rotate = (Math.random() * 16 - 8) + 'deg';
      const bw = board.clientWidth * (innerWidth < innerHeight ? (rows > 2 ? 0.58 : 0.7) : 0.8);
      p.style.width = bw / cols + 'px'; p.style.height = bw / rows + 'px';
      tray.appendChild(p);
      draggable(p, {
        onStart: () => { sfx.tap(); p.style.rotate = '0deg'; },
        onDrop: (x, y) => {
          const s = slots[i];
          if (!inside(s, x, y, Math.min(s.offsetWidth, s.offsetHeight) * 0.35)) {
            const other = slots.find((o) => inside(o, x, y));
            if (other) { sfx.oops(); buzz(25); }
            p.style.rotate = (Math.random() * 16 - 8) + 'deg';
            return false;
          }
          p.dataset.locked = 1; p.style.transform = ''; p.style.transition = ''; p.style.rotate = '0deg';
          s.appendChild(p); p.classList.add('placed');
          sfx.chime(left); buzz(15);
          const rr = s.getBoundingClientRect(); burst(rr.left + rr.width / 2, rr.top + rr.height / 2, { n: 14, shape: 'star' });
          if (--left === 0) {
            board.classList.add('complete');
            timer = setTimeout(() => {
              if (!alive) return;
              P.sound?.();
              celebrate(P.kid ? (P.name ? `It's ${P.name}!` : 'Yay!') : `A ${P.name}! Well done!`);
              timer = setTimeout(() => { board.classList.remove('complete'); alive && start(); }, 3800);
            }, 400);
          }
          return true;
        },
      });
    }
    say('Can you finish the puzzle?');
  }
  start();
  return () => { alive = false; clearTimeout(timer); };
}
