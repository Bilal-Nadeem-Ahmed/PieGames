// Small helpers for building SVG shapes.
const fx = (n) => Math.round(n * 10) / 10;

// A bumpy "cloud / wool" edge along part of an ellipse (angles in degrees, y-down).
export function cloudArc(cx, cy, rx, ry, a0, a1, bumps, bulge = 0.62, move = true) {
  let d = '', px = 0, py = 0;
  for (let i = 0; i <= bumps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / bumps) * Math.PI) / 180;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    if (i === 0) d += (move ? 'M' : 'L') + fx(x) + ' ' + fx(y);
    else {
      const c = Math.hypot(x - px, y - py) * bulge;
      d += ` A${fx(c)} ${fx(c)} 0 0 1 ${fx(x)} ${fx(y)}`;
    }
    px = x; py = y;
  }
  return d;
}
export const cloud = (cx, cy, rx, ry, bumps) => cloudArc(cx, cy, rx, ry, 0, 360, bumps) + 'Z';

export const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

export function loadImg(svg) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = svgUrl(svg);
  });
}
