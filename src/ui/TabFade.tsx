/**
 * Cross-fades children whenever `tabKey` changes.
 *
 * On every key change, the wrapper fades out (opacity 1 → 0 over 120ms),
 * remounts with the new children, then fades back in. Outgoing renders are
 * kept in the DOM for the duration of the fade-out so the user sees a
 * smooth blend instead of a hard cut.
 *
 * Used inside `ControlPanel` and `EditorOverlay` to transition between
 * tabs / sub-panels without a jarring snap.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { transition } from './tokens/motion';

export type TabFadeProps = {
	tabKey: string;
	children: ReactNode;
	/** Override the half-cycle duration in ms. Default 120. */
	durationMs?: number;
};

export default function TabFade({
	tabKey,
	children,
	durationMs = 120
}: TabFadeProps) {
	const [mountedKey, setMountedKey] = useState(tabKey);
	const [mountedChildren, setMountedChildren] = useState(children);
	const [opacity, setOpacity] = useState(1);

	useEffect(() => {
		if (tabKey === mountedKey) {
			// Same tab, but children may have changed (parent re-renders) —
			// keep showing the latest.
			setMountedChildren(children);
			return undefined;
		}
		setOpacity(0);
		const id = window.setTimeout(() => {
			setMountedKey(tabKey);
			setMountedChildren(children);
			// Two-frame defer so the new content's first paint is at opacity 0
			// and the transition has something to interpolate from.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => setOpacity(1));
			});
		}, durationMs);
		return () => window.clearTimeout(id);
	}, [tabKey, mountedKey, children, durationMs]);

	return (
		<div
			style={{
				opacity,
				transition: transition('opacity', 'fast')
			}}
		>
			{mountedChildren}
		</div>
	);
}
