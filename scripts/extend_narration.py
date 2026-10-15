"""Append extra narration to existing narrator sections with Gemini TTS, without touching the approved audio.

Reads <episode>/additions.json ({"<section index>": [lines...]}), speaks each section's new lines in one
request, and joins them onto the original section audio (kept in voice/narrator/orig/). Rewrites the
section .txt, NARRATOR_full.mp3 and timings.json, so animation/tools/align.py works unchanged.
Resumable and quota-friendly: sections whose addition is already in voice/narrator/add/ are skipped,
and --max limits how many new TTS requests one run makes (the free tier has a small daily quota).

Usage:
  GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview \
    python3 scripts/extend_narration.py scripts/ep02-kadesh Algenib [--max N]
"""
import json, os, re, shutil, subprocess, sys, pathlib, base64, time, urllib.request, urllib.error

API = "https://generativelanguage.googleapis.com/v1beta"
KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.1-flash-tts-preview")  # matches ep02 sections 1-9
STYLE = ("narrator of an animated history documentary: a deep, warm male voice, "
         "dramatic but with dry humour, confident and brisk, with short pauses between sentences")
GAP = 0.45      # silence between the original section audio and the addition (s)
LUFS = -19.5    # loudness the ep02 sections were matched to

def speak(text, voice, mp3):
    body = {"contents": [{"parts": [{"text": f"### DIRECTOR'S NOTES\nStyle: {STYLE}.\n\n### TRANSCRIPT\n{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(f"{API}/models/{MODEL}:generateContent", data=json.dumps(body).encode(),
                                 headers={"x-goog-api-key": KEY, "Content-Type": "application/json"}, method="POST")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                res = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            if e.code == 429:
                return f"quota: {msg}"          # daily free-tier quota: stop, resume tomorrow
            if e.code in (500, 502, 503) and attempt < 2:
                time.sleep(10 * (attempt + 1)); continue
            sys.exit(f"HTTP {e.code}: {msg}")
    part = res["candidates"][0]["content"]["parts"][0]["inlineData"]
    rate = int(re.search(r"rate=(\d+)", part.get("mimeType", "rate=24000")).group(1))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-",
                    "-af", f"loudnorm=I={LUFS}:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "128k", str(mp3)],
                   input=base64.b64decode(part["data"]), check=True)
    return None

def duration(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

ep, voice = pathlib.Path(sys.argv[1]), sys.argv[2]
limit = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 99
if not KEY: sys.exit("GEMINI_API_KEY is not set")
adds = {int(k): v for k, v in json.loads((ep / "additions.json").read_text()).items() if not k.startswith("_")}
nar = ep / "voice" / "narrator"
orig, addd = nar / "orig", nar / "add"
orig.mkdir(exist_ok=True); addd.mkdir(exist_ok=True)
timings = json.loads(((orig / "timings.json") if (orig / "timings.json").exists() else (nar / "timings.json")).read_text())
if not (orig / "timings.json").exists(): shutil.copy(nar / "timings.json", orig / "timings.json")

made, stopped = 0, None
for s in timings:
    i, f = s["index"], s["file"]
    for ext in (".mp3", ".txt"):
        if not (orig / f.replace(".mp3", ext)).exists(): shutil.copy(nar / f.replace(".mp3", ext), orig / f.replace(".mp3", ext))
    base_txt = (orig / f.replace(".mp3", ".txt")).read_text().strip()
    add_mp3 = addd / f"{i:02d}_add.mp3"
    if i in adds and not add_mp3.exists() and not stopped and made < limit:
        stopped = speak(" ".join(adds[i]), voice, add_mp3)
        if not stopped: made += 1; print(f"section {i}: spoke {len(' '.join(adds[i]).split())} words -> {add_mp3.name} ({duration(add_mp3):.1f}s)")
    if i in adds and add_mp3.exists():
        (addd / f"{i:02d}_add.txt").write_text("\n\n".join(adds[i]) + "\n")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(orig / f), "-f", "lavfi", "-t", str(GAP), "-i", "anullsrc=r=44100:cl=mono",
                        "-i", str(add_mp3), "-filter_complex", "[0]aresample=44100,aformat=channel_layouts=mono[a];[2]aresample=44100,aformat=channel_layouts=mono[c];[a][1][c]concat=n=3:v=0:a=1",
                        "-b:a", "128k", str(nar / f)], check=True)
        (nar / f.replace(".mp3", ".txt")).write_text(base_txt + "\n\n" + "\n\n".join(adds[i]) + "\n")
    else:
        shutil.copy(orig / f, nar / f); (nar / f.replace(".mp3", ".txt")).write_text(base_txt + "\n")
    s["duration"] = duration(nar / f)

(nar / "concat.txt").write_text("".join(f"file '{s['file']}'\n" for s in timings))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(nar / "concat.txt"), "-c", "copy", str(nar / "NARRATOR_full.mp3")], check=True)
(nar / "concat.txt").unlink()
t = 0.0
for s in timings:
    s["audio_start"], t = round(t, 2), t + s["duration"]
(nar / "timings.json").write_text(json.dumps(timings, indent=1))
done = sorted(i for i in adds if (addd / f"{i:02d}_add.mp3").exists())
print(f"{made} new request(s); additions done for sections {done}; pending {sorted(set(adds) - set(done))}; total {t / 60:.2f} min")
if stopped: print("stopped on quota:", stopped[:200])
