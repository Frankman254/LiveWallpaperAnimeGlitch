import { useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { getVisualWorkloadHint } from '@/features/discovery/workloadHint';
import { CAPTION_CLASS } from './ui/designTokens';

export default function VisualWorkloadBanner() {
	const t = useT();
	const store = useWallpaperStore();
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;
	if (getVisualWorkloadHint(store) === 'none') return null;

	return (
		<div
			className={`flex gap-2 rounded-md border px-2.5 py-2 ${CAPTION_CLASS}`}
			style={{
				borderColor: 'color-mix(in srgb, var(--editor-tag-border) 70%, #f97316)',
				background: 'color-mix(in srgb, var(--editor-tag-bg) 92%, #f9731618)',
				color: 'var(--editor-accent-fg)'
			}}
			role="status"
		>
			<p className="min-w-0 flex-1">{t.hint_workload_heavy}</p>
			<button
				type="button"
				onClick={() => setDismissed(true)}
				className="shrink-0 rounded border px-2 py-0.5 text-[9px] uppercase tracking-wide"
				style={{
					borderColor: 'var(--editor-accent-border)',
					color: 'var(--editor-accent-muted)'
				}}
			>
				{t.label_dismiss_hint}
			</button>
		</div>
	);
}
