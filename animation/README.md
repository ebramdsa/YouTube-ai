# Animation pipeline

Scenes are HTML/SVG files that expose `window.render(t)` (t = seconds).
`render.js` steps through time with headless Chromium and pipes frames to ffmpeg.

```
node render.js poc/scene.html poc/test-cannae.mp4 6 24
```
