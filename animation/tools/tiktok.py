"""Cut TikTok videos (1080x1920, 30 fps) from a finished episode, laid out for TikTok's safe zone: the right-hand
button column and the bottom caption area stay free of text, the picture sits slightly left of centre, and the
burned-in subtitles are an ASS track in pixel units placed between the picture and the caption area.

A clip is one or more segments of the episode played back to back, so a short can open on its strongest line
(the "hook") before the story starts. Optional part badge and an end card ("FOLLOW FOR PART 2") for series.

Usage: python3 animation/tools/tiktok.py animation/episodes/ep02/tiktok.json
tiktok.json: {"source": mp4, "srt": srt, "font": ttf, "out_dir": dir,
              "clips": [{"name", "segments": [[start, end], ...], "title": [line1, line2], "badge": str?, "end": str?}]}
"""
import json, subprocess, sys, pathlib

cfg = json.loads(pathlib.Path(sys.argv[1]).read_text())
out_dir = pathlib.Path(cfg["out_dir"]); out_dir.mkdir(parents=True, exist_ok=True)
font = pathlib.Path(cfg["font"]).resolve()

def secs(ts):
    h, m, s = ts.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
cues = []
for block in pathlib.Path(cfg["srt"]).read_text().strip().split("\n\n"):
    lines = block.split("\n"); a, b = lines[1].split(" --> ")
    cues.append((secs(a), secs(b), " ".join(lines[2:])))

def ass_time(x):
    cs = int(round(max(0, x) * 100)); h, cs = divmod(cs, 360000); m, cs = divmod(cs, 6000); s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"
# picture: 960 wide at x=40, y=600; subtitles from y=1190; keep x 60..900 (TikTok buttons sit at x > 940, caption below y 1540)
ASS_HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Lilita One,66,&H00FFFFFF,&H00FFFFFF,&H00171D2A,&H00000000,0,0,0,0,100,100,0,0,1,6,0,8,60,180,1190,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
esc = lambda s: s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,").replace("%", "\\%")
CX = 480  # centre of the safe area

for c in cfg["clips"]:
    segs, t, events = c["segments"], 0.0, []
    for a, b in segs:
        for s, e, txt in cues:
            if e > a and s < b: events.append((t + max(s, a) - a, t + min(e, b) - a, txt))
        t += b - a
    d = t
    ass = out_dir / f"{c['name']}.ass"
    ass.write_text(ASS_HEAD + "".join(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Sub,,0,0,0,,{x}\n" for s, e, x in events))
    args, parts = ["ffmpeg", "-y", "-loglevel", "error"], []
    for i, (a, b) in enumerate(segs):
        args += ["-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", cfg["source"]]
        parts.append(f"[{i}:v]fps=30,setpts=PTS-STARTPTS[v{i}];[{i}:a]asetpts=PTS-STARTPTS[a{i}]")
    n = len(segs)
    t1, t2 = c["title"]
    txt = lambda s, size, col, y, extra="": (f"drawtext=fontfile='{font}':text='{esc(s)}':fontsize={size}:fontcolor={col}:borderw=8:bordercolor=0x2a1d17"
                                             f":x={CX}-tw/2:y={y}{extra}")
    vf = ";".join(parts) + ";" + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[cv][ca];"
    vf += ("[cv]split[x][y];[x]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:4,eq=brightness=-0.3:saturation=1.2[bg];"
           "[y]scale=960:-2[fg];[bg][fg]overlay=40:600,")
    vf += txt(t1, 84, "white", 250) + "," + txt(t2, 92, "0xe6b740", 355)
    if c.get("badge"):
        vf += "," + txt(c["badge"], 46, "0xe6b740", 490, ":box=1:boxcolor=0x2a1d17@0.85:boxborderw=18")
    vf += f",subtitles='{ass}':fontsdir='{font.parent}'"
    if c.get("end"):
        vf += "," + txt(c["end"], 64, "white", 1420, f":box=1:boxcolor=0xc4372c@0.95:boxborderw=26:enable='gte(t,{d - 3.2:.2f})'")
    vf += f",fade=t=out:st={d - .4:.2f}:d=0.4[out];[ca]afade=t=out:st={d - .5:.2f}:d=0.5[aout]"
    out = out_dir / f"{c['name']}.mp4"
    subprocess.run(args + ["-filter_complex", vf, "-map", "[out]", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "21",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)], check=True)
    ass.unlink()
    print(f"wrote {out} ({d:.1f}s, {len(events)} subtitles)")
