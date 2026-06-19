import { useEffect, useRef, useState } from 'react';
import { useRuntimeUiMode } from '@/runtime/useRuntimeUiMode';
import { useOutputPerformanceStore } from '@/runtime/outputPerformanceStore';
import { resolveOutputCanvasBacking } from '@/runtime/outputRenderQuality';

type FrameSample = {
	fps: number;
	frameMs: number;
};

function measureFps(): Promise<FrameSample> {
	return new Promise(resolve => {
		const samples: number[] = [];
		let last = performance.now();
		let frames = 0;
		const start = last;

		function tick(now: number) {
			frames += 1;
			samples.push(now - last);
			last = now;
			if (now - start < 900) {
				requestAnimationFrame(tick);
				return;
			}
			const avgFrame =
				samples.reduce((a, b) => a + b, 0) /
				Math.max(samples.length, 1);
			const elapsedSec = (now - start) / 1000;
			resolve({
				fps: frames / Math.max(elapsedSec, 0.001),
				frameMs: avgFrame
			});
		}

		requestAnimationFrame(tick);
	});
}

/** DEV-only output shell diagnostics. */
export default function OutputModeDevDiagnostics({
	editorShellMounted,
	hudMounted,
	diagnosticsMounted
}: {
	editorShellMounted: boolean;
	hudMounted: boolean;
	diagnosticsMounted: boolean;
}) {
	const { mode } = useRuntimeUiMode();
	const recordingRenderScale = useOutputPerformanceStore(
		s => s.recordingRenderScale
	);
	const [sample, setSample] = useState<FrameSample | null>(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		let raf = 0;
		const run = async () => {
			const next = await measureFps();
			if (mountedRef.current) setSample(next);
			raf = window.requestAnimationFrame(() => {
				void run();
			});
		};
		void run();
		return () => {
			mountedRef.current = false;
			cancelAnimationFrame(raf);
		};
	}, []);

	if (!import.meta.env.DEV) return null;

	const backing = resolveOutputCanvasBacking();

	return (
		<div className="pointer-events-none fixed bottom-3 left-3 z-[130] rounded border border-white/15 bg-black/70 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/75">
			<div>output mode: {mode}</div>
			<div>editor shell mounted: {editorShellMounted ? 'yes' : 'no'}</div>
			<div>HUD mounted: {hudMounted ? 'yes' : 'no'}</div>
			<div>diagnostics mounted: {diagnosticsMounted ? 'yes' : 'no'}</div>
			<div>
				backing: {backing.backingWidth}×{backing.backingHeight} · css:{' '}
				{backing.cssWidth}×{backing.cssHeight}
			</div>
			<div>
				DPR: {backing.effectiveDpr.toFixed(2)} · render scale:{' '}
				{recordingRenderScale.toFixed(2)}
			</div>
			<div>
				approx FPS: {sample ? sample.fps.toFixed(1) : '…'} · frame:{' '}
				{sample ? `${sample.frameMs.toFixed(2)} ms` : '…'}
			</div>
		</div>
	);
}
