// Specialized Web Audio API synthesizer for Bamboo Dash: Temple Panda Run
// Procedural dynamic tempo-synced background soundtrack + instant low-latency game SFX

class PandaAudioEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false
  private isMusicPlaying: boolean = false
  private musicInterval: number | null = null
  private currentStep: number = 0
  private tempoBpm: number = 118
  private pentatonicNotes = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33] // D4, F4, G4, A4, C5, D5

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
    if (muted && this.isMusicPlaying) {
      this.stopMusic()
    }
  }

  public isSoundMuted(): boolean {
    return this.muted
  }

  // --- Dynamic Procedural Soundtrack ---
  public startMusic(speedFactor: number = 1.0) {
    if (this.muted || this.isMusicPlaying) return
    const ctx = this.getContext()
    if (!ctx) return

    this.isMusicPlaying = true
    this.currentStep = 0
    this.tempoBpm = Math.min(170, 115 * speedFactor)

    const stepDurationMs = (60 / this.tempoBpm / 2) * 1000 // 8th notes

    this.musicInterval = window.setInterval(() => {
      if (!this.isMusicPlaying || this.muted) return
      this.playMusicStep(this.currentStep)
      this.currentStep = (this.currentStep + 1) % 16
    }, stepDurationMs)
  }

  public updateMusicTempo(speedFactor: number) {
    if (!this.isMusicPlaying) return
    const newBpm = Math.min(175, 115 * speedFactor)
    if (Math.abs(newBpm - this.tempoBpm) > 4) {
      this.stopMusic()
      this.tempoBpm = newBpm
      this.startMusic(speedFactor)
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }
  }

  private playMusicStep(step: number) {
    const ctx = this.getContext()
    if (!ctx) return

    // 1. Woodblock / percussion beat on beats 0, 4, 8, 12
    if (step % 4 === 0) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    }

    // 2. Marimba bass pulse on 0, 6, 8, 14
    if (step === 0 || step === 6 || step === 8 || step === 14) {
      const bass = ctx.createOscillator()
      const bassGain = ctx.createGain()
      bass.type = 'sine'
      const freq = step === 0 || step === 6 ? 146.83 : 130.81 // D3, C3
      bass.frequency.setValueAtTime(freq, ctx.currentTime)
      bassGain.gain.setValueAtTime(0.08, ctx.currentTime)
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      bass.connect(bassGain)
      bassGain.connect(ctx.destination)
      bass.start()
      bass.stop(ctx.currentTime + 0.12)
    }

    // 3. Bamboo Kalimba melody pattern
    const melodyPattern = [0, -1, 2, -1, 3, 2, -1, 4, -1, 3, 2, 0, -1, 1, 2, -1]
    const noteIdx = melodyPattern[step]
    if (noteIdx !== -1) {
      const noteFreq = this.pentatonicNotes[noteIdx % this.pentatonicNotes.length]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(noteFreq, ctx.currentTime)
      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    }
  }

  // --- Sound Effects ---

  // Jump leap sound
  public playJump() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(260, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.18)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.22)
  }

  // Slide woosh
  public playSlide() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const bufferSize = ctx.sampleRate * 0.22
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.22)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()
    noise.stop(ctx.currentTime + 0.22)
  }

  // Bamboo collect chime
  public playCollectBamboo() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [659.25, 880.0, 1046.5] // E5, A5, C6
    const f = notes[Math.floor(Math.random() * notes.length)]

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, ctx.currentTime)

    gain.gain.setValueAtTime(0.14, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  }

  // Power-up activation fanfare
  public playPowerUp() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const chord = [523.25, 659.25, 783.99, 1046.5]
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05)
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.05)
      osc.stop(ctx.currentTime + i * 0.05 + 0.25)
    })
  }

  // Shield deflection
  public playShieldHit() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }

  // Crash / Game Over
  public playCrash() {
    if (this.muted) return
    this.stopMusic()
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.35)

    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  }

  // Quest milestone celebration
  public playQuestComplete() {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07)
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.28)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.07)
      osc.stop(ctx.currentTime + idx * 0.07 + 0.28)
    })
  }
}

export const pandaAudio = new PandaAudioEngine()
