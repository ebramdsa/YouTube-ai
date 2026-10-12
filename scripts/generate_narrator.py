"""Generate the narrator track for a narrator-only script with ElevenLabs:
one MP3 per section, a combined full MP3, and a timings file with each section's start and duration.

Usage: ELEVENLABS_API_KEY=... python3 scripts/generate_narrator.py scripts/ep01-cannae
Sections that already have an MP3 are skipped, so a run that stops halfway can be resumed.
"""
import json, os, re, ssl, subprocess, sys, pathlib, urllib.request

VOICE_ID = "onwK4e9ZLuTAKqWW03F9"  # Daniel - Steady Broadcaster
MODEL = "eleven_multilingual_v2"
SETTINGS = {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35}

ep = pathlib.Path(sys.argv[1])
sections, current = [], None
for raw in (ep / "SCRIPT_V2_NARRATOR_ONLY.md").read_text().splitlines():
    m = re.match(r"## (\d+)\. (.*?) \(([\d:]+)–([\d:]+)\)", raw)
    if m:
        current = {"index": int(m.group(1)), "title": m.group(2), "start": m.group(3), "end": m.group(4), "lines": []}
        sections.append(current)
    elif raw.startswith("## "):
        current = None  # e.g. PRODUCTION NOTES
    elif current and re.fullmatch(r'".*"', raw.strip()):
        current["lines"].append(raw.strip()[1:-1])

out = ep / "voice" / "narrator"
out.mkdir(parents=True, exist_ok=True)
ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE"))
texts = ["\n\n".join(s["lines"]) for s in sections]

for i, s in enumerate(sections):
    slug = re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-")
    s["file"] = f"{s['index']:02d}_{slug}.mp3"
    path = out / s["file"]
    (out / f"{s['index']:02d}_{slug}.txt").write_text(texts[i] + "\n")
    if not path.exists():
        body = {"text": texts[i], "model_id": MODEL, "voice_settings": SETTINGS,
                "previous_text": texts[i - 1][-500:] if i else None,
                "next_text": texts[i + 1][:500] if i + 1 < len(texts) else None}
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
            data=json.dumps(body).encode(), method="POST",
            headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
        with urllib.request.urlopen(req, context=ctx, timeout=300) as r:
            path.write_bytes(r.read())
    s["duration"] = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]))
    print(f"{s['file']:42} {len(texts[i]):5} chars {s['duration']:6.1f}s")

(out / "concat.txt").write_text("".join(f"file '{s['file']}'\n" for s in sections))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(out / "concat.txt"),
                "-c", "copy", str(out / "NARRATOR_full.mp3")], check=True)
(out / "concat.txt").unlink()

t = 0.0
for s in sections:
    s["audio_start"], t = round(t, 2), t + s["duration"]
    del s["lines"]
(out / "timings.json").write_text(json.dumps(sections, indent=1))
print(f"total {t / 60:.1f} min -> {out / 'NARRATOR_full.mp3'}")
