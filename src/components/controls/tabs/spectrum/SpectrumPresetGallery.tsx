import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	ALL_SPECTRUM_PRESETS,
	findPresetById,
	type SpectrumPreset,
	type SpectrumPresetTier
} from '@/features/spectrum/presets/spectrumPresets';
import { extractSpectrumProfileSettings } from '@/lib/featureProfiles';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import SectionDivider from '../../ui/SectionDivider';
import type { SpectrumDirectorTrigger } from '@/types/wallpaper';

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
	isFavorite,
	favoriteLabel,
	onApply,
	onToggleFavorite
}: {
	preset: SpectrumPreset;
	isActive: boolean;
	isDirty: boolean;
	isFavorite: boolean;
	favoriteLabel: string;
	onApply: () => void;
	onToggleFavorite: () => void;
}) {
	const activeBorder = isActive && !isDirty
		? '2px solid var(--editor-active-fg)'
		: isActive && isDirty
			? '2px solid var(--editor-tag-border)'
			: '1px solid var(--editor-accent-border)';

	return (
		<div className="relative">
			<button
				type="button"
				onClick={onApply}
				className="group flex w-full flex-col gap-1.5 rounded-lg p-2 pr-7 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
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
			<button
				type="button"
				aria-label={favoriteLabel}
				title={favoriteLabel}
				onClick={e => {
					e.preventDefault();
					e.stopPropagation();
					onToggleFavorite();
				}}
				className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded border text-[12px] leading-none transition-colors hover:bg-white/10"
				style={{
					borderColor: 'var(--editor-accent-border)',
					color: isFavorite
						? 'var(--editor-active-fg)'
						: 'var(--editor-accent-muted)'
				}}
			>
				{isFavorite ? '★' : '☆'}
			</button>
		</div>
	);
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function SpectrumPresetGallery() {
	const t = useT();
	const store = useWallpaperStore();
	const activeId = store.activeSpectrumPresetId;

	const favoritePresets = store.favoriteSpectrumPresetIds
		.map(id => findPresetById(id))
		.filter((p): p is SpectrumPreset => Boolean(p));

	const recentPresets = store.recentSpectrumPresetIds
		.map(id => findPresetById(id))
		.filter((p): p is SpectrumPreset => Boolean(p));
	const directorTriggers = store.spectrumAutoDirectorTriggers;

	const toggleTrigger = (trigger: SpectrumDirectorTrigger) => {
		const hasTrigger = directorTriggers.includes(trigger);
		const next = hasTrigger
			? directorTriggers.filter(item => item !== trigger)
			: [...directorTriggers, trigger];
		store.setSpectrumAutoDirectorTriggers(next);
	};

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
			{favoritePresets.length > 0 ? (
				<>
					<SectionDivider label={t.section_spectrum_favorites} />
					<div className="grid grid-cols-2 gap-2">
						{favoritePresets.map(preset => (
							<PresetCard
								key={`fav-${preset.id}`}
								preset={preset}
								isActive={activeId === preset.id}
								isDirty={activeId === preset.id && isDirty}
								isFavorite={store.favoriteSpectrumPresetIds.includes(
									preset.id
								)}
								favoriteLabel={t.label_favorite_toggle}
								onApply={() => store.applySpectrumPreset(preset)}
								onToggleFavorite={() =>
									store.toggleFavoriteSpectrumPresetId(preset.id)
								}
							/>
						))}
					</div>
				</>
			) : null}

			{recentPresets.length > 0 ? (
				<>
					<SectionDivider label={t.section_spectrum_recent} />
					<div className="grid grid-cols-2 gap-2">
						{recentPresets.map(preset => (
							<PresetCard
								key={`recent-${preset.id}`}
								preset={preset}
								isActive={activeId === preset.id}
								isDirty={activeId === preset.id && isDirty}
								isFavorite={store.favoriteSpectrumPresetIds.includes(
									preset.id
								)}
								favoriteLabel={t.label_favorite_toggle}
								onApply={() => store.applySpectrumPreset(preset)}
								onToggleFavorite={() =>
									store.toggleFavoriteSpectrumPresetId(preset.id)
								}
							/>
						))}
					</div>
				</>
			) : null}

			<div
				className="rounded-md border p-2"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-tag-bg)'
				}}
			>
				<ToggleControl
					label="Auto Director"
					value={store.spectrumAutoDirectorEnabled}
					onChange={store.setSpectrumAutoDirectorEnabled}
				/>
				{store.spectrumAutoDirectorEnabled ? (
					<div className="mt-2 grid grid-cols-2 gap-2">
						<SliderControl
							label="Cooldown"
							value={store.spectrumAutoDirectorCooldownMs}
							min={1200}
							max={30000}
							step={200}
							unit="ms"
							onChange={store.setSpectrumAutoDirectorCooldownMs}
						/>
						<SliderControl
							label="Interval"
							value={store.spectrumAutoDirectorIntervalMs}
							min={4000}
							max={90000}
							step={500}
							unit="ms"
							onChange={store.setSpectrumAutoDirectorIntervalMs}
						/>
						<SliderControl
							label="Energy Threshold"
							value={store.spectrumAutoDirectorEnergyThreshold}
							min={0.08}
							max={0.95}
							step={0.01}
							onChange={store.setSpectrumAutoDirectorEnergyThreshold}
						/>
						<SliderControl
							label="Beat Sensitivity"
							value={store.spectrumAutoDirectorBeatSensitivity}
							min={0.2}
							max={1}
							step={0.01}
							onChange={store.setSpectrumAutoDirectorBeatSensitivity}
						/>
						<ToggleControl
							label="Allow Family Switch"
							value={store.spectrumAutoDirectorAllowFamilySwitch}
							onChange={store.setSpectrumAutoDirectorAllowFamilySwitch}
						/>
						<ToggleControl
							label="Trigger Kick"
							value={directorTriggers.includes('kick')}
							onChange={() => toggleTrigger('kick')}
						/>
						<ToggleControl
							label="Trigger Beat"
							value={directorTriggers.includes('beat')}
							onChange={() => toggleTrigger('beat')}
						/>
						<ToggleControl
							label="Trigger Track Change"
							value={directorTriggers.includes('track-change')}
							onChange={() => toggleTrigger('track-change')}
						/>
						<ToggleControl
							label="Trigger Time"
							value={directorTriggers.includes('time')}
							onChange={() => toggleTrigger('time')}
						/>
					</div>
				) : null}
			</div>

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

			<SectionDivider label={t.section_all_spectrum_presets} />
			<div className="grid grid-cols-2 gap-2">
				{ALL_SPECTRUM_PRESETS.map(preset => (
					<PresetCard
						key={preset.id}
						preset={preset}
						isActive={activeId === preset.id}
						isDirty={activeId === preset.id && isDirty}
						isFavorite={store.favoriteSpectrumPresetIds.includes(
							preset.id
						)}
						favoriteLabel={t.label_favorite_toggle}
						onApply={() => store.applySpectrumPreset(preset)}
						onToggleFavorite={() =>
							store.toggleFavoriteSpectrumPresetId(preset.id)
						}
					/>
				))}
			</div>
		</div>
	);
}
