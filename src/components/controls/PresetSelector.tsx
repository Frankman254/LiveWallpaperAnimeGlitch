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
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
					Presets
				</span>
				<span
					className={`text-xs ${isPresetDirty ? 'text-amber-400' : 'text-cyan-600'}`}
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
						className={`px-3 py-1 text-xs rounded border transition-colors ${
							activePreset === key && !isPresetDirty
								? 'bg-cyan-500 border-cyan-500 text-black'
								: activePreset === key && isPresetDirty
									? 'border-amber-500 text-amber-400'
									: 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
						}`}
					>
						{PRESET_LABELS[key]}
					</button>
				))}
			</div>

			{customPresetList.length > 0 && (
				<div className="flex flex-col gap-1">
					<span className="text-xs text-cyan-600 uppercase tracking-widest">
						{t.custom_presets}
					</span>
					<div className="flex gap-2 flex-wrap">
						{customPresetList.map(preset => (
							<button
								key={preset.id}
								onClick={() => void handleApply(preset.id)}
								className={`px-3 py-1 text-xs rounded border transition-colors ${
									activePreset === preset.id && !isPresetDirty
										? 'bg-cyan-500 border-cyan-500 text-black'
										: activePreset === preset.id &&
											  isPresetDirty
											? 'border-amber-500 text-amber-400'
											: 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
								}`}
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
					className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
				>
					{t.save_custom_preset}
				</button>
				<button
					onClick={handleDuplicate}
					className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
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
