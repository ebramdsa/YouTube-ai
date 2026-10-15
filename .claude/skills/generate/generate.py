"""Image/video generation across providers, with cost checks before anything is spent.

Usage:
  python3 generate.py status                       # keys found, month spend, limits
  python3 generate.py plan jobs.json [--budget 3]  # pick model/provider per job and estimate cost; spends nothing
  python3 generate.py run  jobs.json [--budget 3]  # same check, then generate in parallel

jobs.json is a list of jobs:
  [{"name": "hannibal-alps", "prompt": "...", "type": "image", "model": "gemini-image",
    "aspect": "16:9", "duration": 5, "image": "path/to/reference.png"}]
Only "prompt" is required. Without "model", the cheapest model of that type that meets settings.quality is used.

Keys (env): GEMINI_API_KEY (google), OPENAI_API_KEY (openai), FAL_KEY (fal), REPLICATE_API_TOKEN (replicate).
Results go to outputs/<date>_<name>.<ext> with a .json next to it (prompt, model, provider, cost).
"""
import base64, json, mimetypes, os, pathlib, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "outputs"
SPEND = HERE / "spend.json"
MODELS = {k: v for k, v in json.loads((HERE / "models.json").read_text()).items() if not k.startswith("_")}
SETTINGS = json.loads((HERE / "settings.json").read_text())
KEYS = {"google": "GEMINI_API_KEY", "openai": "OPENAI_API_KEY", "fal": "FAL_KEY", "replicate": "REPLICATE_API_TOKEN"}
LEVEL = {"fast": 1, "balanced": 2, "best": 3}

def key(provider): return os.environ.get(KEYS[provider], "")
def month(): return datetime.now(timezone.utc).strftime("%Y-%m")
def spent(): return json.loads(SPEND.read_text()).get(month(), 0.0) if SPEND.exists() else 0.0

def add_spend(usd):
    data = json.loads(SPEND.read_text()) if SPEND.exists() else {}
    data[month()] = round(data.get(month(), 0.0) + usd, 4)
    SPEND.write_text(json.dumps(data, indent=2) + "\n")

# ---------- planning ----------

def defaults(job):
    kind = job.get("type") or (MODELS[job["model"]]["type"] if job.get("model") in MODELS else "image")
    out = SETTINGS["default_output"][kind]
    job = {"type": kind, **job}
    if kind == "video":
        aspect, dur = [s.strip() for s in out.split("/")]
        job.setdefault("aspect", aspect)
        job.setdefault("duration", int(dur.rstrip("s")))
    else:
        job.setdefault("aspect", out)
    return job

def options(job):
    """(cost, model, provider, provider_model) for every usable choice, cheapest first."""
    names = [job["model"]] if job.get("model") else [
        n for n, m in MODELS.items() if m["type"] == job["type"] and m["quality"] >= LEVEL[SETTINGS["quality"]]]
    opts = []
    for n in names:
        m = MODELS.get(n) or sys.exit(f"unknown model {n!r}; see models.json")
        units = job["duration"] if m["unit"] == "second" else 1
        if n.startswith("veo"): units = 8  # Veo clips are a fixed 8 s
        for p, cfg in m["providers"].items():
            if key(p): opts.append((round(cfg["price"] * units, 4), n, p, cfg["model"]))
    return sorted(opts)

def plan(jobs):
    rows = []
    for i, job in enumerate(jobs):
        job = defaults(job)
        job.setdefault("name", f"job{i + 1}")
        opts = options(job)
        if not opts:
            rows.append((job, None)); continue
        if not SETTINGS["auto_pick_cheapest"] and job.get("provider"):
            opts = [o for o in opts if o[2] == job["provider"]] or opts
        rows.append((job, opts[0]))
    return rows

def check(rows, budget):
    total = sum(r[1][0] for r in rows if r[1])
    print(f"{'name':24} {'model':14} {'provider':10} {'cost':>7}")
    for job, pick in rows:
        print(f"{job['name'][:24]:24} " + (f"{pick[1]:14} {pick[2]:10} {pick[0]:7.3f}" if pick else
              f"{job.get('model', job['type']):14} {'-':10}  no key set for any provider"))
    left = SETTINGS["monthly_limit_usd"] - spent()
    print(f"\ntotal ≈ ${total:.3f} | request budget ${budget:.2f} | month spent ${spent():.2f}, left ${left:.2f}")
    problems = []
    if any(not r[1] for r in rows): problems.append("some jobs have no provider with a key")
    if total > budget: problems.append(f"over the request budget by ${total - budget:.3f}")
    if total > left and SETTINGS["hard_stop_at_limit"]: problems.append("over the monthly limit")
    for p in problems: print("STOP:", p)
    return not problems

# ---------- HTTP ----------

def http(url, body=None, headers=None, method=None, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data else "GET"),
                                 headers={"Content-Type": "application/json", **(headers or {})})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return r.read() if raw else json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:500]
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(5 * 2 ** attempt); continue
            raise RuntimeError(f"HTTP {e.code} from {url.split('?')[0]}: {msg}")

def b64file(path): return base64.b64encode(pathlib.Path(path).read_bytes()).decode()
def mime(path): return mimetypes.guess_type(str(path))[0] or "image/png"
def data_uri(path): return f"data:{mime(path)};base64,{b64file(path)}"

def poll(fn, every=5, limit=1200):
    t0 = time.time()
    while time.time() - t0 < limit:
        res = fn()
        if res is not None: return res
        time.sleep(every)
    raise RuntimeError("timed out waiting for the result")

# ---------- providers: each returns (bytes, extension) ----------

GAPI = "https://generativelanguage.googleapis.com/v1beta"

def google(job, model):
    h = {"x-goog-api-key": key("google")}
    if job["type"] == "video":
        inst = {"prompt": job["prompt"]}
        if job.get("image"): inst["image"] = {"bytesBase64Encoded": b64file(job["image"]), "mimeType": mime(job["image"])}
        op = http(f"{GAPI}/models/{model}:predictLongRunning", {"instances": [inst], "parameters": {"aspectRatio": job["aspect"]}}, h)
        done = poll(lambda: (r := http(f"{GAPI}/{op['name']}", headers=h)).get("done") and r, every=10)
        if "error" in done: raise RuntimeError(done["error"].get("message"))
        uri = done["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
        return http(uri, headers=h, raw=True), "mp4"
    if model.startswith("imagen"):
        res = http(f"{GAPI}/models/{model}:predict", {"instances": [{"prompt": job["prompt"]}],
                   "parameters": {"sampleCount": 1, "aspectRatio": job["aspect"]}}, h)
        return base64.b64decode(res["predictions"][0]["bytesBase64Encoded"]), "png"
    parts = [{"text": job["prompt"]}]
    if job.get("image"): parts.append({"inlineData": {"mimeType": mime(job["image"]), "data": b64file(job["image"])}})
    res = http(f"{GAPI}/models/{model}:generateContent", {"contents": [{"parts": parts}], "generationConfig": {
        "responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": job["aspect"]}}}, h)
    for p in res["candidates"][0]["content"]["parts"]:
        if "inlineData" in p: return base64.b64decode(p["inlineData"]["data"]), "png"
    raise RuntimeError("no image returned (prompt may have been blocked)")

def openai(job, model):
    if job.get("image"): raise RuntimeError("reference images are not wired up for openai; use gemini-image")
    size = {"16:9": "1536x1024", "9:16": "1024x1536"}.get(job["aspect"], "1024x1024")
    res = http("https://api.openai.com/v1/images/generations", {"model": model, "prompt": job["prompt"], "size": size},
               {"Authorization": f"Bearer {key('openai')}"})
    return base64.b64decode(res["data"][0]["b64_json"]), "png"

def fal(job, model):
    h = {"Authorization": f"Key {key('fal')}"}
    body = {"prompt": job["prompt"], "aspect_ratio": job["aspect"]}
    if job["type"] == "video": body["duration"] = str(job["duration"])
    if job.get("image"):
        body["image_url"] = data_uri(job["image"])
        model = model.replace("text-to-video", "image-to-video")
    q = http(f"https://queue.fal.run/{model}", body, h)
    poll(lambda: True if http(q["status_url"], headers=h).get("status") == "COMPLETED" else None)
    res = http(q["response_url"], headers=h)
    url = res["video"]["url"] if "video" in res else res["images"][0]["url"]
    return http(url, raw=True), "mp4" if "video" in res else url.rsplit(".", 1)[-1].split("?")[0] or "png"

def replicate(job, model):
    h = {"Authorization": f"Bearer {key('replicate')}", "Prefer": "wait"}
    inp = {"prompt": job["prompt"], "aspect_ratio": job["aspect"]}
    if job["type"] == "video": inp["duration"] = job["duration"]
    if job.get("image"): inp["image"] = data_uri(job["image"])
    p = http(f"https://api.replicate.com/v1/models/{model}/predictions", {"input": inp}, h)
    final = ("succeeded", "failed", "canceled")
    if p["status"] not in final:
        get = p["urls"]["get"]
        p = poll(lambda: r if (r := http(get, headers=h))["status"] in final else None)
    if p["status"] != "succeeded": raise RuntimeError(f"replicate: {p['status']} {p.get('error')}")
    url = p["output"][0] if isinstance(p["output"], list) else p["output"]
    return http(url, raw=True), url.rsplit(".", 1)[-1].split("?")[0]

PROVIDERS = {"google": google, "openai": openai, "fal": fal, "replicate": replicate}

# ---------- run ----------

def one(job, pick):
    cost, name, provider, pmodel = pick
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    try:
        blob, ext = PROVIDERS[provider](job, pmodel)
    except Exception as e:
        print(f"FAIL {job['name']}: {e}"); return 0.0
    out = OUT / f"{stamp}_{job['name']}.{ext}"
    out.write_bytes(blob)
    meta = {**job, "model": name, "provider": provider, "provider_model": pmodel, "cost_usd": cost, "file": out.name}
    out.with_suffix(".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    print(f"OK   {job['name']}: {out.relative_to(HERE)} (${cost:.3f})")
    return cost

def main():
    a = sys.argv[1:]
    if not a or a[0] not in ("status", "plan", "run"): sys.exit(__doc__)
    if a[0] == "status":
        for p, env in KEYS.items(): print(f"{p:10} {env:22} {'set' if key(p) else 'missing'}")
        print(f"month {month()}: spent ${spent():.2f} of ${SETTINGS['monthly_limit_usd']}"); return
    budget = float(a[a.index("--budget") + 1]) if "--budget" in a else SETTINGS["request_limit_usd"]
    jobs = json.loads(pathlib.Path(a[1]).read_text())
    rows = plan(jobs if isinstance(jobs, list) else [jobs])
    if not check(rows, budget): sys.exit(2)
    if a[0] == "plan": return
    OUT.mkdir(exist_ok=True)
    with ThreadPoolExecutor(SETTINGS["parallel_jobs"]) as ex:
        costs = list(ex.map(lambda r: one(*r), rows))
    add_spend(sum(costs))
    print(f"\nspent ≈ ${sum(costs):.3f}; month total ${spent():.2f}")

if __name__ == "__main__":
    main()
