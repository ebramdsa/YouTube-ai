// Shared timeline for the Cannae cold open: shot boundaries, narration line starts, SFX hits.
globalThis.CUES = {
  duration: 38,
  shots: [0, 5.0, 12.2, 15.0, 19.4, 22.6, 29.0, 33.5],
  lines: [0.6, 5.2, 12.4, 15.2, 19.6, 22.8, 26.0, 27.3, 29.4],
  thumps: [1.0, 2.8, 12.6, 18.0, 21.0, 24.9, 26.5, 27.9, 30.9, 31.2, 31.5, 33.7],
};
if (typeof module !== 'undefined') module.exports = globalThis.CUES;
