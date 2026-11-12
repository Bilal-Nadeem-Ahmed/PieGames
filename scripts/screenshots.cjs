const { chromium } = require('playwright');
// Usage: (cd www && python3 -m http.server 8080 &) ; node scripts/screenshots.cjs   (Pie Pet shot: pick a pet first)
const OUT = require('path').join(__dirname, '../docs/screenshots/');
const L = ['home','pet','runner','dino','colour','music','peekaboo','sorter','build','feed','pairs','puzzle','findit','count','abc','parent'];
const P = ['balloons','bubbles','roundup'];
(async () => {
  const b = await chromium.launch();
  for (const [list, vp] of [[L, { width: 844, height: 390 }], [P, { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => console.log('PAGEERROR', e.message));
    await p.goto('http://localhost:8080/index.html#home'); await p.waitForTimeout(800);
    for (const r of list) {
      await p.evaluate((r) => location.hash = '#' + r, r); await p.waitForTimeout(r === 'balloons' || r === 'bubbles' ? 4000 : 2600);
      await p.screenshot({ path: OUT + r + '.jpg', type: 'jpeg', quality: 80 });
      await p.evaluate(() => location.hash = '#home'); await p.waitForTimeout(400);
    }
    await p.close();
  }
  await b.close();
})();
