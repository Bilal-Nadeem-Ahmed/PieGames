// Feed the animals (v2): animals wander around the farm field. Each hungry one shows the food it wants.
// Drag food to it - it stops, turns, opens its mouth, munches and does a happy wiggle with its own sound.
// Stroke an animal to pet it (love eyes + hearts); tap it to make it hop. Wrong food gets a polite head shake.
import { sfx, buzz } from '../sound.js';
import { say } from '../speech.js';
import { getLevel, win, levelBadge } from '../levels.js';
import { homeBtn, shuffle, pick, draggable, wait } from '../ui.js';
import { burst, celebrate } from '../fx.js';
import { animalSound, preloadAnimals } from '../animals.js';
import { petSVG, PETS } from './pet-art.js';
import { createMeadow } from '../scenery.js';

const KINDS = ['puppy', 'kitten', 'bunny', 'lamb', 'cow', 'elephant', 'duck', 'dino'];
const SPOKEN = { puppy: 'puppy', kitten: 'kitten', bunny: 'bunny', lamb: 'lamb', cow: 'cow', elephant: 'elephant', duck: 'duck', dino: 'dinosaur' };

export function mount(el) {
  preloadAnimals();
  el.innerHTML = `<div class="screen feed2"><canvas class="farm-bg"></canvas>${homeBtn()}<div class="field"></div><div class="foodbasket"></div></div>`;
  const root = el.firstElementChild, field = root.querySelector('.field'), basket = root.querySelector('.foodbasket');
  const badge = levelBadge(root, 'feed', () => { clearTimeout(timer); round(true); });
  const cv = root.querySelector('.farm-bg'), c = cv.getContext('2d'), meadow = createMeadow();
  let W, H, alive = true, raf = 0, t = 0, last = performance.now(), timer = 0, animals = [];
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = root.clientWidth; H = root.clientHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener('resize', fit);

  const sound = (k) => { const s = PETS[k].sound; if (s) animalSound(s); else if (k === 'dino') sfx.roar(); else sfx.giggle(); };
  const rand = (a, b) => a + Math.random() * (b - a);
  // the field is the lower part of the screen, above the basket
  const area = () => ({ x0: 0.1, x1: 0.9, y0: 0.5, y1: 0.8 });

  function makeAnimal(kind, i, n) {
    const a = area();
    const d = document.createElement('div');
    d.className = 'beastie';
    d.innerHTML = '<div class="b-art"></div><div class="b-want"></div>';
    field.appendChild(d);
    const an = { kind, el: d, x: a.x0 + ((i + 0.5) / n) * (a.x1 - a.x0) + rand(-0.04, 0.04), y: rand(a.y0, a.y1), tx: a.x0 + ((i + 0.5) / n) * (a.x1 - a.x0), ty: rand(a.y0, a.y1), dir: 1,
      state: 'walk', mood: 'ok', hungry: true, wait: 0, sig: '', t: Math.random() * 5 };
    // petting + tapping
    let lp = null, rub = 0, downAt = 0;
    d.addEventListener('pointerdown', (e) => { e.preventDefault(); d.setPointerCapture(e.pointerId); lp = [e.clientX, e.clientY]; rub = 0; downAt = performance.now(); });
    d.addEventListener('pointermove', (e) => {
      if (!lp || an.state === 'eat') return;
      rub += Math.hypot(e.clientX - lp[0], e.clientY - lp[1]); lp = [e.clientX, e.clientY];
      if (rub > 140) { rub = 0; pet(an, e.clientX, e.clientY); }
    });
    d.addEventListener('pointerup', (e) => { if (lp && performance.now() - downAt < 250 && rub < 15) hop(an); lp = null; });
    return an;
  }

  function round(fresh) {
    const n = Math.min(W > H ? 4 : 3, [2, 3, 4, 4][getLevel('feed') - 1]);
    if (fresh || animals.length !== n) {
      field.innerHTML = '';
      animals = shuffle([...KINDS]).slice(0, n).map((k, i) => makeAnimal(k, i, n));
    } else {
      // swap one animal for a new one now and then
      if (Math.random() < 0.6) {
        const old = animals.shift(); old.state = 'leave'; old.tx = 1.25; setTimeout(() => old.el.remove(), 4000);
        const used = new Set(animals.map((x) => x.kind)), k = pick(KINDS.filter((x) => !used.has(x) && x !== old.kind));
        animals.push(makeAnimal(k, 0, n));
      }
      animals.forEach((an) => { an.hungry = true; an.state = an.state === 'leave' ? 'leave' : 'walk'; });
    }
    fillBasket();
    say('Feed the animals!');
  }

  function fillBasket() {
    basket.innerHTML = '';
    // level 4: one extra food that nobody here eats
    if (getLevel('feed') >= 4) {
      const used = new Set(animals.map((a) => a.kind)), k = pick(KINDS.filter((x) => !used.has(x)));
      const f = document.createElement('div'); f.className = 'food2'; f.textContent = PETS[k].food; basket.appendChild(f);
      draggable(f, { onStart: () => sfx.tap(), onDrop: (x, y) => { const an = nearest(x, y); if (an) { refuse(an); say('No thank you!'); } return false; } });
    }
    for (const an of shuffle(animals.filter((a) => a.hungry))) {
      const f = document.createElement('div');
      f.className = 'food2'; f.textContent = PETS[an.kind].food; f.dataset.k = an.kind;
      basket.appendChild(f);
      let target = null;
      draggable(f, {
        onStart: () => sfx.tap(),
        onMove: (x, y) => {
          const near = nearest(x, y);
          if (near !== target) { if (target) { target.state = 'walk'; } target = near; if (near) { near.state = 'look'; near.dir = x < screenX(near) ? -1 : 1; sfx.boing(); } }
        },
        onDrop: (x, y) => {
          if (target) target.state = 'walk';
          const an = nearest(x, y); target = null;
          if (!an) return false;
          if (!an.hungry) { an.state = 'walk'; say("I'm full!"); refuse(an); return false; }
          if (an.kind !== f.dataset.k) { refuse(an); say('No thank you!'); return false; }
          eat(an, f); return true;
        },
      });
    }
  }

  const screenX = (an) => an.x * W, screenY = (an) => an.y * H;
  function nearest(x, y) {
    let best = null, bd = 1e9;
    for (const an of animals) {
      if (an.state === 'leave') continue;
      const r = an.el.getBoundingClientRect();
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height * 0.45));
      if (d < r.width * 0.75 && d < bd) { bd = d; best = an; }
    }
    return best;
  }

  async function eat(an, f) {
    f.dataset.locked = 1; an.state = 'eat'; an.mood = 'eat';
    const mouth = an.el.querySelector('.mouth, .beak, .trunk')?.getBoundingClientRect() || an.el.getBoundingClientRect();
    const r = f.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(f).transform);
    f.style.transition = 'transform .3s ease-in, opacity .3s'; f.style.opacity = '0';
    f.style.transform = `translate(${m.e + mouth.left + mouth.width / 2 - r.left - r.width / 2}px, ${m.f + mouth.top + mouth.height / 2 - r.top - r.height / 2}px) scale(.2)`;
    await wait(320); f.remove();
    an.el.classList.add('chewing');
    for (let i = 0; i < 3; i++) { sfx.munch(); buzz(8); await wait(260); }
    an.el.classList.remove('chewing');
    an.hungry = false; an.mood = 'love'; an.el.classList.add('wiggle');
    sound(an.kind); sfx.ding();
    const b = an.el.getBoundingClientRect(); burst(b.left + b.width / 2, b.top + b.height * 0.3, { n: 16, colors: ['#ff5c8a', '#ff8ac2', '#fff'], shape: 'dot' });
    hearts(an, 4);
    setTimeout(() => alive && say(`Yum! ${SPOKEN[an.kind]}!`), 900);
    await wait(1500);
    an.el.classList.remove('wiggle'); an.mood = 'happy'; an.state = 'walk';
    if (!animals.some((x) => x.hungry && x.state !== 'leave')) timer = setTimeout(() => {
      if (!alive) return;
      celebrate('All the animals are full!'); win('feed', badge);
      timer = setTimeout(() => alive && round(false), 9000);   // after a little while they get hungry again
    }, 500);
  }
  function refuse(an) { an.el.classList.remove('nope'); void an.el.offsetWidth; an.el.classList.add('nope'); an.mood = 'sad'; sfx.oops(); buzz(25); setTimeout(() => { if (an.mood === 'sad') an.mood = an.hungry ? 'ok' : 'happy'; }, 900); }
  function pet(an, x, y) {
    an.state = 'look'; an.mood = 'love'; clearTimeout(an.petT);
    hearts(an, 1, x, y); buzz(5);
    if (!an.petSound || performance.now() - an.petSound > 1800) { an.petSound = performance.now(); sound(an.kind); }
    an.petT = setTimeout(() => { an.mood = an.hungry ? 'ok' : 'happy'; an.state = 'walk'; }, 1000);
  }
  function hop(an) { an.el.classList.remove('hop'); void an.el.offsetWidth; an.el.classList.add('hop'); sound(an.kind); }
  function hearts(an, n, x, y) {
    const r = an.el.getBoundingClientRect();
    for (let i = 0; i < n; i++) setTimeout(() => {
      const h = document.createElement('div'); h.className = 'heart-pop'; h.textContent = pick(['❤️', '💕', '💖']);
      h.style.left = (x ?? r.left + r.width * (0.3 + Math.random() * 0.4)) + 'px'; h.style.top = (y ?? r.top + r.height * 0.25) + 'px';
      document.body.appendChild(h); setTimeout(() => h.remove(), 1000);
    }, i * 180);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    meadow.draw(c, W, H, t, dt, t * 4, H * 0.4);
    const a = area(), size = Math.min(H * 0.46, W * 0.24);
    for (const an of animals) {
      an.t += dt;
      if (an.state === 'walk' || an.state === 'leave') {
        const dx = an.tx - an.x, dy = an.ty - an.y, d = Math.hypot(dx * W, dy * H), sp = (an.state === 'leave' ? 0.12 : 0.05) * W;
        if (d > 4) { an.x += (dx * W / d) * sp * dt / W; an.y += (dy * H / d) * sp * dt / H; if (Math.abs(dx) > 0.002) an.dir = dx > 0 ? 1 : -1; an.walking = true; }
        else { an.walking = false; an.wait -= dt; if (an.wait <= 0) { an.wait = rand(1, 4); an.tx = rand(a.x0, a.x1); an.ty = rand(a.y0, a.y1); } }
      } else an.walking = false;
      const mood = an.mood === 'ok' && an.hungry ? 'ok' : an.mood;
      const sig = mood;
      if (an.sig !== sig) { an.sig = sig; an.el.querySelector('.b-art').innerHTML = petSVG(an.kind, 2, mood); }
      const want = an.el.querySelector('.b-want');
      want.textContent = an.hungry && an.state !== 'leave' ? PETS[an.kind].food : '';
      want.classList.toggle('on', an.hungry && an.state !== 'leave' && an.state !== 'eat');
      const depth = 0.8 + ((an.y - a.y0) / (a.y1 - a.y0)) * 0.3;
      an.el.style.width = size + 'px';
      an.el.style.transform = `translate(${an.x * W - size / 2}px, ${an.y * H - size * 0.9}px) scale(${depth})`;
      an.el.querySelector('.b-art').style.transform = `scaleX(${-an.dir})`;
      an.el.style.zIndex = Math.round(an.y * 100);
      an.el.classList.toggle('walking', an.walking);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  round(true);
  return () => { alive = false; clearTimeout(timer); cancelAnimationFrame(raf); removeEventListener('resize', fit); };
}
