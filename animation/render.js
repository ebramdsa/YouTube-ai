// Renders an animated HTML/SVG scene (exposing window.render(t)) to MP4.
// Usage: node render.js <scene.html> <out.mp4> <seconds> [fps] [width] [height]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [scene, out, secs, fpsArg, wArg, hArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 24), frames = Math.round(Number(secs) * fps);
  const width = Number(wArg || 1920), height = Number(hArg || 1080);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(scene));
  await page.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`wrote ${out} (${frames} frames)`);
})();
