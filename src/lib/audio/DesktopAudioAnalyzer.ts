import type { IAudioSourceAdapter } from './types';

export class DesktopAudioAnalyzer implements IAudioSourceAdapter {
	private context: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private source: MediaStreamAudioSourceNode | null = null;
	private stream: MediaStream | null = null;
	private bins: Uint8Array<ArrayBuffer> = new Uint8Array(
		0
	) as Uint8Array<ArrayBuffer>;
	private smoothedBins: Float32Array = new Float32Array(0);
	private peak = 0;
	private fftSize: number;
	private smoothingTimeConstant: number;

	constructor(fftSize = 2048, smoothingTimeConstant = 0.8) {
		this.fftSize = fftSize;
		this.smoothingTimeConstant = smoothingTimeConstant;
	}

	setAnalysisConfig(fftSize: number, smoothingTimeConstant: number): void {
		this.fftSize = fftSize;
		this.smoothingTimeConstant = smoothingTimeConstant;

		if (!this.analyser) return;

		if (this.analyser.fftSize !== fftSize) {
			this.analyser.fftSize = fftSize;
			this.bins = new Uint8Array(
				this.analyser.frequencyBinCount
			) as Uint8Array<ArrayBuffer>;
			this.smoothedBins = new Float32Array(
				this.analyser.frequencyBinCount
			);
		}
		this.analyser.smoothingTimeConstant = smoothingTimeConstant;
	}

	async start(): Promise<void> {
		// Request with minimal video (1×1 @ 1fps) so audio capture is included.
		// Immediately stop the video track — we only need system audio.
		// Note: the browser sharing-indicator notification is a platform limitation
		// of getDisplayMedia and cannot be suppressed in a web context.
		const stream = await navigator.mediaDevices.getDisplayMedia({
			video: { width: 1, height: 1, frameRate: 1 },
			audio: {
				// Hints to prefer system audio over individual tab audio
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false
			}
		});

		const audioTracks = stream.getAudioTracks();

		// Stop video immediately — we only need audio
		stream.getVideoTracks().forEach(t => t.stop());

		if (audioTracks.length === 0) {
			stream.getTracks().forEach(t => t.stop());
			throw new Error('no-audio-track');
		}

		this.stream = new MediaStream([audioTracks[0]]);
		this.context = new AudioContext();
		this.analyser = this.context.createAnalyser();
		this.analyser.fftSize = this.fftSize;
		this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
		this.analyser.minDecibels = -90;
		this.analyser.maxDecibels = -10;

		this.source = this.context.createMediaStreamSource(this.stream);
		this.source.connect(this.analyser);

		const binCount = this.analyser.frequencyBinCount;
		this.bins = new Uint8Array(binCount) as Uint8Array<ArrayBuffer>;
		this.smoothedBins = new Float32Array(binCount);
	}

	stop(): void {
		this.source?.disconnect();
		this.stream?.getTracks().forEach(t => t.stop());
		this.context?.close();
		this.context = null;
		this.analyser = null;
		this.source = null;
		this.stream = null;
		this.peak = 0;
		this.bins = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
		this.smoothedBins = new Float32Array(0);
	}

	getFrequencyBins(): Uint8Array {
		if (!this.analyser || this.bins.length === 0) return this.bins;
		this.analyser.getByteFrequencyData(this.bins);
		// Apply extra smoothing on top of the analyser's built-in smoothing
		for (let i = 0; i < this.bins.length; i++) {
			this.smoothedBins[i] =
				this.smoothedBins[i] * 0.5 + this.bins[i] * 0.5;
		}
		return this.bins;
	}

	getAmplitude(): number {
		const bins = this.getFrequencyBins();
		if (bins.length === 0) return 0;
		let sum = 0;
		for (let i = 0; i < bins.length; i++) sum += bins[i];
		const avg = sum / bins.length / 255;
		this.peak = Math.max(this.peak * 0.98, avg);
		return avg;
	}

	getPeak(): number {
		return this.peak;
	}

	getBands(): { bass: number; mid: number; treble: number } {
		const bins = this.getFrequencyBins();
		if (bins.length === 0) return { bass: 0, mid: 0, treble: 0 };
		// Bass: bins 1–10 (~20–430 Hz at 44100 Hz, fftSize 2048)
		// Mid: bins 11–80 (~430–3440 Hz)
		// Treble: bins 81–200 (~3440–8600 Hz)
		// Peak detection: captures the loudest bin in each band for dramatic reactivity
		const peak = (start: number, end: number) => {
			let max = 0;
			for (let i = start; i < Math.min(end, bins.length); i++) {
				if (bins[i] > max) max = bins[i];
			}
			return max / 255;
		};
		return {
			bass: peak(1, 10),
			mid: peak(11, 80),
			treble: peak(81, 200)
		};
	}
}
