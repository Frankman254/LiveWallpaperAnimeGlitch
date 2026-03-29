import type { IAudioSourceAdapter } from './types'

export class FileAudioAnalyzer implements IAudioSourceAdapter {
  private file: File
  private audioEl: HTMLAudioElement | null = null
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private bins: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>
  private peak = 0
  private fftSize: number
  private smoothing: number
  private objectUrl = ''

  constructor(file: File, fftSize = 2048, smoothing = 0.8) {
    this.file = file
    this.fftSize = fftSize
    this.smoothing = smoothing
  }

  setAnalysisConfig(fftSize: number, smoothing: number): void {
    this.fftSize = fftSize
    this.smoothing = smoothing

    if (!this.analyser) return

    if (this.analyser.fftSize !== fftSize) {
      this.analyser.fftSize = fftSize
      this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }
    this.analyser.smoothingTimeConstant = smoothing
  }

  async start(): Promise<void> {
    this.objectUrl = URL.createObjectURL(this.file)
    this.audioEl = new Audio(this.objectUrl)
    this.audioEl.loop = true

    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = this.smoothing
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    this.gainNode = this.context.createGain()
    this.gainNode.gain.value = 1.0

    // graph: source → analyser → gainNode → speakers
    // analyser taps the raw signal regardless of volume
    this.source = this.context.createMediaElementSource(this.audioEl)
    this.source.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.context.destination)

    this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    await this.audioEl.play()
  }

  pause(): void {
    this.audioEl?.pause()
  }

  resume(): void {
    void this.context?.resume()
    this.audioEl?.play().catch(() => {})
  }

  seek(time: number): void {
    if (this.audioEl) this.audioEl.currentTime = Math.max(0, time)
  }

  getCurrentTime(): number {
    return this.audioEl?.currentTime ?? 0
  }

  getDuration(): number {
    const d = this.audioEl?.duration
    return d && isFinite(d) ? d : 0
  }

  setVolume(v: number): void {
    if (this.gainNode) this.gainNode.gain.value = Math.max(0, Math.min(1, v))
  }

  setLoop(v: boolean): void {
    if (this.audioEl) this.audioEl.loop = v
  }

  getFileName(): string {
    return this.file.name
  }

  stop(): void {
    if (this.audioEl) {
      this.audioEl.pause()
      this.audioEl.src = ''
      this.audioEl = null
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = ''
    }
    try { this.source?.disconnect() } catch { /* ignore */ }
    this.gainNode?.disconnect()
    void this.context?.close()
    this.context = null
    this.analyser = null
    this.gainNode = null
    this.source = null
    this.peak = 0
    this.bins = new Uint8Array(0) as Uint8Array<ArrayBuffer>
  }

  getFrequencyBins(): Uint8Array {
    if (!this.analyser || this.bins.length === 0) return this.bins
    this.analyser.getByteFrequencyData(this.bins)
    return this.bins
  }

  getAmplitude(): number {
    const bins = this.getFrequencyBins()
    if (bins.length === 0) return 0
    let sum = 0
    for (let i = 0; i < bins.length; i++) sum += bins[i]
    const avg = sum / bins.length / 255
    this.peak = Math.max(this.peak * 0.98, avg)
    return avg
  }

  getPeak(): number {
    return this.peak
  }

  getBands(): { bass: number; mid: number; treble: number } {
    const bins = this.getFrequencyBins()
    if (bins.length === 0) return { bass: 0, mid: 0, treble: 0 }
    const peak = (start: number, end: number) => {
      let max = 0
      for (let i = start; i < Math.min(end, bins.length); i++) {
        if (bins[i] > max) max = bins[i]
      }
      return max / 255
    }
    return {
      bass: peak(1, 10),
      mid: peak(11, 80),
      treble: peak(81, 200),
    }
  }
}
