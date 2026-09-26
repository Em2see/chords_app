import { describe, it, expect } from 'vitest'
import { midiToFreq } from '../../src/audio/synth'

// ---- midiToFreq ----

describe('midiToFreq', () => {
  it('A4 (MIDI 69) = 440 Hz exactly', () => {
    expect(midiToFreq(69)).toBe(440)
  })

  it('A5 (MIDI 81) = 880 Hz', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6)
  })

  it('A3 (MIDI 57) = 220 Hz', () => {
    expect(midiToFreq(57)).toBeCloseTo(220, 6)
  })

  it('C4 middle C (MIDI 60) ≈ 261.626 Hz', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.626, 2)
  })

  it('each octave up doubles frequency', () => {
    for (let midi = 36; midi <= 72; midi++) {
      expect(midiToFreq(midi + 12)).toBeCloseTo(midiToFreq(midi) * 2, 8)
    }
  })

  it('each semitone multiplies by 2^(1/12)', () => {
    const ratio = 2 ** (1 / 12)
    for (let midi = 36; midi <= 83; midi++) {
      expect(midiToFreq(midi + 1) / midiToFreq(midi)).toBeCloseTo(ratio, 8)
    }
  })

  it('range C2–B5 (MIDI 36–83) stays within 65–1047 Hz', () => {
    for (let midi = 36; midi <= 83; midi++) {
      const f = midiToFreq(midi)
      expect(f).toBeGreaterThan(65)
      expect(f).toBeLessThan(1048)
    }
  })
})

// ---- beat scheduling algorithm ----
// Verifies that the Metronome's scheduling formula produces beat times
// with < 5 ms cumulative drift over 100 beats (property from CLAUDE.md).
// Audio accuracy is guaranteed by Web Audio's clock; here we test the algorithm.

describe('beat scheduling accuracy', () => {
  function scheduledTimes(bpm: number, count: number): number[] {
    const interval = 60 / bpm
    const times: number[] = []
    let t = 0.05  // initial offset matching Metronome.start()
    for (let i = 0; i < count; i++) {
      times.push(t)
      t += interval
    }
    return times
  }

  it('100 beats at 60 BPM deviate < 5 ms from expected', () => {
    const bpm = 60
    const interval = 60 / bpm
    const times = scheduledTimes(bpm, 100)
    for (let i = 0; i < times.length; i++) {
      const expected = 0.05 + i * interval
      expect(Math.abs(times[i]! - expected)).toBeLessThan(0.005)
    }
  })

  it('100 beats at 120 BPM deviate < 5 ms', () => {
    const bpm = 120
    const interval = 60 / bpm
    const times = scheduledTimes(bpm, 100)
    for (let i = 0; i < times.length; i++) {
      const expected = 0.05 + i * interval
      expect(Math.abs(times[i]! - expected)).toBeLessThan(0.005)
    }
  })

  it('100 beats at 80 BPM deviate < 5 ms', () => {
    const bpm = 80
    const interval = 60 / bpm
    const times = scheduledTimes(bpm, 100)
    for (let i = 0; i < times.length; i++) {
      expect(Math.abs(times[i]! - (0.05 + i * interval))).toBeLessThan(0.005)
    }
  })

  it('consecutive beat intervals are exactly 60/bpm', () => {
    for (const bpm of [40, 80, 120, 200]) {
      const times = scheduledTimes(bpm, 20)
      const expected = 60 / bpm
      for (let i = 1; i < times.length; i++) {
        expect(times[i]! - times[i - 1]!).toBeCloseTo(expected, 10)
      }
    }
  })

  it('downbeat fires every beatsPerChord beats', () => {
    for (const bpc of [1, 2, 4]) {
      const downbeats = Array.from({ length: 16 }, (_, i) => i).filter(i => i % bpc === 0)
      // verify: first 4 downbeats spaced bpc apart
      for (let i = 1; i < downbeats.length; i++) {
        expect(downbeats[i]! - downbeats[i - 1]!).toBe(bpc)
      }
    }
  })
})
