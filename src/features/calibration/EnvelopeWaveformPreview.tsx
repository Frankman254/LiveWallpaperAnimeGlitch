/**
 * Visualizes how the current calibration values transform an audio signal.
 *
 * Two modes:
 *  - Live: reads the active channel from the audio context every frame and
 *    runs it through a local `createAudioEnvelope()` configured with the
 *    user's current sliders. Useful when audio is playing.
 *  - Synthetic: generates a periodic test pulse so the user can see the
 *    envelope shape in silence.
 *
 * Used inside CalibrationTab under each group that owns a full envelope
 * (Logo, BG Zoom).
 */

import { useEffect, useRef } from 'react';
import { useAudioContext } from '@/context/useAudioContext';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import { syntheticKickValue } from '@/features/calibration/syntheticDrive';
import { Button, SegmentedControl, UI_COLORS, FONT } from '@/ui';
import type { AudioReactiveChannel } from '@/types/wallpaper';
import type { CalibrationGroupId } from '@/features/calibration/calibrationConfig';

type PreviewMode = 'live' | 'synthetic';

export interface EnvelopePreviewParams {
	attack: number;
	release: number;
	responseSpeed: number;
	peakWindow: number;
	peakFloor: number;
	punch: number;
	scaleIntensity: number;
}

interface Props {
	title: string;
	/**
	 * Calibration group this preview belongs to. The Real/Sintético switch is
	 * stored per group so each tab keeps its own state, and "Sintético" also
	 * drives the matching real element (logo, BG zoom) while selected.
	 */
	groupId: CalibrationGroupId;
	channel: AudioReactiveChannel;
	preGain: number;
	params: EnvelopePreviewParams;
	/** Hex stroke color for the envelope curve. */
	envelopeColor?: string;
}

const HISTORY_SAMPLES = 240;
const CANVAS_HEIGHT = 96;

function resolveChannelValue(
	channels: Record<string, number>,
	channel: AudioReactiveChannel
): number {
	if (channel === 'auto') return channels.kick ?? 0;
	return channels[channel] ?? 0;
}

export function EnvelopeWaveformPreview({
	title,
	groupId,
	channel,
	preGain,
	params,
	envelopeColor = '#7dd3fc'
}: Props) {
	const { getAudioSnapshot } = useAudioContext();
	const audioPaused = useWallpaperStore(s => s.audioPaused);
	const mode: PreviewMode = useWallpaperStore(s =>
		s.calibrationSyntheticGroups[groupId] ? 'synthetic' : 'live'
	);
	const setCalibrationSyntheticMode = useWallpaperStore(
		s => s.setCalibrationSyntheticMode
	);
	const setMode = (next: PreviewMode) =>
		setCalibrationSyntheticMode(groupId, next === 'synthetic');
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rawHistoryRef = useRef<number[]>(
		Array.from({ length: HISTORY_SAMPLES }, () => 0)
	);
	const envHistoryRef = useRef<number[]>(
		Array.from({ length: HISTORY_SAMPLES }, () => 0)
	);
	const envelopeRef = useRef(createAudioEnvelope());
	const lastTimeRef = useRef<number>(performance.now());
	const syntheticTimeRef = useRef<number>(0);

	useEffect(() => {
		let frameId = 0;
		function step() {
			const canvas = canvasRef.current;
			if (!canvas) {
				frameId = requestAnimationFrame(step);
				return;
			}
			const now = performance.now();
			const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
			lastTimeRef.current = now;

			let rawAmplitude = 0;
			if (mode === 'live') {
				const snap = getAudioSnapshot();
				const channelLevel = resolveChannelValue(
					snap.channels as unknown as Record<string, number>,
					channel
				);
				rawAmplitude = Math.min(3.2, Math.max(0, channelLevel) * preGain);
			} else {
				// Synthetic kick at ~120 BPM — same shape the live render uses
				// when this group's "Sintético" mode is on.
				syntheticTimeRef.current += dt;
				const pulse = syntheticKickValue(syntheticTimeRef.current);
				rawAmplitude = Math.min(3.2, pulse * preGain);
			}

			const env = envelopeRef.current.tick(rawAmplitude, dt, {
				...params,
				min: 0,
				max: 1
			});

			rawHistoryRef.current.shift();
			rawHistoryRef.current.push(Math.min(1, rawAmplitude / 1.5));
			envHistoryRef.current.shift();
			envHistoryRef.current.push(env.value);

			drawCanvas(
				canvas,
				rawHistoryRef.current,
				envHistoryRef.current,
				envelopeColor
			);

			frameId = requestAnimationFrame(step);
		}
		frameId = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frameId);
	}, [mode, channel, preGain, params, envelopeColor, getAudioSnapshot]);

	function reset() {
		envelopeRef.current.reset();
		rawHistoryRef.current = Array.from({ length: HISTORY_SAMPLES }, () => 0);
		envHistoryRef.current = Array.from({ length: HISTORY_SAMPLES }, () => 0);
		syntheticTimeRef.current = 0;
	}

	const liveAvailable = !audioPaused;

	return (
		<div
			className="flex flex-col gap-1.5 rounded-md border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.overlay
			}}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex flex-col">
					<span
						className="text-[10px] uppercase tracking-wider"
						style={{
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono,
							letterSpacing: '0.08em'
						}}
					>
						{title}
					</span>
					<span
						className="text-[9px]"
						style={{ color: UI_COLORS.fgMute }}
					>
						{mode === 'live'
							? liveAvailable
								? `canal: ${channel}`
								: 'audio pausado'
							: 'kick sintético @ 120 BPM'}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<SegmentedControl<PreviewMode>
						value={mode}
						onChange={setMode}
						options={[
							{ value: 'live', label: 'Real' },
							{ value: 'synthetic', label: 'Sintético' }
						]}
						size="sm"
					/>
					<Button
						size="sm"
						density="compact"
						variant="ghost"
						onClick={reset}
					>
						Reset
					</Button>
				</div>
			</div>
			<canvas
				ref={canvasRef}
				width={HISTORY_SAMPLES}
				height={CANVAS_HEIGHT}
				className="w-full rounded-sm"
				style={{
					background: UI_COLORS.panel,
					height: CANVAS_HEIGHT,
					imageRendering: 'pixelated'
				}}
			/>
			<div
				className="flex items-center gap-3 text-[9px]"
				style={{ color: UI_COLORS.fgMute }}
			>
				<span className="inline-flex items-center gap-1">
					<span
						className="inline-block h-0.5 w-3"
						style={{ background: UI_COLORS.fgMute }}
					/>
					señal raw
				</span>
				<span className="inline-flex items-center gap-1">
					<span
						className="inline-block h-0.5 w-3"
						style={{ background: envelopeColor }}
					/>
					envelope
				</span>
			</div>
		</div>
	);
}

function drawCanvas(
	canvas: HTMLCanvasElement,
	raw: number[],
	envelope: number[],
	envelopeColor: string
) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const { width, height } = canvas;
	ctx.clearRect(0, 0, width, height);

	// baseline grid (3 horizontal lines)
	ctx.strokeStyle = 'rgba(255,255,255,0.06)';
	ctx.lineWidth = 1;
	for (let i = 1; i < 4; i++) {
		const y = (height / 4) * i;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}

	// raw signal (dim)
	drawCurve(ctx, raw, width, height, 'rgba(255,255,255,0.35)', 1);
	// envelope (highlight)
	drawCurve(ctx, envelope, width, height, envelopeColor, 1.8);
}

function drawCurve(
	ctx: CanvasRenderingContext2D,
	samples: number[],
	width: number,
	height: number,
	color: string,
	lineWidth: number
) {
	if (samples.length < 2) return;
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.beginPath();
	const step = width / (samples.length - 1);
	for (let i = 0; i < samples.length; i++) {
		const v = Math.max(0, Math.min(1, samples[i] ?? 0));
		const x = i * step;
		const y = height - v * (height - 2) - 1;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();
}
