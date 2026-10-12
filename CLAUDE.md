# Notes for Claude

- The channel owner lives in **Germany**. Give every publish/schedule time in German time
  (Europe/Berlin: CEST = UTC+2 until the last Sunday of October, CET = UTC+1 in winter),
  with the US Eastern time next to it, since the audience is mainly US/UK.
  Never use Mecca/Saudi time, even though `strategy/content-calendar.md` mentions it.
- Reply to the owner in Arabic; channel content (titles, descriptions, narration) is in English.
- Default slot: 17:00 Germany time in summer time (= 11:00 New York). Between the
  European and US clock changes (late Oct to early Nov, and March) the gap is one hour different, so check it.
- Channel: Spears and Tears, `UCQWruVOY2KJtc2aLH3eZuNA`, connected to vidIQ.
  Episode 1 (Cannae) is `eYPMUTlmnPM`, published 2026-10-11.
- Finished episode cuts, reels and TikTok clips live on branch `claude/elevenlabs-dramatic-voices-7x1bsj`
  (`animation/previews/`, `scripts/ep0*/reels.md`). Search all branches before saying something doesn't exist.
- Narrator TTS options: ElevenLabs (credits ran out after episode 1), Gemini TTS (`scripts/tts_gemini.py` on the
  branch above, free tier, `GEMINI_API_KEY`), and Kokoro (`scripts/tts_kokoro.py`): local, free, no key or quota,
  English only. Kokoro samples are in `scripts/voice-samples/kokoro/`.
