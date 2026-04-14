import { getColor, createWaveGradient } from '../../color/spectrumColor';
import { normalizeAngle, getRadialBaseRadius } from '../../geometry/radialGeometry';
import type { SpectrumSettings } from '../../runtime/spectrumRuntime';

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
		spectrumGlowIntensity,
		spectrumShadowBlur,
		spectrumInnerRadius
	} = settings;
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
		ctx.save();
		ctx.translate(startX, startY);
		ctx.rotate(angle);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity;
		ctx.fillRect(0, -spectrumBarWidth / 2, h, spectrumBarWidth);
		if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
			ctx.fillStyle = '#ffffff';
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
	const {
		spectrumBarWidth,
		spectrumGlowIntensity,
		spectrumShadowBlur,
		spectrumInnerRadius
	} = settings;
	const baseSegmentLength = Math.max(10, spectrumBarWidth * 3.6);
	const baseSegmentGap = Math.max(2, spectrumBarWidth * 0.75);
	const maxSegmentsPerBar = barCount > 180 ? 4 : barCount > 120 ? 5 : 6;
	const shadowBlur = Math.min(
		spectrumShadowBlur * spectrumGlowIntensity,
		barCount > 160 ? 6 : 10
	);
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
			Math.round((h + baseSegmentGap) / (baseSegmentLength + baseSegmentGap))
		);
		const segments = Math.min(maxSegmentsPerBar, estimatedSegments);
		const segmentGap = Math.min(baseSegmentGap, h * 0.18);
		const segmentLength = Math.max(
			baseSegmentLength,
			(h - Math.max(0, segments - 1) * segmentGap) / segments
		);
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

export function drawRadialWave(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	cx: number,
	cy: number,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	rotationOffset: number,
	radialAngle: number
) {
	const gradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		'radial',
		cx,
		cy,
		settings.spectrumInnerRadius + settings.spectrumMaxHeight,
		rotationOffset + radialAngle
	);
	const safeRadius =
		settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
			? settings.spectrumInnerRadius
			: 0;
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
		const radius = baseRadius + heights[i % barCount];
		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.save();
	ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
	ctx.fill();
	ctx.restore();
	ctx.strokeStyle = gradient;
	ctx.lineWidth = settings.spectrumBarWidth;
	ctx.shadowColor = settings.spectrumPrimaryColor;
	ctx.shadowBlur =
		settings.spectrumShadowBlur * settings.spectrumGlowIntensity;
	ctx.stroke();
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
		ctx.shadowBlur =
			settings.spectrumShadowBlur * settings.spectrumGlowIntensity;
		ctx.fill();
	}
}
