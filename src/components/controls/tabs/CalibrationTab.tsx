import { memo, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Settings2, RotateCcw, Save } from 'lucide-react';
import {
	Button,
	IconButton,
	SectionCard,
	SegmentedControl,
	Slider,
	UI_COLORS,
	ICON_SIZE,
	FONT
} from '@/ui';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import {
	CALIBRATION_GROUPS,
	CALIBRATION_PARAMS,
	type CalibrationGroupId,
	type CalibrationParam,
	type CalibrationRangeOverride,
	getEffectiveRange
} from '@/features/calibration/calibrationConfig';
import { EnvelopeWaveformPreview } from '@/features/calibration/EnvelopeWaveformPreview';
import TabSection from '../ui/TabSection';
import ProfileSlotsEditor from '@/ui/ProfileSlotsEditor';
import { useDialog } from '../ui/DialogProvider';
import {
	confirmResetCalibrationOverrides,
	confirmResetCalibrationOriginal
} from '../ui/confirmCritical';
import { useT } from '@/lib/i18n';

function setterNameFor(key: string): string {
	return 'set' + key.charAt(0).toUpperCase() + key.slice(1);
}

function pascalKeyFor(param: CalibrationParam) {
	return setterNameFor(param.key) as keyof WallpaperStore;
}

function formatValue(value: number, precision: number): string {
	if (!Number.isFinite(value)) return '0';
	return value.toFixed(precision);
}

function inferPrecision(step: number, fallback: number): number {
	if (!Number.isFinite(step) || step <= 0) return fallback;
	if (step >= 1) return 0;
	const decimals = Math.min(4, Math.ceil(-Math.log10(step)));
	return Math.max(fallback, decimals);
}

interface RangeEditorProps {
	param: CalibrationParam;
	currentRange: ReturnType<typeof getEffectiveRange>;
	override: CalibrationRangeOverride | undefined;
	onChange: (next: CalibrationRangeOverride | null) => void;
	onClose: () => void;
}

function RangeEditor({
	param,
	currentRange,
	override,
	onChange,
	onClose
}: RangeEditorProps) {
	const [minStr, setMinStr] = useState(String(currentRange.min));
	const [maxStr, setMaxStr] = useState(String(currentRange.max));
	const [stepStr, setStepStr] = useState(String(currentRange.step));

	function commit() {
		const next: CalibrationRangeOverride = {};
		const min = Number(minStr);
		const max = Number(maxStr);
		const step = Number(stepStr);
		if (
			Number.isFinite(min) &&
			min !== param.defaultRange.min &&
			!(override && override.min === min)
		) {
			next.min = min;
		} else if (Number.isFinite(min) && override?.min !== undefined) {
			next.min = min;
		}
		if (
			Number.isFinite(max) &&
			(max !== param.defaultRange.max || override?.max !== undefined)
		) {
			next.max = max;
		}
		if (
			Number.isFinite(step) &&
			step > 0 &&
			(step !== param.defaultRange.step || override?.step !== undefined)
		) {
			next.step = step;
		}
		// Drop entries that equal the default to keep override sparse.
		if (next.min === param.defaultRange.min) delete next.min;
		if (next.max === param.defaultRange.max) delete next.max;
		if (next.step === param.defaultRange.step) delete next.step;
		onChange(Object.keys(next).length > 0 ? next : null);
		onClose();
	}

	return (
		<div
			className="flex flex-col gap-2 rounded-md border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.overlay
			}}
		>
			<div
				className="text-[10px] uppercase tracking-wider"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					letterSpacing: '0.08em'
				}}
			>
				Rango ({param.key})
			</div>
			<div className="grid grid-cols-3 gap-2">
				<label className="flex flex-col gap-1 text-[10px]">
					<span style={{ color: UI_COLORS.fgMute }}>min</span>
					<input
						type="number"
						value={minStr}
						onChange={e => setMinStr(e.target.value)}
						step="any"
						className="rounded-sm border px-1 py-0.5 text-[11px]"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.panel,
							color: UI_COLORS.fg
						}}
					/>
				</label>
				<label className="flex flex-col gap-1 text-[10px]">
					<span style={{ color: UI_COLORS.fgMute }}>max</span>
					<input
						type="number"
						value={maxStr}
						onChange={e => setMaxStr(e.target.value)}
						step="any"
						className="rounded-sm border px-1 py-0.5 text-[11px]"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.panel,
							color: UI_COLORS.fg
						}}
					/>
				</label>
				<label className="flex flex-col gap-1 text-[10px]">
					<span style={{ color: UI_COLORS.fgMute }}>step</span>
					<input
						type="number"
						value={stepStr}
						onChange={e => setStepStr(e.target.value)}
						step="any"
						className="rounded-sm border px-1 py-0.5 text-[11px]"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.panel,
							color: UI_COLORS.fg
						}}
					/>
				</label>
			</div>
			<div
				className="flex items-center justify-between text-[10px]"
				style={{ color: UI_COLORS.fgMute }}
			>
				<span>
					default: {param.defaultRange.min} / {param.defaultRange.max}{' '}
					/ {param.defaultRange.step}
				</span>
				<div className="flex gap-1">
					<Button
						size="sm"
						density="compact"
						variant="secondary"
						onClick={() => {
							onChange(null);
							onClose();
						}}
					>
						Reset
					</Button>
					<Button
						size="sm"
						density="compact"
						variant="primary"
						onClick={commit}
					>
						Aplicar
					</Button>
				</div>
			</div>
		</div>
	);
}

interface CalibrationSliderProps {
	param: CalibrationParam;
}

const CalibrationSliderRow = memo(function CalibrationSliderRow({
	param
}: CalibrationSliderProps) {
	const value = useWallpaperStore(s => s[param.key] as number);
	const setterName = pascalKeyFor(param);
	const setter = useWallpaperStore(s => s[setterName]) as
		| ((v: number) => void)
		| undefined;
	const override = useWallpaperStore(
		s => s.calibrationRangeOverrides[param.key]
	);
	const setRangeOverride = useWallpaperStore(
		s => s.setCalibrationRangeOverride
	);
	const [editing, setEditing] = useState(false);
	const effectiveRange = getEffectiveRange(param, {
		[param.key]: override
	});
	const precision = inferPrecision(effectiveRange.step, param.precision ?? 2);
	const hasOverride = override && Object.keys(override).length > 0;

	if (!setter) return null;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<Slider
						label={param.label}
						value={
							Number.isFinite(value) ? value : effectiveRange.min
						}
						min={effectiveRange.min}
						max={effectiveRange.max}
						step={effectiveRange.step}
						onChange={setter}
						variant="compact"
						hint={param.hint}
						formatValue={v => formatValue(v, precision)}
					/>
				</div>
				<IconButton
					size="sm"
					density="compact"
					variant={hasOverride ? 'warning' : 'default'}
					active={hasOverride}
					title="Editar rango"
					onClick={() => setEditing(o => !o)}
				>
					<Settings2 size={ICON_SIZE.xs} />
				</IconButton>
			</div>
			{editing ? (
				<RangeEditor
					param={param}
					currentRange={effectiveRange}
					override={override}
					onChange={next => setRangeOverride(param.key, next)}
					onClose={() => setEditing(false)}
				/>
			) : null}
		</div>
	);
});

function GroupSection({ id }: { id: CalibrationGroupId }) {
	const meta = CALIBRATION_GROUPS.find(g => g.id === id);
	const params = useMemo(
		() => CALIBRATION_PARAMS.filter(p => p.group === id),
		[id]
	);
	if (!meta) return null;
	return (
		<TabSection title={meta.label} hint={meta.description}>
			{id === 'logo' ? <LogoEnvelopePreviewBlock /> : null}
			{id === 'bgZoom' ? <BgZoomEnvelopePreviewBlock /> : null}
			{params.map(param => (
				<CalibrationSliderRow key={param.key} param={param} />
			))}
		</TabSection>
	);
}

function LogoEnvelopePreviewBlock() {
	const params = useWallpaperStore(
		useShallow(s => ({
			attack: s.logoAttack,
			release: s.logoRelease,
			responseSpeed: s.logoReactivitySpeed * 2.4,
			peakWindow: s.logoPeakWindow,
			peakFloor: s.logoPeakFloor,
			punch: s.logoPunch,
			scaleIntensity: s.logoReactiveScaleIntensity,
			channel: s.logoBandMode,
			preGain: s.logoAudioSensitivity * 1.18
		}))
	);
	return (
		<EnvelopeWaveformPreview
			title="Logo envelope"
			channel={params.channel}
			preGain={params.preGain}
			envelopeColor="#67e8f9"
			params={{
				attack: params.attack,
				release: params.release,
				responseSpeed: params.responseSpeed,
				peakWindow: params.peakWindow,
				peakFloor: params.peakFloor,
				punch: params.punch,
				scaleIntensity: params.scaleIntensity
			}}
		/>
	);
}

function BgZoomEnvelopePreviewBlock() {
	const params = useWallpaperStore(
		useShallow(s => ({
			attack: s.imageBassAttack,
			release: s.imageBassRelease,
			responseSpeed: s.imageBassReactivitySpeed * 2.4,
			peakWindow: s.imageBassPeakWindow,
			peakFloor: s.imageBassPeakFloor,
			punch: s.imageBassPunch,
			scaleIntensity: s.imageBassReactiveScaleIntensity,
			channel: s.imageAudioChannel,
			preGain: s.imageBassScaleIntensity * 2
		}))
	);
	return (
		<EnvelopeWaveformPreview
			title="BG Zoom envelope"
			channel={params.channel}
			preGain={params.preGain}
			envelopeColor="#fbbf24"
			params={{
				attack: params.attack,
				release: params.release,
				responseSpeed: params.responseSpeed,
				peakWindow: params.peakWindow,
				peakFloor: params.peakFloor,
				punch: params.punch,
				scaleIntensity: params.scaleIntensity
			}}
		/>
	);
}

interface Props {
	onReset?: () => void;
}

type CalibrationView = CalibrationGroupId | 'ranges' | 'profiles';

function isCalibrationGroupView(
	value: CalibrationView
): value is CalibrationGroupId {
	return CALIBRATION_GROUPS.some(group => group.id === value);
}

export default function CalibrationTab({ onReset }: Props) {
	const t = useT();
	const { confirm } = useDialog();
	const store = useWallpaperStore(
		useShallow(s => ({
			slots: s.calibrationProfileSlots,
			loadSlot: s.loadCalibrationProfileSlot,
			saveSlot: s.saveCalibrationProfileSlot,
			addSlot: s.addCalibrationProfileSlot,
			removeSlot: s.removeCalibrationProfileSlot,
			overrides: s.calibrationRangeOverrides,
			resetOverrides: s.resetCalibrationRangeOverrides,
			applySuggested: s.applySuggestedCalibration,
			resetToOriginal: s.resetCalibrationToOriginalDefaults
		}))
	);

	const overrideCount = Object.keys(store.overrides).length;
	const [view, setView] = useState<CalibrationView>('logo');
	const viewOptions = [
		...CALIBRATION_GROUPS.map(group => ({
			value: group.id,
			label: group.label
		})),
		{
			value: 'ranges',
			label: 'Rangos'
		},
		{
			value: 'profiles',
			label: 'Slots'
		}
	] satisfies Array<{ value: CalibrationView; label: string }>;

	return (
		<div className="flex flex-col gap-3">
			<SectionCard
				title="Reset calibrado"
				subtitle="Recalibración sugerida para corregir respuesta lenta + nerviosa."
				density="compact"
			>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						size="sm"
						variant="primary"
						onClick={store.applySuggested}
					>
						<Save size={ICON_SIZE.xs} /> Aplicar calibración
						sugerida
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() =>
							void (async () => {
								if (
									!(await confirmResetCalibrationOriginal(
										confirm,
										t
									))
								) {
									return;
								}
								store.resetToOriginal();
							})()
						}
					>
						<RotateCcw size={ICON_SIZE.xs} /> Restaurar defaults
						originales
					</Button>
					{onReset ? (
						<Button
							size="sm"
							variant="ghost"
							onClick={onReset}
							title="Reset completo de la sección"
						>
							Reset tab
						</Button>
					) : null}
				</div>
			</SectionCard>

			<SectionCard
				title="Foco de calibración"
				subtitle={
					isCalibrationGroupView(view)
						? (CALIBRATION_GROUPS.find(group => group.id === view)
								?.description ?? '')
						: view === 'ranges'
							? 'Audita y limpia límites personalizados.'
							: 'Guarda y recupera bundles completos.'
				}
				density="compact"
			>
				<SegmentedControl<CalibrationView>
					value={view}
					onChange={setView}
					options={viewOptions}
					size="sm"
					density="compact"
					full
					ariaLabel="Calibration focus"
				/>
			</SectionCard>

			{isCalibrationGroupView(view) ? <GroupSection id={view} /> : null}

			{view === 'ranges' ? (
				<SectionCard
					title="Rangos personalizados"
					subtitle={
						overrideCount > 0
							? `${overrideCount} parámetro(s) con rango custom`
							: 'Sin overrides — todos los rangos vienen de los defaults.'
					}
					density="compact"
				>
					<Button
						size="sm"
						variant="secondary"
						disabled={overrideCount === 0}
						onClick={() =>
							void (async () => {
								if (
									!(await confirmResetCalibrationOverrides(
										confirm,
										t
									))
								) {
									return;
								}
								store.resetOverrides();
							})()
						}
					>
						<RotateCcw size={ICON_SIZE.xs} /> Quitar todos los
						overrides
					</Button>
				</SectionCard>
			) : null}

			{view === 'profiles' ? (
				<TabSection
					title="Presets de calibración"
					hint="Guarda configuraciones completas y vuelve a ellas cuando quieras."
				>
					<ProfileSlotsEditor
						title="Slots"
						hint={`Cada slot guarda los valores actuales de los ${CALIBRATION_PARAMS.length} parámetros.`}
						slots={store.slots}
						activeIndex={null}
						onLoad={store.loadSlot}
						onSave={store.saveSlot}
						onAdd={store.addSlot}
						onDelete={store.removeSlot}
						loadLabel="Cargar"
						saveLabel="Guardar"
						slotLabel="Calibración"
						emptyLabel="Vacío"
						activeLabel="Activo"
						minProtectedSlots={3}
						maxSlots={10}
					/>
				</TabSection>
			) : null}
		</div>
	);
}
