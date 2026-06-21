export interface IAudioSourceAdapter {
	start(): Promise<void>;
	stop(): void;
	setAnalysisConfig?(fftSize: number, smoothing: number): void;
	getFrequencyBins(): Uint8Array;
	/**
	 * Time-domain waveform samples (0–255, centered around 128 = silence).
	 * Returns an empty buffer when the source isn't running. Optional because
	 * not every adapter (e.g. cross-tab remote replicas) has live PCM access.
	 */
	getTimeDomainBins?(): Uint8Array;
	getAmplitude(): number;
	getPeak(): number;
	getBands(): { bass: number; mid: number; treble: number };
	pause?(): void;
	resume?(): void;
	/**
	 * Observe the source's real play/pause transitions (e.g. from native OS
	 * media keys driving the underlying element). The app store subscribes to
	 * this so canonical playback state can never diverge from reality.
	 */
	setOnPlaybackStateChange?(cb: ((playing: boolean) => void) | null): void;
	seek?(time: number): void;
	getCurrentTime?(): number;
	getDuration?(): number;
	setVolume?(v: number): void;
	setLoop?(v: boolean): void;
	getFileName?(): string;
}
