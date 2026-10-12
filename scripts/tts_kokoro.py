"""Narrator voice with Kokoro TTS (hexgrad/Kokoro-82M): free, runs locally, no API key or quota.
Alternative to ElevenLabs and Gemini TTS (scripts/tts_gemini.py on branch claude/elevenlabs-dramatic-voices-7x1bsj).

Output matches tts_gemini.py: voice/narrator/NN_slug.mp3 + .txt, NARRATOR_full.mp3 and timings.json,
so animation/tools/align.py works unchanged. English only (no Arabic voices); no style prompts.

Setup (Python 3.10-3.12, CPU is fine; the ~330 MB model downloads from Hugging Face on first run):
  uv venv -p 3.12 .venv-kokoro
  VIRTUAL_ENV=.venv-kokoro uv pip install kokoro soundfile torch \
      en_core_web_sm@https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl \
      --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match
  Run with .venv-kokoro/bin/python. Also needs ffmpeg/ffprobe on PATH.

Usage:
  python scripts/tts_kokoro.py voices                                 # list English voices
  python scripts/tts_kokoro.py samples <out_dir> [voice ...]          # one test line per voice
  python scripts/tts_kokoro.py script <episode_dir> <voice> [speed]   # whole narrator script, resumable
Voice prefix picks the accent: am_/af_ = American, bm_/bf_ = British. Speed defaults to 1.0.
"""
import json, re, subprocess, sys, pathlib

import numpy as np

RATE = 24000
PAUSE = 0.35  # seconds of silence between script lines
SAMPLE = ("1274 BC. Syria. The most powerful man in the world is about to be ambushed. "
          "His name is Ramesses the Second. Pharaoh of Egypt. Son of the sun god. And very, very sure of himself.")
DEFAULT_VOICES = ["am_michael", "am_fenrir", "am_onyx", "bm_george", "bm_lewis", "bm_fable"]
VOICES = ["af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky", "am_adam", "am_echo", "am_eric", "am_fenrir",
          "am_liam", "am_michael", "am_onyx", "am_puck", "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
          "bm_daniel", "bm_fable", "bm_george", "bm_lewis"]

_pipelines = {}

def pipeline(voice):
    from kokoro import KPipeline
    lang = voice[0]
    if lang not in "ab": sys.exit(f"{voice}: only English voices (a*/b*) are supported")
    if lang not in _pipelines:
        _pipelines[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    return _pipelines[lang]

def speak(lines, voice, mp3, speed=1.0):
    pipe, gap, chunks = pipeline(voice), np.zeros(int(RATE * PAUSE), dtype=np.float32), []
    for line in lines:
        for result in pipe(line, voice=voice, speed=speed):
            chunks.append(np.asarray(result.audio, dtype=np.float32))
        chunks.append(gap)
    pcm = (np.clip(np.concatenate(chunks[:-1]), -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(RATE), "-ac", "1", "-i", "-",
                    "-ar", "44100", "-b:a", "128k", str(mp3)], input=pcm, check=True)

def duration(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

def parse(script):
    sections, cur = [], None
    for raw in script.read_text().splitlines():
        m = re.match(r"## (\d+)\. (.*?) \(([\d:]+)–([\d:]+)\)", raw)
        if m:
            cur = {"index": int(m.group(1)), "title": m.group(2), "start": m.group(3), "end": m.group(4), "lines": []}; sections.append(cur)
        elif raw.startswith("## "): cur = None
        elif cur and re.fullmatch(r'".*"', raw.strip()): cur["lines"].append(raw.strip()[1:-1])
    return sections

mode = sys.argv[1] if len(sys.argv) > 1 else ""
if mode == "voices":
    print("\n".join(VOICES))
elif mode == "samples":
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    for v in sys.argv[3:] or DEFAULT_VOICES:
        speak([SAMPLE], v, out / f"{v}.mp3"); print(f"{v}: {duration(out / f'{v}.mp3'):.1f}s")
elif mode == "script":
    ep, voice = pathlib.Path(sys.argv[2]), sys.argv[3]
    speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    script = next(p for p in (ep / "SCRIPT_NARRATOR.md", ep / "SCRIPT_V2_NARRATOR_ONLY.md") if p.exists())
    out = ep / "voice" / "narrator"; out.mkdir(parents=True, exist_ok=True)
    print("kokoro voice:", voice, "speed:", speed)
    sections = parse(script)
    for s in sections:
        slug = re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-")
        s["file"] = f"{s['index']:02d}_{slug}.mp3"
        text = "\n\n".join(s["lines"])
        (out / s["file"].replace(".mp3", ".txt")).write_text(text + "\n")
        if not (out / s["file"]).exists(): speak(s["lines"], voice, out / s["file"], speed)
        s["duration"] = duration(out / s["file"])
        print(f"{s['file']:40} {len(text):5} chars {s['duration']:6.1f}s")
    (out / "concat.txt").write_text("".join(f"file '{s['file']}'\n" for s in sections))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(out / "concat.txt"), "-c", "copy", str(out / "NARRATOR_full.mp3")], check=True)
    (out / "concat.txt").unlink()
    t = 0.0
    for s in sections:
        s["audio_start"], t = round(t, 2), t + s["duration"]; del s["lines"]
    (out / "timings.json").write_text(json.dumps(sections, indent=1))
    print(f"total {t / 60:.1f} min, kokoro voice {voice}")
else:
    sys.exit(__doc__)
