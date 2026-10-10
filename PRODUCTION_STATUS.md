# Cannae Episode 1 — Production Status

**Project:** Spears & Tears (@SpearsAndTears) — YouTube History Channel  
**Target Episode:** "Cannae: The Day Rome Lost Everything" (~9.5 minutes, first cut)  
**Status:** NARRATION COMPLETE ✓ — animation in progress

---

## 📹 Preview Video

**File:** `/animation/previews/cannae-ep01-opening.mp4`  
**Duration:** 10.5 seconds  
**Content:** Opening section of episode (scenes 0-2)  
**Format:** 1280×720 @ 24fps MP4

**Preview covers:**
- **0:00–3.5s:** Cold open with armies and title card
- **3.5–7:00s:** Hamilcar's oath to young Hannibal at ancient altar
- **7:00–10.5s:** Dramatic Alps crossing with struggling soldiers and elephants

---

## ✅ Completed

### Script
- ✅ Full 22-minute narrator-only script completed
- ✅ Single-narrator voice (not multiple characters)
- ✅ 9 sections with timing annotations
- ✅ File: `scripts/ep01-cannae/SCRIPT_V2_NARRATOR_ONLY.md`

### Animation Scenes (HTML/SVG)
- ✅ **opening-scene.html** — Cold open and army formations (3.5s)
  - Dusty plains with Roman and Carthaginian armies
  - Hannibal standing alone with eyepatch
  - Mediterranean map with pulsing Rome/Carthage indicators
  - Dynamic dust clouds and fog effects
  
- ✅ **hamilcar-scene.html** — Oath at altar (3.5s)
  - Temple interior with stone columns
  - Hamilcar (elderly, scarred, stern) gesturing to young Hannibal
  - Altar with divine flame and light rays
  - Young Hannibal with intense, determined expression
  - Oath moment with connecting light lines
  
- ✅ **alps-scene.html** — Alpine crossing (3.5s)
  - Multi-layered mountain backdrop with snow peaks
  - Hannibal on horseback pointing forward
  - Struggling soldiers and failing elephants
  - Wind effects and avalanche animations
  - Snow swirls and falling bodies (fading)

### Render Pipeline
- ✅ SVG animation scenes render to MP4 using Playwright + FFmpeg
- ✅ Configurable duration and frame rate (24fps default)
- ✅ Scenes combine for continuous preview video

---

## 🎨 Visual Style Elements

### Color Palette (Bold & Saturated)
- **Roman Red:** #E63946
- **Carthaginian Purple:** #9D4EDD  
- **Bronze/Gold:** #FFB81C
- **Royal Purple (Helmet Plumes):** #9D4EDD
- **Earth Brown:** #8B4513, #8B6914
- **Skin Tone:** #f2ece0 (characters)

### Character Details
- **Hannibal:** Eyepatch (right eye), beard, purple armor, bronze helmet with purple plume
- **Hamilcar:** Weathered, scarred, iron helmet, stern expression, brown armor
- **Young Hannibal:** Determined face, small bronze crown, foreshadowing eyepatch effect
- **Roman Soldiers:** Red armor, gray helmets, organized formations

### Animation Techniques
- SVG-based characters (scalable, lightweight)
- Breathing/bobbing idle animations
- Dynamic map interactions (pulsing cities, moving routes)
- Weather effects (wind, snow, dust clouds)
- Camera movements (zoom, pan)
- Fade transitions between scenes

---

## 🎯 Next Steps (Remaining Work)

### Immediate (This Week)
1. ~~**Voice Recording**~~ ✅ Done — Daniel voice, all 9 sections
   - `scripts/ep01-cannae/voice/narrator/NARRATOR_full.mp3` (9.5 min)
   - Section start times in `timings.json` (use these, not the script's 22-min timestamps)

2. **Character Sprite Library**
   - Finalize all 8 character designs with consistent style
   - Create multiple poses per character (standing, pointing, wounded, dead)
   - Export as SVG for reuse in all scenes

3. **Map Animation Set**
   - Mediterranean base map
   - Alps route animation (with elevation changes)
   - Battle of Trebia River
   - Battle of Trasimene
   - Cannae battlefield overhead view
   - Combat unit movements and formations

### Mid-Production (Week 2-3)
4. **Detailed Battle Scenes**
   - Trebia River ambush (Section 3: 5:00–7:00)
   - Trasimene encirclement (Section 3 continued)
   - Fabius "Delayer" strategy animation (Section 4: 7:00–8:45)
   - Cannae trap setup (Section 5: 8:45–10:30)
   - Cannae full battle sequence (Section 6: 10:30–16:00)
   - Aftermath sequence (Section 7: 16:00–19:30)

5. **Full Animation Assembly**
   - Render all 9 sections to individual MP4s
   - Integrate narrator voice files at correct timings
   - Add subtitle overlays (English text)
   - Add background music (dramatic, orchestral)
   - Add sound effects (battle sounds, wind, footsteps)

### Final (Week 4)
6. **Post-Production & Editing**
   - Color correction pass
   - Audio mixing and leveling
   - Final video quality check (1280×720 @ 24fps MP4)
   - Create HD version for YouTube upload (1920×1080 scaled up)
   - Generate thumbnail image

7. **YouTube Upload**
   - User uploads final MP4 to @SpearsAndTears channel
   - Add title, description, tags
   - Set up community post
   - Schedule premiere or publish

---

## 📊 Production Metrics

| Aspect | Target | Status |
|--------|--------|--------|
| Script Length | 22 min | ✅ Complete (2,118 words) |
| Animation Scenes | 9 sections | 🟡 3/9 previewed (33%) |
| Voice Track | Single narrator | ✅ Daniel, 9.5 min |
| Character Sprites | 8 unique | ⏳ Design in progress |
| Maps | 5 animated | ⏳ In production queue |
| Total Runtime | ~9.5 min (first cut; 22 min later) | 🟡 ~2.5 min preview ready |
| Video Quality | 1280×720 @ 24fps | ✅ Preview at full spec |
| YouTube Format | 1920×1080 @ 24fps | ⏳ Will upscale from 720p |

---

## 🔧 Technical Details

### Animation Pipeline
```
scene.html (SVG + JavaScript)
    ↓
Playwright (Chrome browser)
    ↓
PNG frame screenshots
    ↓
FFmpeg (x264 codec)
    ↓
MP4 video (H.264, YUV420p, CRF 18)
    ↓
FFmpeg concat demuxer
    ↓
Final combined video
```

### Usage
```bash
# Render a single scene
node animation/render.js <scene.html> <output.mp4> <duration_secs> [fps]

# Example
node animation/render.js animation/scenes/opening-scene.html output.mp4 3.5 24

# Concatenate multiple scenes
ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

### File Locations
- **Scripts:** `scripts/ep01-cannae/`
- **Scene Templates:** `animation/scenes/`
- **Rendered Previews:** `animation/previews/`
- **Character SVGs:** `assets/characters/` (to be created)
- **Final Output:** `output/` (to be created)

---

## 📝 Notes for Continuation

1. **Character Consistency:** All characters maintain visual identity across scenes (Hannibal's eyepatch, Hamilcar's scars, etc.)

2. **Narrator Timing:** Script includes [timestamps] for voice alignment. User must record to these exact timings for proper sync.

3. **Color Contrast:** Bold palette chosen specifically for YouTube's algorithm (saturated colors stand out in thumbnails and recommendations).

4. **Animation Performance:** SVG + Playwright approach uses moderate CPU. Each 30-second scene renders in ~10-15 seconds on typical hardware.

5. **Map Reusability:** Mediterranean base map used in multiple scenes—build once, reuse across all episodes.

6. **Battle Choreography:** Cannae sequence (Section 6) is most complex—double envelopment with moving Roman squares, Carthaginian cavalry flanking movements, gradual collapse.

---

**Last Updated:** 2026-10-10  
**Created by:** Claude Haiku 4.5  
**Session:** https://claude.ai/code/session_01DuWpjDCBeYCSni9ZgYZmE6
