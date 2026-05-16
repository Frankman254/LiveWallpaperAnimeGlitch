import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	formatViewportResolution,
	useViewportResolution
} from '@/features/layout/viewportMetrics';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { Button, SectionCard } from '@/ui';
import { HintText, SwitchRow } from '../modernAdvancedControls';
import { MetricTile, ResolutionField } from './editorTabHelpers';

export default function ResponsiveLayoutSection() {
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
			title="Responsive Layout"
			subtitle="Scale HUD, spectrum, logo and track text from a saved reference resolution."
			density="compact"
		>
			<HintText>
				Use a reference resolution to keep overlays proportional when this
				project moves between monitors. Manual values stay untouched.
			</HintText>
			<div className="grid gap-2 md:grid-cols-2">
				<SwitchRow
					label="Auto-adjust to current screen"
					checked={store.layoutResponsiveEnabled}
					onChange={store.setLayoutResponsiveEnabled}
				/>
				<SwitchRow
					label="Preserve background framing"
					checked={store.layoutBackgroundReframeEnabled}
					onChange={store.setLayoutBackgroundReframeEnabled}
					hint="Keeps authored image framing when aspect ratio changes."
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<MetricTile
					label="Current"
					value={formatViewportResolution(currentViewport)}
				/>
				<MetricTile
					label="Reference"
					value={formatViewportResolution({
						width: store.layoutReferenceWidth,
						height: store.layoutReferenceHeight
					})}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<ResolutionField
					label="Reference Width"
					value={referenceWidthDraft}
					onChange={setReferenceWidthDraft}
					onCommit={commitReferenceWidth}
				/>
				<ResolutionField
					label="Reference Height"
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
				Use current screen as reference
			</Button>
		</SectionCard>
	);
}
