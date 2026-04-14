import { useEffect, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { useAudioData } from '@/hooks/useAudioData';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { usePerformanceTelemetry } from '@/hooks/usePerformanceTelemetry';
import { AUDIO_ROUTING_RANGES } from '@/config/ranges';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	getSpectrumFamilyGpuCostHint,
	resolveSpectrumRenderQuality
} from '@/lib/visual/performanceQuality';
import { getScopedEditorThemeColorVars } from '../editorTheme';
import ToggleControl from '../ToggleControl';
import ResetButton from '../ui/ResetButton';
import TabSection from '../ui/TabSection';
import DiagnosticsAudioPreviews from './DiagnosticsAudioPreviews';
import SliderControl from '../SliderControl';

export default function DiagnosticsTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		store.editorThemeColorSource,
		backgroundPalette,
		store.editorTheme,
		{
			accent: store.editorManualAccentColor,
			secondary: store.editorManualSecondaryColor,
			backdrop: store.editorManualBackdropColor,
			textPrimary: store.editorManualTextPrimaryColor,
			textSecondary: store.editorManualTextSecondaryColor
		},
		{
			backdropOpacity: store.editorManualBackdropOpacity,
			blurPx: store.editorManualBlurPx,
			surfaceOpacity: store.editorManualSurfaceOpacity,
			itemOpacity: store.editorManualItemOpacity
		}
	);

	return (
		<div className="flex flex-col gap-2.5" style={themeVars}>
			<ResetButton label={t.reset_tab} onClick={onReset} />

			<p
				className="text-[11px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{t.hint_diagnostics_intro}
			</p>

			<TabSection title={t.section_diagnostics_huds}>
				<ToggleControl
					label={t.label_bg_scale_meter}
					value={store.showBackgroundScaleMeter}
					onChange={store.setShowBackgroundScaleMeter}
					tooltip={t.hint_bg_scale_meter}
				/>
				<ToggleControl
					label={t.label_spectrum_diag_toggle}
					value={store.showSpectrumDiagnosticsHud}
					onChange={store.setShowSpectrumDiagnosticsHud}
					tooltip={t.hint_spectrum_diag_hud}
				/>
				<ToggleControl
					label={t.label_logo_diag_toggle}
					value={store.showLogoDiagnosticsHud}
					onChange={store.setShowLogoDiagnosticsHud}
					tooltip={t.hint_logo_diag_hud}
				/>
			</TabSection>

			<TabSection title={t.section_diagnostics_previews}>
				<DiagnosticsAudioPreviews />
			</TabSection>

			<TabSection title={t.section_diagnostics_state_snapshot}>
				<DiagnosticsStateSnapshot />
			</TabSection>
		</div>
	);
}

function DiagnosticsStateSnapshot() {
	const t = useT();
	const store = useWallpaperStore();
	const { getAudioSnapshot } = useAudioData();
	const [audioValues, setAudioValues] = useState(() => getAudioSnapshot());

	useEffect(() => {
		let raf = 0;
		let alive = true;
		const tick = () => {
			if (!alive) return;
			setAudioValues(getAudioSnapshot());
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
		};
	}, [getAudioSnapshot]);

	const audioRows: Array<[string, string | number | boolean]> = [
		['Capture', store.audioCaptureState],
		['Audio paused', store.audioPaused],
		['Motion paused', store.motionPaused],
		['Amplitude', audioValues.amplitude.toFixed(3)],
		['Peak', audioValues.peak.toFixed(3)],
		['Channel full', audioValues.channels.full.toFixed(3)],
		['Channel kick', audioValues.channels.kick.toFixed(3)],
		['Channel instrumental', audioValues.channels.instrumental.toFixed(3)],
		['Channel bass', audioValues.channels.bass.toFixed(3)],
		['Channel hihat', audioValues.channels.hihat.toFixed(3)],
		['Channel vocal', audioValues.channels.vocal.toFixed(3)],
		['FFT size', store.fftSize]
	];

	const backgroundRows: Array<[string, string | number | boolean]> = [
		['Images loaded', store.backgroundImages.length],
		['Active image', store.activeImageId ?? 'none'],
		['Scene BG enabled', store.backgroundImageEnabled],
		['Global BG enabled', store.globalBackgroundEnabled],
		['BG fit', store.imageFitMode],
		['BG opacity', store.imageOpacity.toFixed(2)],
		['BG reactive', store.imageBassReactive],
		['BG channel', store.imageAudioChannel],
		[
			'BG smoothing',
			store.imageAudioSmoothingEnabled
				? store.imageAudioSmoothing.toFixed(2)
				: 'off'
		],
		['BG opacity reactive', store.imageOpacityReactive],
		['Transition', store.slideshowTransitionType],
		['Transition dur', store.slideshowTransitionDuration.toFixed(2)],
		['Transition intensity', store.slideshowTransitionIntensity.toFixed(2)],
		[
			'Transition audio drive',
			store.slideshowTransitionAudioDrive.toFixed(2)
		]
	];

	const overlayRows: Array<[string, string | number | boolean]> = [
		['Filter targets', store.filterTargets.join(', ') || 'none'],
		['Filter opacity', store.filterOpacity.toFixed(2)],
		['Brightness', store.filterBrightness.toFixed(2)],
		['Contrast', store.filterContrast.toFixed(2)],
		['Saturation', store.filterSaturation.toFixed(2)],
		['Blur', store.filterBlur.toFixed(2)],
		['Hue rotate', store.filterHueRotate.toFixed(1)],
		[
			'Track details',
			store.audioTrackTitleEnabled || store.audioTrackTimeEnabled
		],
		['Particles', store.particlesEnabled],
		['Rain', store.rainEnabled]
	];

	const logoRows: Array<[string, string | number | boolean]> = [
		['Enabled', store.logoEnabled],
		['Channel', store.logoBandMode],
		[
			'Smoothing',
			store.logoAudioSmoothingEnabled
				? store.logoAudioSmoothing.toFixed(2)
				: 'off'
		],
		[
			'Position',
			`${store.logoPositionX.toFixed(2)}, ${store.logoPositionY.toFixed(2)}`
		],
		['Min scale', store.logoMinScale.toFixed(2)],
		['Max scale', store.logoMaxScale.toFixed(2)]
	];

	const spectrumRenderQ = resolveSpectrumRenderQuality(
		store.performanceMode,
		store.spectrumFamily
	);
	const spectrumFamilyCost = getSpectrumFamilyGpuCostHint(store.spectrumFamily);

	const spectrumRows: Array<[string, string | number | boolean]> = [
		['Enabled', store.spectrumEnabled],
		['Mode', store.spectrumMode],
		['Family', store.spectrumFamily],
		['Render quality tier', spectrumRenderQ],
		['Family GPU hint (static)', spectrumFamilyCost],
		['Channel', store.spectrumBandMode],
		[
			'Audio smoothing',
			store.spectrumAudioSmoothingEnabled
				? store.spectrumAudioSmoothing.toFixed(2)
				: 'off'
		],
		['Visual smoothing', store.spectrumSmoothing.toFixed(2)],
		[
			'Position',
			`${store.spectrumPositionX.toFixed(2)}, ${store.spectrumPositionY.toFixed(2)}`
		],
		['Bar count', store.spectrumBarCount],
		['Bar width', store.spectrumBarWidth.toFixed(1)]
	];

	const systemRows: Array<[string, string | number | boolean]> = [
		['Performance', store.performanceMode],
		['Theme', store.editorTheme],
		['FPS visible', store.showFps],
		['Anchor panel', store.controlPanelAnchor],
		['Anchor fps', store.fpsOverlayAnchor]
	];
	const performanceTelemetry = usePerformanceTelemetry({
		particlesEnabled: store.particlesEnabled,
		rainEnabled: store.rainEnabled,
		spectrumEnabled: store.spectrumEnabled,
		logoEnabled: store.logoEnabled,
		globalBackgroundEnabled: store.globalBackgroundEnabled,
		backgroundImageEnabled: store.backgroundImageEnabled,
		rgbShiftAudioReactive: store.rgbShiftAudioReactive,
		imageBassReactive: store.imageBassReactive,
		scanlineIntensity: store.scanlineIntensity,
		noiseIntensity: store.noiseIntensity
	});
	const performanceRows: Array<[string, string | number | boolean]> = [
		['RAM (JS heap used)', formatMegabytes(performanceTelemetry.jsHeapUsedMb)],
		['RAM (heap total)', formatMegabytes(performanceTelemetry.jsHeapTotalMb)],
		['RAM limit', formatMegabytes(performanceTelemetry.jsHeapLimitMb)],
		[
			'CPU estimate',
			performanceTelemetry.cpuEstimate != null
				? `${performanceTelemetry.cpuEstimate.toFixed(0)}%`
				: 'n/a'
		],
		[
			'GPU estimate',
			performanceTelemetry.gpuEstimate != null
				? `${performanceTelemetry.gpuEstimate.toFixed(0)}%`
				: 'n/a'
		],
		['FPS live', performanceTelemetry.fps.toFixed(1)],
		['Frame time', `${performanceTelemetry.avgFrameMs.toFixed(1)} ms`],
		[
			'Device memory',
			performanceTelemetry.deviceMemoryGb != null
				? `${performanceTelemetry.deviceMemoryGb.toFixed(1)} GB`
				: 'n/a'
		],
		['CPU threads', performanceTelemetry.hardwareConcurrency ?? 'n/a']
	];

	function resetCalibrationDefaults() {
		store.setAudioAutoKickThreshold(DEFAULT_STATE.audioAutoKickThreshold);
		store.setAudioAutoSwitchHoldMs(DEFAULT_STATE.audioAutoSwitchHoldMs);
	}

	return (
		<div className="flex flex-col gap-3">
			<div
				className="rounded border p-3"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-surface-bg)'
				}}
			>
				<div className="mb-2 flex items-center justify-between gap-2">
					<div
						className="text-[10px] uppercase tracking-wide"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						Calibration
					</div>
					<button
						type="button"
						onClick={resetCalibrationDefaults}
						className="rounded border px-2 py-1 text-[10px] transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-color)'
						}}
					>
						{t.reset_tab}
					</button>
				</div>
				<div className="flex flex-col gap-2">
					<SliderControl
						label={t.label_auto_kick_threshold}
						value={store.audioAutoKickThreshold}
						{...AUDIO_ROUTING_RANGES.autoKickThreshold}
						onChange={store.setAudioAutoKickThreshold}
					/>
					<SliderControl
						label={t.label_auto_switch_hold}
						value={store.audioAutoSwitchHoldMs}
						{...AUDIO_ROUTING_RANGES.autoSwitchHoldMs}
						onChange={store.setAudioAutoSwitchHoldMs}
						unit=" ms"
					/>
				</div>
			</div>

			<DiagnosticsSection title="Audio Snapshot" rows={audioRows} />
			<DiagnosticsSection
				title="Performance / Resources"
				rows={performanceRows}
				footer="RAM usa valores reales del navegador cuando están disponibles. CPU y GPU son estimaciones de presión de runtime para ayudarte a detectar cuándo se dispara la carga."
			/>
			<DiagnosticsSection
				title="Background / Slideshow"
				rows={backgroundRows}
			/>
			<DiagnosticsSection title="Logo" rows={logoRows} />
			<DiagnosticsSection title="Spectrum" rows={spectrumRows} />
			<DiagnosticsSection title="Layers / Filters" rows={overlayRows} />
			<DiagnosticsSection title="System" rows={systemRows} />
		</div>
	);
}

function DiagnosticsSection({
	title,
	rows,
	footer
}: {
	title: string;
	rows: Array<[string, string | number | boolean]>;
	footer?: string;
}) {
	return (
		<div
			className="rounded border p-3"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div
				className="mb-2 text-[10px] uppercase tracking-wide"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{title}
			</div>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				{rows.map(([label, value]) => (
					<div
						key={label}
						className="rounded border px-2 py-1.5"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'rgba(0, 0, 0, 0.16)'
						}}
					>
						<div
							className="text-[10px] uppercase tracking-wide"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{label}
						</div>
						<div
							className="font-mono text-[11px]"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{String(value)}
						</div>
					</div>
				))}
			</div>
			{footer ? (
				<p
					className="mt-2 text-[10px] leading-snug"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{footer}
				</p>
			) : null}
		</div>
	);
}

function formatMegabytes(value: number | null): string {
	return value != null ? `${value.toFixed(1)} MB` : 'n/a';
}
