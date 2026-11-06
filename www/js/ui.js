// Small shared UI pieces.
import { sfx } from './sound.js';

export const ICON = {
  home: '<svg viewBox="0 0 48 48"><path d="M8 24 L24 9 L40 24 M13 20 V39 H35 V20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  speaker: '<svg viewBox="0 0 48 48"><path d="M8 18 H16 L27 9 V39 L16 30 H8 Z" fill="currentColor"/><path d="M33 17 Q38 24 33 31 M37 12 Q46 24 37 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  undo: '<svg viewBox="0 0 48 48"><path d="M14 18 H30 A10 10 0 0 1 30 38 H18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M20 8 L10 18 L20 28" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 48 48"><path d="M17 8 L33 24 L17 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  prev: '<svg viewBox="0 0 48 48"><path d="M31 8 L15 24 L31 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="4"/><path d="M24 4v8M24 36v8M4 24h8M36 24h8M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  bucket: '<svg viewBox="0 0 48 48"><path d="M10 20 L24 6 L40 22 L26 36 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M40 26 Q46 36 40 40 Q34 36 40 26Z" fill="currentColor"/></svg>',
  brush: '<svg viewBox="0 0 48 48"><path d="M38 6 L22 26" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M20 26 Q10 26 10 36 Q10 42 4 42 Q20 46 24 36 Q26 30 20 26Z" fill="currentColor"/></svg>',
  eraser: '<svg viewBox="0 0 48 48"><path d="M6 32 L26 12 L40 26 L24 42 H14 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 22 L30 36" stroke="currentColor" stroke-width="4"/></svg>',
  trash: '<svg viewBox="0 0 48 48"><path d="M10 14 H38 M18 14 V8 H30 V14 M14 14 L16 42 H32 L34 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  voiceOn: '<svg viewBox="0 0 48 48"><circle cx="24" cy="17" r="9" fill="currentColor"/><path d="M8 42 C8 30 40 30 40 42 Z" fill="currentColor"/><path d="M38 10 Q43 17 38 24 M42 6 Q50 17 42 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  voiceOff: '<svg viewBox="0 0 48 48"><circle cx="24" cy="17" r="9" fill="currentColor"/><path d="M8 42 C8 30 40 30 40 42 Z" fill="currentColor"/><path d="M6 6 L42 42" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/></svg>',
  musicOn: '<svg viewBox="0 0 48 48"><path d="M18 36 V10 L40 5 V31" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><ellipse cx="13" cy="36" rx="7" ry="5.5" fill="currentColor"/><ellipse cx="35" cy="31" rx="7" ry="5.5" fill="currentColor"/></svg>',
  musicOff: '<svg viewBox="0 0 48 48"><path d="M18 36 V10 L40 5 V31" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><ellipse cx="13" cy="36" rx="7" ry="5.5" fill="currentColor"/><ellipse cx="35" cy="31" rx="7" ry="5.5" fill="currentColor"/><path d="M6 6 L42 42" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/></svg>',
  pics: '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="15" height="15" rx="3" fill="currentColor"/><rect x="27" y="6" width="15" height="15" rx="3" fill="currentColor"/><rect x="6" y="27" width="15" height="15" rx="3" fill="currentColor"/><rect x="27" y="27" width="15" height="15" rx="3" fill="currentColor"/></svg>',
};

export function homeBtn() {
  return `<button class="rbtn home-btn" aria-label="Home" onclick="location.hash='#home'">${ICON.home}</button>`;
}

// Big chooser chips (used by games to switch what they show).
export function chips(list, active, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'chips';
  for (const m of list) {
    const b = document.createElement('button');
    b.className = 'chip' + (m.id === active ? ' on' : '');
    b.innerHTML = m.icon;
    b.setAttribute('aria-label', m.label || m.id);
    b.onclick = () => {
      wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on'); sfx.tap(); onPick(m.id);
    };
    wrap.appendChild(b);
  }
  return wrap;
}

export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const rnd = (n) => (Math.random() * n) | 0;
export const pick = (a) => a[rnd(a.length)];
