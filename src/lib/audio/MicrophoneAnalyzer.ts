import type { IAudioSourceAdapter } from './types'

export class MicrophoneAnalyzer implements IAudioSourceAdapter {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private bins: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>
  private peak = 0
  private fftSize: number
  private smoothingTimeConstant: number

  constructor(fftSize = 2048, smoothingTimeConstant = 0.8) {
    this.fftSize = fftSize
    this.smoothingTimeConstant = smoothingTimeConstant
  }

  setAnalysisConfig(fftSize: number, smoothingTimeConstant: number): void {
    this.fftSize = fftSize
    this.smoothingTimeConstant = smoothingTimeConstant

    if (!this.analyser) return

    if (this.analyser.fftSize !== fftSize) {
      this.analyser.fftSize = fftSize
      this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }
    this.analyser.smoothingTimeConstant = smoothingTimeConstant
  }

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

    this.stream = stream
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    this.source = this.context.createMediaStreamSource(stream)
    this.source.connect(this.analyser)

    const binCount = this.analyser.frequencyBinCount
    this.bins = new Uint8Array(binCount) as Uint8Array<ArrayBuffer>
  }

  stop(): void {
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.context?.close()
    this.context = null
    this.analyser = null
    this.source = null
    this.stream = null
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
    // Peak detection: captures the loudest bin in each band for dramatic reactivity
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
