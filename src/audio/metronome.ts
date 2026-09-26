import { getAudioContext } from './context'

// Schedule audio this many seconds ahead of real time
const LOOKAHEAD_S = 0.1
// Scheduler polling interval in ms
const TICK_MS = 25

export interface MetronomeCallbacks {
  onBeat:    (beatInMeasure: number) => void  // visual — fires near beat time via setTimeout
  onAdvance: () => void                       // visual chord advance — fires on downbeat
}

export class Metronome {
  bpm: number
  beatsPerChord: number

  private cb: MetronomeCallbacks
  private nextBeatTime = 0
  private beatCount    = 0
  private tickId: ReturnType<typeof setTimeout> | null = null
  running = false

  constructor(bpm: number, beatsPerChord: number, cb: MetronomeCallbacks) {
    this.bpm           = bpm
    this.beatsPerChord = beatsPerChord
    this.cb            = cb
  }

  start(): void {
    if (this.running) return
    this.running      = true
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    this.nextBeatTime = ctx.currentTime + 0.05
    this.beatCount    = 0
    this._tick()
  }

  stop(): void {
    this.running = false
    if (this.tickId !== null) { clearTimeout(this.tickId); this.tickId = null }
  }

  toggle(): void { this.running ? this.stop() : this.start() }

  updateCallbacks(cb: MetronomeCallbacks): void { this.cb = cb }

  private _tick(): void {
    if (!this.running) return
    const ctx = getAudioContext()

    while (this.nextBeatTime < ctx.currentTime + LOOKAHEAD_S) {
      const beatInMeasure = this.beatCount % this.beatsPerChord
      const isDownbeat    = beatInMeasure === 0

      // Precise audio scheduling
      this._scheduleClick(this.nextBeatTime, isDownbeat)

      // Visual callback timed to match the audio beat
      const delayMs = Math.max(0, (this.nextBeatTime - ctx.currentTime) * 1000)
      const beat    = beatInMeasure
      const adv     = isDownbeat
      setTimeout(() => {
        this.cb.onBeat(beat)
        if (adv) this.cb.onAdvance()
      }, delayMs)

      this.beatCount++
      this.nextBeatTime += 60 / this.bpm
    }

    this.tickId = setTimeout(() => this._tick(), TICK_MS)
  }

  private _scheduleClick(time: number, accent: boolean): void {
    const ctx  = getAudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = accent ? 1500 : 900
    gain.gain.setValueAtTime(accent ? 0.35 : 0.15, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035)

    osc.start(time)
    osc.stop(time + 0.04)
  }
}
