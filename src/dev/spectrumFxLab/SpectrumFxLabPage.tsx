import { useEffect, useRef, useState } from 'react';
import {
	buildLabSettings,
	isScenarioSupportedForMode,
	labModeLabel,
	listSupportedScenarios,
	SPECTRUM_FX_LAB_MODES,
	type SpectrumFxLabMode
} from './spectrumFxLabConfig';
import {
	createFreshLabRuntime,
	resetSpectrumFxLabRuntime
} from './spectrumFxLabRuntime';
import { renderLabFrame } from './spectrumFxLabRender';
import {
	LabDrawMetricTracker,
	type LabDrawMetrics,
	type LabMetricSampleCount
} from './spectrumFxLabMetrics';
import {
	fillSyntheticHeights,
	fillSyntheticPeaks,
	fillSyntheticTimeDomain,
	type SpectrumFxScenario,
	type SpectrumFxWavePreset
} from './syntheticWaveData';

const LAB_W = 640;
const LAB_H = 360;
const BAR_COUNT = 128;
const METRIC_UI_INTERVAL_MS = 200;

const SAMPLE_COUNTS: LabMetricSampleCount[] = [64, 128, 256];

export default function SpectrumFxLabPage() {
	const offRef = useRef<HTMLCanvasElement>(null);
	const onRef = useRef<HTMLCanvasElement>(null);
	const offRuntimeRef = useRef(createFreshLabRuntime());
	const onRuntimeRef = useRef(createFreshLabRuntime());
	const heightsRef = useRef(new Float32Array(BAR_COUNT));
	const peaksRef = useRef(new Float32Array(BAR_COUNT));
	const timeDomainRef = useRef(new Uint8Array(BAR_COUNT));
	const frameRef = useRef(0);
	const metricsRef = useRef(new LabDrawMetricTracker(64));
	const lastMetricUiAtRef = useRef(0);

	const [mode, setMode] = useState<SpectrumFxLabMode>('classic-wave-linear');
	const [preset, setPreset] = useState<SpectrumFxWavePreset>('sine');
	const [scenario, setScenario] = useState<SpectrumFxScenario>('all-accents');
	const [sampleCount, setSampleCount] = useState<LabMetricSampleCount>(64);
	const [metrics, setMetrics] = useState<LabDrawMetrics>(() =>
		metricsRef.current.snapshot()
	);

	const supportedScenarios = listSupportedScenarios(mode);

	useEffect(() => {
		if (!isScenarioSupportedForMode(scenario, mode)) {
			setScenario('baseline');
		}
	}, [mode, scenario]);

	useEffect(() => {
		resetSpectrumFxLabRuntime(offRuntimeRef.current);
		resetSpectrumFxLabRuntime(onRuntimeRef.current);
		offRuntimeRef.current = createFreshLabRuntime();
		onRuntimeRef.current = createFreshLabRuntime();
		frameRef.current = 0;
		metricsRef.current.reset();
		metricsRef.current.setCapacity(sampleCount);
		setMetrics(metricsRef.current.snapshot());
	}, [mode, preset, scenario, sampleCount]);

	useEffect(() => {
		metricsRef.current.setCapacity(sampleCount);
	}, [sampleCount]);

	useEffect(() => {
		let raf = 0;
		const tick = () => {
			const offCanvas = offRef.current;
			const onCanvas = onRef.current;
			if (!offCanvas || !onCanvas) {
				raf = requestAnimationFrame(tick);
				return;
			}
			const offCtx = offCanvas.getContext('2d');
			const onCtx = onCanvas.getContext('2d');
			if (!offCtx || !onCtx) {
				raf = requestAnimationFrame(tick);
				return;
			}

			const f = frameRef.current + 1;
			frameRef.current = f;
			fillSyntheticHeights(heightsRef.current, preset, 140, f);
			fillSyntheticPeaks(peaksRef.current, heightsRef.current, 140);
			fillSyntheticTimeDomain(timeDomainRef.current, preset, f);

			const offSettings = buildLabSettings('baseline', mode);
			const onSettings = buildLabSettings(scenario, mode);
			const buffers = {
				heights: heightsRef.current,
				peaks: peaksRef.current,
				timeDomain: timeDomainRef.current
			};

			const offMs = renderLabFrame(
				offCtx,
				offCanvas,
				mode,
				offSettings,
				buffers,
				f,
				offRuntimeRef.current
			);
			const onMs = renderLabFrame(
				onCtx,
				onCanvas,
				mode,
				onSettings,
				buffers,
				f,
				onRuntimeRef.current
			);

			const tracker = metricsRef.current;
			tracker.pushOff(offMs);
			tracker.setBaselineAvg(tracker.offAvgMs);
			tracker.pushOn(onMs);

			const now = performance.now();
			if (now - lastMetricUiAtRef.current >= METRIC_UI_INTERVAL_MS) {
				lastMetricUiAtRef.current = now;
				setMetrics(tracker.snapshot());
			}

			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [mode, preset, scenario]);

	return (
		<div className="min-h-screen bg-[#0a0a0f] p-4 text-white">
			<h1 className="mb-2 font-mono text-lg">Spectrum FX Lab (dev)</h1>
			<p className="mb-2 max-w-4xl text-sm text-white/60">
				Deterministic synthetic data — OFF (baseline) vs ON (selected
				scenario). Timing is Canvas CPU submission/draw only (not GPU).
			</p>
			<p className="mb-4 font-mono text-xs text-white/50">
				Mode: {labModeLabel(mode)} · Scenario: {scenario} · Samples:{' '}
				{sampleCount}
			</p>

			<div className="mb-3 flex flex-wrap gap-2">
				{SPECTRUM_FX_LAB_MODES.map(m => (
					<button
						key={m}
						type="button"
						className={`rounded px-2 py-1 text-xs ${mode === m ? 'bg-cyan-600' : 'bg-white/10'}`}
						onClick={() => setMode(m)}
					>
						{m}
					</button>
				))}
			</div>

			<div className="mb-3 flex flex-wrap gap-2">
				{(
					[
						'sine',
						'kick-peaks',
						'alternating',
						'rolling',
						'silence',
						'fixed-radial'
					] as SpectrumFxWavePreset[]
				).map(p => (
					<button
						key={p}
						type="button"
						className={`rounded px-2 py-1 text-xs ${preset === p ? 'bg-fuchsia-600' : 'bg-white/10'}`}
						onClick={() => setPreset(p)}
					>
						{p}
					</button>
				))}
			</div>

			<div className="mb-3 flex flex-wrap gap-2">
				{supportedScenarios.map(s => (
					<button
						key={s}
						type="button"
						className={`rounded px-2 py-1 text-xs ${scenario === s ? 'bg-amber-600' : 'bg-white/10'}`}
						onClick={() => setScenario(s)}
					>
						{s}
					</button>
				))}
			</div>

			<div className="mb-4 flex flex-wrap items-center gap-2">
				<span className="text-xs uppercase text-white/50">Samples</span>
				{SAMPLE_COUNTS.map(count => (
					<button
						key={count}
						type="button"
						className={`rounded px-2 py-1 text-xs ${sampleCount === count ? 'bg-emerald-700' : 'bg-white/10'}`}
						onClick={() => setSampleCount(count)}
					>
						{count}
					</button>
				))}
			</div>

			<div className="mb-4 grid max-w-4xl grid-cols-1 gap-2 font-mono text-xs text-white/70 sm:grid-cols-2">
				<div className="rounded border border-white/10 p-2">
					<p className="mb-1 uppercase text-white/40">OFF baseline</p>
					<p>Last: {metrics.offLastMs.toFixed(3)} ms</p>
					<p>
						Avg ({sampleCount}): {metrics.offAvgMs.toFixed(3)} ms
					</p>
					<p>Δ vs self: {metrics.offDeltaMs.toFixed(3)} ms</p>
				</div>
				<div className="rounded border border-white/10 p-2">
					<p className="mb-1 uppercase text-white/40">ON scenario</p>
					<p>Last: {metrics.onLastMs.toFixed(3)} ms</p>
					<p>
						Avg ({sampleCount}): {metrics.onAvgMs.toFixed(3)} ms
					</p>
					<p>Δ vs OFF avg: {metrics.onDeltaMs.toFixed(3)} ms</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-4">
				<div>
					<p className="mb-1 text-xs uppercase text-white/50">OFF</p>
					<canvas
						ref={offRef}
						width={LAB_W}
						height={LAB_H}
						className="rounded border border-white/20"
					/>
				</div>
				<div>
					<p className="mb-1 text-xs uppercase text-white/50">ON</p>
					<canvas
						ref={onRef}
						width={LAB_W}
						height={LAB_H}
						className="rounded border border-white/20"
					/>
				</div>
			</div>
		</div>
	);
}
