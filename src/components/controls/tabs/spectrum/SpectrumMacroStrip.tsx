import { clamp, lerp } from '@/lib/math';
import { useWallpaperStore } from '@/store/wallpaperStore';
import SliderControl from '../../SliderControl';

function inferEnergy(opacity: number): number {
	return clamp((opacity - 0.35) / 0.65, 0, 1);
}

function inferSoftness(smoothing: number): number {
	return clamp((smoothing - 0.12) / 0.83, 0, 1);
}

function inferChaos(rotation: number): number {
	const n = Math.min(Math.abs(rotation) / 2.2, 1);
	return clamp(n, 0, 1);
}

export function SpectrumMacroStrip() {
	const store = useWallpaperStore();

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
				value={inferEnergy(store.spectrumOpacity)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					useWallpaperStore.setState({
						spectrumOpacity: lerp(0.35, 1, v),
						spectrumGlowIntensity: lerp(4, 42, v),
						spectrumMaxHeight: lerp(0.42, 0.92, v)
					});
				}}
			/>
			<SliderControl
				label="Softness"
				value={inferSoftness(store.spectrumSmoothing)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					useWallpaperStore.setState({
						spectrumSmoothing: lerp(0.12, 0.95, v),
						spectrumShadowBlur: lerp(2, 28, v),
						spectrumPeakDecay: lerp(0.06, 0.45, v)
					});
				}}
			/>
			<SliderControl
				label="Chaos"
				value={inferChaos(store.spectrumRotationSpeed)}
				min={0}
				max={1}
				step={0.02}
				onChange={v => {
					const sign =
						store.spectrumRotationSpeed >= 0 ? 1 : -1;
					useWallpaperStore.setState({
						spectrumRotationSpeed: sign * lerp(0, 2.1, v),
						spectrumMotionTrails: lerp(0, 0.45, v * v),
						spectrumPeakRibbons: lerp(0, 0.35, v)
					});
				}}
			/>
		</div>
	);
}
