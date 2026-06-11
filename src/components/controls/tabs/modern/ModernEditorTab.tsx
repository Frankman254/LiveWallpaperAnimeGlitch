/**
 * Editor settings tab — split into focused sub-panels for clarity and
 * better re-render isolation. Each `<...Section>` owns its own
 * `useShallow` slice; the orchestrator here only handles the Global
 * Color Shortcuts row that needs to reconcile state across many
 * sibling color-source fields.
 */
import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { ThemeColorSource } from '@/types/wallpaper';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	SectionCard,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import { HintText, OptionButtonGroup } from './modernAdvancedControls';
import EditorPanelSection from './editor/EditorPanelSection';
import ThemeSection from './editor/ThemeSection';
import AppearanceSection from './editor/AppearanceSection';
import ResponsiveLayoutSection from './editor/ResponsiveLayoutSection';
import QuickActionsSection from './editor/QuickActionsSection';
import { THEME_COLOR_SOURCES } from './editor/editorTabHelpers';

function GlobalColorShortcutsSection() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			editorThemeColorSource: s.editorThemeColorSource,
			quickActionsColorSource: s.quickActionsColorSource,
			spectrumColorSource: s.spectrumColorSource,
			spectrumInstances: s.spectrumInstances,
			logoGlowColorSource: s.logoGlowColorSource,
			logoShadowColorSource: s.logoShadowColorSource,
			logoBackdropColorSource: s.logoBackdropColorSource,
			particleColorSource: s.particleColorSource,
			rainColorSource: s.rainColorSource,
			audioTrackTitleTextColorSource: s.audioTrackTitleTextColorSource,
			audioTrackTitleStrokeColorSource:
				s.audioTrackTitleStrokeColorSource,
			audioTrackTitleGlowColorSource: s.audioTrackTitleGlowColorSource,
			audioTrackTitleBackdropColorSource:
				s.audioTrackTitleBackdropColorSource,
			audioTrackTimeTextColorSource: s.audioTrackTimeTextColorSource,
			audioTrackTimeStrokeColorSource: s.audioTrackTimeStrokeColorSource,
			audioTrackTimeGlowColorSource: s.audioTrackTimeGlowColorSource,
			syncAllColorSources: s.syncAllColorSources
		}))
	);

	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};

	const sharedUiColorSources: ThemeColorSource[] = [
		store.editorThemeColorSource,
		store.quickActionsColorSource,
		store.spectrumColorSource,
		...store.spectrumInstances.map(
			instance => instance.spectrumColorSource
		),
		store.logoGlowColorSource,
		store.logoShadowColorSource,
		store.logoBackdropColorSource,
		store.particleColorSource,
		store.rainColorSource,
		store.audioTrackTitleTextColorSource,
		store.audioTrackTitleStrokeColorSource,
		store.audioTrackTitleGlowColorSource,
		store.audioTrackTitleBackdropColorSource,
		store.audioTrackTimeTextColorSource,
		store.audioTrackTimeStrokeColorSource,
		store.audioTrackTimeGlowColorSource
	];
	const globalShortcutSummary = THEME_COLOR_SOURCES.find(source =>
		sharedUiColorSources.every(candidate => candidate === source)
	);

	return (
		<SectionCard title={t.label_global_color_shortcuts} density="compact">
			<HintText>{t.hint_global_color_shortcuts}</HintText>
			<OptionButtonGroup<ThemeColorSource>
				label={t.label_current_state}
				options={THEME_COLOR_SOURCES}
				value={globalShortcutSummary ?? null}
				onChange={store.syncAllColorSources}
				labels={themeColorSourceLabels}
				columns={3}
			/>
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					letterSpacing: '0.12em'
				}}
			>
				{t.label_current_state}:{' '}
				<span style={{ color: UI_COLORS.fg }}>
					{globalShortcutSummary
						? themeColorSourceLabels[globalShortcutSummary]
						: t.label_mixed}
				</span>
			</span>
		</SectionCard>
	);
}

export default function ModernEditorTab({ onReset }: { onReset: () => void }) {
	const t = useT();

	return (
		<EditorTabLayout
			header={<EditorTabHeader title={t.tab_editor} />}
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
			<EditorPanelSection />
			<ThemeSection />
			<AppearanceSection />
			<ResponsiveLayoutSection />
			<GlobalColorShortcutsSection />
			<QuickActionsSection />
		</EditorTabLayout>
	);
}
