export interface IAudioSourceAdapter {
	start(): Promise<void>;
	stop(): void;
	setAnalysisConfig?(fftSize: number, smoothing: number): void;
	getFrequencyBins(): Uint8Array;
	getAmplitude(): number;
	getPeak(): number;
	getBands(): { bass: number; mid: number; treble: number };
	pause?(): void;
	resume?(): void;
	seek?(time: number): void;
	getCurrentTime?(): number;
	getDuration?(): number;
	setVolume?(v: number): void;
	setLoop?(v: boolean): void;
	getFileName?(): string;
}
