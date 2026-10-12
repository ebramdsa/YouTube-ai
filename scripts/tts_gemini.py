"""Narrator voice with Google AI Studio (Gemini TTS) — alternative to ElevenLabs.

Reads the key from GEMINI_API_KEY. Output matches generate_narrator.py: voice/narrator/NN_slug.mp3 + .txt,
NARRATOR_full.mp3 and timings.json, so animation/tools/align.py works unchanged.

Usage:
  python3 scripts/tts_gemini.py models                         # list TTS-capable models
  python3 scripts/tts_gemini.py samples <out_dir> [voice ...]  # one test line per voice
  python3 scripts/tts_gemini.py script <episode_dir> <voice>   # whole narrator script, resumable
"""
import base64, json, os, re, subprocess, sys, time, pathlib, urllib.request, urllib.error

API = "https://generativelanguage.googleapis.com/v1beta"
KEY = os.environ.get("GEMINI_API_KEY", "")
# Direction goes in a notes block; a plain "Read this as ...:" prefix gets spoken aloud by newer models.
STYLE = ("narrator of an animated history documentary: a deep, warm male voice, "
         "dramatic but with dry humour, confident and brisk, with short pauses between sentences")
SAMPLE = ("1274 BC. Syria. The most powerful man in the world is about to be ambushed. "
          "His name is Ramesses the Second. Pharaoh of Egypt. Son of the sun god. And very, very sure of himself.")
DEFAULT_VOICES = ["Charon", "Algenib", "Gacrux", "Orus"]

def call(path, body=None):
    req = urllib.request.Request(f"{API}/{path}", data=json.dumps(body).encode() if body else None,
                                 headers={"x-goog-api-key": KEY, "Content-Type": "application/json"}, method="POST" if body else "GET")
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:400]
            if e.code in (429, 500, 502, 503) and attempt < 4:
                time.sleep(5 * 2 ** attempt); continue
            sys.exit(f"HTTP {e.code}: {msg}")

def tts_models():
    names = [m["name"].split("/")[-1] for m in call("models?pageSize=200").get("models", [])]
    return [n for n in names if "tts" in n]

def pick_model():
    # Pro TTS has a free-tier quota of 0, so default to the newest non-lite Flash model;
    # set GEMINI_TTS_MODEL to override (e.g. a pro model on a paid key).
    if os.environ.get("GEMINI_TTS_MODEL"): return os.environ["GEMINI_TTS_MODEL"]
    ms = tts_models()
    if not ms: sys.exit("no TTS model available for this key")
    ver = lambda m: [int(x) for x in re.findall(r"\d+", m.split("-tts")[0])]
    flash = sorted((m for m in ms if "flash" in m and "lite" not in m), key=ver, reverse=True)
    return (flash or ms)[0]

def speak(text, voice, model, mp3):
    body = {"contents": [{"parts": [{"text": f"### DIRECTOR'S NOTES\nStyle: {STYLE}.\n\n### TRANSCRIPT\n{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    res = call(f"models/{model}:generateContent", body)
    part = res["candidates"][0]["content"]["parts"][0]["inlineData"]
    rate = int(re.search(r"rate=(\d+)", part.get("mimeType", "")).group(1)) if "rate=" in part.get("mimeType", "") else 24000
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-",
                    "-ar", "44100", "-b:a", "128k", str(mp3)], input=base64.b64decode(part["data"]), check=True)

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

if not KEY: sys.exit("GEMINI_API_KEY is not set")
mode = sys.argv[1]
if mode == "models":
    print("\n".join(tts_models()))
elif mode == "samples":
    out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    model = pick_model(); print("model:", model)
    for v in sys.argv[3:] or DEFAULT_VOICES:
        speak(SAMPLE, v, model, out / f"{v}.mp3"); print(f"{v}: {duration(out / f'{v}.mp3'):.1f}s")
elif mode == "script":
    ep, voice = pathlib.Path(sys.argv[2]), sys.argv[3]
    script = next(p for p in (ep / "SCRIPT_NARRATOR.md", ep / "SCRIPT_V2_NARRATOR_ONLY.md") if p.exists())
    out = ep / "voice" / "narrator"; out.mkdir(parents=True, exist_ok=True)
    model = pick_model(); print("model:", model, "voice:", voice)
    sections = parse(script)
    for s in sections:
        slug = re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-")
        s["file"] = f"{s['index']:02d}_{slug}.mp3"
        text = "\n\n".join(s["lines"])
        (out / s["file"].replace(".mp3", ".txt")).write_text(text + "\n")
        if not (out / s["file"]).exists(): speak(text, voice, model, out / s["file"])
        s["duration"] = duration(out / s["file"])
        print(f"{s['file']:40} {len(text):5} chars {s['duration']:6.1f}s")
    (out / "concat.txt").write_text("".join(f"file '{s['file']}'\n" for s in sections))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(out / "concat.txt"), "-c", "copy", str(out / "NARRATOR_full.mp3")], check=True)
    (out / "concat.txt").unlink()
    t = 0.0
    for s in sections:
        s["audio_start"], t = round(t, 2), t + s["duration"]; del s["lines"]
    (out / "timings.json").write_text(json.dumps(sections, indent=1))
    print(f"total {t / 60:.1f} min, voice {voice}, model {model}")
