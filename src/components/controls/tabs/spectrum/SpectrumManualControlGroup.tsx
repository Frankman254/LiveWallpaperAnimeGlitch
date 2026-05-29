import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { Caption, UI_COLORS } from '@/ui';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import { SpectrumGroup } from './SpectrumGroup';
import { useT } from '@/lib/i18n';
import type { SpectrumDriveMode } from '@/types/wallpaper';

function buildDriveModeOptions(
	t: ReturnType<typeof useT>
): Array<{ value: SpectrumDriveMode; label: string; hint: string }> {
	return [
		{
			value: 'audio',
			label: t.spectrum_drive_mode_audio_label,
			hint: t.spectrum_drive_mode_audio_hint
		},
		{
			value: 'max',
			label: t.spectrum_drive_mode_max_label,
			hint: t.spectrum_drive_mode_max_hint
		},
		{
			value: 'add',
			label: t.spectrum_drive_mode_add_label,
			hint: t.spectrum_drive_mode_add_hint
		},
		{
			value: 'manual',
			label: t.spectrum_drive_mode_manual_label,
			hint: t.spectrum_drive_mode_manual_hint
		}
	];
}

function formatKeyLabel(raw: string): string {
	if (!raw) return '·';
	if (raw === ' ') return 'Space';
	if (raw.length === 1) return raw.toUpperCase();
	return raw;
}

function BindingCapture({
	index,
	currentKey,
	onCapture
}: {
	index: number;
	currentKey: string;
	onCapture: (index: number, key: string) => void;
}) {
	const [capturing, setCapturing] = useState(false);
	return (
		<button
			type="button"
			onClick={() => setCapturing(c => !c)}
			onKeyDown={event => {
				if (!capturing) return;
				if (event.key === 'Escape') {
					setCapturing(false);
					return;
				}
				if (event.key === 'Tab') return; // let the user focus elsewhere
				event.preventDefault();
				event.stopPropagation();
				onCapture(index, event.key);
				setCapturing(false);
			}}
			className="rounded border px-2 py-1 text-center transition"
			style={{
				borderColor: capturing
					? 'var(--editor-accent-color)'
					: 'var(--editor-border)',
				background: capturing ? UI_COLORS.accentSoft : 'transparent',
				color: 'var(--editor-text-primary)',
				fontSize: 11,
				minWidth: 44
			}}
		>
			{capturing ? '…' : formatKeyLabel(currentKey)}
		</button>
	);
}

export function SpectrumManualControlGroup({ bare = false }: { bare?: boolean } = {}) {
	const t = useT();
	const {
		driveMode,
		sections,
		addWeight,
		attack,
		release,
		bindings,
		showHud,
		setDriveMode,
		setSections,
		setAddWeight,
		setAttack,
		setRelease,
		setBinding,
		setShowHud
	} = useWallpaperStore(
		useShallow(state => ({
			driveMode: state.spectrumDriveMode,
			sections: state.spectrumManualSections,
			addWeight: state.spectrumManualAddWeight,
			attack: state.spectrumManualAttack,
			release: state.spectrumManualRelease,
			bindings: state.spectrumManualBindings,
			showHud: state.showSpectrumManualHud,
			setDriveMode: state.setSpectrumDriveMode,
			setSections: state.setSpectrumManualSections,
			setAddWeight: state.setSpectrumManualAddWeight,
			setAttack: state.setSpectrumManualAttack,
			setRelease: state.setSpectrumManualRelease,
			setBinding: state.setSpectrumManualBinding,
			setShowHud: state.setShowSpectrumManualHud
		}))
	);

	const driveModeOptions = buildDriveModeOptions(t);
	const activeOption = driveModeOptions.find(o => o.value === driveMode);
	const isAddMode = driveMode === 'add';
	const isManualActive = driveMode !== 'audio';
	const safeSections = Math.max(0, Math.min(bindings.length, sections));

	const body = (
		<div className="flex min-w-0 flex-col gap-2">
				<div className="grid grid-cols-2 gap-1">
					{driveModeOptions.map(option => {
						const active = option.value === driveMode;
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => setDriveMode(option.value)}
								className="rounded px-2 py-1 text-left transition"
								style={{
									border: `1px solid ${active ? UI_COLORS.accentBorder : UI_COLORS.border}`,
									background: active
										? UI_COLORS.accentSoft
										: 'transparent',
									color: UI_COLORS.fg,
									fontSize: 11
								}}
							>
								{option.label}
							</button>
						);
					})}
				</div>
				{activeOption ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{activeOption.hint}
					</Caption>
				) : null}

				{isManualActive ? (
					<>
						<SliderControl
							label="Sections"
							tooltip="Number of slices the spectrum is split into for key control. Each section gets one keybinding."
							value={sections}
							{...SPECTRUM_RANGES.manualSections}
							onChange={setSections}
						/>
						<div className="grid grid-cols-2 gap-2">
							<SliderControl
								label="Attack (s)"
								tooltip="How fast a key press ramps its section to full level."
								value={attack}
								{...SPECTRUM_RANGES.manualAttack}
								onChange={setAttack}
							/>
							<SliderControl
								label="Release (s)"
								tooltip="How fast the section drops back to baseline after key release."
								value={release}
								{...SPECTRUM_RANGES.manualRelease}
								onChange={setRelease}
							/>
						</div>
						{isAddMode ? (
							<SliderControl
								label="Add weight"
								tooltip="Multiplier applied to the manual signal in Add mode. 0 = audio only, 1 = full extra layer."
								value={addWeight}
								{...SPECTRUM_RANGES.manualAddWeight}
								onChange={setAddWeight}
							/>
						) : null}
						<ToggleControl
							label="Show HUD indicator"
							value={showHud}
							onChange={setShowHud}
						/>
						<div className="flex flex-col gap-1">
							<span
								className="uppercase"
								style={{
									fontSize: 10,
									fontWeight: 650,
									letterSpacing: '0.1em',
									color: 'var(--editor-text-secondary)'
								}}
							>
								Keybindings
							</span>
							<Caption
								as="p"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								Click a slot then press the key you want. Esc cancels.
							</Caption>
							<div
								className="grid gap-1"
								style={{
									gridTemplateColumns: `repeat(${Math.min(safeSections, 6)}, minmax(0, 1fr))`
								}}
							>
								{Array.from({ length: safeSections }, (_, i) => (
									<BindingCapture
										key={i}
										index={i}
										currentKey={bindings[i] ?? ''}
										onCapture={setBinding}
									/>
								))}
							</div>
						</div>
					</>
				) : null}
		</div>
	);

	if (bare) return body;
	return <SpectrumGroup title={t.spectrum_section_manual_control}>{body}</SpectrumGroup>;
}
