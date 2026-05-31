import { useState } from 'react';
import {
	Camera,
	ChevronDown,
	Eraser,
	ImageDown,
	Lock,
	X
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * QuickEditPerImagePanel — floating, tab-free shortcut for capturing
 * per-image overrides (logo, spectrum, particles, rain, looks) without
 * navigating to the BG tab. Surfaces scene-lock state honestly: when the
 * active image has a `sceneSlotId`, captures are disabled because the
 * scene takes priority at activation time.
 *
 * Mounts at top-left of the viewport. Closed by default; users open via
 * the small "Quick edit" pill.
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

export default function QuickEditPerImagePanel() {
	const [open, setOpen] = useState(false);
	const {
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
		<div
			style={{
				position: 'fixed',
				top: 16,
				left: 16,
				zIndex: 35,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				gap: 6
			}}
		>
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				title="Quick edit per-image overrides"
				className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] backdrop-blur-sm transition"
				style={{
					background: 'rgba(0,0,0,0.55)',
					borderColor: 'rgba(255,255,255,0.16)',
					color: 'rgba(255,255,255,0.85)'
				}}
			>
				<ImageDown size={12} />
				<span>Quick edit</span>
				<ChevronDown
					size={12}
					style={{
						transform: open ? 'rotate(180deg)' : 'none',
						transition: 'transform 150ms ease'
					}}
				/>
			</button>
			{open ? (
				<div
					className="flex w-[260px] flex-col gap-2 rounded-md border p-2 backdrop-blur"
					style={{
						background: 'rgba(0,0,0,0.78)',
						borderColor: 'rgba(255,255,255,0.16)',
						color: 'rgba(255,255,255,0.92)',
						boxShadow: '0 8px 20px rgba(0,0,0,0.45)'
					}}
				>
					<div className="flex items-center justify-between gap-2">
						<div className="min-w-0 text-[10px] uppercase tracking-widest opacity-70">
							{activeImage
								? (activeImage.originalFileName ??
									activeImage.assetId.slice(0, 8))
								: 'No active image'}
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="rounded p-0.5"
							style={{ color: 'rgba(255,255,255,0.7)' }}
							title="Close"
						>
							<X size={12} />
						</button>
					</div>
					{sceneLocked && activeSceneSlot ? (
						<div
							className="flex items-center gap-1.5 rounded border px-2 py-1 text-[10px]"
							style={{
								borderColor: 'rgba(248,191,28,0.4)',
								background: 'rgba(248,191,28,0.08)',
								color: 'rgba(253,224,138,0.95)'
							}}
						>
							<Lock size={10} />
							<span>
								Scene "{activeSceneSlot.name}" is active —
								overrides are ignored
							</span>
						</div>
					) : null}
					<div className="flex flex-col gap-1">
						{ROWS.map(row => {
							const status = statusOf(row.id);
							const disabled =
								status === 'no-active' || status === 'scene-locked';
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
										: 'rgba(255,255,255,0.5)';
							return (
								<div
									key={row.id}
									className="flex items-center justify-between gap-1 rounded border px-2 py-1 text-[11px]"
									style={{
										borderColor: 'rgba(255,255,255,0.10)',
										background: 'rgba(255,255,255,0.03)'
									}}
								>
									<span className="flex min-w-0 items-center gap-1.5">
										<span>{row.label}</span>
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
											className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40"
											style={{
												background: 'rgba(120,190,230,0.16)',
												color: 'rgba(180,220,250,0.95)'
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
											className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40"
											style={{
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
				</div>
			) : null}
		</div>
	);
}
