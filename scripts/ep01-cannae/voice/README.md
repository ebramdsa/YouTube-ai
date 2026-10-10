# Voice generation (ElevenLabs)

Model: **Eleven Multilingual v2** (supports `<break>` pauses). Paste each file's text, generate, download as MP3,
and name the MP3 exactly like the text file (e.g. `SOBIUS.mp3`).

| File | Voice direction |
|---|---|
| NARRATOR_part1 / part2 | Warm, deep, documentary narrator with dry humour. Same voice for both parts. |
| SOBIUS | High-pitched, nervous, whiny young soldier. Over-dramatic. |
| HANNIBAL | Calm, low, smug, confident. Never shouts. |
| VARRO | Loud, arrogant, overexcited politician. |
| ELDER | Old, slow, wise, slightly tired (used for Fabius and Maharbal). |

`cues.json` records the order of every line so the audio can be split on the 2-second pauses and placed on the timeline.
