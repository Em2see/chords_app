import { getAudioContext } from './context'

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function scheduleNote(
  ctx: AudioContext,
  freq: number,
  when: number,
  duration: number,
  peak: number,
): void {
  const osc  = ctx.createOscillator()
  const env  = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.value = freq

  // Short attack, exponential decay
  env.gain.setValueAtTime(0, when)
  env.gain.linearRampToValueAtTime(peak, when + 0.006)
  env.gain.exponentialRampToValueAtTime(peak * 0.35, when + 0.12)
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration)

  osc.connect(env)
  env.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration + 0.05)
}

export function playChord(
  midis: readonly number[],
  opts: { volume?: number; duration?: number; when?: number } = {},
): void {
  if (midis.length === 0) return
  const ctx      = getAudioContext()
  const when     = opts.when    ?? ctx.currentTime
  const duration = opts.duration ?? 2.0
  // Equal-power mix: divide peak gain by √N so total RMS is constant
  const peak = (opts.volume ?? 0.45) / Math.sqrt(midis.length)

  for (const midi of midis) {
    scheduleNote(ctx, midiToFreq(midi), when, duration, peak)
  }
}
