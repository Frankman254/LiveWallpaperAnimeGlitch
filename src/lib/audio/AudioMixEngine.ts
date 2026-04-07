import { FileAudioAnalyzer } from './FileAudioAnalyzer';

export type MixEngineCallbacks = {
	/** Called when the active track ends naturally (no crossfade was queued). */
	onTrackEnd: () => void;
	/**
	 * Called when a crossfade completes and the previously-queued track is now
	 * the active track. The engine has already swapped tracks internally.
	 */
	onCrossfadeComplete: (newActiveId: string) => void;
};

type LoadedTrack = {
	id: string;
	analyzer: FileAudioAnalyzer;
	/** Target/base volume for this track (0–1). */
	baseVolume: number;
};

/**
 * AudioMixEngine — manages up to two FileAudioAnalyzers simultaneously and
 * handles crossfade transitions between them.
 *
 * The caller is responsible for:
 *  - Loading blobs from IndexedDB
 *  - Calling `tick()` every animation frame while capture is active
 *  - Reacting to `onTrackEnd` / `onCrossfadeComplete` to advance the playlist
 */
export class AudioMixEngine {
	private active: LoadedTrack | null = null;
	private queued: LoadedTrack | null = null;

	private crossfadeEnabled = false;
	private crossfadeDurationMs = 3000;
	private isCrossfading = false;
	private crossfadeStartMs = 0;

	private fftSize: number;
	private smoothing: number;
	private callbacks: MixEngineCallbacks;

	constructor(
		callbacks: MixEngineCallbacks,
		fftSize = 2048,
		smoothing = 0.8
	) {
		this.callbacks = callbacks;
		this.fftSize = fftSize;
		this.smoothing = smoothing;
	}

	// ── Configuration ─────────────────────────────────────────────────────────

	setAnalysisConfig(fftSize: number, smoothing: number): void {
		this.fftSize = fftSize;
		this.smoothing = smoothing;
		this.active?.analyzer.setAnalysisConfig?.(fftSize, smoothing);
		this.queued?.analyzer.setAnalysisConfig?.(fftSize, smoothing);
	}

	setCrossfadeConfig(enabled: boolean, durationSeconds: number): void {
		this.crossfadeEnabled = enabled;
		this.crossfadeDurationMs = Math.max(0.5, durationSeconds) * 1000;
	}

	// ── Track loading ──────────────────────────────────────────────────────────

	/**
	 * Load a track as the active/playing track.
	 * Any previously active or queued tracks are stopped first.
	 */
	async loadActiveTrack(
		id: string,
		file: File,
		volume: number,
		loop: boolean
	): Promise<void> {
		this.stopQueued();
		this.stopActive();
		this.isCrossfading = false;

		const onEnded = () => this.callbacks.onTrackEnd();
		const analyzer = new FileAudioAnalyzer(
			file,
			this.fftSize,
			this.smoothing,
			onEnded
		);
		analyzer.setLoop(loop);
		await analyzer.start();
		analyzer.setVolume(volume);
		this.active = { id, analyzer, baseVolume: volume };
	}

	/**
	 * Load a track as the queued/next track for crossfade.
	 * It starts paused at volume 0 — the engine will resume it when crossfade begins.
	 * Any previously queued track is replaced.
	 */
	async preloadQueuedTrack(
		id: string,
		file: File,
		volume: number,
		loop: boolean
	): Promise<void> {
		this.stopQueued();
		// No onEnded for queued tracks — they get onEnded attached after promotion
		const analyzer = new FileAudioAnalyzer(file, this.fftSize, this.smoothing);
		analyzer.setLoop(loop);
		await analyzer.start();
		analyzer.pause();
		analyzer.setVolume(0);
		this.queued = { id, analyzer, baseVolume: volume };
	}

	// ── Tick (call every animation frame) ─────────────────────────────────────

	tick(): void {
		this.maybeStartCrossfade();
		this.updateCrossfadeVolumes();
	}

	private maybeStartCrossfade(): void {
		if (
			!this.crossfadeEnabled ||
			!this.active ||
			!this.queued ||
			this.isCrossfading
		)
			return;

		const duration = this.active.analyzer.getDuration();
		const current = this.active.analyzer.getCurrentTime();
		if (duration <= 0 || current <= 0) return;

		const remaining = duration - current;
		const threshold = this.crossfadeDurationMs / 1000;

		if (remaining > 0 && remaining <= threshold) {
			this.startCrossfade();
		}
	}

	private startCrossfade(): void {
		if (!this.queued) return;
		this.isCrossfading = true;
		this.crossfadeStartMs = performance.now();
		// Start queued track audibly
		this.queued.analyzer.resume();
		this.queued.analyzer.setVolume(0);
	}

	private updateCrossfadeVolumes(): void {
		if (!this.isCrossfading || !this.active || !this.queued) return;

		const elapsed = performance.now() - this.crossfadeStartMs;
		const progress = Math.min(1, elapsed / this.crossfadeDurationMs);

		this.active.analyzer.setVolume(this.active.baseVolume * (1 - progress));
		this.queued.analyzer.setVolume(this.queued.baseVolume * progress);

		if (progress >= 1) {
			this.finalizeCrossfade();
		}
	}

	private finalizeCrossfade(): void {
		if (!this.queued) return;

		const newActive = this.queued;
		this.stopActive();

		newActive.analyzer.setVolume(newActive.baseVolume);
		this.active = newActive;
		this.queued = null;
		this.isCrossfading = false;

		this.callbacks.onCrossfadeComplete(newActive.id);
	}

	// ── Mixed audio output ─────────────────────────────────────────────────────

	/**
	 * Returns frequency bins for the active track, or a weighted mix of active
	 * and queued bins during crossfade.
	 */
	getMixedBins(): Uint8Array {
		if (!this.active) return new Uint8Array(0);
		if (!this.isCrossfading || !this.queued) {
			return this.active.analyzer.getFrequencyBins();
		}

		const elapsed = performance.now() - this.crossfadeStartMs;
		const progress = Math.min(1, elapsed / this.crossfadeDurationMs);

		const binsA = this.active.analyzer.getFrequencyBins();
		const binsB = this.queued.analyzer.getFrequencyBins();
		const len = Math.max(binsA.length, binsB.length);
		if (len === 0) return new Uint8Array(0);

		const mixed = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			const a = binsA[i] ?? 0;
			const b = binsB[i] ?? 0;
			mixed[i] = Math.min(255, Math.round(a * (1 - progress) + b * progress));
		}
		return mixed;
	}

	// ── Transport controls ─────────────────────────────────────────────────────

	pause(): void {
		this.active?.analyzer.pause?.();
		if (this.isCrossfading) this.queued?.analyzer.pause?.();
	}

	resume(): void {
		void this.active?.analyzer.resume?.();
		if (this.isCrossfading) void this.queued?.analyzer.resume?.();
	}

	seek(time: number): void {
		this.active?.analyzer.seek?.(time);
	}

	getCurrentTime(): number {
		return this.active?.analyzer.getCurrentTime?.() ?? 0;
	}

	getDuration(): number {
		return this.active?.analyzer.getDuration?.() ?? 0;
	}

	setActiveVolume(v: number): void {
		if (!this.active) return;
		this.active.baseVolume = v;
		if (!this.isCrossfading) this.active.analyzer.setVolume(v);
	}

	setActiveLoop(v: boolean): void {
		this.active?.analyzer.setLoop?.(v);
	}

	getFileName(): string {
		return this.active?.analyzer.getFileName?.() ?? '';
	}

	// ── State queries ──────────────────────────────────────────────────────────

	hasActive(): boolean {
		return this.active !== null;
	}

	getActiveTrackId(): string | null {
		return this.active?.id ?? null;
	}

	getQueuedTrackId(): string | null {
		return this.queued?.id ?? null;
	}

	getIsCrossfading(): boolean {
		return this.isCrossfading;
	}

	getCrossfadeProgress(): number {
		if (!this.isCrossfading) return 0;
		const elapsed = performance.now() - this.crossfadeStartMs;
		return Math.min(1, elapsed / this.crossfadeDurationMs);
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────

	/** Stop and discard the queued track without affecting the active track. */
	stopQueued(): void {
		this.queued?.analyzer.stop();
		this.queued = null;
	}

	private stopActive(): void {
		this.active?.analyzer.stop();
		this.active = null;
		this.isCrossfading = false;
	}

	stopAll(): void {
		this.stopQueued();
		this.stopActive();
	}
}
