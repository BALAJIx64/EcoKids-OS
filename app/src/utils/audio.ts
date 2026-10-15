// Web Audio API procedural sound synthesizer for EcoKids OS
// Zero external audio network requests; immediate low-latency feedback.

class SoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public setMuted(muted: boolean) {
    this.muted = muted
  }

  public isMuted(): boolean {
    return this.muted
  }

  // Soft UI tap sound
  public playTap() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.06)

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.06)
  }

  // Success chime (arpeggio)
  public playSuccess() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07)

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.07 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + i * 0.07)
      osc.stop(ctx.currentTime + i * 0.07 + 0.28)
    })
  }

  // Gentle error pulse (not harsh for children)
  public playError() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }

  // Liquid water drop sound for Water Guardian
  public playWaterDrop() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.14)
  }

  // Electric click / switch for Energy Detective
  public playSwitch() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(900, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }

  // Leaf rustle / plant sound for Forest Guardian
  public playLeafRustle() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.18
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1800, ctx.currentTime)
    filter.Q.setValueAtTime(3, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()
    noise.stop(ctx.currentTime + 0.18)
  }

  // Celebratory victory fanfare
  public playFanfare() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.12 },
      { f: 783.99, d: 0.12, t: 0.24 },
      { f: 1046.5, d: 0.35, t: 0.36 },
      { f: 880.0, d: 0.15, t: 0.72 },
      { f: 1046.5, d: 0.6, t: 0.88 },
    ]

    melody.forEach((note) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.t)

      gain.gain.setValueAtTime(0, ctx.currentTime + note.t)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.t + note.d)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + note.t)
      osc.stop(ctx.currentTime + note.t + note.d)
    })
  }
}

export const sound = new SoundEngine()
