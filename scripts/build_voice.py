"""Split an episode script into ElevenLabs-ready text files, one per voice
(narrator split in two parts to stay under per-request limits), plus a cue list mapping each line to its file.

Usage: python3 scripts/build_voice.py scripts/ep01-cannae
"""
import json, re, sys, pathlib

BREAK = ' <break time="2.0s" /> '
ep = pathlib.Path(sys.argv[1])
lines, chapter = [], 0
for raw in (ep / "script.md").read_text().splitlines():
    if raw.startswith("## "):
        chapter = int(raw[3:].split(".")[0])
    m = re.match(r"\*\*([A-Z]+):\*\*\s*(.*)", raw)
    if m:
        text = re.sub(r"\([^)]*\)\s*", "", m.group(2)).strip()  # drop stage directions
        lines.append({"speaker": m.group(1), "chapter": chapter, "text": text})

files = {}
for ln in lines:
    key = ("NARRATOR_part1" if ln["chapter"] <= 4 else "NARRATOR_part2") if ln["speaker"] == "NARRATOR" else ln["speaker"]
    ln["file"] = key
    ln["index"] = len(files.setdefault(key, []))
    files[key].append(ln["text"])

out = ep / "voice"
out.mkdir(exist_ok=True)
for key, texts in files.items():
    (out / f"{key}.txt").write_text(BREAK.join(texts) + "\n")
(out / "cues.json").write_text(json.dumps(lines, indent=1))
for key, texts in sorted(files.items()):
    print(f"{key:14} {len(texts):3} lines {len(BREAK.join(texts)):5} chars")
print("total words:", sum(len(l["text"].split()) for l in lines))
