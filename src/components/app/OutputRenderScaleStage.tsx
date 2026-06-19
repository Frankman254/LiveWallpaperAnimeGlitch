import type { ReactNode } from 'react';
import { useOutputPerformanceStore } from '@/runtime/outputPerformanceStore';

/** Applies optional recording render scale without mutating project presets. */
export default function OutputRenderScaleStage({
	enabled,
	children
}: {
	enabled: boolean;
	children: ReactNode;
}) {
	const scale = useOutputPerformanceStore(s => s.recordingRenderScale);
	if (!enabled || scale >= 0.999) return children;

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				overflow: 'hidden',
				width: `${100 / scale}%`,
				height: `${100 / scale}%`,
				transform: `scale(${scale})`,
				transformOrigin: 'top left'
			}}
		>
			{children}
		</div>
	);
}
