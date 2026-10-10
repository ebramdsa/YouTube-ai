// Mix narration lines + synthesized wind bed + impact thumps at the cue times.
// Usage: node build-audio.js <cues.js> <voDir with l1.wav..lN.wav> <out.wav>
const { execFileSync } = require('child_process');
const path = require('path');
const [cuesFile, voDir, out] = process.argv.slice(2);
const cues = require(path.resolve(cuesFile));
const args = ['-y', '-loglevel', 'error'];
const filters = [], mix = [];
cues.lines.forEach((t, i) => {
  args.push('-i', path.join(voDir, `l${i + 1}.wav`));
  filters.push(`[${i}]aresample=48000,adelay=${Math.round(t * 1000)}:all=1,volume=1.6[v${i}]`);
  mix.push(`[v${i}]`);
});
const n = cues.lines.length, D = cues.duration;
args.push('-f', 'lavfi', '-t', String(D), '-i', 'anoisesrc=color=brown:amplitude=0.5:sample_rate=48000');
filters.push(`[${n}]lowpass=f=420,volume=0.12,afade=t=in:d=1,afade=t=out:st=${D - 1.5}:d=1.5[wind]`);
mix.push('[wind]');
cues.thumps.forEach((t, i) => {
  args.push('-f', 'lavfi', '-t', '0.6', '-i', 'sine=frequency=62:sample_rate=48000');
  filters.push(`[${n + 1 + i}]volume=1.4,afade=t=out:st=0.02:d=0.55,adelay=${Math.round(t * 1000)}:all=1[k${i}]`);
  mix.push(`[k${i}]`);
});
filters.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=longest,atrim=0:${D},alimiter=limit=0.9[out]`);
args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-ac', '2', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('wrote', out);
