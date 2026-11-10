import { getAudioContext } from './context'

// Frequency range to detect: C2 (65 Hz) – B5 (988 Hz), with margins
const MIN_FREQ = 58
const MAX_FREQ = 1050

// Minimum RMS to consider non-silence (0–1 scale)
const RMS_THRESHOLD = 0.012

// HPS: how many harmonics to multiply (2 = fundamental × 2nd harmonic)
const HPS_HARMONICS = 3

// Don't re-fire the same MIDI within this many ms
const DEBOUNCE_MS = 250

// Pitch detection via Harmonic Product Spectrum on AnalyserNode FFT data.
// More robust than raw autocorrelation for piano because harmonics reinforce
// the fundamental rather than creating octave-doubling artefacts.
export function detectPitchFromAnalyser(analyser: AnalyserNode): number | null {
  const sampleRate = analyser.context.sampleRate
  const fftSize    = analyser.fftSize  // 4096
  const binHz      = sampleRate / fftSize
  const n          = analyser.frequencyBinCount  // fftSize / 2 = 2048

  const dbs = new Float32Array(n)
  analyser.getFloatFrequencyData(dbs)

  // Convert dB → linear, compute RMS proxy (max power)
  const power = new Float32Array(n)
  let maxPow = 0
  for (let i = 0; i < n; i++) {
    const p = Math.pow(10, (dbs[i]! + 140) / 20)  // +140 offset: values are typically -100..0 dB
    power[i] = p
    if (p > maxPow) maxPow = p
  }
  if (maxPow < RMS_THRESHOLD * 1e7) return null  // silence

  const minBin = Math.max(1, Math.floor(MIN_FREQ / binHz))
  const maxBin = Math.min(Math.floor(n / HPS_HARMONICS) - 1, Math.ceil(MAX_FREQ / binHz))

  // Harmonic Product Spectrum: multiply power at bin, bin*2, bin*3, ...
  let peakBin = minBin
  let peakVal = 0
  for (let b = minBin; b <= maxBin; b++) {
    let prod = power[b]!
    for (let h = 2; h <= HPS_HARMONICS; h++) {
      prod *= power[b * h] ?? 0
    }
    if (prod > peakVal) { peakVal = prod; peakBin = b }
  }

  // Parabolic interpolation for sub-bin accuracy
  const yL = peakBin > minBin ? (power[peakBin - 1]! || 0) : peakVal
  const yR = peakBin < maxBin ? (power[peakBin + 1]! || 0) : peakVal
  const denom = 2 * peakVal - yL - yR
  const refined = denom > 0 ? peakBin + (yL - yR) / (2 * denom) : peakBin

  return refined * binHz
}

export function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440))
}

// Start microphone pitch detection.
// onNote receives the detected MIDI number (36–83 = C2–B5).
// Returns a stop() function, or null if permission was denied.
export async function startMic(
  onNote: (midi: number) => void,
): Promise<(() => void) | null> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  } catch {
    return null
  }

  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume()

  const source   = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 4096
  analyser.smoothingTimeConstant = 0.6
  source.connect(analyser)

  let lastMidi = -1
  let lastFire = 0

  const id = setInterval(() => {
    const freq = detectPitchFromAnalyser(analyser)
    if (freq === null) { lastMidi = -1; return }

    const midi = freqToMidi(freq)
    if (midi < 36 || midi > 83) return

    const now = Date.now()
    if (midi === lastMidi && now - lastFire < DEBOUNCE_MS) return

    lastMidi = midi
    lastFire = now
    onNote(midi)
  }, 80)

  return () => {
    clearInterval(id)
    source.disconnect()
    for (const t of stream.getTracks()) t.stop()
  }
}
