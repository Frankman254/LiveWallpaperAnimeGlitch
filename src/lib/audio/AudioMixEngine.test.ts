import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockAnalyzer = {
	resolveStart: () => void;
	rejectStart: (error: Error) => void;
	stop: ReturnType<typeof vi.fn>;
	pause: ReturnType<typeof vi.fn>;
	setVolume: ReturnType<typeof vi.fn>;
	onEnded?: () => void;
};

const audioMocks = vi.hoisted(() => ({
	instances: [] as MockAnalyzer[]
}));

vi.mock('./FileAudioAnalyzer', () => ({
	FileAudioAnalyzer: class {
		resolveStart!: () => void;
		rejectStart!: (error: Error) => void;
		stop = vi.fn();
		pause = vi.fn();
		resume = vi.fn();
		setVolume = vi.fn();
		setLoop = vi.fn();
		setRestoreStartTime = vi.fn();
		setOnPlaybackStateChange = vi.fn();
		private readonly startPromise: Promise<void>;

		onEnded?: () => void;

		constructor(
			_file: File,
			_fftSize: number,
			_smoothing: number,
			onEnded?: () => void
		) {
			this.onEnded = onEnded;
			this.startPromise = new Promise((resolve, reject) => {
				this.resolveStart = resolve;
				this.rejectStart = reject;
			});
			audioMocks.instances.push(this);
		}

		start() {
			return this.startPromise;
		}

		getDuration() {
			return 120;
		}

		getCurrentTime() {
			return 0;
		}

		getFrequencyBins() {
			return new Uint8Array(0);
		}
	}
}));

import { AudioMixEngine } from './AudioMixEngine';

const file = { name: 'track.mp3' } as File;

describe('AudioMixEngine async loading', () => {
	beforeEach(() => {
		audioMocks.instances.length = 0;
	});

	it('discards an older active load that resolves after a newer request', async () => {
		const engine = new AudioMixEngine({
			onTrackEnd: vi.fn(),
			onCrossfadeComplete: vi.fn()
		});
		const firstLoad = engine.loadActiveTrack('first', file, 1, false);
		const first = audioMocks.instances[0]!;
		const secondLoad = engine.loadActiveTrack('second', file, 1, false);
		const second = audioMocks.instances[1]!;

		second.resolveStart();
		expect(await secondLoad).toBe(true);
		first.resolveStart();
		expect(await firstLoad).toBe(false);

		expect(first.stop).toHaveBeenCalled();
		expect(engine.getActiveTrackId()).toBe('second');
	});

	it('does not surface an error from a superseded active load', async () => {
		const engine = new AudioMixEngine({
			onTrackEnd: vi.fn(),
			onCrossfadeComplete: vi.fn()
		});
		const firstLoad = engine.loadActiveTrack('first', file, 1, false);
		const first = audioMocks.instances[0]!;
		const secondLoad = engine.loadActiveTrack('second', file, 1, false);
		const second = audioMocks.instances[1]!;

		second.resolveStart();
		expect(await secondLoad).toBe(true);
		first.rejectStart(new Error('stale setup failure'));
		expect(await firstLoad).toBe(false);
		expect(engine.getActiveTrackId()).toBe('second');
	});

	it('keeps only the newest queued preload', async () => {
		const engine = new AudioMixEngine({
			onTrackEnd: vi.fn(),
			onCrossfadeComplete: vi.fn()
		});
		const firstQueue = engine.preloadQueuedTrack('first', file, 1, false);
		const first = audioMocks.instances[0]!;
		const secondQueue = engine.preloadQueuedTrack('second', file, 1, false);
		const second = audioMocks.instances[1]!;

		second.resolveStart();
		expect(await secondQueue).toBe(true);
		first.resolveStart();
		expect(await firstQueue).toBe(false);

		expect(first.stop).toHaveBeenCalled();
		expect(second.pause).toHaveBeenCalled();
		expect(engine.getQueuedTrackId()).toBe('second');
	});

	it('ignores the outgoing track ended event during a crossfade', async () => {
		const onTrackEnd = vi.fn();
		const engine = new AudioMixEngine({
			onTrackEnd,
			onCrossfadeComplete: vi.fn()
		});
		engine.setCrossfadeConfig(true, 0.5);
		const activeLoad = engine.loadActiveTrack('active', file, 1, false);
		const active = audioMocks.instances[0]!;
		active.resolveStart();
		await activeLoad;

		const queuedLoad = engine.preloadQueuedTrack('queued', file, 1, false);
		const queued = audioMocks.instances[1]!;
		queued.resolveStart();
		await queuedLoad;
		engine.triggerMixNow();
		active.onEnded?.();

		expect(engine.getIsCrossfading()).toBe(true);
		expect(onTrackEnd).not.toHaveBeenCalled();
	});

	it('advances when a promoted queued track ends after crossfade', async () => {
		const onTrackEnd = vi.fn();
		const engine = new AudioMixEngine({
			onTrackEnd,
			onCrossfadeComplete: vi.fn()
		});
		engine.setCrossfadeConfig(true, 0.5);
		const activeLoad = engine.loadActiveTrack('active', file, 1, false);
		const active = audioMocks.instances[0]!;
		active.resolveStart();
		await activeLoad;

		const queuedLoad = engine.preloadQueuedTrack('queued', file, 1, false);
		const queued = audioMocks.instances[1]!;
		queued.resolveStart();
		await queuedLoad;

		const now = vi.spyOn(performance, 'now');
		now.mockReturnValueOnce(1_000).mockReturnValueOnce(2_000);
		engine.triggerMixNow();
		engine.tick();
		queued.onEnded?.();

		expect(engine.getActiveTrackId()).toBe('queued');
		expect(engine.getIsCrossfading()).toBe(false);
		expect(onTrackEnd).toHaveBeenCalledOnce();
		now.mockRestore();
	});
});
