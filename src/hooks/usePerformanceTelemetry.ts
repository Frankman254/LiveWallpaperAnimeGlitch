import { useEffect, useMemo, useRef, useState } from 'react';

type MemoryInfo = {
	jsHeapUsedMb: number | null;
	jsHeapTotalMb: number | null;
	jsHeapLimitMb: number | null;
};

export type PerformanceTelemetryInput = {
	particlesEnabled: boolean;
	rainEnabled: boolean;
	spectrumEnabled: boolean;
	logoEnabled: boolean;
	globalBackgroundEnabled: boolean;
	backgroundImageEnabled: boolean;
	rgbShiftAudioReactive: boolean;
	imageBassReactive: boolean;
	scanlineIntensity: number;
	noiseIntensity: number;
};

export type PerformanceTelemetrySnapshot = {
	fps: number;
	avgFrameMs: number;
	cpuEstimate: number | null;
	gpuEstimate: number | null;
	jsHeapUsedMb: number | null;
	jsHeapTotalMb: number | null;
	jsHeapLimitMb: number | null;
	deviceMemoryGb: number | null;
	hardwareConcurrency: number | null;
};

type PerformanceMemoryLike = {
	usedJSHeapSize?: number;
	totalJSHeapSize?: number;
	jsHeapSizeLimit?: number;
};

function toMb(value?: number): number | null {
	return typeof value === 'number' && Number.isFinite(value)
		? value / (1024 * 1024)
		: null;
}

function readMemoryInfo(): MemoryInfo {
	const memory = (
		performance as Performance & {
			memory?: PerformanceMemoryLike;
		}
	).memory;

	return {
		jsHeapUsedMb: toMb(memory?.usedJSHeapSize),
		jsHeapTotalMb: toMb(memory?.totalJSHeapSize),
		jsHeapLimitMb: toMb(memory?.jsHeapSizeLimit)
	};
}

function clampPercent(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export function usePerformanceTelemetry(
	input: PerformanceTelemetryInput
): PerformanceTelemetrySnapshot {
	const [snapshot, setSnapshot] = useState<PerformanceTelemetrySnapshot>(() => ({
		fps: 60,
		avgFrameMs: 16.7,
		cpuEstimate: null,
		gpuEstimate: null,
		...readMemoryInfo(),
		deviceMemoryGb:
			typeof navigator !== 'undefined' &&
			typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory ===
				'number'
				? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
				: null,
		hardwareConcurrency:
			typeof navigator !== 'undefined'
				? navigator.hardwareConcurrency ?? null
				: null
	}));

	const inputRef = useRef(input);
	inputRef.current = input;
	const longTaskWindowRef = useRef<Array<{ time: number; duration: number }>>(
		[]
	);

	const sceneLoadScore = useMemo(() => {
		let score = 0;
		if (input.backgroundImageEnabled) score += 1;
		if (input.globalBackgroundEnabled) score += 1;
		if (input.logoEnabled) score += 1;
		if (input.spectrumEnabled) score += 1.4;
		if (input.particlesEnabled) score += 1.8;
		if (input.rainEnabled) score += 1.4;
		if (input.imageBassReactive) score += 0.8;
		if (input.rgbShiftAudioReactive) score += 0.8;
		score += Math.min(1.1, input.scanlineIntensity * 1.5);
		score += Math.min(0.9, input.noiseIntensity * 5);
		return score;
	}, [input]);

	useEffect(() => {
		let raf = 0;
		let alive = true;
		let sampleFrames = 0;
		let sampleMs = 0;
		let last = performance.now();
		const SAMPLE_WINDOW_MS = 2400;
		const LONG_TASK_WINDOW_MS = 5000;
		let sampleStart = last;

		const observer =
			typeof PerformanceObserver !== 'undefined'
				? new PerformanceObserver(list => {
						const now = performance.now();
						for (const entry of list.getEntries()) {
							longTaskWindowRef.current.push({
								time: now,
								duration: entry.duration
							});
						}
						longTaskWindowRef.current = longTaskWindowRef.current.filter(
							entry => now - entry.time <= LONG_TASK_WINDOW_MS
						);
					})
				: null;

		try {
			observer?.observe({ entryTypes: ['longtask'] });
		} catch {
			observer?.disconnect();
		}

		const tick = (now: number) => {
			if (!alive) return;
			const dt = Math.min(now - last, 250);
			last = now;
			sampleFrames += 1;
			sampleMs += dt;

			if (now - sampleStart >= SAMPLE_WINDOW_MS) {
				const fps =
					sampleMs > 0 ? (sampleFrames / sampleMs) * 1000 : 60;
				const avgFrameMs = sampleFrames > 0 ? sampleMs / sampleFrames : 16.7;
				const longTaskBusyMs = longTaskWindowRef.current.reduce(
					(total, entry) => total + entry.duration,
					0
				);
				const longTaskRatio = Math.min(
					1,
					longTaskBusyMs / LONG_TASK_WINDOW_MS
				);
				const frameJankRatio = Math.max(0, (avgFrameMs - 16.7) / 16.7);
				const cpuEstimate = clampPercent(
					longTaskRatio * 100 + frameJankRatio * 42
				);
				const fpsPenalty = Math.max(0, (60 - fps) / 60);
				const gpuEstimate = clampPercent(
					fpsPenalty * 62 + sceneLoadScore * 8.5
				);
				const memoryInfo = readMemoryInfo();

				setSnapshot(current => ({
					...current,
					fps,
					avgFrameMs,
					cpuEstimate,
					gpuEstimate,
					...memoryInfo
				}));

				sampleFrames = 0;
				sampleMs = 0;
				sampleStart = now;
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);

		return () => {
			alive = false;
			cancelAnimationFrame(raf);
			observer?.disconnect();
		};
	}, [sceneLoadScore]);

	return snapshot;
}
