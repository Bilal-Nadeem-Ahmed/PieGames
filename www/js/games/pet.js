// Pie Pet: a modern Tamagotchi. Each child chooses a pet that lives in its own room.
// Needs (food, fun, energy, clean, health) change in real time - even while the app is closed.
// Feed it, stroke it, play with toys, bath it, put it to bed, clean up its messes, give medicine when ill.
// Good care earns growth points: Baby -> Little -> Big -> Grown-up.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { currentPlayer, storage } from '../store.js';
import { homeBtn, draggable, inside, wait, pick } from '../ui.js';
import { burst, celebrate, confettiRain } from '../fx.js';
import { animalSound, preloadAnimals } from '../animals.js';
import { petSVG, PETS, STAGES } from './pet-art.js';

const GROW = [0, 90, 260, 600];                       // growth points needed for each stage
const IN_APP = 30;                                    // while playing, time runs 30x faster (1 minute = 30 minutes)
const RATE = { hunger: -6, fun: -4, energy: -4, clean: -3 };   // per hour, awake
const FOODS = [
  { e: '🍎', name: 'apple', food: 22, fun: 2 }, { e: '🥕', name: 'carrot', food: 22, fun: 2 }, { e: '🍌', name: 'banana', food: 22, fun: 2 },
  { e: '🥛', name: 'milk', food: 18, fun: 3 }, { e: '🍪', name: 'cookie', food: 10, fun: 10 },
];
const key = () => 'pg.pet.' + (currentPlayer()?.id || 'p1');
const clamp = (v) => Math.max(0, Math.min(100, v));
const isNight = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h >= 19.5 || h < 7; };

function newPet(type) {
  return { type, name: PETS[type].name, born: Date.now(), last: Date.now(), xp: 0, stage: 0,
    s: { hunger: 70, fun: 70, energy: 80, clean: 90, health: 100 }, sick: false, asleep: false, poops: [], poopTimer: 0 };
}

// advance the pet's needs by `h` hours of real time
function age(pet, h) {
  if (h <= 0) return;
  const s = pet.s;
  if (pet.asleep) { s.energy = clamp(s.energy + 60 * h); s.hunger = clamp(s.hunger - 2 * h); }
  else { s.hunger = clamp(s.hunger + RATE.hunger * h); s.energy = clamp(s.energy + RATE.energy * h); }
  s.fun = clamp(s.fun + (pet.sick ? -8 : RATE.fun) * h * (pet.asleep ? 0.2 : 1));
  s.clean = clamp(s.clean + (RATE.clean - pet.poops.length * 2) * h);
  const neglected = s.hunger < 20 || s.clean < 20 || pet.poops.length >= 3 || s.energy < 10;
  s.health = clamp(s.health + (neglected ? -7 : pet.sick ? -1 : 3) * h);
  if (!pet.sick && s.health < 40) pet.sick = true;
  // messes: one every ~5 hours awake (max 3)
  pet.poopTimer += h;
  if (!pet.asleep && pet.poopTimer > 5 && pet.poops.length < 3) { pet.poopTimer = 0; pet.poops.push({ x: 0.15 + Math.random() * 0.7 }); }
}

export function mount(el) {
  preloadAnimals();
  let pet = storage.read(key(), null), alive = true, busy = false, tickT = 0, saveT = 0, last = performance.now(), raf = 0, mode = null;
  const root = document.createElement('div');
  root.className = 'screen pet';
  el.innerHTML = ''; el.appendChild(root);
  if (!pet) chooser();
  else {
    // catch up on the time the app was closed (at most 2 days), gently: needs drop at 60% speed while away,
    // and the pet puts itself to bed when tired and wakes up when rested
    let away = Math.min(48, (Date.now() - pet.last) / 3.6e6);
    while (away > 0) {
      const step = Math.min(1, away); away -= step;
      if (!pet.asleep && pet.s.energy < 15) pet.asleep = true;
      if (pet.asleep && pet.s.energy >= 95) pet.asleep = false;
      age(pet, step * 0.6);
    }
    pet.last = Date.now();
    room();
  }
  return () => { alive = false; clearInterval(tickT); cancelAnimationFrame(raf); if (pet) save(); };

  function save() { pet.last = Date.now(); storage.write(key(), pet); }

  // ---------------- choose a pet ----------------
  function chooser() {
    root.innerHTML = `${homeBtn()}<div class="pet-choose"><h2>Choose your pet!</h2><div class="pet-cards"></div></div>`;
    const cards = root.querySelector('.pet-cards');
    for (const t of Object.keys(PETS)) {
      const b = document.createElement('button');
      b.className = 'pet-card'; b.innerHTML = `${petSVG(t, 0, 'happy')}<span>${PETS[t].name}</span>`;
      b.onclick = () => {
        sfx.yay(); pet = newPet(t); save();
        if (PETS[t].sound) animalSound(PETS[t].sound); else sfx.giggle();
        room(); say(`${PETS[t].name}!`);
      };
      cards.appendChild(b);
    }
    say('Choose your pet!');
  }

  // ---------------- the room ----------------
  function room() {
    const P = PETS[pet.type];
    root.innerHTML = `${homeBtn()}
      <div class="pet-room ${isNight() ? 'night' : ''}">
        <div class="wall"><div class="window"><div class="sky"><span class="sun"></span><span class="moon"></span><i></i><i></i><i></i><i></i></div></div>
          <div class="frame-pic">🌈</div><div class="lamp"><span></span></div></div>
        <div class="floor"><div class="rug"></div></div>
        <div class="poops"></div>
        <div class="toyzone"></div>
        <div class="petwrap"><div class="need"></div><div class="pet-el"></div><div class="zzz">z<b>z</b><i>z</i></div></div>
        <div class="dark"></div>
      </div>
      <div class="hud">
        <div class="pet-name"><b>${P.name}</b><small class="stage"></small><div class="grow"><span></span></div></div>
        <div class="meters"></div>
      </div>
      <div class="dock"></div>
      <div class="tray"></div>`;
    const meters = root.querySelector('.meters');
    for (const [k, ic] of [['hunger', '🍎'], ['fun', '😊'], ['energy', '⚡'], ['clean', '🛁'], ['health', '❤️']]) meters.insertAdjacentHTML('beforeend', `<div class="meter" data-k="${k}"><span>${ic}</span><div class="bar"><i></i></div></div>`);
    const dock = root.querySelector('.dock');
    const ACTIONS = [['food', '🍽️', 'Food'], ['play', '🧸', 'Play'], ['bath', '🛁', 'Bath'], ['sleep', '💡', 'Lights'], ['meds', '💊', 'Medicine']];
    for (const [id, ic, label] of ACTIONS) {
      const b = document.createElement('button');
      b.className = 'act act-' + id; b.innerHTML = `<span>${ic}</span><small>${label}</small>`;
      b.onclick = () => action(id);
      dock.appendChild(b);
    }
    const petEl = root.querySelector('.pet-el');
    // stroke / tap the pet
    let stroke = 0, lastP = null, downAt = 0;
    petEl.addEventListener('pointerdown', (e) => { e.preventDefault(); petEl.setPointerCapture(e.pointerId); lastP = [e.clientX, e.clientY]; downAt = performance.now(); stroke = 0; });
    petEl.addEventListener('pointermove', (e) => {
      if (!lastP || pet.asleep || busy) return;
      stroke += Math.hypot(e.clientX - lastP[0], e.clientY - lastP[1]); lastP = [e.clientX, e.clientY];
      if (stroke > 160) { stroke = 0; petted(e.clientX, e.clientY); }
    });
    petEl.addEventListener('pointerup', (e) => {
      if (lastP && performance.now() - downAt < 250 && stroke < 20) tapped(e.clientX, e.clientY);
      lastP = null;
    });
    root.querySelector('.poops').addEventListener('pointerdown', (e) => {
      const p = e.target.closest('.poop'); if (!p) return;
      const i = +p.dataset.i; p.classList.add('swept'); sfx.poof(); buzz(10);
      setTimeout(() => { pet.poops.splice(i, 1); pet.s.clean = clamp(pet.s.clean + 6); gain(4); draw(); }, 450);
    });
    draw();
    tickT = setInterval(tick, 1000);
    if (pet.asleep) root.querySelector('.pet-room').classList.add('lightsoff');
    greet();
  }

  function greet() {
    const n = need();
    if (n === 'meds') say("I'm poorly!"); else if (n === 'food') say("I'm hungry!"); else if (n === 'sleep') say('Sleepy!');
    else if (n === 'clean') say('Bath time!'); else if (n === 'play') say("Let's play!"); else say('Hello!');
    if (!pet.asleep) voice();
  }
  function voice() { const s = PETS[pet.type].sound; if (s) animalSound(s); else if (pet.type === 'dino') sfx.roar(); else sfx.giggle(); }

  // what does the pet want most?
  function need() {
    const s = pet.s;
    if (pet.sick) return 'meds';
    if (pet.asleep) return null;
    if (s.hunger < 35) return 'food';
    if (s.energy < 25 || (isNight() && s.energy < 60)) return 'sleep';
    if (s.clean < 35 || pet.poops.length) return 'clean';
    if (s.fun < 40) return 'play';
    return null;
  }
  function mood() {
    if (pet.asleep) return 'sleep';
    if (mode === 'eat') return 'eat';
    if (mode === 'love') return 'love';
    if (mode === 'excited') return 'excited';
    if (pet.sick) return 'sick';
    const s = pet.s;
    if (s.hunger < 25 || s.fun < 25 || s.clean < 20) return 'sad';
    if (s.energy < 25) return 'sleepy';
    return s.fun > 70 && s.hunger > 50 ? 'happy' : 'ok';
  }

  function draw() {
    if (!alive) return;
    const petEl = root.querySelector('.pet-el'); if (!petEl) return;
    const m = mood();
    const sig = `${pet.type}|${pet.stage}|${m}|${pet.s.clean < 35}|${mode === 'wet'}`;
    if (petEl.dataset.sig !== sig) { petEl.dataset.sig = sig; petEl.innerHTML = petSVG(pet.type, pet.stage, m, { dirty: pet.s.clean < 35, wet: mode === 'wet' }); }
    const wrap = root.querySelector('.petwrap');
    wrap.className = 'petwrap ' + m + (busy ? ' busy' : '');
    for (const mEl of root.querySelectorAll('.meter')) {
      const v = Math.round(pet.s[mEl.dataset.k]);
      const i = mEl.querySelector('i'); i.style.width = v + '%';
      mEl.classList.toggle('low', v < 30); mEl.classList.toggle('mid', v >= 30 && v < 60);
    }
    const st = root.querySelector('.stage'); st.textContent = ` · ${STAGES[pet.stage]}`;
    const next = GROW[pet.stage + 1];
    root.querySelector('.grow span').style.width = (next ? Math.min(100, ((pet.xp - GROW[pet.stage]) / (next - GROW[pet.stage])) * 100) : 100) + '%';
    const n = need(), bubble = root.querySelector('.need');
    const icon = { food: PETS[pet.type].food, sleep: '💤', clean: pet.poops.length ? '💩' : '🛁', play: '🧸', meds: '💊' }[n];
    bubble.textContent = icon || ''; bubble.classList.toggle('on', !!icon && !busy);
    root.querySelector('.act-meds').classList.toggle('urgent', pet.sick);
    root.querySelector('.act-sleep').classList.toggle('on', pet.asleep);
    for (const [k, b] of [['food', 'food'], ['sleep', 'sleep'], ['bath', 'clean'], ['play', 'play']]) root.querySelector('.act-' + k).classList.toggle('wanted', n === b);
    const poops = root.querySelector('.poops');
    if (poops.childElementCount !== pet.poops.length || poops.dataset.n !== String(pet.poops.length)) {
      poops.dataset.n = pet.poops.length;
      poops.innerHTML = pet.poops.map((p, i) => `<span class="poop" data-i="${i}" style="left:${p.x * 100}%">💩<i>〰</i></span>`).join('');
    }
    root.querySelector('.pet-room').classList.toggle('night', isNight());
  }

  function tick() {
    if (!alive) return;
    const wasSick = pet.sick;
    age(pet, IN_APP / 3600);
    if (pet.asleep && pet.s.energy >= 100 && !isNight()) wake();
    if (!wasSick && pet.sick) { say("I'm poorly!"); sfx.oops(); }
    draw();
    if (++saveT % 5 === 0) save();
  }

  function gain(n) {
    pet.xp += n;
    const next = GROW[pet.stage + 1];
    if (next && pet.xp >= next && !pet.sick) grow();
  }
  async function grow() {
    pet.stage++; save();
    busy = true;
    const wrap = root.querySelector('.petwrap'); wrap.classList.add('growing');
    await wait(900); draw(); wrap.classList.remove('growing');
    celebrate(`Look how big I am! ${STAGES[pet.stage]}!`);
    say('Bigger!');
    busy = false; draw();
  }

  // ---------------- interactions ----------------
  function petted(x, y) {
    mode = 'love'; draw();
    pet.s.fun = clamp(pet.s.fun + 4); gain(1);
    heart(x, y); buzz(6);
    if (Math.random() < 0.35) voice();
    clearTimeout(petted.t); petted.t = setTimeout(() => { mode = null; draw(); }, 900);
  }
  function tapped(x, y) {
    if (pet.asleep) { say('Shh, sleeping!'); return; }
    const wrap = root.querySelector('.petwrap');
    wrap.classList.remove('hop'); void wrap.offsetWidth; wrap.classList.add('hop');
    sfx.giggle(); burst(x, y, { n: 10, shape: 'star' });
    pet.s.fun = clamp(pet.s.fun + 2);
  }
  function heart(x, y) {
    const h = document.createElement('div'); h.className = 'heart-pop'; h.textContent = pick(['❤️', '💕', '💖']);
    h.style.left = x + 'px'; h.style.top = y + 'px'; document.body.appendChild(h); setTimeout(() => h.remove(), 1000);
  }

  function action(id) {
    sfx.tap();
    if (busy) return;
    if (pet.asleep && id !== 'sleep') { say('Shh, sleeping!'); return; }
    ({ food: openFood, play: openToys, bath: bath, sleep: lights, meds: medicine })[id]();
  }
  function tray(items, onPick) {
    const t = root.querySelector('.tray');
    t.innerHTML = items.map((it, i) => `<button class="titem" data-i="${i}">${it.e}</button>`).join('') + `<button class="titem close">✖</button>`;
    t.classList.add('open');
    t.querySelector('.close').onclick = () => t.classList.remove('open');
    t.querySelectorAll('.titem:not(.close)').forEach((b) => onPick(b, items[+b.dataset.i]));
  }
  function closeTray() { root.querySelector('.tray').classList.remove('open'); }

  // food: drag to the pet's mouth
  function openFood() {
    const P = PETS[pet.type];
    tray([{ e: P.food, name: 'favourite', food: 30, fun: 10, fav: true }, ...FOODS], (b, f) => {
      const petEl = root.querySelector('.pet-el');
      draggable(b, {
        onMove: (x, y) => { const near = inside(petEl, x, y, 30); if (near && mode !== 'eat') { mode = 'eat'; draw(); } else if (!near && mode === 'eat') { mode = null; draw(); } },
        onDrop: (x, y) => {
          if (!inside(petEl, x, y, 30)) { mode = null; draw(); return false; }
          eat(b, f); return true;
        },
      });
    });
  }
  async function eat(b, f) {
    if (pet.s.hunger > 92) { mode = null; draw(); b.style.transform = ''; say('I\'m full!'); shake(); return; }
    busy = true; b.dataset.locked = 1;
    const mouth = root.querySelector('.pet-el .mouth').getBoundingClientRect(), r = b.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(b).transform);
    b.style.transition = 'transform .3s ease-in, opacity .3s'; b.style.opacity = '0';
    b.style.transform = `translate(${m.e + mouth.left + mouth.width / 2 - r.left - r.width / 2}px, ${m.f + mouth.top + mouth.height / 2 - r.top - r.height / 2}px) scale(.2)`;
    await wait(320);
    b.style.transition = 'none'; b.style.transform = ''; b.style.opacity = ''; delete b.dataset.locked;
    const wrap = root.querySelector('.petwrap'); wrap.classList.add('chewing');
    for (let i = 0; i < 3; i++) { sfx.munch(); await wait(250); }
    wrap.classList.remove('chewing');
    pet.s.hunger = clamp(pet.s.hunger + f.food); pet.s.fun = clamp(pet.s.fun + f.fun); gain(f.fav ? 8 : 5);
    if (Math.random() < 0.3 && pet.poops.length < 3) setTimeout(() => { if (alive && !pet.asleep) { pet.poops.push({ x: 0.15 + Math.random() * 0.7 }); sfx.boing(); draw(); } }, 25000 + Math.random() * 30000);
    mode = 'love'; draw(); say(pick(['Yum!', 'Yum yum!'])); if (f.fav) voice(); sfx.ding();
    await wait(900); mode = null; busy = false; draw(); save();
  }
  function shake() { const w = root.querySelector('.petwrap'); w.classList.remove('nope'); void w.offsetWidth; w.classList.add('nope'); sfx.oops(); }

  // toys
  function openToys() {
    tray([{ e: '⚽', t: 'ball' }, { e: '🧸', t: 'teddy' }, { e: '🫧', t: 'bubbles' }, { e: '🎵', t: 'music' }], (b, toy) => { b.onclick = () => { closeTray(); play(toy.t); }; });
  }
  async function play(t) {
    if (pet.s.energy < 12) { say('Sleepy!'); shake(); return; }
    busy = true; draw();
    const zone = root.querySelector('.toyzone'), wrap = root.querySelector('.petwrap');
    if (t === 'ball') {
      zone.innerHTML = '<div class="ball">⚽</div>';
      const ball = zone.firstElementChild; say("Let's play!");
      for (const side of [1, -1, 1]) {
        ball.style.setProperty('--x', side * 30 + 'vw'); ball.className = 'ball roll'; void ball.offsetWidth; sfx.boing();
        await wait(500); wrap.style.setProperty('--x', side * 26 + 'vw'); wrap.classList.add('run'); mode = 'excited'; draw();
        await wait(700); wrap.classList.remove('run'); voice(); burst(innerWidth / 2 + side * innerWidth * 0.26, innerHeight * 0.65, { n: 10, shape: 'star' });
      }
      wrap.style.setProperty('--x', '0px'); wrap.classList.add('run'); await wait(700); wrap.classList.remove('run');
    } else if (t === 'teddy') {
      zone.innerHTML = '<div class="teddy">🧸</div>'; mode = 'love'; draw(); say('I love you!');
      for (let i = 0; i < 4; i++) { heart(innerWidth / 2 + (Math.random() - 0.5) * 120, innerHeight * 0.45); await wait(350); }
      await wait(600);
    } else if (t === 'bubbles') {
      mode = 'excited'; draw();
      for (let i = 0; i < 8; i++) {
        const b = document.createElement('div'); b.className = 'pbubble'; b.style.left = 25 + Math.random() * 50 + '%'; b.style.animationDuration = 2 + Math.random() * 1.5 + 's';
        b.onpointerdown = () => { b.remove(); sfx.pop(); };
        zone.appendChild(b); setTimeout(() => b.remove(), 3500);
        if (i % 2) { wrap.classList.remove('hop'); void wrap.offsetWidth; wrap.classList.add('hop'); sfx.pop(i); }
        await wait(380);
      }
      await wait(800);
    } else {
      mode = 'happy'; draw(); wrap.classList.add('dance');
      for (const n of [0, 2, 4, 5, 4, 2, 0, 4]) { sfx.chime(n); const note = document.createElement('div'); note.className = 'pnote'; note.textContent = pick(['♪', '♫']); note.style.left = 35 + Math.random() * 30 + '%'; zone.appendChild(note); setTimeout(() => note.remove(), 1200); await wait(300); }
      wrap.classList.remove('dance');
    }
    zone.innerHTML = '';
    pet.s.fun = clamp(pet.s.fun + 22); pet.s.energy = clamp(pet.s.energy - 8); pet.s.clean = clamp(pet.s.clean - 4); gain(8);
    mode = 'love'; draw(); sfx.ding(); await wait(700); mode = null; busy = false; draw(); save();
  }

  // bath: scrub with the sponge, then the shower rinses
  async function bath() {
    busy = true; draw(); closeTray();
    const zone = root.querySelector('.toyzone');
    zone.innerHTML = `<div class="tub"></div><div class="sponge">🧽</div><div class="foam"></div>`;
    root.querySelector('.petwrap').classList.add('inbath');
    say('Bath time!');
    const sponge = zone.querySelector('.sponge'), foam = zone.querySelector('.foam'), petEl = root.querySelector('.pet-el');
    let scrub = 0, lp = null;
    await new Promise((done) => {
      sponge.addEventListener('pointerdown', (e) => { e.preventDefault(); sponge.setPointerCapture(e.pointerId); lp = [e.clientX, e.clientY]; });
      sponge.addEventListener('pointermove', (e) => {
        if (!lp) return;
        sponge.style.left = e.clientX + 'px'; sponge.style.top = e.clientY + 'px'; sponge.classList.add('held');
        if (inside(petEl, e.clientX, e.clientY)) {
          scrub += Math.hypot(e.clientX - lp[0], e.clientY - lp[1]);
          if (Math.random() < 0.25) { const f = document.createElement('i'); const r = petEl.getBoundingClientRect(); f.style.left = e.clientX - r.left + 'px'; f.style.top = e.clientY - r.top + 'px'; foam.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; foam.appendChild(f); }
          if (Math.random() < 0.08) sfx.drip();
        }
        lp = [e.clientX, e.clientY];
        if (scrub > 1600) done();
      });
      sponge.addEventListener('pointerup', () => { lp = null; });
    });
    sponge.remove();
    zone.insertAdjacentHTML('beforeend', '<div class="shower">🚿</div><div class="rain"></div>');
    sfx.splash(); await wait(500); foam.innerHTML = ''; mode = 'wet'; draw(); sfx.drip(); await wait(900);
    zone.innerHTML = ''; root.querySelector('.petwrap').classList.remove('inbath');
    pet.s.clean = 100; pet.s.fun = clamp(pet.s.fun + 8); gain(6);
    mode = 'love'; draw(); confettiRain(30); sfx.sparkle(); say(pick(['All clean!', 'Wow!', 'Yay!']));
    await wait(1000); mode = null; busy = false; draw(); save();
  }

  // lights: off = sleep (energy refills), on = wake up
  function lights() {
    if (pet.asleep) return wake();
    if (pet.s.energy > 85 && !isNight()) { say("I'm not tired!"); shake(); return; }
    pet.asleep = true; closeTray();
    root.querySelector('.pet-room').classList.add('lightsoff'); sfx.knock(); say('Night night!');
    draw(); save();
  }
  function wake() {
    pet.asleep = false;
    root.querySelector('.pet-room').classList.remove('lightsoff'); sfx.knock();
    if (pet.s.energy > 70) gain(6);
    say('Good morning!'); voice(); draw(); save();
  }

  // medicine: drag the spoon to the pet's mouth
  function medicine() {
    if (!pet.sick) { say("I'm not poorly!"); shake(); return; }
    tray([{ e: '🥄' }], (b) => {
      b.classList.add('spoon');
      const petEl = root.querySelector('.pet-el');
      draggable(b, {
        onDrop: async (x, y) => {
          if (!inside(petEl, x, y, 30)) return false;
          closeTray(); busy = true; mode = 'eat'; draw(); sfx.munch(); await wait(500);
          const wrap = root.querySelector('.petwrap'); wrap.classList.add('shiver'); await wait(700); wrap.classList.remove('shiver');
          pet.sick = false; pet.s.health = clamp(pet.s.health + 45); gain(6);
          mode = 'love'; draw(); confettiRain(40); sfx.sparkle(); say(pick(['All better!', 'Yay!', 'Wow!']));
          await wait(1100); mode = null; busy = false; draw(); save();
          return true;
        },
      });
    });
  }
}

// grown-ups: forget a child's pet so they can choose a new one
export function resetPet(playerId) { try { localStorage.removeItem('pg.pet.' + playerId); } catch {} }
