"""Synthesize an original background score (no samples, no licensing): low drone, string-like pad,
taiko-style war drums and a plucked oud-like melody in D Phrygian dominant. An intensity timeline
(0 = calm, 1 = full battle) controls drum density, pad brightness and melody activity.

Usage: python3 animation/tools/music.py animation/episodes/ep01/music.json out.wav
music.json: {"duration": s, "bpm": 90, "seed": 1, "intensity": [[t, value], ...]}
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, lfilter

cfg = json.load(open(sys.argv[1]))
SR, BPM, D = 48000, cfg.get("bpm", 90), cfg["duration"]
rng = np.random.default_rng(cfg.get("seed", 1))
N = int(D * SR) + SR
L, R = np.zeros(N), np.zeros(N)
beat = 60 / BPM
pts = np.array(cfg["intensity"], float)
inten = lambda t: float(np.interp(t, pts[:, 0], pts[:, 1]))
hz = lambda midi: 440 * 2 ** ((midi - 69) / 12)

def add(sig, t0, gl=1.0, gr=1.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gl
    R[i:i + len(sig)] += sig * gr

def lowpass(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2))
    return lfilter(b, a, x)

# --- drone: D1 + D2, slow swell ---
t = np.arange(N) / SR
drone = (np.sin(2 * np.pi * hz(26) * t) * .6 + np.sin(2 * np.pi * hz(38) * t) * .4 + np.sin(2 * np.pi * hz(45) * t) * .15)
drone *= .05 * (0.75 + .25 * np.sin(2 * np.pi * t / 23))
L += drone; R += drone

# --- pad: Dm  Bb  Gm  A (2 bars each), detuned saws through a lowpass ---
prog = [[38, 50, 53, 57], [34, 50, 53, 58], [31, 50, 55, 58], [33, 49, 52, 57]]
chord_len = 8 * beat
k = 0
while k * chord_len < D:
    t0 = k * chord_len
    I = inten(t0 + chord_len / 2)
    n = int((chord_len + 1.5) * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / .8) * np.minimum(1, np.maximum(0, (chord_len + 1.5 - tt) / 1.5))
    for side, det in ((0, (-.004, .003)), (1, (.004, -.002))):
        sig = np.zeros(n)
        for m in prog[k % 4]:
            for d in det:
                ph = (hz(m) * (1 + d) * tt) % 1
                sig += 2 * ph - 1
        sig = lowpass(sig, 500 + 1600 * I) * env * (.022 + .02 * I)
        add(sig, t0, 1 if side == 0 else 0, 1 if side == 1 else 0)
    k += 1

# --- drums ---
def taiko(vel, low=False):
    n = int(1.2 * SR); tt = np.arange(n) / SR
    f = (38 if low else 55) + 90 * np.exp(-tt * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (4.5 if low else 7))
    noise = lowpass(rng.standard_normal(n), 900) * np.exp(-tt * 45) * .5
    return (body + noise) * vel

def tick(vel):
    n = int(.12 * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n); x = x - lowpass(x, 2500)
    return x * np.exp(-tt * 60) * vel

calm = [1, 0, 0, 0, 0, 0, 0, 0]
mid = [1, 0, 0, 0, .7, 0, .35, 0]
full = [1, 0, .45, 0, .8, .35, .6, .5]
bar = 4 * beat
b = 0
while b * bar < D:
    t0 = b * bar
    I = inten(t0)
    pat = full if I > .72 else mid if I > .38 else calm
    for i, v in enumerate(pat):
        if v and I > .12:
            g = v * (.35 + .65 * I) * .55
            add(taiko(g, low=(i == 0)), t0 + i * beat / 2)
        if I > .5 and i % 2 == 1:
            add(tick(.08 * I), t0 + i * beat / 2, .7, 1)
    if I > .85 and b % 2 == 1:  # big accent every other bar in the battle
        add(taiko(.6, low=True), t0 + 3.5 * beat)
    b += 1

# --- melody: plucked, D Phrygian dominant ---
scale = [62, 63, 66, 67, 69, 70, 72, 74, 75, 78]
def pluck(m, vel, dur=1.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = hz(m) * (1 + .003 * np.sin(2 * np.pi * 5 * tt) * np.minimum(1, tt * 2))
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = sum(np.sin(h * ph) / h * np.exp(-tt * (2.5 + h * 1.6)) for h in range(1, 7))
    return sig * vel * np.minimum(1, tt * 400)
idx, beatn = 4, 0
while beatn * beat < D:
    t0 = beatn * beat
    I = inten(t0)
    if rng.random() < .12 + .3 * I and I > .15:
        idx = int(np.clip(idx + rng.choice([-2, -1, -1, 1, 1, 2]), 0, len(scale) - 1))
        add(pluck(scale[idx], .05 + .03 * I), t0, .8, 1)
        if rng.random() < .3: add(pluck(scale[max(0, idx - 2)], .035), t0 + beat / 2, .8, 1)
    beatn += 1

# --- master: fades, normalize to -3 dBFS ---
n = int(D * SR)
L, R = L[:n], R[:n]
fade = np.minimum(1, np.arange(n) / (2 * SR)) * np.minimum(1, (n - np.arange(n)) / (4 * SR))
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
g = 10 ** (-3 / 20) / peak
pcm = (np.stack([L, R], 1) * g * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"wrote {sys.argv[2]} ({D:.1f}s)")
