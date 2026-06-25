import { getColor, createWaveGradient } from '../../color/spectrumColor';
import {
	normalizeAngle,
	getRadialBaseRadius
} from '../../geometry/radialGeometry';
import {
	computeClassicGlowBlur,
	drawClassicGlowHaloPass
} from '../linear/linearRenderer';
import { resolveManualGlow } from '../../effects/manualGlow';
import { drawRadialRgbSplitPass } from '../../effects/rgbSplitPass';
import { drawPeakSparksPass } from '../../effects/peakSparksPass';
import {
	drawNeonCorePass,
	resolveNeonCoreStrokeStyle
} from '../../effects/neonCorePass';
import { resolveGradientFlowPhase } from '../../effects/gradientFlow';
import type { SpectrumSettings } from '../../runtime/spectrumRuntime';

export type RadialWaveFrameContext = {
	audioEnergy?: number;
	dt?: number;
};

export function drawPeakMarker(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
) {
	ctx.fillStyle = '#ffffff';
	ctx.shadowBlur = 0;
	ctx.fillRect(x, y, width, height);
}

export function drawRadialBars(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	heights: Float32Array,
	peaks: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number
) {
	const {
		spectrumBarWidth,
		spectrumMinHeight,
		spectrumPeakHold,
		spectrumInnerRadius
	} = settings;
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? spectrumInnerRadius
			: 0;
	const glowBlur = computeClassicGlowBlur(settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const t = i / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const h = heights[i];
		const color = getColor(
			settings,
			normalizeAngle(angle + radialAngle + Math.PI / 2) / (Math.PI * 2)
		);
		const glow = resolveManualGlow(settings, t, color);
		const startX = cx + Math.cos(angle) * baseRadius;
		const startY = cy + Math.sin(angle) * baseRadius;
		drawClassicGlowHaloPass(
			ctx,
			glow.halo,
			settings,
			barCount,
			expansion => {
				ctx.save();
				ctx.translate(startX, startY);
				ctx.rotate(angle);
				ctx.fillRect(
					0,
					-(spectrumBarWidth + expansion) / 2,
					h + expansion,
					spectrumBarWidth + expansion
				);
				ctx.restore();
			}
		);
		ctx.save();
		ctx.translate(startX, startY);
		ctx.rotate(angle);
		ctx.fillStyle = color;
		ctx.shadowColor = glow.core;
		ctx.shadowBlur = glowBlur;
		ctx.fillRect(0, -spectrumBarWidth / 2, h, spectrumBarWidth);
		if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
			ctx.fillStyle = glow.peak ?? '#ffffff';
			ctx.shadowBlur = 0;
			ctx.fillRect(peaks[i], -spectrumBarWidth / 2, 2, spectrumBarWidth);
		}
		ctx.restore();
	}
}

export function drawRadialBlocks(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number
) {
	const { spectrumBarWidth, spectrumInnerRadius } = settings;
	const baseSegmentLength = Math.max(10, spectrumBarWidth * 3.6);
	const baseSegmentGap = Math.max(2, spectrumBarWidth * 0.75);
	const maxSegmentsPerBar = barCount > 180 ? 4 : barCount > 120 ? 5 : 6;
	const shadowBlur = computeClassicGlowBlur(settings, barCount, {
		lowDensityCap: 10,
		highDensityCap: 6
	});
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? spectrumInnerRadius
			: 0;
	for (let i = 0; i < barCount; i++) {
		const t = i / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const h = heights[i];
		const color = getColor(
			settings,
			normalizeAngle(angle + radialAngle + Math.PI / 2) / (Math.PI * 2)
		);
		const startX = cx + Math.cos(angle) * baseRadius;
		const startY = cy + Math.sin(angle) * baseRadius;
		const estimatedSegments = Math.max(
			1,
			Math.round(
				(h + baseSegmentGap) / (baseSegmentLength + baseSegmentGap)
			)
		);
		const segments = Math.min(maxSegmentsPerBar, estimatedSegments);
		const segmentGap = Math.min(baseSegmentGap, h * 0.18);
		const segmentLength = Math.max(
			baseSegmentLength,
			(h - Math.max(0, segments - 1) * segmentGap) / segments
		);
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			ctx.save();
			ctx.translate(startX, startY);
			ctx.rotate(angle);
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > h) break;
				ctx.fillRect(
					offset,
					-(spectrumBarWidth + expansion) / 2,
					Math.min(segmentLength, h - offset) + expansion * 0.35,
					spectrumBarWidth + expansion
				);
			}
			ctx.restore();
		});
		ctx.save();
		ctx.translate(startX, startY);
		ctx.rotate(angle);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = shadowBlur;
		for (let segment = 0; segment < segments; segment++) {
			const offset = segment * (segmentLength + segmentGap);
			if (offset > h) break;
			ctx.fillRect(
				offset,
				-spectrumBarWidth / 2,
				Math.min(segmentLength, h - offset),
				spectrumBarWidth
			);
		}
		ctx.restore();
	}
}

function drawLedCell(
	ctx: CanvasRenderingContext2D,
	shape: SpectrumSettings['spectrumLedShape'],
	x: number,
	y: number,
	size: number,
	rotation: number
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	if (shape === 'circle') {
		ctx.beginPath();
		ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
		ctx.fill();
	} else if (shape === 'rounded') {
		const left = -size / 2;
		const top = -size / 2;
		const radius = size * 0.22;
		ctx.beginPath();
		if (typeof ctx.roundRect === 'function') {
			ctx.roundRect(left, top, size, size, radius);
		} else {
			ctx.rect(left, top, size, size);
		}
		ctx.fill();
	} else {
		if (shape === 'diamond') ctx.rotate(Math.PI / 4);
		ctx.fillRect(-size / 2, -size / 2, size, size);
	}
	ctx.restore();
}

export function drawRadialPixel(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number
) {
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? settings.spectrumInnerRadius
			: 0;
	const cellSize = Math.max(
		2,
		settings.spectrumBarWidth *
			Math.max(0.35, Math.min(4, settings.spectrumLedCellSize ?? 1))
	);
	const cellGap = Math.max(
		0,
		cellSize * Math.max(0, Math.min(2, settings.spectrumLedCellGap ?? 0.28))
	);
	const cellPitch = Math.max(1, cellSize + cellGap);
	const maxCells = barCount > 180 ? 20 : barCount > 120 ? 28 : 40;
	const glowBlur = computeClassicGlowBlur(settings, barCount, {
		lowDensityCap: 12,
		highDensityCap: 8
	});
	const ledAngle = ((settings.spectrumLedAngle ?? 0) * Math.PI) / 180;

	for (let i = 0; i < barCount; i++) {
		const t = i / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			settings.spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const h = heights[i];
		const color = getColor(
			settings,
			normalizeAngle(angle + radialAngle + Math.PI / 2) / (Math.PI * 2)
		);
		const glow = resolveManualGlow(settings, t, color);
		const litCells = Math.min(maxCells, Math.floor(h / cellPitch));
		if (litCells <= 0) continue;
		const cellRotation = angle + ledAngle;

		ctx.fillStyle = color;
		ctx.shadowColor = glow.core;
		ctx.shadowBlur = glowBlur;
		for (let cell = 0; cell < litCells; cell++) {
			const radius = baseRadius + cellSize / 2 + cell * cellPitch;
			drawLedCell(
				ctx,
				settings.spectrumLedShape,
				cx + Math.cos(angle) * radius,
				cy + Math.sin(angle) * radius,
				cellSize,
				cellRotation
			);
		}

		if (settings.spectrumNeonCore) {
			const coreSize =
				cellSize *
				Math.max(0.15, Math.min(0.8, settings.spectrumNeonCoreWidth));
			ctx.save();
			ctx.fillStyle = resolveNeonCoreStrokeStyle(
				settings,
				settings.spectrumNeonCoreIntensity
			);
			ctx.shadowBlur = 0;
			ctx.globalAlpha *=
				0.55 + Math.max(0, settings.spectrumNeonCoreIntensity) * 0.25;
			for (let cell = 0; cell < litCells; cell++) {
				const radius = baseRadius + cellSize / 2 + cell * cellPitch;
				drawLedCell(
					ctx,
					settings.spectrumLedShape,
					cx + Math.cos(angle) * radius,
					cy + Math.sin(angle) * radius,
					coreSize,
					cellRotation
				);
			}
			ctx.restore();
		}

		if (
			settings.spectrumManualGlow &&
			settings.spectrumManualGlowMode === 'peaks'
		) {
			ctx.fillStyle = glow.peak ?? glow.halo;
			ctx.shadowColor = glow.halo;
			ctx.shadowBlur = glowBlur;
			const radius = baseRadius + Math.max(0, litCells - 1) * cellPitch;
			drawLedCell(
				ctx,
				settings.spectrumLedShape,
				cx + Math.cos(angle) * radius,
				cy + Math.sin(angle) * radius,
				cellSize,
				cellRotation
			);
		}
	}

	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		const t = index / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			settings.spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const radius = baseRadius + heights[index];
		ctx.beginPath();
		ctx.arc(
			cx + Math.cos(angle) * radius,
			cy + Math.sin(angle) * radius,
			size * 0.45,
			0,
			Math.PI * 2
		);
		ctx.fill();
	});
}

export function drawRadialWave(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	cx: number,
	cy: number,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number,
	frame: RadialWaveFrameContext = {}
) {
	const { audioEnergy = 0, dt = 1 / 60 } = frame;
	const gradientPhase = resolveGradientFlowPhase(settings, audioEnergy, dt);
	const gradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		'radial',
		cx,
		cy,
		settings.spectrumInnerRadius + settings.spectrumMaxHeight,
		rotationOffset + radialAngle,
		gradientPhase
	);
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? settings.spectrumInnerRadius
			: 0;
	const referencePx = Math.min(canvas.width, canvas.height);

	const traceRadialWave = (radiusOffset: number) => {
		ctx.beginPath();
		for (let i = 0; i <= barCount; i++) {
			const t = (i % barCount) / barCount;
			const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
			const baseRadius = getRadialBaseRadius(
				settings.spectrumRadialShape,
				settings.spectrumInnerRadius,
				angle,
				radialAngle,
				safeRadius
			);
			const radius = baseRadius + heights[i % barCount] + radiusOffset;
			const x = cx + Math.cos(angle) * radius;
			const y = cy + Math.sin(angle) * radius;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
	};

	traceRadialWave(0);
	ctx.fillStyle = gradient;
	ctx.save();
	ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
	ctx.fill();
	ctx.restore();

	traceRadialWave(0);
	const waveGlow = resolveManualGlow(
		settings,
		0.5,
		settings.spectrumPrimaryColor
	);

	drawClassicGlowHaloPass(
		ctx,
		waveGlow.halo,
		settings,
		barCount,
		expansion => {
			traceRadialWave(0);
			ctx.lineWidth = settings.spectrumBarWidth + expansion * 1.2;
			ctx.strokeStyle = waveGlow.halo;
			ctx.stroke();
		},
		{ alphaBoost: 0.22, expansionMultiplier: 1.25 }
	);

	drawRadialRgbSplitPass(
		ctx,
		settings,
		referencePx,
		barCount,
		settings.spectrumBarWidth,
		traceRadialWave
	);

	traceRadialWave(0);
	ctx.strokeStyle = gradient;
	ctx.lineWidth = settings.spectrumBarWidth;
	ctx.shadowColor = waveGlow.core;
	ctx.shadowBlur = computeClassicGlowBlur(settings, barCount);
	ctx.save();
	ctx.stroke();
	ctx.restore();
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';

	if (settings.spectrumNeonCore) {
		traceRadialWave(0);
		drawNeonCorePass(
			ctx,
			settings.spectrumBarWidth,
			settings.spectrumNeonCoreIntensity,
			settings.spectrumNeonCoreWidth,
			resolveNeonCoreStrokeStyle(
				settings,
				settings.spectrumNeonCoreIntensity
			)
		);
	}

	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		const t = index / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			settings.spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const radius = baseRadius + heights[index];
		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;
		ctx.beginPath();
		ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
		ctx.fill();
	});
}

export function drawRadialDots(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number
) {
	const dotRadius = Math.max(settings.spectrumBarWidth * 0.8, 1.5);
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? settings.spectrumInnerRadius
			: 0;
	const glowBlur = computeClassicGlowBlur(settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const t = i / barCount;
		const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2;
		const baseRadius = getRadialBaseRadius(
			settings.spectrumRadialShape,
			settings.spectrumInnerRadius,
			angle,
			radialAngle,
			safeRadius
		);
		const radius = baseRadius + heights[i];
		const color = getColor(
			settings,
			normalizeAngle(angle + radialAngle + Math.PI / 2) / (Math.PI * 2)
		);
		ctx.beginPath();
		ctx.arc(
			cx + Math.cos(angle) * radius,
			cy + Math.sin(angle) * radius,
			dotRadius,
			0,
			Math.PI * 2
		);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			ctx.beginPath();
			ctx.arc(
				cx + Math.cos(angle) * radius,
				cy + Math.sin(angle) * radius,
				dotRadius + expansion * 0.45,
				0,
				Math.PI * 2
			);
			ctx.fill();
		});
		ctx.shadowBlur = glowBlur;
		ctx.fill();
	}
}
