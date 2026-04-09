import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useT } from '@/lib/i18n';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getScopedEditorThemeColorVars } from '@/components/controls/editorTheme';

type QuickActionButtonProps = {
	label: string;
	icon: string;
	active?: boolean;
	onClick: () => void;
};

function QuickActionButton({
	label,
	icon,
	active = false,
	onClick
}: QuickActionButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group flex min-h-[58px] flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition-all duration-200 hover:-translate-y-0.5"
			style={{
				borderColor: active
					? 'var(--editor-button-border)'
					: 'rgba(255,255,255,0.08)',
				background: active
					? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 94%, white 6%), color-mix(in srgb, var(--editor-shell-bg) 72%, transparent))'
					: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
				color: active
					? 'var(--editor-accent-soft)'
					: 'color-mix(in srgb, var(--editor-accent-soft) 82%, white)'
			}}
		>
			<span className="text-base leading-none">{icon}</span>
			<span className="mt-1 text-[10px] font-medium leading-tight">
				{label}
			</span>
		</button>
	);
}

export default function QuickActionsPanel() {
	const t = useT();
	const [open, setOpen] = useState(false);
	const {
		quickActionsEnabled,
		editorTheme,
		editorThemeColorSource,
		editorManualAccentColor,
		editorManualSecondaryColor,
		editorManualBackdropColor,
		backgroundImages,
		activeImageId,
		setActiveImageId,
		imageBassReactive,
		setImageBassReactive,
		spectrumEnabled,
		setSpectrumEnabled,
		logoEnabled,
		setLogoEnabled,
		particlesEnabled,
		setParticlesEnabled,
		rainEnabled,
		setRainEnabled,
		motionPaused,
		setMotionPaused
	} = useWallpaperStore(
		useShallow(state => ({
			quickActionsEnabled: state.quickActionsEnabled,
			editorTheme: state.editorTheme,
			editorThemeColorSource: state.editorThemeColorSource,
			editorManualAccentColor: state.editorManualAccentColor,
			editorManualSecondaryColor: state.editorManualSecondaryColor,
			editorManualBackdropColor: state.editorManualBackdropColor,
			backgroundImages: state.backgroundImages,
			activeImageId: state.activeImageId,
			setActiveImageId: state.setActiveImageId,
			imageBassReactive: state.imageBassReactive,
			setImageBassReactive: state.setImageBassReactive,
			spectrumEnabled: state.spectrumEnabled,
			setSpectrumEnabled: state.setSpectrumEnabled,
			logoEnabled: state.logoEnabled,
			setLogoEnabled: state.setLogoEnabled,
			particlesEnabled: state.particlesEnabled,
			setParticlesEnabled: state.setParticlesEnabled,
			rainEnabled: state.rainEnabled,
			setRainEnabled: state.setRainEnabled,
			motionPaused: state.motionPaused,
			setMotionPaused: state.setMotionPaused
		}))
	);
	const {
		captureMode,
		isPaused,
		pauseCapture,
		resumeCapture,
		pauseFileForSystem,
		resumeFileFromSystem,
		playNextTrack,
		playPrevTrack
	} = useAudioData();
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		editorThemeColorSource,
		backgroundPalette,
		editorTheme,
		{
			accent: editorManualAccentColor,
			secondary: editorManualSecondaryColor,
			backdrop: editorManualBackdropColor
		}
	);

	const imageIndex = useMemo(
		() =>
			backgroundImages.findIndex(image => image.assetId === activeImageId),
		[activeImageId, backgroundImages]
	);

	if (!quickActionsEnabled) return null;

	const handleAudioToggle = () => {
		if (captureMode === 'file') {
			if (isPaused) resumeFileFromSystem();
			else pauseFileForSystem();
			return;
		}
		if (isPaused) resumeCapture();
		else pauseCapture();
	};

	const moveImage = (direction: -1 | 1) => {
		if (!backgroundImages.length) return;
		const currentIndex = imageIndex >= 0 ? imageIndex : 0;
		const nextIndex =
			(currentIndex + direction + backgroundImages.length) %
			backgroundImages.length;
		setActiveImageId(backgroundImages[nextIndex]?.assetId ?? null);
	};

	return (
		<div
			className="fixed bottom-22 right-3 z-[126] flex items-end"
			style={themeVars}
		>
			<button
				type="button"
				onClick={() => setOpen(current => !current)}
				className="mr-2 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5"
				style={{
					borderColor: 'var(--editor-button-border)',
					background:
						'linear-gradient(180deg, color-mix(in srgb, var(--editor-shell-bg) 72%, white 6%), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))',
					color: 'var(--editor-accent-soft)',
					boxShadow:
						'0 16px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
				}}
				title={t.label_quick_actions}
			>
				<span className="text-lg">{open ? '❮' : '❯'}</span>
			</button>
			<div
				className="overflow-hidden rounded-[28px] border shadow-2xl backdrop-blur-2xl transition-all duration-300"
				style={{
					width: open ? 250 : 0,
					opacity: open ? 1 : 0,
					borderColor: 'var(--editor-shell-border)',
					background:
						'linear-gradient(180deg, color-mix(in srgb, var(--editor-hud-bg) 82%, white 3%), color-mix(in srgb, var(--editor-shell-bg) 94%, transparent))',
					boxShadow:
						'0 22px 46px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)'
				}}
			>
				<div className="px-4 pb-4 pt-3">
					<div className="mb-3 flex items-center justify-between">
						<div>
							<div
								className="text-[11px] uppercase tracking-[0.28em]"
								style={{ color: 'var(--editor-accent-color)' }}
							>
								{t.label_quick_actions}
							</div>
							<div
								className="text-[10px]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_quick_actions}
							</div>
						</div>
						<div
							className="rounded-full px-2 py-1 text-[10px]"
							style={{
								border: '1px solid var(--editor-tag-border)',
								background: 'var(--editor-tag-bg)',
								color: 'var(--editor-tag-fg)'
							}}
						>
							{captureMode === 'file' ? 'File' : 'Live'}
						</div>
					</div>

					<div className="grid grid-cols-3 gap-2">
						<QuickActionButton
							label={isPaused ? t.resume : t.pause}
							icon={isPaused ? '▶' : '⏸'}
							active={!isPaused}
							onClick={handleAudioToggle}
						/>
						<QuickActionButton
							label={motionPaused ? t.resume_all : t.pause_all}
							icon={motionPaused ? '⟲' : '❄'}
							active={!motionPaused}
							onClick={() => setMotionPaused(!motionPaused)}
						/>
						<QuickActionButton
							label={t.label_bass_zoom}
							icon="◌"
							active={imageBassReactive}
							onClick={() => setImageBassReactive(!imageBassReactive)}
						/>
						<QuickActionButton
							label={t.label_previous_image}
							icon="⟨"
							onClick={() => moveImage(-1)}
						/>
						<QuickActionButton
							label={t.label_next_image}
							icon="⟩"
							onClick={() => moveImage(1)}
						/>
						<QuickActionButton
							label={t.tab_spectrum}
							icon="◔"
							active={spectrumEnabled}
							onClick={() => setSpectrumEnabled(!spectrumEnabled)}
						/>
						<QuickActionButton
							label={t.label_previous_track}
							icon="⏮"
							onClick={() => void playPrevTrack()}
						/>
						<QuickActionButton
							label={t.label_next_track}
							icon="⏭"
							onClick={() => void playNextTrack()}
						/>
						<QuickActionButton
							label={t.tab_logo}
							icon="◉"
							active={logoEnabled}
							onClick={() => setLogoEnabled(!logoEnabled)}
						/>
						<QuickActionButton
							label={t.tab_particles}
							icon="✦"
							active={particlesEnabled}
							onClick={() => setParticlesEnabled(!particlesEnabled)}
						/>
						<QuickActionButton
							label={t.tab_rain}
							icon="╱"
							active={rainEnabled}
							onClick={() => setRainEnabled(!rainEnabled)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
