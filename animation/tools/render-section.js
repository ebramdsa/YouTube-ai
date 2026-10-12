// Render one episode section (scene exposing window.render(t) and window.META) to an MP4 with its
// narration, a quiet wind bed and soft impact thumps at META.hits.
// Usage: node render-section.js <scene.html> <narration.mp3> <out.mp4> [fps]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
(async () => {
  const [scene, narration, out, fpsArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 24);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(scene));
  await page.evaluate(() => document.fonts.ready);
  const meta = await page.evaluate(() => window.META);
  const frames = Math.ceil(meta.duration * fps), D = frames / fps;
  const silent = out.replace(/\.mp4$/, '.video.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', String(fps), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.render(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 240 === 0) console.log(`${path.basename(scene)} ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  meta.hits = await page.evaluate(() => window.META.hits); // shots register their hits as they render
  await browser.close();

  // audio: narration + wind bed + thumps, trimmed/padded to the video length
  const hits = [...new Set((meta.hits || []).map(h => Math.round(h * 100) / 100))].filter(h => h >= 0 && h < D - .1);
  const args = ['-y', '-loglevel', 'error', '-i', narration, '-f', 'lavfi', '-t', String(D), '-i', 'anoisesrc=color=brown:amplitude=0.5:sample_rate=48000'];
  const filters = ['[0]aresample=48000,volume=1.0[v]', `[1]lowpass=f=380,volume=0.07,afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, D - .6).toFixed(3)}:d=0.6[w]`], mix = ['[v]', '[w]'];
  hits.forEach((h, i) => {
    args.push('-f', 'lavfi', '-t', '0.5', '-i', 'sine=frequency=60:sample_rate=48000');
    filters.push(`[${i + 2}]volume=0.9,afade=t=out:st=0.02:d=0.45,adelay=${Math.round(h * 1000)}:all=1[k${i}]`); mix.push(`[k${i}]`);
  });
  filters.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=longest,apad,atrim=0:${D.toFixed(3)},alimiter=limit=0.9[out]`);
  const wav = out.replace(/\.mp4$/, '.wav');
  execFileSync('ffmpeg', [...args, '-filter_complex', filters.join(';'), '-map', '[out]', '-ac', '2', wav], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', D.toFixed(3), out], { stdio: 'inherit' });
  fs.unlinkSync(silent); fs.unlinkSync(wav);
  console.log(`wrote ${out} (${frames} frames, ${D.toFixed(2)}s, ${hits.length} hits) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
