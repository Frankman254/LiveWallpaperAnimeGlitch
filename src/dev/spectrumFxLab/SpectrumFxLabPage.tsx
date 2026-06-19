import { useEffect, useRef, useState } from 'react';
import { DEFAULT_STATE } from '@/lib/constants';
import { drawLinearWave } from '@/features/spectrum/renderers/linear/linearRenderer';
import { drawRadialWave } from '@/features/spectrum/renderers/radial/radialRenderer';
import {
	createSpectrumRuntimeState,
	type SpectrumSettings
} from '@/features/spectrum/runtime/spectrumRuntime';
import {
	applyFxScenario,
	fillSyntheticHeights,
	type SpectrumFxScenario,
	type SpectrumFxWavePreset
} from './syntheticWaveData';

const LAB_W = 640;
const LAB_H = 360;
const BAR_COUNT = 128;

type LabMode = 'classic-linear' | 'classic-radial';

function buildSettings(
	scenario: SpectrumFxScenario,
	mode: LabMode
): SpectrumSettings {
	const base = {
		...DEFAULT_STATE,
		spectrumFamily: 'classic' as const,
		spectrumShape: 'wave' as const,
		spectrumMode: mode === 'classic-radial' ? 'radial' : 'linear',
		spectrumLinearOrientation: 'horizontal' as const,
		spectrumPrimaryColor: '#00ffff',
		spectrumSecondaryColor: '#ff00ff',
		spectrumColorMode: 'gradient' as const,
		spectrumBarCount: BAR_COUNT,
		spectrumBarWidth: 4,
		spectrumMaxHeight: 140,
		spectrumMinHeight: 4,
		spectrumWaveFillOpacity: 0.25,
		spectrumGlowIntensity: 1.2,
		spectrumShadowBlur: 18,
		spectrumInnerRadius: 48,
		spectrumSpan: 0.85,
		performanceMode: 'high' as const
	};
	return applyFxScenario(base, scenario) as SpectrumSettings;
}

function renderLabFrame(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	heights: Float32Array,
	frame: number,
	runtime: ReturnType<typeof createSpectrumRuntimeState>
): number {
	const t0 = performance.now();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#050508';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const cx = canvas.width / 2;
	const cy = canvas.height / 2;
	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	if (settings.spectrumMode === 'radial') {
		drawRadialWave(
			ctx,
			canvas,
			cx,
			cy,
			heights,
			BAR_COUNT,
			settings,
			frame * 0.012,
			0,
			{ audioEnergy: 0.6, dt: 1 / 60 }
		);
	} else {
		drawLinearWave(ctx, canvas, heights, BAR_COUNT, settings, {
			runtime,
			audioEnergy: 0.6,
			dt: 1 / 60
		});
	}
	ctx.restore();
	return performance.now() - t0;
}

export default function SpectrumFxLabPage() {
	const offRef = useRef<HTMLCanvasElement>(null);
	const onRef = useRef<HTMLCanvasElement>(null);
	const runtimeRef = useRef(createSpectrumRuntimeState());
	const heightsRef = useRef(new Float32Array(BAR_COUNT));
	const [mode, setMode] = useState<LabMode>('classic-linear');
	const [preset, setPreset] = useState<SpectrumFxWavePreset>('sine');
	const [scenario, setScenario] = useState<SpectrumFxScenario>('all-accents');
	const frameRef = useRef(0);
	const [lastMs, setLastMs] = useState(0);
	const [avgMs, setAvgMs] = useState(0);
	const samplesRef = useRef<number[]>([]);

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
			const offSettings = buildSettings('baseline', mode);
			const onSettings = buildSettings(scenario, mode);
			renderLabFrame(
				offCtx,
				offCanvas,
				offSettings,
				heightsRef.current,
				f,
				runtimeRef.current
			);
			const ms = renderLabFrame(
				onCtx,
				onCanvas,
				onSettings,
				heightsRef.current,
				frameRef.current,
				runtimeRef.current
			);
			setLastMs(ms);
			const samples = samplesRef.current;
			samples.push(ms);
			if (samples.length > 64) samples.shift();
			setAvgMs(
				samples.reduce((a, b) => a + b, 0) / Math.max(samples.length, 1)
			);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [mode, preset, scenario]);

	return (
		<div className="min-h-screen bg-[#0a0a0f] p-4 text-white">
			<h1 className="mb-2 font-mono text-lg">Spectrum FX Lab (dev)</h1>
			<p className="mb-4 max-w-3xl text-sm text-white/60">
				Deterministic synthetic wave — OFF (baseline) vs ON (selected
				scenario). Timing is CPU canvas draw only (~{lastMs.toFixed(2)}
				ms last, {avgMs.toFixed(2)} ms avg over 64 frames).
			</p>
			<div className="mb-4 flex flex-wrap gap-2">
				{(['classic-linear', 'classic-radial'] as LabMode[]).map(m => (
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
			<div className="mb-4 flex flex-wrap gap-2">
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
			<div className="mb-4 flex flex-wrap gap-2">
				{(
					[
						'baseline',
						'manual-glow',
						'neon-core',
						'rgb-split',
						'gradient-flow',
						'peak-sparks',
						'echo-trace',
						'all-accents'
					] as SpectrumFxScenario[]
				).map(s => (
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
