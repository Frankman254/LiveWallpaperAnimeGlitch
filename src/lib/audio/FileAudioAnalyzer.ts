import type { IAudioSourceAdapter } from './types'

export class FileAudioAnalyzer implements IAudioSourceAdapter {
  private file: File
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private bins: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>
  private peak = 0

  constructor(file: File) {
    this.file = file
  }

  async start(): Promise<void> {
    const arrayBuffer = await this.file.arrayBuffer()
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
    this.source = this.context.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.loop = true

    this.source.connect(this.analyser)
    this.analyser.connect(this.context.destination)

    this.source.start(0)
    this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
  }

  stop(): void {
    try { this.source?.stop() } catch { /* already stopped */ }
    this.source?.disconnect()
    this.context?.close()
    this.context = null
    this.analyser = null
    this.source = null
    this.peak = 0
    this.bins = new Uint8Array(0)
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
