// Screenshot an animated scene at given times: node still.js <scene.html[#hash]> <outPrefix> t1 t2 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [scene, out, ...times] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  const [file, hash] = scene.split('#');
  await page.goto('file://' + path.resolve(file) + (hash ? '#' + hash : ''));
  await page.evaluate(() => document.fonts.ready);
  for (const t of times.length ? times : ['0']) {
    await page.evaluate(t => window.render(t), Number(t));
    await page.screenshot({ path: `${out}-${t}.png` });
  }
  await browser.close();
})();
