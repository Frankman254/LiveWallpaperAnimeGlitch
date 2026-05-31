import {
	Camera,
	Eraser,
	Layers,
	Lock,
	MousePointerClick
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * Per-image override panel rendered INSIDE the HUD. Same functionality the
 * previous floating `QuickEditPerImagePanel` exposed, but mounted as an
 * expand-panel of the HUD frame so the user gets the same drag / theme /
 * position controls every other HUD panel has.
 *
 * Mode is persisted in the store (`quickEditCaptureMode`):
 *   - 'selection': per-row Capture/Clear chips (fine-grained).
 *   - 'total':     single Capture-All / Clear-All for fast checkpointing.
 *
 * Scene takes priority over per-image overrides at activation time, so when
 * the active image has a `sceneSlotId` the panel disables all buttons and
 * surfaces an amber chip naming the scene.
 */
type SubsystemRow = {
	id: 'logo' | 'spectrum' | 'particles' | 'rain' | 'looks';
	label: string;
};

const ROWS: ReadonlyArray<SubsystemRow> = [
	{ id: 'logo', label: 'Logo' },
	{ id: 'spectrum', label: 'Spectrum' },
	{ id: 'particles', label: 'Particles' },
	{ id: 'rain', label: 'Rain' },
	{ id: 'looks', label: 'Looks' }
];

export default function QuickActionsPerImagePanel() {
	const {
		mode,
		setMode,
		activeImageId,
		backgroundImages,
		sceneSlots,
		captureImageLogoOverride,
		setImageLogoOverride,
		captureImageSpectrumOverride,
		setImageSpectrumOverride,
		captureImageParticlesOverride,
		setImageParticlesOverride,
		captureImageRainOverride,
		setImageRainOverride,
		captureImageLooksOverride,
		setImageLooksOverride
	} = useWallpaperStore(
		useShallow(s => ({
			mode: s.quickEditCaptureMode,
			setMode: s.setQuickEditCaptureMode,
			activeImageId: s.activeImageId,
			backgroundImages: s.backgroundImages,
			sceneSlots: s.sceneSlots,
			captureImageLogoOverride: s.captureImageLogoOverride,
			setImageLogoOverride: s.setImageLogoOverride,
			captureImageSpectrumOverride: s.captureImageSpectrumOverride,
			setImageSpectrumOverride: s.setImageSpectrumOverride,
			captureImageParticlesOverride: s.captureImageParticlesOverride,
			setImageParticlesOverride: s.setImageParticlesOverride,
			captureImageRainOverride: s.captureImageRainOverride,
			setImageRainOverride: s.setImageRainOverride,
			captureImageLooksOverride: s.captureImageLooksOverride,
			setImageLooksOverride: s.setImageLooksOverride
		}))
	);

	const activeImage = backgroundImages.find(
		image => image.assetId === activeImageId
	);
	const activeSceneSlot = activeImage?.sceneSlotId
		? sceneSlots.find(slot => slot.id === activeImage.sceneSlotId)
		: undefined;
	const sceneLocked = activeSceneSlot != null;
	const noImage = !activeImage;
	const captureBlocked = noImage || sceneLocked;
	const anyOverrideSaved =
		activeImage != null &&
		(activeImage.logoOverride != null ||
			activeImage.spectrumOverride != null ||
			activeImage.particlesOverride != null ||
			activeImage.rainOverride != null ||
			activeImage.looksOverride != null);

	function captureAll() {
		if (captureBlocked) return;
		captureImageLogoOverride();
		captureImageSpectrumOverride();
		captureImageParticlesOverride();
		captureImageRainOverride();
		captureImageLooksOverride();
	}
	function clearAll() {
		if (captureBlocked) return;
		setImageLogoOverride(null);
		setImageSpectrumOverride(null);
		setImageParticlesOverride(null);
		setImageRainOverride(null);
		setImageLooksOverride(null);
	}

	function statusOf(id: SubsystemRow['id']) {
		if (!activeImage) return 'no-active';
		if (sceneLocked) return 'scene-locked';
		const hasOverride = (() => {
			switch (id) {
				case 'logo':
					return activeImage.logoOverride != null;
				case 'spectrum':
					return activeImage.spectrumOverride != null;
				case 'particles':
					return activeImage.particlesOverride != null;
				case 'rain':
					return activeImage.rainOverride != null;
				case 'looks':
					return activeImage.looksOverride != null;
			}
		})();
		return hasOverride ? 'override' : 'empty';
	}

	function capture(id: SubsystemRow['id']) {
		switch (id) {
			case 'logo':
				captureImageLogoOverride();
				return;
			case 'spectrum':
				captureImageSpectrumOverride();
				return;
			case 'particles':
				captureImageParticlesOverride();
				return;
			case 'rain':
				captureImageRainOverride();
				return;
			case 'looks':
				captureImageLooksOverride();
				return;
		}
	}
	function clear(id: SubsystemRow['id']) {
		switch (id) {
			case 'logo':
				setImageLogoOverride(null);
				return;
			case 'spectrum':
				setImageSpectrumOverride(null);
				return;
			case 'particles':
				setImageParticlesOverride(null);
				return;
			case 'rain':
				setImageRainOverride(null);
				return;
			case 'looks':
				setImageLooksOverride(null);
				return;
		}
	}

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<span
					className="min-w-0 truncate text-[10px] uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{activeImage
						? (activeImage.originalFileName ??
							activeImage.assetId.slice(0, 8))
						: 'No active image'}
				</span>
				<div
					className="flex overflow-hidden border text-[10px]"
					style={{
						borderRadius: 'var(--editor-radius-sm)',
						borderColor: 'var(--editor-accent-border)'
					}}
				>
					<button
						type="button"
						onClick={() => setMode('selection')}
						className="flex items-center gap-1 px-2 py-0.5 transition"
						style={{
							background:
								mode === 'selection'
									? 'var(--editor-active-bg)'
									: 'transparent',
							color:
								mode === 'selection'
									? 'var(--editor-active-fg)'
									: 'var(--editor-accent-muted)'
						}}
						title="Per-subsystem capture/clear"
					>
						<MousePointerClick size={9} />
						Selection
					</button>
					<button
						type="button"
						onClick={() => setMode('total')}
						className="flex items-center gap-1 px-2 py-0.5 transition"
						style={{
							background:
								mode === 'total'
									? 'var(--editor-active-bg)'
									: 'transparent',
							color:
								mode === 'total'
									? 'var(--editor-active-fg)'
									: 'var(--editor-accent-muted)'
						}}
						title="Capture all subsystems in one shot"
					>
						<Layers size={9} />
						Total
					</button>
				</div>
			</div>

			{sceneLocked && activeSceneSlot ? (
				<div
					className="flex items-center gap-1.5 border px-2 py-1 text-[10px]"
					style={{
						borderRadius: 'var(--editor-radius-sm)',
						borderColor: 'rgba(248,191,28,0.4)',
						background: 'rgba(248,191,28,0.08)',
						color: 'rgba(253,224,138,0.95)'
					}}
				>
					<Lock size={10} />
					<span>
						Scene "{activeSceneSlot.name}" is active — overrides
						are ignored
					</span>
				</div>
			) : null}

			{mode === 'total' ? (
				<div className="flex flex-wrap items-center gap-1.5">
					<button
						type="button"
						disabled={captureBlocked}
						onClick={captureAll}
						className="flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							borderRadius: 'var(--editor-radius-md)',
							borderColor: 'var(--editor-accent-color)',
							background: 'var(--editor-active-bg)',
							color: 'var(--editor-active-fg)'
						}}
						title="Snapshot logo + spectrum + particles + rain + looks into this image"
					>
						<Camera size={11} />
						Capture all
					</button>
					<button
						type="button"
						disabled={captureBlocked || !anyOverrideSaved}
						onClick={clearAll}
						className="flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							borderRadius: 'var(--editor-radius-md)',
							borderColor: 'rgba(248,113,113,0.45)',
							background: 'rgba(248,113,113,0.08)',
							color: 'rgba(252,165,165,0.95)'
						}}
						title="Remove every per-image override on this image"
					>
						<Eraser size={11} />
						Clear all
					</button>
				</div>
			) : (
				<div className="flex flex-col gap-1">
					{ROWS.map(row => {
						const status = statusOf(row.id);
						const disabled =
							status === 'no-active' ||
							status === 'scene-locked';
						const statusBadge =
							status === 'override'
								? 'Saved'
								: status === 'scene-locked'
									? 'Scene'
									: status === 'no-active'
										? '—'
										: 'Empty';
						const statusColor =
							status === 'override'
								? 'rgba(120,255,180,0.95)'
								: status === 'scene-locked'
									? 'rgba(253,224,138,0.85)'
									: 'var(--editor-accent-muted)';
						return (
							<div
								key={row.id}
								className="flex items-center justify-between gap-1.5 border px-2 py-1 text-[11px]"
								style={{
									borderRadius: 'var(--editor-radius-sm)',
									borderColor: 'var(--editor-accent-border)',
									background: 'var(--editor-tag-bg)'
								}}
							>
								<span className="flex min-w-0 items-center gap-1.5">
									<span
										style={{
											color: 'var(--editor-accent-soft)'
										}}
									>
										{row.label}
									</span>
									<span
										className="text-[9px] uppercase tracking-widest"
										style={{ color: statusColor }}
									>
										{statusBadge}
									</span>
								</span>
								<span className="flex items-center gap-1">
									<button
										type="button"
										disabled={disabled}
										onClick={() => capture(row.id)}
										className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40"
										style={{
											borderRadius:
												'var(--editor-radius-sm)',
											background:
												'var(--editor-button-bg)',
											color: 'var(--editor-accent-soft)'
										}}
										title="Capture current state for this image"
									>
										<Camera size={10} />
										Capture
									</button>
									<button
										type="button"
										disabled={
											disabled || status !== 'override'
										}
										onClick={() => clear(row.id)}
										className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40"
										style={{
											borderRadius:
												'var(--editor-radius-sm)',
											background: 'rgba(248,113,113,0.12)',
											color: 'rgba(252,165,165,0.95)'
										}}
										title="Clear saved override"
									>
										<Eraser size={10} />
										Clear
									</button>
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
