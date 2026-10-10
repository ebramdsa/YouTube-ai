"""Cut vertical 9:16 reels (1080x1920) from the finished episode: the 16:9 picture sits in the middle over a
blurred copy of itself, a hook title and a call to action on top, burned-in English subtitles under the
picture; the bottom stays clear for the app's own buttons and caption. Subtitles come from the episode SRT, shifted to each clip.

Usage: python3 animation/tools/reels.py animation/episodes/ep01/reels.json
reels.json: {"source": mp4, "srt": srt, "font": ttf, "out_dir": dir,
             "reels": [{"name", "start", "end", "title": [line1, line2]}]}
"""
import json, re, subprocess, sys, pathlib

cfg = json.loads(pathlib.Path(sys.argv[1]).read_text())
out_dir = pathlib.Path(cfg["out_dir"]); out_dir.mkdir(parents=True, exist_ok=True)
font = pathlib.Path(cfg["font"]).resolve()
srt = pathlib.Path(cfg["srt"]).read_text()

def secs(ts):
    h, m, s = ts.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
def ts(x):
    ms = int(round(max(0, x) * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
cues = []
for block in srt.strip().split("\n\n"):
    lines = block.split("\n")
    a, b = lines[1].split(" --> ")
    cues.append((secs(a), secs(b), " ".join(lines[2:])))

esc = lambda s: s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,")
for r in cfg["reels"]:
    a, b = r["start"], r["end"]
    clip_srt = out_dir / f"{r['name']}.srt"
    sel = [(max(s, a) - a, min(e, b) - a, t) for s, e, t in cues if e > a and s < b]
    clip_srt.write_text("".join(f"{i}\n{ts(s)} --> {ts(e)}\n{t}\n\n" for i, (s, e, t) in enumerate(sel, 1)))
    d = b - a
    t1, t2 = r["title"]
    style = "FontName=Lilita One,FontSize=13,PrimaryColour=&H00FFFFFF,OutlineColour=&H00171D2A,Outline=2.2,Shadow=0,Alignment=2,MarginV=66,MarginL=8,MarginR=8"
    vf = (
        "[0:v]split[a][b];"
        "[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:4,eq=brightness=-0.28:saturation=1.2[bg];"
        "[b]scale=1080:-2[fg];"
        "[bg][fg]overlay=0:620[v];"
        f"[v]drawtext=fontfile='{font}':text='{esc(t1)}':fontsize=96:fontcolor=white:borderw=8:bordercolor=0x2a1d17:x=(w-tw)/2:y=250,"
        f"drawtext=fontfile='{font}':text='{esc(t2)}':fontsize=104:fontcolor=0xe6b740:borderw=8:bordercolor=0x2a1d17:x=(w-tw)/2:y=370,"
        f"subtitles='{clip_srt}':fontsdir='{font.parent}':force_style='{style}',"
        f"drawtext=fontfile='{font}':text='{esc('FULL EPISODE ON YOUTUBE - SPEARS & TEARS')}':fontsize=40:fontcolor=0xe6b740:borderw=4:bordercolor=0x2a1d17:x=(w-tw)/2:y=520,"
        f"fade=t=in:st=0:d=0.25,fade=t=out:st={d - .5:.2f}:d=0.5[out]"
    )
    out = out_dir / f"{r['name']}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a), "-t", f"{d:.3f}", "-i", cfg["source"],
                    "-filter_complex", vf, "-map", "[out]", "-map", "0:a", "-af", f"afade=t=out:st={d - .6:.2f}:d=0.6",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)], check=True)
    print(f"wrote {out} ({d:.1f}s, {len(sel)} subtitles)")
