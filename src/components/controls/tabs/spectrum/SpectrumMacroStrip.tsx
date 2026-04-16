import { useEffect } from 'react';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { clamp, lerp } from '@/lib/math';
import { useWallpaperStore } from '@/store/wallpaperStore';
import SliderControl from '../../SliderControl';

function inverseLerp(value: number, min: number, max: number): number {
	if (max <= min) return 0;
	return clamp((value - min) / (max - min), 0, 1);
}

function clampToRange(
	value: number,
	range: { min: number; max: number }
): number {
	return clamp(value, range.min, range.max);
}

function getEnergyHeightRange(
	spectrumMode: 'radial' | 'linear',
	spectrumFamily: string
): [number, number] {
	if (spectrumFamily === 'tunnel') return [70, 220];
	if (spectrumFamily === 'orbital') return [60, 170];
	if (spectrumFamily === 'liquid') {
		return spectrumMode === 'linear' ? [60, 190] : [45, 165];
	}
	if (spectrumFamily === 'oscilloscope') {
		return spectrumMode === 'linear' ? [50, 165] : [40, 145];
	}
	return spectrumMode === 'linear' ? [55, 220] : [40, 180];
}

function getEnergyGlowRange(spectrumFamily: string): [number, number] {
	return spectrumFamily === 'classic' ? [0.15, 2.2] : [0.1, 1.8];
}

function getChaosRotationMax(
	spectrumMode: 'radial' | 'linear',
	spectrumFamily: string
): number {
	if (spectrumFamily === 'orbital') return 1.4;
	if (spectrumFamily === 'tunnel') return 1.15;
	if (spectrumFamily === 'liquid') return spectrumMode === 'radial' ? 0.9 : 0.45;
	if (spectrumFamily === 'oscilloscope') return spectrumMode === 'radial' ? 0.75 : 0.3;
	return spectrumMode === 'radial' ? 0.85 : 0.25;
}

function inferEnergy(
	opacity: number,
	maxHeight: number,
	glowIntensity: number,
	spectrumMode: 'radial' | 'linear',
	spectrumFamily: string
): number {
	const [heightMin, heightMax] = getEnergyHeightRange(
		spectrumMode,
		spectrumFamily
	);
	const [glowMin, glowMax] = getEnergyGlowRange(spectrumFamily);
	const heightT = inverseLerp(maxHeight, heightMin, heightMax);
	const opacityT = inverseLerp(opacity, 0.5, 1);
	const glowT = inverseLerp(glowIntensity, glowMin, glowMax);
	return clamp(heightT * 0.55 + opacityT * 0.25 + glowT * 0.2, 0, 1);
}

function inferSoftness(
	smoothing: number,
	shadowBlur: number,
	afterglow: number
): number {
	const smoothingT = inverseLerp(smoothing, 0.18, 0.94);
	const blurT = inverseLerp(shadowBlur, 0, 26);
	const afterglowT = inverseLerp(afterglow, 0, 0.28);
	return clamp(smoothingT * 0.6 + blurT * 0.25 + afterglowT * 0.15, 0, 1);
}

function inferChaos(
	rotation: number,
	motionTrails: number,
	peakRibbons: number,
	spectrumMode: 'radial' | 'linear',
	spectrumFamily: string
): number {
	const rotationT = inverseLerp(
		Math.abs(rotation),
		0,
		getChaosRotationMax(spectrumMode, spectrumFamily)
	);
	const trailT = inverseLerp(motionTrails, 0, 0.32);
	const ribbonT = inverseLerp(peakRibbons, 0, 0.42);
	return clamp(rotationT * 0.45 + trailT * 0.3 + ribbonT * 0.25, 0, 1);
}

export function SpectrumMacroStrip() {
	const store = useWallpaperStore();
	const [energyHeightMin, energyHeightMax] = getEnergyHeightRange(
		store.spectrumMode,
		store.spectrumFamily
	);
	const [energyGlowMin, energyGlowMax] = getEnergyGlowRange(
		store.spectrumFamily
	);
	const chaosRotationMax = getChaosRotationMax(
		store.spectrumMode,
		store.spectrumFamily
	);
	const supportsFillControl =
		store.spectrumShape === 'wave' ||
		store.spectrumFamily === 'liquid' ||
		store.spectrumFamily === 'oscilloscope';

	useEffect(() => {
		const patch: Partial<typeof store> = {};
		const clampedMaxHeight = clampToRange(
			store.spectrumMaxHeight,
			SPECTRUM_RANGES.maxHeight
		);
		if (clampedMaxHeight !== store.spectrumMaxHeight) {
			patch.spectrumMaxHeight = clampedMaxHeight;
		}
		const clampedGlow = clampToRange(
			store.spectrumGlowIntensity,
			SPECTRUM_RANGES.glowIntensity
		);
		if (clampedGlow !== store.spectrumGlowIntensity) {
			patch.spectrumGlowIntensity = clampedGlow;
		}
		const clampedPeakDecay = clampToRange(
			store.spectrumPeakDecay,
			SPECTRUM_RANGES.peakDecay
		);
		if (clampedPeakDecay !== store.spectrumPeakDecay) {
			patch.spectrumPeakDecay = clampedPeakDecay;
		}
		if (Object.keys(patch).length > 0) {
			useWallpaperStore.setState(patch);
		}
	}, [
		store.spectrumGlowIntensity,
		store.spectrumMaxHeight,
		store.spectrumPeakDecay
	]);

	return (
		<div
			className="mb-3 rounded-lg border p-2"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-tag-bg)'
			}}
		>
			<div
				className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				Macros
			</div>
			<SliderControl
				label="Energy"
				value={inferEnergy(
					store.spectrumOpacity,
					store.spectrumMaxHeight,
					store.spectrumGlowIntensity,
					store.spectrumMode,
					store.spectrumFamily
				)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					useWallpaperStore.setState({
						spectrumOpacity: clampToRange(
							lerp(0.5, 1, v),
							SPECTRUM_RANGES.opacity
						),
						spectrumGlowIntensity: clampToRange(
							lerp(energyGlowMin, energyGlowMax, v),
							SPECTRUM_RANGES.glowIntensity
						),
						spectrumMaxHeight: clampToRange(
							lerp(energyHeightMin, energyHeightMax, v),
							SPECTRUM_RANGES.maxHeight
						),
						spectrumMinHeight: clampToRange(
							lerp(1, 4.5, v),
							SPECTRUM_RANGES.minHeight
						)
					});
				}}
			/>
			<SliderControl
				label="Softness"
				value={inferSoftness(
					store.spectrumSmoothing,
					store.spectrumShadowBlur,
					store.spectrumAfterglow
				)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					useWallpaperStore.setState({
						spectrumSmoothing: clampToRange(
							lerp(0.18, 0.94, v),
							SPECTRUM_RANGES.smoothing
						),
						spectrumShadowBlur: clampToRange(
							lerp(0, 26, v),
							SPECTRUM_RANGES.shadowBlur
						),
						spectrumPeakDecay: clampToRange(
							lerp(0.016, 0.002, v),
							SPECTRUM_RANGES.peakDecay
						),
						spectrumAfterglow: clampToRange(
							lerp(0, store.spectrumFamily === 'classic' ? 0.18 : 0.28, v),
							SPECTRUM_RANGES.afterglow
						),
						...(supportsFillControl
							? {
									spectrumWaveFillOpacity: clampToRange(
										lerp(0.05, 0.32, v),
										SPECTRUM_RANGES.waveFillOpacity
									)
								}
							: {})
					});
				}}
			/>
			<SliderControl
				label="Chaos"
				value={inferChaos(
					store.spectrumRotationSpeed,
					store.spectrumMotionTrails,
					store.spectrumPeakRibbons,
					store.spectrumMode,
					store.spectrumFamily
				)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					const sign =
						store.spectrumRotationSpeed >= 0 ? 1 : -1;
					useWallpaperStore.setState({
						spectrumRotationSpeed: clamp(
							sign * lerp(0, chaosRotationMax, v),
							SPECTRUM_RANGES.rotationSpeed.min,
							SPECTRUM_RANGES.rotationSpeed.max
						),
						spectrumMotionTrails: clampToRange(
							lerp(0, store.spectrumFamily === 'orbital' ? 0.36 : 0.24, v),
							SPECTRUM_RANGES.motionTrails
						),
						spectrumPeakRibbons: clampToRange(
							lerp(0, 0.42, v),
							SPECTRUM_RANGES.peakRibbons
						),
						spectrumGhostFrames: clampToRange(
							lerp(0, 0.18, v * 0.9),
							SPECTRUM_RANGES.ghostFrames
						)
					});
				}}
			/>
		</div>
	);
}
