// Locks the screen upright or sideways depending on the screen being shown.
// Balloons, Bubbles and the Sheep pen are upright; the grown-ups area can rotate freely;
// everything else (home and the other games) is sideways.
const PORTRAIT = new Set(['balloons', 'bubbles', 'roundup']);
const FREE = new Set(['parent']);

let plugin = null, current = null;
function so() {
  if (plugin !== null) return plugin;
  const C = window.Capacitor, reg = C?.registerPlugin || window.capacitorExports?.registerPlugin;
  plugin = C?.isNativePlatform?.() && reg ? reg('ScreenOrientation') : false;
  return plugin;
}

export const orientationFor = (route) => (FREE.has(route) ? 'any' : PORTRAIT.has(route) ? 'portrait' : 'landscape');

// Lock for this route, then wait (briefly) until the screen has actually turned so the
// game lays itself out at the right size.
export async function lockFor(route) {
  const want = orientationFor(route);
  if (want === current) return;
  current = want;
  const p = so();
  if (!p) return;                       // in a browser: nothing to lock
  try {
    if (want === 'any') { await p.unlock(); return; }
    await p.lock({ orientation: want });
  } catch { return; }
  const ok = () => (want === 'landscape') === (innerWidth > innerHeight);
  if (ok()) return;
  await new Promise((resolve) => {
    const done = () => { removeEventListener('resize', check); clearTimeout(t); resolve(); };
    const check = () => { if (ok()) done(); };
    const t = setTimeout(done, 900);
    addEventListener('resize', check);
  });
}
