import { Maximize2, MonitorUp, RotateCcw, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { DEFAULT_STATE, PARTICLE_LIMITS } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { PerformanceMode } from '@/types/wallpaper';
import {
	Button,
	CollapsibleSection,
	SectionCard,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import {
	APP_VERSION,
	PROJECT_SCHEMA_VERSION,
	STORE_PERSIST_VERSION
} from '@/lib/version';
import { useDialog } from '../../ui/DialogProvider';
import {
	confirmClearStorage,
	confirmResetAllSettings
} from '../../ui/confirmCritical';

const PERF_MODES: PerformanceMode[] = ['low', 'medium', 'high'];

function OptionGrid<T extends string>({
	options,
	value,
	onChange,
	disabled,
	labels
}: {
	options: readonly T[];
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	labels?: Partial<Record<T, string>>;
}) {
	return (
		<div className="grid grid-cols-3 gap-1.5">
			{options.map(option => (
				<Button
					key={option}
					size="sm"
					density="compact"
					variant={value === option ? 'primary' : 'secondary'}
					active={value === option}
					disabled={disabled}
					onClick={() => onChange(option)}
					full
				>
					{labels?.[option] ?? option}
				</Button>
			))}
		</div>
	);
}

function ToggleRow({
	label,
	hint,
	checked,
	onChange
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<div className="min-w-0">
				<div className="text-[12px] font-medium" style={{ color: UI_COLORS.fg }}>
					{label}
				</div>
				{hint ? (
					<div
						className="text-[11px] leading-snug"
						style={{ color: UI_COLORS.fgMute }}
					>
						{hint}
					</div>
				) : null}
			</div>
			<ToggleSwitch
				checked={checked}
				onChange={onChange}
				size="sm"
				ariaLabel={label}
			/>
		</div>
	);
}

export default function ModernPerfTab() {
	const t = useT();
	const { confirm } = useDialog();
	const store = useWallpaperStore(
		useShallow(s => ({
			performanceMode: s.performanceMode,
			performanceSafeEnabled: s.performanceSafeEnabled,
			particleCount: s.particleCount,
			sleepModeEnabled: s.sleepModeEnabled,
			sleepModeDelaySeconds: s.sleepModeDelaySeconds,
			setPerformanceMode: s.setPerformanceMode,
			setPerformanceSafeEnabled: s.setPerformanceSafeEnabled,
			setSleepModeEnabled: s.setSleepModeEnabled,
			setSleepModeDelaySeconds: s.setSleepModeDelaySeconds,
			restoreFactorySettingsDefaults: s.restoreFactorySettingsDefaults,
			restoreFactorySpectrumDefaults: s.restoreFactorySpectrumDefaults,
			reset: s.reset
		}))
	);
	const {
		isFullscreen,
		fullscreenSupported,
		isMiniPlayerOpen,
		miniPlayerSupport,
		canExpandMiniPlayer,
		expandMiniPlayer,
		toggleFullscreen,
		toggleMiniPlayer
	} = useWindowPresentationControls();
	const limit = PARTICLE_LIMITS[store.performanceMode];
	const cappedCount = Math.min(store.particleCount, limit);
	const isCapped = store.particleCount > limit;
	const miniPlayerHint =
		miniPlayerSupport === 'document-pip'
			? t.hint_mini_player_document_pip
			: miniPlayerSupport === 'popup'
				? t.hint_mini_player_popup
				: t.hint_mini_player_unavailable;
	const perfLabels: Record<PerformanceMode, string> = {
		low: 'Low',
		medium: 'Medium',
		high: 'High'
	};

	async function handleClearStorage() {
		if (!(await confirmClearStorage(confirm, t))) return;
		localStorage.removeItem('lwag-state');
		useWallpaperStore.setState({ ...DEFAULT_STATE });
	}

	async function handleResetAll() {
		if (!(await confirmResetAllSettings(confirm, t))) return;
		store.reset();
	}

	async function handleRestoreFactorySettings() {
		const shouldRestore = await confirm({
			title: 'Restore factory visual settings?',
			message:
				'Applies the canonical visual/editor/logo/motion settings while keeping image pools, audio files, playlists, overlays, setlists, and local assets.',
			confirmLabel: 'Restore settings',
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!shouldRestore) return;
		store.restoreFactorySettingsDefaults();
	}

	async function handleRestoreFactorySpectrum() {
		const shouldRestore = await confirm({
			title: 'Restore factory Spectrum?',
			message:
				'Applies the canonical Spectrum engine settings and Spectrum slots without touching images, audio, overlays, or setlists.',
			confirmLabel: 'Restore Spectrum',
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!shouldRestore) return;
		store.restoreFactorySpectrumDefaults();
	}

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.label_perf_mode}
				subtitle={t.hint_perf_safe}
				density="compact"
			>
				<div className="flex flex-col gap-3">
					<OptionGrid<PerformanceMode>
						options={PERF_MODES}
						value={store.performanceMode}
						onChange={store.setPerformanceMode}
						disabled={store.performanceSafeEnabled}
						labels={perfLabels}
					/>
					{store.performanceSafeEnabled ? (
						<p
							className="text-[11px] leading-snug"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.hint_perf_mode_locked_while_safe}
						</p>
					) : null}
					<div
						className="rounded-[var(--editor-radius-md)] border p-2 text-[11px] leading-snug"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised,
							color: UI_COLORS.fgMute
						}}
					>
						<p>{t.hint_perf_low}</p>
						<p>{t.hint_perf_med}</p>
						<p>{t.hint_perf_high}</p>
					</div>
					<ToggleRow
						label={t.label_perf_safe}
						hint={t.hint_perf_safe}
						checked={store.performanceSafeEnabled}
						onChange={store.setPerformanceSafeEnabled}
					/>
					{isCapped ? (
						<div
							className="rounded-[var(--editor-radius-md)] border px-3 py-2 text-[11px]"
							style={{
								borderColor: UI_COLORS.warnBorder,
								background: UI_COLORS.warnSoft,
								color: UI_COLORS.warn
							}}
						>
							{t.label_count}: {store.particleCount} -&gt;{' '}
							{t.hint_effective} {cappedCount}
						</div>
					) : null}
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_window_tools}
				subtitle={miniPlayerHint}
				density="compact"
			>
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
						{fullscreenSupported ? (
							<Button
								size="sm"
								density="compact"
								icon={<Maximize2 size={ICON_SIZE.xs} />}
								onClick={() => void toggleFullscreen()}
								full
							>
								{isFullscreen
									? t.label_exit_fullscreen
									: t.label_enter_fullscreen}
							</Button>
						) : null}
						<Button
							size="sm"
							density="compact"
							icon={<MonitorUp size={ICON_SIZE.xs} />}
							onClick={() => void toggleMiniPlayer()}
							full
						>
							{isMiniPlayerOpen
								? t.label_close_mini_player
								: t.label_open_mini_player}
						</Button>
					</div>
					{isMiniPlayerOpen && canExpandMiniPlayer ? (
						<Button
							size="sm"
							density="compact"
							onClick={() => void expandMiniPlayer()}
							full
						>
							{t.label_expand_mini_player}
						</Button>
					) : null}
				</div>
			</SectionCard>

			<SectionCard title={t.section_sleep_mode} density="compact">
				<div className="flex flex-col gap-3">
					<ToggleRow
						label={t.label_sleep_mode}
						hint={t.hint_sleep_mode}
						checked={store.sleepModeEnabled}
						onChange={store.setSleepModeEnabled}
					/>
					{store.sleepModeEnabled ? (
						<Slider
							label={t.label_sleep_delay}
							value={store.sleepModeDelaySeconds}
							min={10}
							max={180}
							step={5}
							unit="s"
							onChange={store.setSleepModeDelaySeconds}
							variant="compact"
						/>
					) : null}
				</div>
			</SectionCard>

			<CollapsibleSection title="Factory restore" defaultOpen={false} dense>
				<div className="flex flex-col gap-2">
					<Button
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
						onClick={() => void handleRestoreFactorySpectrum()}
					>
						Restore Factory Spectrum
					</Button>
					<Button
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
						onClick={() => void handleRestoreFactorySettings()}
					>
						Restore Factory Settings
					</Button>
				</div>
			</CollapsibleSection>

			<CollapsibleSection title="Danger zone" defaultOpen={false} dense>
				<div className="flex flex-col gap-2">
					<Button
						size="sm"
						density="compact"
						variant="destructive"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
						onClick={() => void handleResetAll()}
					>
						{t.reset_all}
					</Button>
					<Button
						size="sm"
						density="compact"
						variant="warning"
						icon={<Trash2 size={ICON_SIZE.xs} />}
						onClick={() => void handleClearStorage()}
					>
						{t.clear_storage}
					</Button>
				</div>
			</CollapsibleSection>

			<div
				className="mt-1 border-t pt-3 text-center text-[10px] uppercase tracking-[0.12em]"
				style={{
					borderColor: UI_COLORS.hairline,
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono
				}}
			>
				v{APP_VERSION} · project schema {PROJECT_SCHEMA_VERSION} · store{' '}
				{STORE_PERSIST_VERSION}
			</div>
		</div>
	);
}
