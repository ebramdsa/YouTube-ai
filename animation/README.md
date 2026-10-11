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

## Music and subtitles

```
# original score (synthesized, no licensing) following the intensity curve in music.json
python3 tools/music.py episodes/ep01/music.json out/music.wav
# English + Arabic SRT from the word timings (Arabic text: scripts/ep01-cannae/subtitles/ar.json)
python3 tools/subtitles.py episodes/ep01/timing.js ../scripts/ep01-cannae/subtitles
# duck the music under the narration and embed both subtitle tracks
tools/finish.sh out/ep01-joined.mp4 out/music.wav ../scripts/ep01-cannae/subtitles/ep01.en.srt ../scripts/ep01-cannae/subtitles/ep01.ar.srt previews/ep01-full.mp4
```

For YouTube, upload `ep01.en.srt` and `ep01.ar.srt` as separate caption tracks.

## Episode 2 (Kadesh)

Same pipeline; the narration is Gemini TTS (voice Algenib) in `scripts/ep02-kadesh/voice/narrator`.

| File | Role |
|---|---|
| `episodes/ep02/cast.js` | Kadesh cast and props: Ramesses II, Muwatalli II, Egyptian/Hittite soldiers, the nomad spies, a historian, both chariot types, the Middle East map, Kadesh, carved temple walls, clay tablets |
| `episodes/ep02/s0.html` … `s9.html` | One scene per narrator section (s0 = cold open, holds the title card 2.6 s past the narration) |
| `episodes/ep02/music.json` | Intensity curve for the score, keyed to the section start times |

```
python3 tools/align.py ../scripts/ep02-kadesh/voice/narrator episodes/ep02/timing.js
node tools/render-section.js episodes/ep02/s5.html ../scripts/ep02-kadesh/voice/narrator/05_the-chariots-strike.mp3 out/ep02/s5.mp4
tools/assemble.sh out/ep02/joined.mp4 20 out/ep02/s0.mp4 ... out/ep02/s9.mp4
python3 tools/music.py episodes/ep02/music.json out/ep02/music.wav
```
Preview the cast with `node tools/still.js "episodes/ep02/sheet.html#cast" /tmp/cast 0` (pages: cast, chariots, map, places, wall, misc, abu).
