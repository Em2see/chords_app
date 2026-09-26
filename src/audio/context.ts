let ctx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

// Call once at boot — resumes AudioContext on the first user gesture (needed for iOS Safari)
export function unlockAudio(): void {
  const resume = () => {
    const c = getAudioContext()
    if (c.state === 'suspended') void c.resume()
  }
  document.addEventListener('touchstart',  resume, { passive: true, once: true })
  document.addEventListener('pointerdown', resume, { once: true })
}
