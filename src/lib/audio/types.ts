export interface IAudioSourceAdapter {
  start(): Promise<void>
  stop(): void
  getFrequencyBins(): Uint8Array
  getAmplitude(): number
  getPeak(): number
  getBands(): { bass: number; mid: number; treble: number }
}
