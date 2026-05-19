import { useEffect, useState, type CSSProperties } from 'react';
import {
	Image as ImageIcon,
	Layers,
	List,
	RotateCcw,
	SlidersHorizontal
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import ModernBackgroundPanel from './ModernBackgroundPanel';
import { useIsSimple } from '@/components/controls/UIMode';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	IconButton,
	SectionCard,
	SegmentedControl,
	Select,
	UI_COLORS,
	ICON_SIZE,
	FONT
} from '@/ui';
import ModernLayerStackPanel from './layers/ModernLayerStackPanel';
import ModernOverlaysPanel from './layers/ModernOverlaysPanel';

type LayersView = 'background' | 'stack' | 'overlays';

const MODERN_LAYERS_VIEW_STORAGE_KEY = 'lwag-modern-layers-view';

function isLayersView(value: unknown): value is LayersView {
	return value === 'background' || value === 'stack' || value === 'overlays';
}

function readPersistedLayersView(isSimple: boolean): LayersView {
	if (typeof window === 'undefined') return isSimple ? 'background' : 'stack';
	try {
		const value = window.localStorage.getItem(MODERN_LAYERS_VIEW_STORAGE_KEY);
		if (!isLayersView(value)) return isSimple ? 'background' : 'stack';
		return isSimple && value === 'overlays' ? 'background' : value;
	} catch {
		return isSimple ? 'background' : 'stack';
	}
}

function writePersistedLayersView(value: LayersView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_LAYERS_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable — view restore is optional */
	}
}

export default function ModernLayersTab({
	onReset
}: {
	onReset: () => void;
}) {
	const isSimple = useIsSimple();
	const [view, setView] = useState<LayersView>(
		() => readPersistedLayersView(isSimple)
	);

	useEffect(() => {
		if (isSimple && view === 'overlays') {
			setView('background');
			writePersistedLayersView('background');
		}
	}, [isSimple, view]);

	function handleViewChange(nextView: LayersView) {
		const safeView = isSimple && nextView === 'overlays' ? 'background' : nextView;
		setView(safeView);
		writePersistedLayersView(safeView);
	}

	const options = isSimple
		? ([
				{
					value: 'background',
					label: 'BG',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				},
				{
					value: 'stack',
					label: 'Stack',
					icon: <Layers size={ICON_SIZE.xs} />
				}
			] as const)
		: ([
				{
					value: 'background',
					label: 'BG',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				},
				{
					value: 'stack',
					label: 'Stack',
					icon: <Layers size={ICON_SIZE.xs} />
				},
				{
					value: 'overlays',
					label: 'Overlays',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				}
			] as const);

	return (
		<div className="flex flex-col gap-2">
			<SetlistQuickSwitcher />
			<SectionCard
				title="Layers"
				subtitle="Background, render order, and overlay images"
				action={
					<IconButton
						size="sm"
						density="compact"
						onClick={onReset}
						title="Reset layer settings"
					>
						<RotateCcw size={ICON_SIZE.sm} />
					</IconButton>
				}
				density="compact"
			>
				<SegmentedControl<LayersView>
					value={view}
					onChange={handleViewChange}
					options={options}
					size="sm"
					density="compact"
					full
					ariaLabel="Layer sections"
				/>
			</SectionCard>

			{view === 'background' ? (
				<div
					className="flex flex-col gap-2"
					style={
						{
							'--bg-preview-height':
								'clamp(12rem, 24dvh, 22rem)',
							'--bg-control-gap': '0.25rem',
							'--bg-stepper-size': '1.75rem',
							'--bg-input-height': '1.75rem',
							'--bg-slider-hit-height': '1rem',
							'--bg-slider-track-height': '3px',
							'--bg-slider-thumb-size': '10px'
						} as CSSProperties
					}
				>
					<ModernBackgroundPanel />
				</div>
			) : null}
			{view === 'stack' ? <ModernLayerStackPanel /> : null}
			{view === 'overlays' ? <ModernOverlaysPanel onReset={onReset} /> : null}
		</div>
	);
}

const ALL_IMAGES_OPTION_VALUE = '__all__';

/**
 * Quick switcher for the active setlist, mounted at the top of the Layers
 * tab. Lets the user toggle between "show all images" and any saved
 * setlist without leaving Layers for Scene → Setlists.
 *
 * Hidden when there are no setlists (no point showing a 1-option select).
 */
function SetlistQuickSwitcher() {
	const { setlists, activeSetlistId, setActiveSetlistId } = useWallpaperStore(
		useShallow(s => ({
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			setActiveSetlistId: s.setActiveSetlistId
		}))
	);

	if (setlists.length === 0) return null;

	const options = [
		{
			value: ALL_IMAGES_OPTION_VALUE,
			label: 'All images',
			icon: <ImageIcon size={ICON_SIZE.xs} />
		},
		...setlists.map(setlist => ({
			value: setlist.id,
			label: setlist.name,
			hint: `${setlist.imageAssetIds.length} img · ${setlist.trackIds.length} trk`
		}))
	];

	return (
		<div
			className="flex items-center gap-2 rounded-[var(--editor-radius-md)] border px-2 py-1.5"
			style={{
				borderColor: activeSetlistId
					? UI_COLORS.accentBorder
					: UI_COLORS.border,
				background: activeSetlistId
					? UI_COLORS.accentSoft
					: UI_COLORS.raised
			}}
		>
			<List
				size={ICON_SIZE.xs}
				style={{
					color: activeSetlistId
						? UI_COLORS.accent
						: UI_COLORS.fgMute
				}}
				aria-hidden
			/>
			<span
				className="text-[10px] uppercase tracking-widest"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono
				}}
			>
				Setlist
			</span>
			<Select<string>
				value={activeSetlistId ?? ALL_IMAGES_OPTION_VALUE}
				onChange={next =>
					setActiveSetlistId(
						next === ALL_IMAGES_OPTION_VALUE ? null : next
					)
				}
				options={options}
				size="sm"
				density="compact"
				full
				ariaLabel="Filter pool by setlist"
			/>
		</div>
	);
}
