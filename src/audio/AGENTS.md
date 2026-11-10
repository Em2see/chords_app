# Browser audio modules

`src/audio/` contains Web Audio and microphone side effects. Keep it separate from `src/theory/`. Schedule audible metronome beats against `AudioContext.currentTime`; timers may update the UI but must not fire stale callbacks after stop. Release microphone tracks and timers when detection ends. Handle denied permissions and suspended audio contexts without leaving the UI active.
