import { useEffect, useRef } from 'react';
import { useAudioData } from '@/hooks/useAudioData';
import { useT } from '@/lib/i18n';
import {
	buildChannelWeightedCurve,
	downsampleFftMax
} from '@/lib/audio/spectrumBinSampling';
import {
	getDebugBgAudio,
	getDebugLogoAudio,
	getDebugSpectrumClone,
	getDebugSpectrumPrimary
} from '@/lib/debug/frameAudioDebugSnapshot';

const FFT_BUCKETS = 52;
const BG_BAND_BARS = 32;
const LOGO_BAND_BARS = 32;

function drawBarRow(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	values: number[],
	color: string
) {
	const n = values.length;
	if (n === 0 || h <= 0) return;
	const gap = 0.5;
	const barW = Math.max(0.5, (w - (n - 1) * gap) / n);
	for (let i = 0; i < n; i++) {
		const v = Math.max(0, Math.min(1, values[i] ?? 0));
		const bh = Math.max(0.5, v * h);
		ctx.fillStyle = color;
		ctx.fillRect(x + i * (barW + gap), y + h - bh, barW, bh);
	}
}

function paintCanvas(
	canvas: HTMLCanvasElement | null,
	full: number[],
	weighted: number[],
	accent: string
) {
	if (!canvas) return;
	const dpr = Math.min(
		2,
		typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
	);
	const rect = canvas.getBoundingClientRect();
	const cssW = Math.max(120, rect.width);
	const cssH = 52;
	canvas.width = Math.floor(cssW * dpr);
	canvas.height = Math.floor(cssH * dpr);
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = '#0c1218';
	ctx.fillRect(0, 0, cssW, cssH);
	const mid = cssH * 0.5;
	const rowH = mid - 2;
	drawBarRow(ctx, 0, 1, cssW, rowH, full, '#3d4f5c');
	drawBarRow(ctx, 0, mid + 1, cssW, rowH, weighted, accent);
}

export default function DiagnosticsAudioPreviews() {
	const t = useT();
	const { getAudioSnapshot } = useAudioData();
	const canvasBg = useRef<HTMLCanvasElement>(null);
	const canvasSp = useRef<HTMLCanvasElement>(null);
	const canvasSpCl = useRef<HTMLCanvasElement>(null);
	const canvasLg = useRef<HTMLCanvasElement>(null);
	const lineBg = useRef<HTMLSpanElement>(null);
	const lineSp = useRef<HTMLSpanElement>(null);
	const lineSpCl = useRef<HTMLSpanElement>(null);
	const lineLg = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		let id = 0;
		const accentBg = '#5eead4';
		const accentSp = '#67e8f9';
		const accentSpCl = '#a78bfa';
		const accentLg = '#fbbf24';

		const tick = () => {
			id = requestAnimationFrame(tick);
			const audio = getAudioSnapshot();
			const bins = audio.bins;
			const full = downsampleFftMax(bins, FFT_BUCKETS);

			const bgSnap = getDebugBgAudio();
			const bgWeighted =
				bgSnap && bins.length > 0
					? buildChannelWeightedCurve(
							bins,
							BG_BAND_BARS,
							bgSnap.resolvedChannel
						)
					: [];

			const spSnap = getDebugSpectrumPrimary();
			const spBars = spSnap && spSnap.barCount > 0 ? spSnap.barCount : 24;
			const spWeighted =
				spSnap && bins.length > 0
					? buildChannelWeightedCurve(
							bins,
							spBars,
							spSnap.resolvedChannel
						)
					: [];

			const clSnap = getDebugSpectrumClone();
			const clBars = clSnap && clSnap.barCount > 0 ? clSnap.barCount : 24;
			const clWeighted =
				clSnap && bins.length > 0
					? buildChannelWeightedCurve(
							bins,
							clBars,
							clSnap.resolvedChannel
						)
					: [];

			const lgSnap = getDebugLogoAudio();
			const lgWeighted =
				lgSnap && bins.length > 0
					? buildChannelWeightedCurve(
							bins,
							LOGO_BAND_BARS,
							lgSnap.resolvedChannel
						)
					: [];

			paintCanvas(canvasBg.current, full, bgWeighted, accentBg);
			paintCanvas(canvasSp.current, full, spWeighted, accentSp);
			paintCanvas(canvasSpCl.current, full, clWeighted, accentSpCl);
			paintCanvas(canvasLg.current, full, lgWeighted, accentLg);

			if (lineBg.current) {
				lineBg.current.textContent = bgSnap
					? `${bgSnap.resolvedChannel} req=${bgSnap.requestChannel} · inst ${bgSnap.channelInstant.toFixed(2)} sm ${bgSnap.channelRouterSmoothed.toFixed(2)} · boost ${bgSnap.envelopeBoost.toFixed(2)}`
					: t.label_diag_waiting;
			}
			if (lineSp.current) {
				lineSp.current.textContent = spSnap
					? `${spSnap.resolvedChannel} req=${spSnap.bandModeRequested} · inst ${spSnap.channelInstant.toFixed(2)} sm ${spSnap.channelRouterSmoothed.toFixed(2)} · mean ${spSnap.meanBinEnergy.toFixed(2)} · gain ${spSnap.globalGain.toFixed(2)} · bars ${spSnap.barCount}`
					: t.label_diag_waiting_spectrum;
			}
			if (lineSpCl.current) {
				lineSpCl.current.textContent = clSnap
					? `${clSnap.resolvedChannel} req=${clSnap.bandModeRequested} · inst ${clSnap.channelInstant.toFixed(2)} · gain ${clSnap.globalGain.toFixed(2)} · bars ${clSnap.barCount}`
					: t.label_diag_clone_idle_preview;
			}
			if (lineLg.current) {
				lineLg.current.textContent = lgSnap
					? `${lgSnap.resolvedChannel} req=${lgSnap.bandModeRequested} · inst ${lgSnap.channelInstant.toFixed(2)} sm ${lgSnap.channelRouterSmoothed.toFixed(2)} · drive×sens ${lgSnap.driveScaled.toFixed(2)} · env ${lgSnap.envelopeScale.toFixed(2)}`
					: t.label_diag_waiting_logo;
			}
		};
		id = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(id);
	}, [getAudioSnapshot, t]);

	return (
		<div className="flex flex-col gap-4">
			<p className="text-[11px] leading-snug text-cyan-800">
				{t.hint_diagnostics_previews}
			</p>

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between gap-2">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-teal-500">
						{t.label_diag_bg}
					</span>
					<span className="text-[9px] text-gray-600">
						{t.label_diag_row_fft} / {t.label_diag_row_band}
					</span>
				</div>
				<canvas
					ref={canvasBg}
					className="h-13 w-full rounded border border-cyan-950/80"
				/>
				<span
					ref={lineBg}
					className="block font-mono text-[10px] leading-tight text-gray-400"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between gap-2">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-500">
						{t.label_diag_spectrum}
					</span>
					<span className="text-[9px] text-gray-600">
						{t.label_diag_row_fft} / {t.label_diag_row_band}
					</span>
				</div>
				<canvas
					ref={canvasSp}
					className="h-13 w-full rounded border border-cyan-950/80"
				/>
				<span
					ref={lineSp}
					className="block font-mono text-[10px] leading-tight text-gray-400"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between gap-2">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">
						{t.label_diag_spectrum_clone}
					</span>
					<span className="text-[9px] text-gray-600">
						{t.label_diag_row_fft} / {t.label_diag_row_band}
					</span>
				</div>
				<canvas
					ref={canvasSpCl}
					className="h-13 w-full rounded border border-cyan-950/80"
				/>
				<span
					ref={lineSpCl}
					className="block font-mono text-[10px] leading-tight text-gray-400"
				/>
			</div>

			<div className="flex flex-col gap-1">
				<div className="flex items-baseline justify-between gap-2">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">
						{t.label_diag_logo}
					</span>
					<span className="text-[9px] text-gray-600">
						{t.label_diag_row_fft} / {t.label_diag_row_band}
					</span>
				</div>
				<canvas
					ref={canvasLg}
					className="h-13 w-full rounded border border-cyan-950/80"
				/>
				<span
					ref={lineLg}
					className="block font-mono text-[10px] leading-tight text-gray-400"
				/>
			</div>
		</div>
	);
}
