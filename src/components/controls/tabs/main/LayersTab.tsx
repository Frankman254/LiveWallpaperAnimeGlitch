import { useEffect, useState, type CSSProperties } from 'react';
import {
	Image as ImageIcon,
	Layers,
	RotateCcw,
	SlidersHorizontal
} from 'lucide-react';
import BackgroundTab from './BackgroundTab';
import { BackgroundViewTabs } from '../bg/backgroundViewTabs';
import {
	readPersistedBgView,
	writePersistedBgView,
	type BgView
} from '../bg/backgroundViewState';
import { useIsSimple } from '@/components/controls/UIMode';
import { useT } from '@/lib/i18n';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	SectionCard,
	SegmentedControl,
	UI_COLORS,
	ICON_SIZE
} from '@/ui';
import LayerStackPanel from './layers/LayerStackPanel';
import OverlaysPanel from './layers/OverlaysPanel';
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

export default function LayersTab({ onReset }: { onReset: () => void }) {
	const isSimple = useIsSimple();
	const t = useT();
	const canShowBackgroundAudio = !isSimple;
	const [view, setView] = useState<LayersView>(() =>
		readPersistedLayersView(isSimple)
	);
	const [backgroundView, setBackgroundView] = useState<BgView>(() =>
		readPersistedBgView(canShowBackgroundAudio)
	);

	useEffect(() => {
		if (isSimple && view === 'overlays') {
			setView('background');
			writePersistedLayersView('background');
		}
	}, [isSimple, view]);

	useEffect(() => {
		if (backgroundView === 'audio' && !canShowBackgroundAudio) {
			setBackgroundView('pool');
			writePersistedBgView('pool');
		}
	}, [backgroundView, canShowBackgroundAudio]);

	function handleViewChange(nextView: LayersView) {
		const safeView =
			isSimple && nextView === 'overlays' ? 'background' : nextView;
		setView(safeView);
		writePersistedLayersView(safeView);
	}

	function handleBackgroundViewChange(nextView: BgView) {
		const safeView =
			nextView === 'audio' && !canShowBackgroundAudio ? 'pool' : nextView;
		setBackgroundView(safeView);
		writePersistedBgView(safeView);
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
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_layers}
					subtitle={t.layers_subtitle}
				/>
			}
			footer={
				<EditorTabFooter title={t.label_reset}>
					<Button
						type="button"
						onClick={onReset}
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.reset_tab}
					</Button>
				</EditorTabFooter>
			}
		>
			<ProjectScopeStrip />
			<div
				className="sticky top-0 z-30 -mx-1 px-1 pb-2 pt-1"
				style={{
					background: `linear-gradient(to bottom, ${UI_COLORS.shell} 0%, ${UI_COLORS.shell} 82%, transparent 100%)`
				}}
			>
				<SectionCard
					title={t.layers_section_title}
					subtitle={t.layers_subtitle}
					density="compact"
				>
					<SegmentedControl<LayersView>
						value={view}
						onChange={handleViewChange}
						options={options}
						size="sm"
						density="compact"
						full
						ariaLabel={t.layers_aria_sections}
					/>
					{view === 'background' ? (
						<div
							className="mt-2 border-t pt-2"
							style={{ borderColor: UI_COLORS.hairline }}
						>
							<BackgroundViewTabs
								view={backgroundView}
								onChange={handleBackgroundViewChange}
								canShowAudio={canShowBackgroundAudio}
							/>
						</div>
					) : null}
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
					<BackgroundTab
						view={backgroundView}
						onViewChange={handleBackgroundViewChange}
						hideViewTabs
					/>
				</div>
			) : null}
			{view === 'stack' ? <LayerStackPanel /> : null}
			{view === 'overlays' ? <OverlaysPanel onReset={onReset} /> : null}
		</EditorTabLayout>
	);
}
