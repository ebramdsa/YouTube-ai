# Animation pipeline

Scenes are HTML/SVG files that expose `window.render(t)` (t = seconds).
`render.js` steps through time with headless Chromium and pipes frames to ffmpeg.

```
node render.js poc/scene.html poc/test-cannae.mp4 6 24
```

## Full episode (ep01)

| File | Role |
|---|---|
| `lib/toon.js` | Character kit (Hannibal, Varro, Paullus, Fabius, Mago, Maharbal, senators, soldiers…) |
| `lib/kit.js` | Props, map, kinetic text, camera, and the shot runner (`K.runScene`) |
| `episodes/ep01/timing.js` | When each sentence/word is spoken in each narrator section (generated) |
| `episodes/ep01/battle.js` | Top-down Cannae board used by sections 5–6 |
| `episodes/ep01/s1.html` … `s8.html` | One scene per narrator section, cut on the narration timings |

Steps:

```
# 1. word timings from the narrator MP3s (pip install faster-whisper)
python3 tools/align.py ../scripts/ep01-cannae/voice/narrator episodes/ep01/timing.js
# 2. render a section with its narration, wind bed and impact thumps
node tools/render-section.js episodes/ep01/s6.html ../scripts/ep01-cannae/voice/narrator/06_the-jaws-close.mp3 out/s6.mp4
# 3. join cold open + sections
tools/assemble.sh previews/ep01-full.mp4 26 previews/ep01-cold-open.mp4 out/s1.mp4 ... out/s8.mp4
```

Shots reference narration by sentence (`S(k)`) or word (`W('now')`), so re-generated audio only needs step 1 again.
Check frames quickly with `node tools/still.js episodes/ep01/s3.html /tmp/s3 12 40`.
