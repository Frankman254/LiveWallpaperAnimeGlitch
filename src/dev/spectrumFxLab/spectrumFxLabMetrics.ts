/** Rolling CPU draw-time metrics (Canvas 2D submission only — not GPU). */
export type LabMetricSampleCount = 64 | 128 | 256;

export type LabDrawMetrics = {
	offLastMs: number;
	onLastMs: number;
	offAvgMs: number;
	onAvgMs: number;
	offDeltaMs: number;
	onDeltaMs: number;
};

export class LabDrawMetricTracker {
	private readonly offRing: Float32Array;
	private readonly onRing: Float32Array;
	private capacity: number;
	private offWrite = 0;
	private onWrite = 0;
	private offFilled = 0;
	private onFilled = 0;
	private offBaselineAvg = 0;
	offLastMs = 0;
	onLastMs = 0;
	offAvgMs = 0;
	onAvgMs = 0;
	offDeltaMs = 0;
	onDeltaMs = 0;

	constructor(initialCapacity: LabMetricSampleCount = 64) {
		this.capacity = initialCapacity;
		this.offRing = new Float32Array(initialCapacity);
		this.onRing = new Float32Array(initialCapacity);
	}

	setCapacity(next: LabMetricSampleCount): void {
		if (next === this.capacity) return;
		this.capacity = next;
		this.offWrite = 0;
		this.onWrite = 0;
		this.offFilled = 0;
		this.onFilled = 0;
		this.offRing.fill(0);
		this.onRing.fill(0);
	}

	setBaselineAvg(ms: number): void {
		this.offBaselineAvg = ms;
	}

	pushOff(ms: number): void {
		this.offLastMs = ms;
		this.offRing[this.offWrite] = ms;
		this.offWrite = (this.offWrite + 1) % this.capacity;
		this.offFilled = Math.min(this.offFilled + 1, this.capacity);
		this.offAvgMs = averageRing(this.offRing, this.offFilled);
		this.offDeltaMs = this.offAvgMs - this.offBaselineAvg;
	}

	pushOn(ms: number): void {
		this.onLastMs = ms;
		this.onRing[this.onWrite] = ms;
		this.onWrite = (this.onWrite + 1) % this.capacity;
		this.onFilled = Math.min(this.onFilled + 1, this.capacity);
		this.onAvgMs = averageRing(this.onRing, this.onFilled);
		this.onDeltaMs = this.onAvgMs - this.offBaselineAvg;
	}

	snapshot(): LabDrawMetrics {
		return {
			offLastMs: this.offLastMs,
			onLastMs: this.onLastMs,
			offAvgMs: this.offAvgMs,
			onAvgMs: this.onAvgMs,
			offDeltaMs: this.offDeltaMs,
			onDeltaMs: this.onDeltaMs
		};
	}

	reset(): void {
		this.offWrite = 0;
		this.onWrite = 0;
		this.offFilled = 0;
		this.onFilled = 0;
		this.offRing.fill(0);
		this.onRing.fill(0);
		this.offLastMs = 0;
		this.onLastMs = 0;
		this.offAvgMs = 0;
		this.onAvgMs = 0;
		this.offDeltaMs = 0;
		this.onDeltaMs = 0;
		this.offBaselineAvg = 0;
	}
}

function averageRing(ring: Float32Array, filled: number): number {
	if (filled <= 0) return 0;
	let sum = 0;
	for (let i = 0; i < filled; i++) sum += ring[i];
	return sum / filled;
}
