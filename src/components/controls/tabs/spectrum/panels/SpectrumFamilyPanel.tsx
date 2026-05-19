import { useEffect } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { AdvancedOnly } from '../../../UIMode';
import type {
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape
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
	SPECTRUM_RADIAL_SHAPES
} from '@/features/spectrum/spectrumControlConfig';
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

function SpectrumFamilyPreview({ family }: { family: SpectrumFamily }) {
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

export function SpectrumFamilyPanel({
	mainStyleOptions
}: {
	mainStyleOptions: SpectrumShape[];
}) {
	const t = useT();
	const store = useWallpaperStore();
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const isClassic = store.spectrumFamily === 'classic';
	const isTunnel = store.spectrumFamily === 'tunnel';
	const isLiquid = store.spectrumFamily === 'liquid';
	const isOrbital = store.spectrumFamily === 'orbital';
	const caps = getSpectrumFamilyCapabilities(store.spectrumFamily);
	const isRadial = store.spectrumMode === 'radial';
	const isLinearMode = store.spectrumMode === 'linear';
	const showLinearAxisControls = isLinearMode;
	const canMoveMainSpectrum = !resolveSpectrumPlacement(fullStore, {
		variant: 'main'
	}).positionLockedToLogo;

	useEffect(() => {
		if (!caps.supportsRadial && store.spectrumMode === 'radial') {
			store.setSpectrumMode('linear');
		} else if (!caps.supportsLinear && store.spectrumMode === 'linear') {
			store.setSpectrumMode('radial');
		}
	}, [caps.supportsLinear, caps.supportsRadial, store]);

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
					value={store.spectrumFamily}
					onChange={store.setSpectrumFamily}
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
						value={store.spectrumMode}
						onChange={store.setSpectrumMode}
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
					value={store.spectrumShape}
					onChange={store.setSpectrumShape}
				/>
			)}

			{isClassic && isRadial && (
				<>
					<ToggleControl
						label={t.label_follow_logo}
						value={store.spectrumFollowLogo}
						onChange={store.setSpectrumFollowLogo}
					/>
					{store.spectrumFollowLogo ? (
						<AdvancedOnly>
							<ToggleControl
								label={t.label_fit_around_logo}
								value={store.spectrumRadialFitLogo}
								onChange={store.setSpectrumRadialFitLogo}
								tooltip={t.hint_fit_around_logo}
							/>
							<SliderControl
								label={t.label_logo_gap}
								value={store.spectrumLogoGap}
								{...SPECTRUM_RANGES.logoGap}
								onChange={store.setSpectrumLogoGap}
								unit="px"
							/>
						</AdvancedOnly>
					) : (
						<AdvancedOnly>
							<SliderControl
								label={t.label_inner_radius}
								value={store.spectrumInnerRadius}
								{...SPECTRUM_RANGES.innerRadius}
								onChange={store.setSpectrumInnerRadius}
							/>
						</AdvancedOnly>
					)}
				</>
			)}

			{isRadial && caps.supportsRadialShape ? (
				<>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_radial_shape}
						</span>
						<EnumButtons<SpectrumRadialShape>
							options={SPECTRUM_RADIAL_SHAPES}
							value={store.spectrumRadialShape}
							onChange={store.setSpectrumRadialShape}
							labels={SPECTRUM_RADIAL_SHAPE_LABELS}
						/>
					</div>
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_radial_shape_families}
					</Caption>
					<AdvancedOnly>
						<SliderControl
							label={t.label_radial_angle}
							value={store.spectrumRadialAngle}
							{...SPECTRUM_RANGES.radialAngle}
							onChange={store.setSpectrumRadialAngle}
							unit="deg"
						/>
					</AdvancedOnly>
					{!isClassic && !store.spectrumFollowLogo ? (
						<AdvancedOnly>
							<SliderControl
								label={
									isTunnel
										? t.label_tunnel_inner_radius
										: t.label_inner_radius
								}
								value={store.spectrumInnerRadius}
								{...SPECTRUM_RANGES.innerRadius}
								onChange={store.setSpectrumInnerRadius}
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
							value={store.spectrumLinearOrientation}
							onChange={store.setSpectrumLinearOrientation}
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
							value={store.spectrumLinearDirection}
							onChange={store.setSpectrumLinearDirection}
							labels={SPECTRUM_LINEAR_DIRECTION_LABELS}
						/>
					</div>
					<SliderControl
						label={t.label_spectrum_span}
						value={store.spectrumSpan}
						{...SPECTRUM_RANGES.span}
						onChange={store.setSpectrumSpan}
					/>
				</>
			) : null}

			<AdvancedOnly>
				{canMoveMainSpectrum ? (
					<CollapsibleSection title="Position" dense>
						<div className="flex min-w-0 flex-col gap-2">
							<SliderControl
								label={t.label_position_x}
								value={store.spectrumPositionX}
								{...SPECTRUM_RANGES.positionX}
								onChange={store.setSpectrumPositionX}
							/>
							<SliderControl
								label={t.label_position_y}
								value={store.spectrumPositionY}
								{...SPECTRUM_RANGES.positionY}
								onChange={store.setSpectrumPositionY}
							/>
						</div>
					</CollapsibleSection>
				) : null}
			</AdvancedOnly>
		</div>
	);
}
