# Spears & Tears — YouTube history channel

Workspace for an animated ancient-history/warfare channel (@SpearsAndTears): strategy, scripts,
voice prep, and a code-driven 2D cartoon animation pipeline. Planning docs are in Arabic; all
on-screen text and narration are in English.

## Layout
- `strategy/`, `templates/`, `UPDATED_PLAN.md` — channel strategy, content calendar, style and palette notes (Arabic).
- `scripts/<ep>/script.md` — episode scripts. Dialogue lines are `**SPEAKER:** text (stage direction)`; `## N.` headings are chapters.
- `scripts/build_voice.py <ep-dir>` — splits a script into per-voice ElevenLabs text files + `voice/cues.json`.
- `animation/lib/toon.js` — the shared character kit (global `T`: palette `C`, easing, `rng`, characters, `text`, …).
- `animation/episodes/<ep>/` — scene HTML + `cues.js` (shot boundaries, narration start times, SFX thumps; global `CUES`).
- `animation/scenes/sheet.html` — character sheet for checking the kit.
- `animation/previews/` — rendered MP4 previews (committed; keep them few, they are large).
- `assets/brand/`, `assets/fonts/` — logo, banner, Sobius mascot, Lilita One / Luckiest Guy fonts.

## Animation pipeline
Scenes are 1920×1080 SVG built in immediate mode: each scene defines `window.render(t)` (t in
seconds) that rebuilds the whole SVG string for that instant. Rendering must be a pure function
of `t` — no timers, CSS animations, or `Math.random()` (use `T.rng(seed)`), or frames won't be
reproducible.

Run from `animation/` (Playwright resolves via the global `NODE_PATH`; Chromium and ffmpeg are pre-installed):
```bash
node tools/still.js episodes/ep01/cold-open.html /tmp/shot 0 5.2 12.4   # PNG stills at given times — fast check
node render.js episodes/ep01/cold-open.html out.mp4 38 24              # full MP4 (scene, out, seconds, fps, [w], [h])
node tools/build-audio.js episodes/ep01/cues.js <voDir> mix.wav        # mix l1.wav..lN.wav at CUES.lines + wind + thumps
ffmpeg -i out.mp4 -i mix.wav -c:v copy -c:a aac -shortest final.mp4     # mux
```
Check work with stills (and look at them) before rendering a full video. Write scratch renders
outside the repo; only commit a preview when it's a deliverable.

## Visual style (current, as of the ep01 cold open)
Hussain-Ahn-inspired cartoon look: big round heads, touching oval eyes, chunky brows, noodle arms
with dark gloves, thick ink outlines (`C.ink`), grime and scratches. Reuse `toon.js` and its
palette rather than hard-coding new colours. Character marks: Hannibal = eyepatch, purple
Carthaginian armour; Romans = red. Sobius is the recurring nervous-soldier mascot.

## Gotchas
- `PRODUCTION_STATUS.md` is partly stale: it describes `opening/hamilcar/alps-scene.html` and
  `cannae-ep01-opening.mp4`, which were deleted when the style was rebuilt. Trust the code.
- Keep `cues.js` timings in sync with the narration audio; scenes and `build-audio.js` both read it.
- Historical accuracy matters (army sizes, casualty figures) — double-check numbers in scripts.
