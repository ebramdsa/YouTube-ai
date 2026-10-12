# Notes for Claude

- The channel owner lives in **Germany**. Give every publish/schedule time in German time
  (Europe/Berlin: CEST = UTC+2 until the last Sunday of October, CET = UTC+1 in winter),
  with the US Eastern time next to it, since the audience is mainly US/UK.
  Never use Mecca/Saudi time, even though `strategy/content-calendar.md` mentions it.
- Reply to the owner in Arabic; channel content (titles, descriptions, narration) is in English.
- Default slot: 17:00 Germany time in summer time (= 11:00 New York). Between the
  European and US clock changes (late Oct to early Nov, and March) the gap is one hour different, so check it.
- Channel: Spears and Tears, `UCQWruVOY2KJtc2aLH3eZuNA`, connected to vidIQ.
  Episode 1 (Cannae) is `eYPMUTlmnPM`, published 2026-10-11. Its first Short (reel 1) is `d6JoIwgVGGU`.
- Finished episode cuts, reels and TikTok clips are in `animation/previews/` (`reels/`, `tiktok/`);
  captions and schedules in `scripts/ep0*/reels.md` and `strategy/tiktok.md`; upload sheets in `scripts/ep0*/youtube.md`.
  Search all branches before saying something doesn't exist.
- Narrator TTS options: ElevenLabs (credits ran out after episode 1; voice: Daniel), Gemini TTS
  (`scripts/tts_gemini.py`, free tier, key in `GEMINI_API_KEY`; used for episode 2 with voice Algenib), and Kokoro
  (`scripts/tts_kokoro.py`): local, free, no key or quota, English only. Kokoro samples are in `scripts/voice-samples/kokoro/`.

## Repo layout
- `strategy/`, `templates/`, `UPDATED_PLAN.md`: channel strategy, content calendar, style and palette notes (Arabic).
- `scripts/<ep>/`: episode scripts, narrator audio (`voice/narrator/`), subtitles, `reels.md`, `youtube.md`.
- `animation/lib/toon.js` (character kit, global `T`) and `animation/lib/kit.js` (props, map, camera, shot runner `K`).
- `animation/episodes/<ep>/`: one scene HTML per narrator section, `timing.js`, `thumbnail.html` (variants via `#a`, `#b`, `#c`).
- `animation/previews/`: committed deliverables (large; keep them few). `assets/brand/`, `assets/fonts/`: logo, banner, Sobius, fonts.
- Full render steps (align, render sections, assemble, music, subtitles, reels, TikTok) are in `animation/README.md`.

## Animation pipeline
Scenes are 1920×1080 SVG built in immediate mode: `window.render(t)` rebuilds the whole SVG for time `t` (seconds).
Keep it a pure function of `t`: no timers, CSS animations or `Math.random()` (use `T.rng(seed)`).
Run from `animation/` with `NODE_PATH=$(npm root -g)` (Playwright; Chromium and ffmpeg are pre-installed):
`node tools/still.js <scene.html[#variant]> /tmp/shot 0 5.2` for PNG stills (look at them before a full render),
`node render.js <scene.html> out.mp4 <seconds> 24` for an MP4. Write scratch renders outside the repo.

## Gotchas
- `PRODUCTION_STATUS.md` is partly stale (describes deleted `opening/hamilcar/alps-scene.html`). Trust the code.
- Historical accuracy matters (army sizes, casualty figures): double-check numbers in scripts, titles and thumbnails.
