import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileAudioAnalyzer } from './FileAudioAnalyzer';

/**
 * Lifecycle cover for the file analyser.
 *
 * The failure mode that matters here is not "it threw" — it is a teardown that
 * leaves an AudioContext, a MediaElementSource or a blob URL alive. Those leak
 * per track change, and the browser caps how many AudioContexts a page may
 * open, so the app eventually stops playing audio at all with no error.
 */

type Listener = () => void;

class FakeAudioElement {
	loop = false;
	src: string;
	paused = false;
	currentTime = 0;
	duration = 214;
	volume = 1;
	playCalls = 0;
	pauseCalls = 0;
	listeners = new Map<string, Set<Listener>>();
	/** Set to make `play()` reject, the way a browser blocks autoplay. */
	static blockAutoplay = false;

	constructor(src: string) {
		this.src = src;
	}

	addEventListener(type: string, cb: Listener) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)!.add(cb);
	}

	removeEventListener(type: string, cb: Listener) {
		this.listeners.get(type)?.delete(cb);
	}

	listenerCount() {
		let total = 0;
		for (const set of this.listeners.values()) total += set.size;
		return total;
	}

	pause() {
		this.pauseCalls++;
		this.paused = true;
	}

	play() {
		this.playCalls++;
		if (FakeAudioElement.blockAutoplay) {
			return Promise.reject(new Error('NotAllowedError'));
		}
		this.paused = false;
		return Promise.resolve();
	}
}

class FakeNode {
	connected: FakeNode[] = [];
	disconnectCalls = 0;
	connect(target: FakeNode) {
		this.connected.push(target);
		return target;
	}
	disconnect() {
		this.disconnectCalls++;
	}
}

class FakeAnalyser extends FakeNode {
	fftSize = 2048;
	smoothingTimeConstant = 0.8;
	minDecibels = -90;
	maxDecibels = -10;
	get frequencyBinCount() {
		return this.fftSize / 2;
	}
	getByteFrequencyData(target: Uint8Array) {
		target.fill(128);
	}
	getByteTimeDomainData(target: Uint8Array) {
		target.fill(128);
	}
}

class FakeAudioContext {
	static instances: FakeAudioContext[] = [];
	/** Set to make `close()` reject, as a browser does on a closed context. */
	static rejectClose = false;
	state = 'running';
	closeCalls = 0;
	destination = new FakeNode();
	analysers: FakeAnalyser[] = [];
	sources: FakeNode[] = [];

	constructor() {
		FakeAudioContext.instances.push(this);
	}

	createAnalyser() {
		const analyser = new FakeAnalyser();
		this.analysers.push(analyser);
		return analyser;
	}

	createGain() {
		return Object.assign(new FakeNode(), { gain: { value: 1 } });
	}

	createMediaElementSource() {
		const source = new FakeNode();
		this.sources.push(source);
		return source;
	}

	resume() {
		this.state = 'running';
		return Promise.resolve();
	}

	close() {
		this.closeCalls++;
		this.state = 'closed';
		return FakeAudioContext.rejectClose
			? Promise.reject(new Error('InvalidStateError'))
			: Promise.resolve();
	}
}

let revokeObjectURL: ReturnType<typeof vi.fn>;
let createObjectURL: ReturnType<typeof vi.fn>;

function installFakeAudioEnvironment() {
	createObjectURL = vi.fn(() => 'blob:track');
	revokeObjectURL = vi.fn();
	vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
	vi.stubGlobal('Audio', FakeAudioElement);
	vi.stubGlobal('AudioContext', FakeAudioContext);
}

const makeAnalyzer = () => new FileAudioAnalyzer({ name: 'track.mp3' } as File);

beforeEach(() => {
	FakeAudioContext.instances = [];
	FakeAudioContext.rejectClose = false;
	FakeAudioElement.blockAutoplay = false;
	installFakeAudioEnvironment();
});

afterEach(() => vi.unstubAllGlobals());

describe('FileAudioAnalyzer — stop() is safe and idempotent', () => {
	it('tears the graph down exactly once however many times it is called', async () => {
		const analyzer = makeAnalyzer();
		await analyzer.start();
		const context = FakeAudioContext.instances[0]!;

		analyzer.stop();
		analyzer.stop();
		analyzer.stop();

		// Closing a closed context throws in real browsers, so it must happen once.
		expect(context.closeCalls).toBe(1);
		expect(revokeObjectURL).toHaveBeenCalledTimes(1);
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:track');
	});

	it('never throws, even before start()', () => {
		const analyzer = makeAnalyzer();
		expect(() => {
			analyzer.stop();
			analyzer.stop();
		}).not.toThrow();
	});

	it('does not leave an unhandled rejection when close() rejects', async () => {
		// A context the browser already closed rejects here; an uncaught
		// rejection would surface as a page-level error the user cannot act on.
		FakeAudioContext.rejectClose = true;
		const unhandled = vi.fn();
		process.on('unhandledRejection', unhandled);

		const analyzer = makeAnalyzer();
		await analyzer.start();
		analyzer.stop();
		await new Promise(resolve => setTimeout(resolve, 10));

		process.off('unhandledRejection', unhandled);
		expect(unhandled).not.toHaveBeenCalled();
	});

	it('detaches every element listener so teardown emits no state change', async () => {
		const analyzer = makeAnalyzer();
		const onState = vi.fn();
		analyzer.setOnPlaybackStateChange(onState);
		await analyzer.start();
		const element = analyzer as unknown as { audioEl: FakeAudioElement };
		const audioEl = element.audioEl;

		onState.mockClear();
		analyzer.stop();

		expect(audioEl.listenerCount()).toBe(0);
		expect(
			onState,
			'teardown must not report a pause'
		).not.toHaveBeenCalled();
	});

	it('releases the object URL when graph setup throws', async () => {
		vi.stubGlobal(
			'AudioContext',
			class {
				constructor() {
					throw new Error('audio context unavailable');
				}
			}
		);
		const analyzer = makeAnalyzer();
		await expect(analyzer.start()).rejects.toThrow(
			'audio context unavailable'
		);
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:track');
	});
});

describe('FileAudioAnalyzer — reads are safe after teardown', () => {
	it('returns neutral values instead of throwing', async () => {
		const analyzer = makeAnalyzer();
		await analyzer.start();
		analyzer.stop();

		expect(() => analyzer.getFrequencyBins()).not.toThrow();
		expect(analyzer.getFrequencyBins().length).toBe(0);
		expect(analyzer.getTimeDomainBins().length).toBe(0);
		expect(analyzer.getAmplitude()).toBe(0);
		expect(analyzer.getPeak()).toBe(0);
		expect(analyzer.getCurrentTime()).toBe(0);
		expect(analyzer.getDuration()).toBe(0);
	});

	it('tolerates transport commands after teardown', async () => {
		const analyzer = makeAnalyzer();
		await analyzer.start();
		analyzer.stop();

		expect(() => {
			analyzer.pause();
			analyzer.resume();
			analyzer.seek(30);
			analyzer.setVolume(0.5);
			analyzer.setLoop(true);
		}).not.toThrow();
	});
});

describe('FileAudioAnalyzer — blocked autoplay', () => {
	it('keeps the graph alive and reports paused instead of failing', async () => {
		FakeAudioElement.blockAutoplay = true;
		const analyzer = makeAnalyzer();

		await expect(analyzer.start()).resolves.toBeUndefined();

		// The file stays restored so the user can press play.
		expect(analyzer.isPaused()).toBe(true);
		expect(FakeAudioContext.instances[0]?.closeCalls).toBe(0);
		expect(revokeObjectURL).not.toHaveBeenCalled();
		expect(analyzer.getDuration()).toBeGreaterThan(0);
	});
});

describe('FileAudioAnalyzer — track changes', () => {
	it('leaves nothing behind when one analyser replaces another', async () => {
		const first = makeAnalyzer();
		await first.start();
		const firstContext = FakeAudioContext.instances[0]!;

		// What the engine does when the user picks another track.
		first.stop();
		const second = makeAnalyzer();
		await second.start();

		expect(firstContext.closeCalls).toBe(1);
		expect(FakeAudioContext.instances).toHaveLength(2);
		expect(FakeAudioContext.instances[1]?.closeCalls).toBe(0);
		expect(revokeObjectURL).toHaveBeenCalledTimes(1);

		second.stop();
		expect(FakeAudioContext.instances[1]?.closeCalls).toBe(1);
		expect(revokeObjectURL).toHaveBeenCalledTimes(2);
	});

	it('survives many start/stop cycles without leaking a context', async () => {
		for (let i = 0; i < 5; i++) {
			const analyzer = makeAnalyzer();
			await analyzer.start();
			analyzer.stop();
		}
		expect(FakeAudioContext.instances).toHaveLength(5);
		for (const context of FakeAudioContext.instances) {
			expect(context.closeCalls).toBe(1);
		}
		expect(revokeObjectURL).toHaveBeenCalledTimes(5);
	});
});

describe('FileAudioAnalyzer — pause / resume', () => {
	it('reports paused state through the element, not just its own flag', async () => {
		const analyzer = makeAnalyzer();
		await analyzer.start();
		expect(analyzer.isPaused()).toBe(false);

		analyzer.pause();
		expect(analyzer.isPaused()).toBe(true);

		analyzer.resume();
		expect(analyzer.isPaused()).toBe(false);
	});
});
