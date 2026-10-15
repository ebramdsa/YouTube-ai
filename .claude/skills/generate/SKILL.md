---
name: generate
description: |
  Generate images and video clips with AI models (Gemini/Nano Banana, Imagen, GPT Image, Flux,
  Veo, Kling, Wan, Seedance) or vidIQ's generators, picking the cheapest provider and staying
  inside a budget. Use when the owner asks to "generate / make an image", "make a video clip",
  "b-roll", "thumbnail idea", "make N ads/images with M models", "animate this picture",
  or names one of those models. Not for the episode cartoons themselves: those are built
  in code under animation/ (see CLAUDE.md).
argument-hint: "[what to make] [count] [--models a,b] [--budget $]"
---

# Generate images and video

Files in this folder:
- `models.json`: models, their providers and estimated price (per image, or per second of video).
- `settings.json`: quality level, parallel jobs, default sizes, per-request and monthly limits.
- `generate.py`: runs the jobs. `status` / `plan` / `run`; see its docstring.
- `outputs/`: results plus one `.json` per result (exact prompt, model, provider, cost). Not committed.
- `spend.json`: spend per month. Commit it after every paid run so the monthly limit survives new sessions.

## Workflow

1. **Understand the request.** What, how many, size (16:9 video/thumbnail, 9:16 Shorts/TikTok, 1:1),
   video length, quality, budget. If the owner gave no budget, use `request_limit_usd` from settings.
   Ask one short question only if something essential is missing.
2. **Check what is available.** `python3 .claude/skills/generate/generate.py status`.
   Only providers with a key can run. If none fits, offer the vidIQ route below (check
   `vidiq_balance` first) or tell the owner which key to add (see "Keys").
3. **Pick models.** Read `models.json`. Spread the count across the models asked for
   (e.g. 10 ads with 3 models → 4/3/3). Without named models, let the script pick
   (cheapest model meeting `settings.quality`).
4. **Write one prompt per shot**, tuned to the model: Gemini/GPT Image handle on-image text well;
   Flux needs short, concrete prompts; video prompts describe one shot, camera move and action,
   with no text in frame. For this channel add the style block below unless asked otherwise.
5. **Write the jobs file** to the scratchpad (not the repo) and run
   `generate.py plan <jobs.json> --budget <usd>`. Show the owner the table (models, providers,
   total cost) and **wait for approval before `run`.** Free jobs (cost 0) can run without asking.
6. If `plan` prints STOP (over budget or monthly limit), do not run. Propose a cheaper plan:
   fewer items, a cheaper model (flux-schnell, seedance-lite), shorter clips.
7. **Run** `generate.py run <jobs.json> --budget <usd>`, then show the results (Read the images,
   take a frame from videos with ffmpeg) and send the good ones with SendUserFile.
   Report failures plainly; never retry a paid job silently.
8. Commit `spend.json`. Copy keepers the owner wants into the repo (e.g. `assets/` or the episode
   folder); `animation/previews/` is for finished deliverables only.

## Channel style block (Spears and Tears)

Append to image prompts for this channel, adapted to the scene:
"2D cartoon cut-out style, big round heads, simple line eyes, exaggerated expressions, thick black
outlines (#1A1A1A), slightly scratchy texture, warm bold palette: golden sky #FFC700, earth #6B4423,
Roman red #E63946, bronze/gold #FFB81C, Carthage purple #9D4EDD, tear cyan #00D4FF.
Original characters, not copies of other channels' characters."
Historical accuracy matters: check army sizes, dates and equipment in any text you put in an image.
Titles, on-image text and descriptions are in English.

## vidIQ route (channel's connected vidIQ account, uses vidIQ credits)

Load the tools with ToolSearch first. Check `vidiq_balance` and tell the owner the credit cost before
calling anything paid:
- `vidiq_generate_thumbnail` / `vidiq_refine_thumbnail` / `vidiq_score_thumbnail`: thumbnails.
- `vidiq_generate_broll`, `vidiq_generate_video`, `vidiq_motion_graphics`: short clips.
- `vidiq_generate_music`: background music. `vidiq_voiceover_generate`: narration.
- Long-running results come back as jobs: poll with `vidiq_job_poll`.

## Free routes

- Cartoon scenes, reels and thumbnails in the channel's own style: the code pipeline in `animation/`.
- Narration: `scripts/tts_kokoro.py` (local, free) or `scripts/tts_gemini.py` (free tier).
- `gemini-image` has a small free tier on some Gemini keys; if `run` gets HTTP 429 the free quota is used up.

## Keys

Set as environment variables in the cloud environment settings (never in the repo):
`GEMINI_API_KEY` (Google: Gemini image, Imagen, Veo), `OPENAI_API_KEY` (GPT Image),
`FAL_KEY` (fal.ai: Flux, Kling, Wan, Seedance, Veo), `REPLICATE_API_TOKEN` (Replicate: Flux, Wan, Seedance).
To add a model: add an entry to `models.json` with its provider model id and price.

## Example

"Make 10 ads using 3 different models, total under $3" →
3 models × (4/3/3) jobs → `plan --budget 3` → show the table → after approval `run` →
results in `outputs/` with a `.json` per item. If the plan costs more than $3, it stops and you
suggest a cheaper split.
