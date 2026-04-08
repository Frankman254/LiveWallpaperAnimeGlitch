import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { PRESET_LABELS, resolvePreset } from '@/lib/presets';
import type { PresetKey } from '@/types/presets';
import { useDialog } from '@/components/controls/ui/DialogProvider';

const PRESET_KEYS: PresetKey[] = ['softDream', 'cyberPop', 'rainyNight'];

export default function PresetSelector() {
	const {
		activePreset,
		customPresets,
		isPresetDirty,
		applyPreset,
		saveCustomPreset,
		duplicatePreset,
		revertToActivePreset
	} = useWallpaperStore();
	const t = useT();
	const { confirm } = useDialog();
	const activePresetName =
		resolvePreset(activePreset, customPresets)?.name ?? t.custom_presets;
	const customPresetList = Object.values(customPresets).sort((a, b) =>
		a.name.localeCompare(b.name)
	);

	async function handleApply(id: string) {
		if (activePreset === id && !isPresetDirty) return;
		if (isPresetDirty) {
			const ok = await confirm({
				title: 'Presets',
				message: t.confirm_apply_preset,
				confirmLabel: t.label_apply,
				cancelLabel: t.label_cancel,
				tone: 'warning'
			});
			if (!ok) return;
		}
		applyPreset(id);
	}

	function handleSave() {
		const currentName =
			customPresets[activePreset]?.name ?? activePresetName;
		const name = window.prompt(t.prompt_preset_name, currentName);
		if (name === null) return;
		saveCustomPreset(name);
	}

	function handleDuplicate() {
		const suggestedName = `${activePresetName} ${t.preset_copy_suffix}`;
		const name = window.prompt(
			t.prompt_duplicate_preset_name,
			suggestedName
		);
		if (name === null) return;
		duplicatePreset(name);
	}

	async function handleRevert() {
		if (!isPresetDirty) return;
		const ok = await confirm({
			title: 'Presets',
			message: t.confirm_revert_preset,
			confirmLabel: t.revert_to_preset,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!ok) return;
		revertToActivePreset();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span
					className="text-xs uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					Presets
				</span>
				<span
					className="text-xs"
					style={{
						color: isPresetDirty
							? '#fbbf24'
							: 'var(--editor-accent-muted)'
					}}
				>
					{activePresetName}
					{isPresetDirty ? ` · ${t.state_custom}` : ''}
				</span>
			</div>

			<div className="flex gap-2 flex-wrap">
				{PRESET_KEYS.map(key => (
					<button
						key={key}
						onClick={() => void handleApply(key)}
						className="rounded border px-3 py-1 text-xs transition-colors"
						style={
							activePreset === key && !isPresetDirty
								? {
										background: 'var(--editor-active-bg)',
										borderColor: 'var(--editor-tag-border)',
										color: 'var(--editor-active-fg)'
									}
								: activePreset === key && isPresetDirty
									? {
											borderColor: '#f59e0b',
											color: '#fbbf24'
										}
									: {
											background: 'var(--editor-tag-bg)',
											borderColor: 'var(--editor-tag-border)',
											color: 'var(--editor-tag-fg)'
										}
						}
					>
						{PRESET_LABELS[key]}
					</button>
				))}
			</div>

			{customPresetList.length > 0 && (
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.custom_presets}
					</span>
					<div className="flex gap-2 flex-wrap">
						{customPresetList.map(preset => (
							<button
								key={preset.id}
								onClick={() => void handleApply(preset.id)}
								className="rounded border px-3 py-1 text-xs transition-colors"
								style={
									activePreset === preset.id && !isPresetDirty
										? {
												background: 'var(--editor-active-bg)',
												borderColor:
													'var(--editor-tag-border)',
												color: 'var(--editor-active-fg)'
											}
										: activePreset === preset.id &&
											  isPresetDirty
											? {
													borderColor: '#f59e0b',
													color: '#fbbf24'
												}
											: {
													background:
														'var(--editor-tag-bg)',
													borderColor:
														'var(--editor-tag-border)',
													color: 'var(--editor-tag-fg)'
												}
								}
							>
								{preset.name}
							</button>
						))}
					</div>
				</div>
			)}

			<div className="flex gap-2 flex-wrap">
				<button
					onClick={handleSave}
					className="rounded border px-3 py-1 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.save_custom_preset}
				</button>
				<button
					onClick={handleDuplicate}
					className="rounded border px-3 py-1 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.duplicate_preset}
				</button>
				<button
					onClick={() => void handleRevert()}
					disabled={!isPresetDirty}
					className="px-3 py-1 text-xs rounded border border-amber-900 text-amber-400 hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					{t.revert_to_preset}
				</button>
			</div>
		</div>
	);
}
