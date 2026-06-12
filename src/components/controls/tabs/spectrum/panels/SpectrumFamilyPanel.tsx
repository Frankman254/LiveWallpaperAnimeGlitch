import { useEffect } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useSpectrumTargetSettings } from '../useSpectrumTargetSettings';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { AdvancedOnly } from '../../../UIMode';
import type {
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape
} from '@/types/wallpaper';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	FONT,
	OptionCardGrid,
	UI_COLORS
} from '@/ui';
import {
	SPECTRUM_FAMILIES,
	SPECTRUM_FAMILY_LABELS,
	SPECTRUM_LINEAR_DIRECTION_LABELS,
	SPECTRUM_LINEAR_DIRECTIONS,
	SPECTRUM_LINEAR_ORIENTATION_LABELS,
	SPECTRUM_LINEAR_ORIENTATIONS,
	SPECTRUM_MODE_LABELS,
	SPECTRUM_MODES,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_LINEAR_STYLES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import { SPECTRUM_RADIAL_SHAPE_ICONS } from '@/features/spectrum/geometry/radialShapeIcons';
import { resolveSpectrumPlacement } from '@/features/spectrum/runtime/spectrumPlacement';
import SliderControl from '../../../SliderControl';
import ToggleControl from '../../../ToggleControl';
import { SpectrumStyleSelector } from '../SpectrumStyleSelector';
import { getSpectrumFamilyCapabilities } from '@/features/spectrum/spectrumFamilyCapabilities';
import type { WallpaperState } from '@/types/wallpaper';

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

export function SpectrumFamilyPreview({ family }: { family: SpectrumFamily }) {
	if (family === 'oscilloscope') {
		return (
			<svg viewBox="0 0 80 38" className="h-9 w-full" aria-hidden>
				<path
					d="M4 20 C14 7 24 31 34 20 S54 7 64 20 S74 31 78 20"
					fill="none"
					stroke="currentColor"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (family === 'tunnel') {
		return (
			<div className="grid place-items-center">
				<div className="h-8 w-8 rounded-full border-2 border-current opacity-90">
					<div className="m-1.5 h-5 w-5 rounded-full border-2 border-current opacity-70" />
				</div>
			</div>
		);
	}
	if (family === 'liquid') {
		return (
			<svg viewBox="0 0 80 38" className="h-9 w-full" aria-hidden>
				<path
					d="M8 28 C18 6 30 8 40 20 C50 32 64 33 72 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="7"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (family === 'orbital') {
		return (
			<div className="relative h-10 w-10 rounded-full border border-current">
				<div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
				<div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-current" />
			</div>
		);
	}
	if (family === 'spiral') {
		return (
			<svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
				<path
					d="M20 20 m-2,0 a2,2 0 1,1 4,0 m1,2 a5,5 0 1,1 -10,0 a5,5 0 1,1 8,-3 m3,1 a10,10 0 1,1 -16,2"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	return (
		<div className="flex h-9 items-end justify-center gap-1.5">
			{[18, 28, 14, 34, 22].map((height, index) => (
				<span
					key={index}
					className="w-1.5 rounded-full bg-current"
					style={{ height }}
				/>
			))}
		</div>
	);
}

function SpectrumModePreview({ mode }: { mode: SpectrumMode }) {
	if (mode === 'radial') {
		return (
			<div className="relative h-10 w-10 rounded-full border-2 border-current">
				{Array.from({ length: 8 }).map((_, index) => {
					const angle = (index / 8) * Math.PI * 2;
					return (
						<span
							key={index}
							className="absolute h-1.5 w-1.5 rounded-full bg-current"
							style={{
								left: `${50 + Math.cos(angle) * 42}%`,
								top: `${50 + Math.sin(angle) * 42}%`,
								transform: 'translate(-50%, -50%)'
							}}
						/>
					);
				})}
			</div>
		);
	}
	return (
		<div className="flex h-9 w-full items-end justify-center gap-1">
			{[12, 18, 26, 32, 22, 16, 10].map((height, index) => (
				<span
					key={index}
					className="w-1.5 rounded-sm bg-current"
					style={{ height }}
				/>
			))}
		</div>
	);
}

export function SpectrumFamilyPanel() {
	const t = useT();
	const { settings: sp, update, target } = useSpectrumTargetSettings();
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const isClassic = sp.spectrumFamily === 'classic';
	const isTunnel = sp.spectrumFamily === 'tunnel';
	const isLiquid = sp.spectrumFamily === 'liquid';
	const isOrbital = sp.spectrumFamily === 'orbital';
	const caps = getSpectrumFamilyCapabilities(sp.spectrumFamily);
	const isRadial = sp.spectrumMode === 'radial';
	const isLinearMode = sp.spectrumMode === 'linear';
	// Style options follow the bound spectrum's mode (S1 or S2 alike).
	const mainStyleOptions = isRadial
		? SPECTRUM_RADIAL_STYLES
		: SPECTRUM_LINEAR_STYLES;
	const showLinearAxisControls = isLinearMode;
	// Placement lock is evaluated for the bound spectrum: instances merge
	// their settings over the full store (same trick as the renderer).
	const canMoveMainSpectrum = !resolveSpectrumPlacement({
		...fullStore,
		...sp
	}).positionLockedToLogo;

	useEffect(() => {
		if (!caps.supportsRadial && sp.spectrumMode === 'radial') {
			update({ spectrumMode: 'linear' });
		} else if (!caps.supportsLinear && sp.spectrumMode === 'linear') {
			update({ spectrumMode: 'radial' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [caps.supportsLinear, caps.supportsRadial, sp.spectrumMode, target]);

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<div className="flex flex-col gap-2">
				<span className="uppercase" style={CONTROL_LABEL_STYLE}>
					Family
				</span>
				<OptionCardGrid<SpectrumFamily>
					items={SPECTRUM_FAMILIES.map(family => ({
						value: family,
						label: SPECTRUM_FAMILY_LABELS[family],
						description:
							family === 'classic'
								? 'Bars, blocks, waves and dots.'
								: family === 'oscilloscope'
									? 'Scope-style waveform motion.'
									: family === 'tunnel'
										? 'Depth rings and radial travel.'
										: family === 'liquid'
											? 'Soft fluid spectrum surface.'
											: family === 'spiral'
												? 'Bins glowing along a logarithmic spiral.'
												: 'Circular motion around center.',
						preview: <SpectrumFamilyPreview family={family} />
					}))}
					value={sp.spectrumFamily}
					onChange={(value => update({ spectrumFamily: value }))}
					density="compact"
					ariaLabel="Spectrum family"
				/>
			</div>

			{isTunnel ? (
				<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
					{t.hint_spectrum_family_tunnel}
				</Caption>
			) : null}
			{isLiquid ? (
				<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
					{t.hint_spectrum_family_liquid}
				</Caption>
			) : null}
			{isOrbital ? (
				<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
					{t.hint_spectrum_family_orbital}
				</Caption>
			) : null}

			{caps.supportsLinear && caps.supportsRadial ? (
				<div className="flex flex-col gap-2">
					<span className="uppercase" style={CONTROL_LABEL_STYLE}>
						{t.label_spectrum_mode}
					</span>
					<OptionCardGrid<SpectrumMode>
						items={SPECTRUM_MODES.map(mode => ({
							value: mode,
							label: SPECTRUM_MODE_LABELS[mode],
							description:
								mode === 'linear'
									? 'Horizontal or vertical timeline feel.'
									: 'Circular spectrum around a center.',
							preview: <SpectrumModePreview mode={mode} />
						}))}
						value={sp.spectrumMode}
						onChange={(value => update({ spectrumMode: value }))}
						columns={2}
						density="compact"
						ariaLabel={t.label_spectrum_mode}
					/>
				</div>
			) : null}

			{caps.supportsShape && (
				<SpectrumStyleSelector
					label={t.label_spectrum_style}
					options={mainStyleOptions}
					value={sp.spectrumShape}
					onChange={(value => update({ spectrumShape: value }))}
				/>
			)}

			{isClassic && isRadial && (
				<>
					<ToggleControl
						label={t.label_follow_logo}
						value={sp.spectrumFollowLogo}
						onChange={(value => update({ spectrumFollowLogo: value }))}
					/>
					{sp.spectrumFollowLogo ? (
						<AdvancedOnly>
							<ToggleControl
								label={t.label_fit_around_logo}
								value={sp.spectrumRadialFitLogo}
								onChange={(value => update({ spectrumRadialFitLogo: value }))}
								tooltip={t.hint_fit_around_logo}
							/>
							<SliderControl
								label={t.label_logo_gap}
								value={sp.spectrumLogoGap}
								{...SPECTRUM_RANGES.logoGap}
								onChange={(value => update({ spectrumLogoGap: value }))}
								unit="px"
							/>
						</AdvancedOnly>
					) : (
						<AdvancedOnly>
							<SliderControl
								label={t.label_inner_radius}
								value={sp.spectrumInnerRadius}
								{...SPECTRUM_RANGES.innerRadius}
								onChange={(value => update({ spectrumInnerRadius: value }))}
							/>
						</AdvancedOnly>
					)}
				</>
			)}

			{isRadial && caps.supportsRadialShape && !isLiquid ? (
				<>
					<CollapsibleSection
						title={t.label_radial_shape}
						defaultOpen
						dense
					>
						<EnumButtons<SpectrumRadialShape>
							options={SPECTRUM_RADIAL_SHAPES}
							value={sp.spectrumRadialShape}
							onChange={(value => update({ spectrumRadialShape: value }))}
							labels={SPECTRUM_RADIAL_SHAPE_ICONS}
							tooltips={SPECTRUM_RADIAL_SHAPE_LABELS}
						/>
					</CollapsibleSection>
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_radial_shape_families}
					</Caption>
					<AdvancedOnly>
						<SliderControl
							label={t.label_radial_angle}
							value={sp.spectrumRadialAngle}
							{...SPECTRUM_RANGES.radialAngle}
							onChange={(value => update({ spectrumRadialAngle: value }))}
							unit="deg"
						/>
					</AdvancedOnly>
					{!isClassic && !sp.spectrumFollowLogo ? (
						<AdvancedOnly>
							<SliderControl
								label={
									isTunnel
										? t.label_tunnel_inner_radius
										: t.label_inner_radius
								}
								value={sp.spectrumInnerRadius}
								{...SPECTRUM_RANGES.innerRadius}
								onChange={(value => update({ spectrumInnerRadius: value }))}
							/>
						</AdvancedOnly>
					) : null}
				</>
			) : null}

			{showLinearAxisControls ? (
				<>
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_linear_axis_controls}
					</Caption>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_spectrum_orientation}
						</span>
						<EnumButtons<SpectrumLinearOrientation>
							options={SPECTRUM_LINEAR_ORIENTATIONS}
							value={sp.spectrumLinearOrientation}
							onChange={(value => update({ spectrumLinearOrientation: value }))}
							labels={SPECTRUM_LINEAR_ORIENTATION_LABELS}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_linear_direction}
						</span>
						<EnumButtons<SpectrumLinearDirection>
							options={SPECTRUM_LINEAR_DIRECTIONS}
							value={sp.spectrumLinearDirection}
							onChange={(value => update({ spectrumLinearDirection: value }))}
							labels={SPECTRUM_LINEAR_DIRECTION_LABELS}
						/>
					</div>
					<SliderControl
						label={t.label_spectrum_span}
						value={sp.spectrumSpan}
						{...SPECTRUM_RANGES.span}
						onChange={(value => update({ spectrumSpan: value }))}
					/>
				</>
			) : null}

			<AdvancedOnly>
				{canMoveMainSpectrum ? (
					<CollapsibleSection title={t.spectrum_section_position} dense>
						<div className="flex min-w-0 flex-col gap-2">
							<SliderControl
								label={t.label_position_x}
								value={sp.spectrumPositionX}
								{...SPECTRUM_RANGES.positionX}
								onChange={(value => update({ spectrumPositionX: value }))}
							/>
							<SliderControl
								label={t.label_position_y}
								value={sp.spectrumPositionY}
								{...SPECTRUM_RANGES.positionY}
								onChange={(value => update({ spectrumPositionY: value }))}
							/>
						</div>
					</CollapsibleSection>
				) : null}
			</AdvancedOnly>
		</div>
	);
}
