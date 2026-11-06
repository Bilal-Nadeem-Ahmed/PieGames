// Farm animals with real recorded sounds (see CREDITS.md for the recordings' authors and licences).
import { getSettings } from './store.js';

export const FARM = [
  { id: 'sheep', e: '🐑', name: 'Sheep', sounds: ['sheep', 'sheep2', 'lamb'] },
  { id: 'cow', e: '🐄', name: 'Cow', sounds: ['cow'] },
  { id: 'elephant', e: '🐘', name: 'Elephant', sounds: ['elephant'] },
  { id: 'duck', e: '🦆', name: 'Duck', sounds: ['duck'] },
  { id: 'dog', e: '🐕', name: 'Dog', sounds: ['dog'] },
  { id: 'cat', e: '🐈', name: 'Cat', sounds: ['cat', 'cat2'] },
  { id: 'chicken', e: '🐔', name: 'Chicken', sounds: ['chicken'] },
  { id: 'horse', e: '🐎', name: 'Horse', sounds: ['horse'] },
];
export const byId = Object.fromEntries(FARM.map((a) => [a.id, a]));
// names used in the Animals pop mode -> recorded sound
export const SOUND_FOR_NAME = { Dog: 'dog', Cat: 'cat', Cow: 'cow', Sheep: 'sheep', Duck: 'duck', Elephant: 'elephant', Horse: 'horse', Chick: 'chicken' };

const cache = {};
function audio(name) {
  if (!cache[name]) { const a = new Audio(`audio/animals/${name}.m4a`); a.preload = 'auto'; cache[name] = a; }
  return cache[name];
}
export function preloadAnimals() { FARM.forEach((a) => a.sounds.forEach(audio)); }

// Play a random recording for this animal. Returns false if sounds are off.
export function animalSound(id) {
  if (!getSettings().sound) return false;
  const a = byId[id]; if (!a) return false;
  const el = audio(a.sounds[(Math.random() * a.sounds.length) | 0]);
  try { el.currentTime = 0; el.volume = 0.9; el.play()?.catch?.(() => {}); } catch { return false; }
  return true;
}
