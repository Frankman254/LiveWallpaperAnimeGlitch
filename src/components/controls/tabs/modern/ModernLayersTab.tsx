import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
	Image as ImageIcon,
	Layers,
	RotateCcw,
	SlidersHorizontal
} from 'lucide-react';
import ModernBackgroundPanel from './ModernBackgroundPanel';
import { useIsSimple } from '@/components/controls/UIMode';
import {
	IconButton,
	SectionCard,
	SegmentedControl,
	UI_COLORS,
	ICON_SIZE
} from '@/ui';
import ModernLayerStackPanel from './layers/ModernLayerStackPanel';
import ModernOverlaysPanel from './layers/ModernOverlaysPanel';
import ProjectScopeStrip from './ProjectScopeStrip';

type LayersView = 'background' | 'stack' | 'overlays';

const MODERN_LAYERS_VIEW_STORAGE_KEY = 'lwag-modern-layers-view';

function isLayersView(value: unknown): value is LayersView {
	return value === 'background' || value === 'stack' || value === 'overlays';
}

function readPersistedLayersView(isSimple: boolean): LayersView {
	if (typeof window === 'undefined') return isSimple ? 'background' : 'stack';
	try {
		const value = window.localStorage.getItem(
			MODERN_LAYERS_VIEW_STORAGE_KEY
		);
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

export default function ModernLayersTab({ onReset }: { onReset: () => void }) {
	const isSimple = useIsSimple();
	const layersNavRef = useRef<HTMLDivElement | null>(null);
	const [layersNavHeight, setLayersNavHeight] = useState(0);
	const [view, setView] = useState<LayersView>(() =>
		readPersistedLayersView(isSimple)
	);

	useEffect(() => {
		if (isSimple && view === 'overlays') {
			setView('background');
			writePersistedLayersView('background');
		}
	}, [isSimple, view]);

	useEffect(() => {
		const node = layersNavRef.current;
		if (!node) return undefined;

		const updateHeight = () => {
			setLayersNavHeight(Math.ceil(node.getBoundingClientRect().height));
		};

		updateHeight();
		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', updateHeight);
			return () => window.removeEventListener('resize', updateHeight);
		}

		const observer = new ResizeObserver(updateHeight);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	function handleViewChange(nextView: LayersView) {
		const safeView =
			isSimple && nextView === 'overlays' ? 'background' : nextView;
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
		<div
			className="flex flex-col gap-2"
			style={
				{
					'--layers-bg-subnav-top': `${layersNavHeight}px`
				} as CSSProperties
			}
		>
			<ProjectScopeStrip />
			<div
				ref={layersNavRef}
				className="sticky top-0 z-30 -mx-1 px-1 pb-2 pt-1"
				style={{
					background: `linear-gradient(to bottom, ${UI_COLORS.shell} 0%, ${UI_COLORS.shell} 82%, transparent 100%)`
				}}
			>
				<SectionCard
					title="Layers"
					subtitle="Background, order, overlay images"
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
			</div>

			{view === 'background' ? (
				<div
					className="flex flex-col gap-2"
					style={
						{
							'--bg-preview-height': 'clamp(12rem, 24dvh, 22rem)',
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
			{view === 'overlays' ? (
				<ModernOverlaysPanel onReset={onReset} />
			) : null}
		</div>
	);
}
