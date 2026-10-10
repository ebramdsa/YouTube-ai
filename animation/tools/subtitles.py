"""Build English and Arabic SRT subtitles for the full episode from the narrator word timings.

Cold open: lines placed at the cue times of the cold-open animation (cold-open.json).
Sections 1-8: English cues from word timings (<= 2 lines of ~42 chars); Arabic cues (ar.json, one entry
per English sentence) share the English sentence timing.
Section k starts at 38 s (cold open) plus the rendered length of the sections before it (frames at 24 fps).

Usage: python3 animation/tools/subtitles.py animation/episodes/ep01/timing.js scripts/ep01-cannae/subtitles
"""
import json, math, re, sys, pathlib

timing_js, sub_dir = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
src = timing_js.read_text()
TM = json.loads(src[src.index("{"):src.rindex("}") + 1])
AR = json.loads((sub_dir / "ar.json").read_text())
CO = json.loads((sub_dir / "cold-open.json").read_text())
FPS, COLD = 24, CO["duration"]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
MAXC = 84

def wrap(text, width=42):
    if len(text) <= width: return text
    words, best = text.split(), None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]: best = (score, a + "\n" + b)
    return best[1]

def split_text(text, parts):
    """split text into `parts` pieces at word boundaries, balanced by length"""
    words = text.split()
    if parts <= 1 or len(words) < 2: return [text]
    out, start = [], 0
    for p in range(1, parts):
        target = len(text) * p / parts
        acc, i = 0, start
        while i < len(words) - 1 and acc + len(words[i]) < target - sum(len(o) + 1 for o in out): acc += len(words[i]) + 1; i += 1
        i = max(i, start + 1)
        out.append(" ".join(words[start:i])); start = i
    out.append(" ".join(words[start:]))
    return out

en, ar = [], []
# --- cold open ---
for ln in CO["lines"]:
    en.append([ln["start"], ln["end"], ln["en"]])
    ar.append([ln["start"], ln["end"], ln["ar"]])

# --- sections ---
offset = COLD
for k in range(1, 9):
    tm = TM[str(k)]
    sec_len = math.ceil(tm["duration"] * FPS) / FPS
    words = iter(tm["w"])
    sent_chunks = []  # per sentence: list of (start, last_word_time, last_word, text)
    for si, sent in enumerate(tm["text"]):
        if re.search(r"(^|\s)'\w", sent) and not re.search(r"\w[.,!?]?'(\s|$)", sent):
            sent += "'"  # the script splits some quotes across sentences; close them for display
        toks = []
        for disp in sent.split():
            n = len([p for p in disp.replace("—", " ").replace("-", " ").split() if norm(p)])
            times = [next(words)[1] for _ in range(n)]
            toks.append((disp, times[0] if times else None, times[-1] if times else None))
        # fill tokens without spoken words (e.g. a lone dash) with the neighbour's time
        for i, (d, a, b) in enumerate(toks):
            if a is None:
                nb = next((x for x in toks[i:] + toks[:i][::-1] if x[1] is not None), (None, 0, 0))
                toks[i] = (d, nb[1], nb[2])
        chunks, cur = [], []
        for tok in toks:
            if cur and len(" ".join(t[0] for t in cur + [tok])) > MAXC:
                # prefer breaking after punctuation in the second half of the chunk
                cut = next((j + 1 for j in range(len(cur) - 1, len(cur) // 2, -1) if re.search(r"[,;:—]$", cur[j][0])), len(cur))
                chunks.append(cur[:cut]); cur = cur[cut:]
            cur.append(tok)
        chunks.append(cur)
        sent_chunks.append([(c[0][1], c[-1][2], c[-1][0], " ".join(t[0] for t in c)) for c in chunks])
    flat = [(si, c) for si, cs in enumerate(sent_chunks) for c in cs]
    ends = {}
    for i, (si, (st, lw_t, lw, text)) in enumerate(flat):
        nxt = flat[i + 1][1][0] if i + 1 < len(flat) else sec_len
        end = min(nxt - .05, lw_t + .45 + .07 * len(lw) + .5)
        end = max(end, min(st + .9, nxt - .05))
        en.append([offset + st, offset + end, text])
        ends.setdefault(si, []).append((st, end))
    for si, spans in ends.items():
        text = AR[str(k)][si]
        st, end = spans[0][0], spans[-1][1]
        parts = max(len(spans), math.ceil(len(text) / MAXC))
        pieces = split_text(text, parts)
        if len(pieces) == len(spans):
            for (a, b), p in zip(spans, pieces): ar.append([offset + a, offset + b, p])
        else:
            tot = sum(len(p) for p in pieces); t = st
            for p in pieces:
                d = (end - st) * len(p) / tot; ar.append([offset + t, offset + t + d - .03, p]); t += d
    offset += sec_len

def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

for name, cues in (("ep01.en.srt", en), ("ep01.ar.srt", ar)):
    cues.sort(key=lambda c: c[0])
    for i in range(len(cues) - 1):  # never overlap
        cues[i][1] = min(cues[i][1], cues[i + 1][0] - .02)
    body = "".join(f"{i}\n{ts(a)} --> {ts(b)}\n{wrap(t)}\n\n" for i, (a, b, t) in enumerate(cues, 1))
    (sub_dir / name).write_text(body)
    print(f"{name}: {len(cues)} cues, ends {ts(cues[-1][1])}")
print(f"episode length {offset:.2f}s")
