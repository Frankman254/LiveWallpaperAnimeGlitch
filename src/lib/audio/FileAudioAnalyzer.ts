import type { IAudioSourceAdapter } from './types';

export class FileAudioAnalyzer implements IAudioSourceAdapter {
	private file: File;
	private audioEl: HTMLAudioElement | null = null;
	private context: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private gainNode: GainNode | null = null;
	private source: MediaElementAudioSourceNode | null = null;
	private bins: Uint8Array<ArrayBuffer> = new Uint8Array(
		0
	) as Uint8Array<ArrayBuffer>;
	private timeDomainBins: Uint8Array<ArrayBuffer> = new Uint8Array(
		0
	) as Uint8Array<ArrayBuffer>;
	private peak = 0;
	private fftSize: number;
	private smoothing: number;
	private objectUrl = '';
	private paused = false;
	private onEndedCb: (() => void) | null = null;
	private restoreStartTimeSeconds = 0;
	private onPlaybackStateChange: ((playing: boolean) => void) | null = null;
	// Bound so they can be removed in stop(). Reflect the element's REAL state
	// to whoever is listening — this is what keeps the app store in sync when
	// the OS/browser drives the element directly via hardware media keys.
	private readonly handleElementPlay = () => {
		this.paused = false;
		this.onPlaybackStateChange?.(true);
	};
	private readonly handleElementPause = () => {
		this.paused = true;
		this.onPlaybackStateChange?.(false);
	};

	constructor(
		file: File,
		fftSize = 2048,
		smoothing = 0.8,
		onEnded?: () => void
	) {
		this.file = file;
		this.fftSize = fftSize;
		this.smoothing = smoothing;
		this.onEndedCb = onEnded ?? null;
	}

	/**
	 * Register a listener for the element's real play/pause transitions. Pass a
	 * single owner (the active source) only — never wire this to queued/crossfade
	 * analyzers, whose internal pauses are not user-facing.
	 */
	setOnPlaybackStateChange(cb: ((playing: boolean) => void) | null): void {
		this.onPlaybackStateChange = cb;
	}

	setAnalysisConfig(fftSize: number, smoothing: number): void {
		this.fftSize = fftSize;
		this.smoothing = smoothing;

		if (!this.analyser) return;

		if (this.analyser.fftSize !== fftSize) {
			this.analyser.fftSize = fftSize;
			this.bins = new Uint8Array(
				this.analyser.frequencyBinCount
			) as Uint8Array<ArrayBuffer>;
			this.timeDomainBins = new Uint8Array(
				this.analyser.fftSize
			) as Uint8Array<ArrayBuffer>;
		}
		this.analyser.smoothingTimeConstant = smoothing;
	}

	async start(): Promise<void> {
		try {
			this.objectUrl = URL.createObjectURL(this.file);
			this.audioEl = new Audio(this.objectUrl);
			this.audioEl.loop = false;
			this.paused = false;
			if (this.onEndedCb) {
				this.audioEl.addEventListener('ended', this.onEndedCb);
			}
			// Observe the element's real play/pause so native hardware media keys
			// (which control the element directly, bypassing the app commands) stay
			// reflected in the app's canonical playback state.
			this.audioEl.addEventListener('play', this.handleElementPlay);
			this.audioEl.addEventListener('pause', this.handleElementPause);

			this.context = new AudioContext();
			this.analyser = this.context.createAnalyser();
			this.analyser.fftSize = this.fftSize;
			this.analyser.smoothingTimeConstant = this.smoothing;
			this.analyser.minDecibels = -90;
			this.analyser.maxDecibels = -10;

			this.gainNode = this.context.createGain();
			this.gainNode.gain.value = 1.0;

			// graph: source → analyser → gainNode → speakers
			// analyser taps the raw signal regardless of volume
			this.source = this.context.createMediaElementSource(this.audioEl);
			this.source.connect(this.analyser);
			this.analyser.connect(this.gainNode);
			this.gainNode.connect(this.context.destination);

			this.bins = new Uint8Array(
				this.analyser.frequencyBinCount
			) as Uint8Array<ArrayBuffer>;
			this.timeDomainBins = new Uint8Array(
				this.analyser.fftSize
			) as Uint8Array<ArrayBuffer>;
			try {
				await this.audioEl.play();
			} catch {
				// Browsers may block autoplay on reload. Keep the analyser graph
				// alive so the file remains restored and the user can resume it.
				this.paused = true;
			}
		} catch (error) {
			this.stop();
			throw error;
		}
	}

	pause(): void {
		this.audioEl?.pause();
		this.paused = true;
	}

	resume(): void {
		void this.context?.resume();
		this.paused = false;
		this.audioEl
			?.play()
			.then(() => {
				this.paused = false;
			})
			.catch(() => {
				this.paused = true;
			});
	}

	seek(time: number): void {
		if (this.audioEl) {
			const nextTime = Math.max(0, time);
			this.restoreStartTimeSeconds = 0;
			this.audioEl.currentTime = nextTime;
		}
	}

	setRestoreStartTime(time: number): void {
		const nextTime = Math.max(0, time);
		this.restoreStartTimeSeconds = nextTime;
		if (this.audioEl) {
			this.audioEl.currentTime = nextTime;
		}
	}

	getCurrentTime(): number {
		return this.audioEl?.currentTime ?? 0;
	}

	getDuration(): number {
		const d = this.audioEl?.duration;
		return d && isFinite(d) ? d : 0;
	}

	setVolume(v: number): void {
		if (this.gainNode)
			this.gainNode.gain.value = Math.max(0, Math.min(1, v));
	}

	setLoop(v: boolean): void {
		if (this.audioEl) this.audioEl.loop = v;
	}

	getFileName(): string {
		return this.file.name;
	}

	getPlaybackState(): {
		contextState: AudioContextState | 'missing';
		elementPaused: boolean;
		currentTime: number;
		duration: number;
		readyState: number;
		ended: boolean;
	} {
		return {
			contextState: this.context?.state ?? 'missing',
			elementPaused: Boolean(this.audioEl?.paused),
			currentTime: this.audioEl?.currentTime ?? 0,
			duration: this.getDuration(),
			readyState: this.audioEl?.readyState ?? 0,
			ended: Boolean(this.audioEl?.ended)
		};
	}

	async ensurePlaybackActive(): Promise<boolean> {
		if (!this.audioEl || !this.context) return false;
		if (this.paused) return false;

		try {
			if (this.context.state === 'suspended') {
				await this.context.resume();
			}
		} catch {
			/* ignore */
		}

		const duration = this.getDuration();
		const current = this.audioEl.currentTime;
		const nearEnded =
			duration > 0 && current >= Math.max(0, duration - 0.25);
		const shouldRestorePosition =
			duration > 0 &&
			this.restoreStartTimeSeconds > 0 &&
			current <= 0.001 &&
			!nearEnded;

		if (shouldRestorePosition) {
			this.audioEl.currentTime = Math.min(
				this.restoreStartTimeSeconds,
				Math.max(0, duration - 0.1)
			);
		}

		if (this.audioEl.paused && !nearEnded) {
			try {
				await this.audioEl.play();
				this.paused = false;
				return true;
			} catch {
				return false;
			}
		}

		return this.context.state === 'running' && !this.audioEl.paused;
	}

	stop(): void {
		// Detach observers BEFORE pausing so teardown doesn't emit a spurious
		// "paused" transition to the app store.
		this.onPlaybackStateChange = null;
		if (this.audioEl) {
			if (this.onEndedCb) {
				this.audioEl.removeEventListener('ended', this.onEndedCb);
			}
			this.audioEl.removeEventListener('play', this.handleElementPlay);
			this.audioEl.removeEventListener('pause', this.handleElementPause);
			this.audioEl.pause();
			this.audioEl.src = '';
			this.audioEl = null;
		}
		if (this.objectUrl) {
			URL.revokeObjectURL(this.objectUrl);
			this.objectUrl = '';
		}
		try {
			this.source?.disconnect();
		} catch {
			/* ignore */
		}
		try {
			this.gainNode?.disconnect();
		} catch {
			/* ignore */
		}
		void this.context?.close();
		this.context = null;
		this.analyser = null;
		this.gainNode = null;
		this.source = null;
		this.peak = 0;
		this.paused = false;
		this.restoreStartTimeSeconds = 0;
		this.bins = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
		this.timeDomainBins = new Uint8Array(0) as Uint8Array<ArrayBuffer>;
	}

	isPaused(): boolean {
		return this.paused || Boolean(this.audioEl?.paused);
	}

	getFrequencyBins(): Uint8Array {
		if (!this.analyser || this.bins.length === 0) return this.bins;
		this.analyser.getByteFrequencyData(this.bins);
		return this.bins;
	}

	getTimeDomainBins(): Uint8Array {
		if (!this.analyser || this.timeDomainBins.length === 0) {
			return this.timeDomainBins;
		}
		this.analyser.getByteTimeDomainData(this.timeDomainBins);
		return this.timeDomainBins;
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
