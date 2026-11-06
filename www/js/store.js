// Players (the cartoon kids) and settings, saved on the device.
const KEY = 'pg.players.v1', SKEY = 'pg.settings.v1', SEL = 'pg.selected';

export const OPTIONS = {
  skin: ['#fde3cc', '#f3c9a3', '#ebbf98', '#e2b08a', '#d39b72', '#b97b52', '#8d5a3a', '#5e3b26'],
  hairColor: ['#1b120d', '#3a2418', '#5c3a22', '#8b5a2b', '#c48a3f', '#e8c46a', '#b5452b', '#9a9a9a'],
  hair: ['topBun', 'swept', 'bangsBun', 'mop', 'short', 'curly', 'long', 'pigtails', 'bun', 'spiky', 'fuzz'],
  eyes: ['#2e1c10', '#5b3a1e', '#3b6fb6', '#3f8a4a', '#8a6d3b'],
  shirt: ['#7fa8e0', '#b8bcc2', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#7b1fa2', '#ec407a', '#ffffff', '#26c6da', '#5d2a4a'],
  pants: ['#9db8dc', '#3d3f45', '#f2c6c2', '#2f4f8a', '#6d4c41', '#e0e0e0'],
  sleeves: ['short', 'puff', 'none', 'long'],
  outfit: ['top', 'dress'],
  pattern: ['none', 'stripes', 'hstripes'],
  brows: ['thin', 'thick'],
  extra: ['none', 'bow', 'hammer', 'glasses', 'cap', 'band'],
  accent: ['#6f9fe0', '#29a8d8', '#ff5c9a', '#e53935', '#fdd835', '#43a047', '#7b1fa2', '#ffffff'],
};

// Defaults based on the two main players (parents can change everything in the parent area).
const DEFAULT_PLAYERS = [
  { id: 'p1', name: '', skin: '#ebbf98', hair: 'topBun', hairColor: '#1b120d', eyes: '#2e1c10', lashes: true,
    shirt: '#8fb0dc', pants: '#8fb0dc', sleeves: 'puff', outfit: 'dress', extra: 'bow', accent: '#6f9fe0' },
  { id: 'p2', name: '', skin: '#d9a179', hair: 'swept', hairColor: '#1b120d', eyes: '#2e1c10', lashes: false, brows: 'thick',
    shirt: '#7d9fd0', pattern: 'stripes', stripe: '#f6f1e6', pants: '#7d9fd0', sleeves: 'long', outfit: 'top', extra: 'hammer', accent: '#29a8d8' },
];

const DEFAULT_SETTINGS = { sound: true, voice: true, countMax: 10, familyClips: true, music: 0 };

function read(k, d) {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; }
}
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export function getPlayers() {
  const p = read(KEY, null);
  return Array.isArray(p) && p.length ? p : structuredClone(DEFAULT_PLAYERS);
}
export function savePlayers(p) { write(KEY, p); }
export function newPlayer() {
  return { ...structuredClone(DEFAULT_PLAYERS[0]), id: 'p' + Date.now().toString(36), name: '', hair: 'short', extra: 'none', lashes: false };
}

export function getSelectedId() { return read(SEL, 'p1'); }
export function setSelectedId(id) { write(SEL, id); }
export function currentPlayer() {
  const ps = getPlayers();
  return ps.find((p) => p.id === getSelectedId()) || ps[0];
}

export function getSettings() { return { ...DEFAULT_SETTINGS, ...read(SKEY, {}) }; }
export function saveSettings(s) { write(SKEY, s); try { window.dispatchEvent(new Event('pg-settings')); } catch {} }

export const storage = { read, write };
