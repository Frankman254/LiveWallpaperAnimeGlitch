import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	formatViewportResolution,
	useViewportResolution
} from '@/features/layout/viewportMetrics';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { Button, SectionCard } from '@/ui';
import { HintText, SwitchRow } from '../modernAdvancedControls';
import { MetricTile, ResolutionField } from './editorTabHelpers';

export default function ResponsiveLayoutSection() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			layoutResponsiveEnabled: s.layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled: s.layoutBackgroundReframeEnabled,
			layoutReferenceWidth: s.layoutReferenceWidth,
			layoutReferenceHeight: s.layoutReferenceHeight,
			setLayoutResponsiveEnabled: s.setLayoutResponsiveEnabled,
			setLayoutBackgroundReframeEnabled: s.setLayoutBackgroundReframeEnabled,
			setLayoutReferenceResolution: s.setLayoutReferenceResolution,
			captureCurrentViewportAsReference: s.captureCurrentViewportAsReference
		}))
	);
	const currentViewport = useViewportResolution();
	const [referenceWidthDraft, setReferenceWidthDraft] = useState(() =>
		String(store.layoutReferenceWidth)
	);
	const [referenceHeightDraft, setReferenceHeightDraft] = useState(() =>
		String(store.layoutReferenceHeight)
	);

	useEffect(() => {
		setReferenceWidthDraft(String(store.layoutReferenceWidth));
	}, [store.layoutReferenceWidth]);

	useEffect(() => {
		setReferenceHeightDraft(String(store.layoutReferenceHeight));
	}, [store.layoutReferenceHeight]);

	const commitReferenceWidth = () => {
		const nextWidth = Number.parseInt(referenceWidthDraft, 10);
		if (Number.isFinite(nextWidth) && nextWidth > 0) {
			store.setLayoutReferenceResolution(
				nextWidth,
				store.layoutReferenceHeight
			);
			return;
		}
		setReferenceWidthDraft(String(store.layoutReferenceWidth));
	};

	const commitReferenceHeight = () => {
		const nextHeight = Number.parseInt(referenceHeightDraft, 10);
		if (Number.isFinite(nextHeight) && nextHeight > 0) {
			store.setLayoutReferenceResolution(
				store.layoutReferenceWidth,
				nextHeight
			);
			return;
		}
		setReferenceHeightDraft(String(store.layoutReferenceHeight));
	};

	return (
		<SectionCard
			title={t.responsive_layout_title}
			subtitle={t.responsive_layout_subtitle}
			density="compact"
		>
			<HintText>{t.responsive_layout_hint}</HintText>
			<div className="grid gap-2 md:grid-cols-2">
				<SwitchRow
					label={t.responsive_layout_auto_adjust}
					checked={store.layoutResponsiveEnabled}
					onChange={store.setLayoutResponsiveEnabled}
				/>
				<SwitchRow
					label={t.responsive_layout_preserve_framing}
					checked={store.layoutBackgroundReframeEnabled}
					onChange={store.setLayoutBackgroundReframeEnabled}
					hint={t.responsive_layout_preserve_framing_hint}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<MetricTile
					label={t.responsive_layout_label_current}
					value={formatViewportResolution(currentViewport)}
				/>
				<MetricTile
					label={t.responsive_layout_label_reference}
					value={formatViewportResolution({
						width: store.layoutReferenceWidth,
						height: store.layoutReferenceHeight
					})}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<ResolutionField
					label={t.responsive_layout_label_reference_width}
					value={referenceWidthDraft}
					onChange={setReferenceWidthDraft}
					onCommit={commitReferenceWidth}
				/>
				<ResolutionField
					label={t.responsive_layout_label_reference_height}
					value={referenceHeightDraft}
					onChange={setReferenceHeightDraft}
					onCommit={commitReferenceHeight}
				/>
			</div>
			<Button
				size="sm"
				density="compact"
				variant="secondary"
				onClick={store.captureCurrentViewportAsReference}
			>
				{t.responsive_layout_btn_use_current}
			</Button>
		</SectionCard>
	);
}
