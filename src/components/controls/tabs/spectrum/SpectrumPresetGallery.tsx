import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	ALL_SPECTRUM_PRESETS,
	findPresetById,
	type SpectrumPreset,
	type SpectrumPresetTier
} from '@/features/spectrum/presets/spectrumPresets';
import { extractSpectrumProfileSettings } from '@/lib/featureProfiles';

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: SpectrumPresetTier }) {
	const map: Record<SpectrumPresetTier, { label: string; color: string }> = {
		light: { label: 'Light', color: '#4ade80' },
		medium: { label: 'Medium', color: '#facc15' },
		heavy: { label: 'Heavy', color: '#f87171' }
	};
	const { label, color } = map[tier];
	return (
		<span
			className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
			style={{
				color,
				background: `${color}22`,
				border: `1px solid ${color}44`
			}}
		>
			{label}
		</span>
	);
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
	return (
		<span
			className="rounded px-1.5 py-0.5 text-[9px] font-medium"
			style={{
				color: 'var(--editor-accent-soft)',
				background: 'var(--editor-accent-border)',
				opacity: 0.85
			}}
		>
			{tag}
		</span>
	);
}

// ─── Single preset card ───────────────────────────────────────────────────────

function PresetCard({
	preset,
	isActive,
	isDirty,
	onApply
}: {
	preset: SpectrumPreset;
	isActive: boolean;
	isDirty: boolean;
	onApply: () => void;
}) {
	const activeBorder = isActive && !isDirty
		? '2px solid var(--editor-active-fg)'
		: isActive && isDirty
			? '2px solid var(--editor-tag-border)'
			: '1px solid var(--editor-accent-border)';

	return (
		<button
			onClick={onApply}
			className="group flex flex-col gap-1.5 rounded-lg p-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
			style={{
				background: isActive
					? 'var(--editor-surface-bg)'
					: 'var(--editor-bg)',
				border: activeBorder,
				cursor: 'pointer'
			}}
		>
			{/* Color swatch / thumbnail */}
			<div
				className="h-8 w-full rounded-md"
				style={{
					background: `linear-gradient(135deg, ${preset.swatchA} 0%, ${preset.swatchB} 100%)`,
					boxShadow: isActive && !isDirty
						? `0 0 10px ${preset.swatchA}66`
						: 'none'
				}}
			/>

			{/* Name + tier */}
			<div className="flex items-center justify-between gap-1">
				<span
					className="text-[11px] font-semibold leading-tight"
					style={{
						color: isActive && !isDirty
							? 'var(--editor-active-fg)'
							: 'var(--editor-accent-fg)'
					}}
				>
					{preset.name}
					{isActive && isDirty ? (
						<span
							className="ml-1 text-[9px] font-normal"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							modified
						</span>
					) : null}
				</span>
				<TierBadge tier={preset.performanceTier} />
			</div>

			{/* Description */}
			<p
				className="text-[10px] leading-snug"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{preset.description}
			</p>

			{/* Tags */}
			<div className="flex flex-wrap gap-1">
				{preset.tags.slice(0, 3).map(tag => (
					<TagPill key={tag} tag={tag} />
				))}
			</div>
		</button>
	);
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function SpectrumPresetGallery() {
	const store = useWallpaperStore();
	const activeId = store.activeSpectrumPresetId;

	/** Detects if user has deviated from the active preset */
	const isDirty = (() => {
		if (!activeId) return false;
		const preset = findPresetById(activeId);
		if (!preset) return false;
		const current = extractSpectrumProfileSettings(store);
		const presetSettings = preset.settings;
		// Compare a lightweight set of key fields to detect drift
		const KEYS_TO_CHECK: (keyof typeof presetSettings)[] = [
			'spectrumMode',
			'spectrumShape',
			'spectrumColorMode',
			'spectrumPrimaryColor',
			'spectrumSecondaryColor',
			'spectrumBarCount',
			'spectrumMaxHeight',
			'spectrumGlowIntensity',
			'spectrumRotationSpeed',
			'spectrumFollowLogo'
		];
		return KEYS_TO_CHECK.some(
			key => current[key] !== presetSettings[key]
		);
	})();

	return (
		<div className="flex flex-col gap-2">
			{activeId && !isDirty ? (
				<div
					className="rounded-md px-3 py-1.5 text-[11px]"
					style={{
						background: 'var(--editor-surface-bg)',
						color: 'var(--editor-active-fg)',
						border: '1px solid var(--editor-active-fg)',
						opacity: 0.9
					}}
				>
					Preset activo:{' '}
					<strong>{findPresetById(activeId)?.name ?? activeId}</strong>
				</div>
			) : activeId && isDirty ? (
				<div
					className="rounded-md px-3 py-1.5 text-[11px]"
					style={{
						background: 'var(--editor-tag-bg)',
						color: 'var(--editor-tag-fg)',
						border: '1px solid var(--editor-tag-border)'
					}}
				>
					Basado en <strong>{findPresetById(activeId)?.name ?? activeId}</strong>{' '}
					— modificado manualmente
				</div>
			) : null}

			<div className="grid grid-cols-2 gap-2">
				{ALL_SPECTRUM_PRESETS.map(preset => (
					<PresetCard
						key={preset.id}
						preset={preset}
						isActive={activeId === preset.id}
						isDirty={activeId === preset.id && isDirty}
						onApply={() => store.applySpectrumPreset(preset)}
					/>
				))}
			</div>
		</div>
	);
}
