// Exports channel brand images. Usage: node assets/brand/export.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mascot = fs.readFileSync(path.join(__dirname, 'sobius.svg'), 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const [m, w, h] of [['logo', 800, 800], ['banner', 2560, 1440]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(__dirname, 'brand.html'));
    await p.evaluate(([m, s]) => window.build(m, s), [m, mascot]);
    await p.screenshot({ path: path.join(__dirname, `${m}.png`), omitBackground: true });
  }
  await b.close();
})();
