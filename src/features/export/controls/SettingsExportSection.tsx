import type { ChangeEvent, RefObject } from 'react';
import { Button, Caption } from '@/ui';

type SettingsStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';

type SettingsExportSectionProps = {
	importRef: RefObject<HTMLInputElement | null>;
	settingsStatus: SettingsStatus;
	settingsLabel: string;
	settingsMessage: string;
	hintSettingsJson: string;
	hintSettingsAssets: string;
	exportLabel: string;
	importLabel: string;
	onExportSettings: () => void;
	onImportSettings: (event: ChangeEvent<HTMLInputElement>) => void;
};

function statusClass(status: SettingsStatus): string {
	if (status === 'saved' || status === 'imported') return 'text-green-400';
	if (status === 'warning') return 'text-yellow-400';
	if (status === 'error') return 'text-red-500';
	return 'text-cyan-400';
}

export default function SettingsExportSection({
	importRef,
	settingsStatus,
	settingsLabel,
	settingsMessage,
	hintSettingsJson,
	hintSettingsAssets,
	exportLabel,
	importLabel,
	onExportSettings,
	onImportSettings
}: SettingsExportSectionProps) {
	return (
		<>
			<div className="flex flex-col gap-1">
				<span className={`text-xs ${statusClass(settingsStatus)}`}>
					{settingsLabel}
				</span>
				<Caption className="text-xs">{hintSettingsJson}</Caption>
				<Caption className="text-xs">{hintSettingsAssets}</Caption>
				{settingsMessage && settingsStatus === 'error' ? (
					<span className="text-xs text-red-500">
						{settingsMessage}
					</span>
				) : null}
			</div>

			<input
				ref={importRef}
				type="file"
				accept=".json,application/json"
				className="hidden"
				onChange={onImportSettings}
			/>

			<div className="flex gap-2">
				<Button
					onClick={onExportSettings}
					size="sm"
					density="compact"
					variant="secondary"
					full
				>
					{exportLabel}
				</Button>
				<Button
					onClick={() => importRef.current?.click()}
					size="sm"
					density="compact"
					variant="secondary"
					full
				>
					{importLabel}
				</Button>
			</div>
		</>
	);
}
