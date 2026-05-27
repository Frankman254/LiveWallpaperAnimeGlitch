import { useCallback, useEffect, useRef } from 'react';
import type { useBackgroundPositionRanges } from './useBackgroundPositionRanges';
import type { ModernBackgroundStore } from './useModernBackgroundStore';

type BackgroundPositionRanges = ReturnType<typeof useBackgroundPositionRanges>;

type CoverageStore = Pick<
	ModernBackgroundStore,
	| 'imageCoverageLockEnabled'
	| 'imageMirrorFill'
	| 'imagePositionX'
	| 'imagePositionY'
	| 'imageScale'
	| 'setImageCoverageLockEnabled'
	| 'setImageMirrorFill'
	| 'setImagePositionX'
	| 'setImagePositionY'
	| 'setImageScale'
>;

function clampToRange(value: number, range: { min: number; max: number }) {
	return Math.min(range.max, Math.max(range.min, value));
}

export function useCoverageLockedImageTransform(
	store: CoverageStore,
	activeImagePositionRanges: BackgroundPositionRanges
) {
	const coverageActive = store.imageCoverageLockEnabled;

	function handleChangeScale(value: number) {
		store.setImageScale(
			coverageActive && activeImagePositionRanges.ready
				? Math.max(value, activeImagePositionRanges.minScale)
				: value
		);
	}

	function handleChangePositionX(value: number) {
		store.setImagePositionX(
			coverageActive && activeImagePositionRanges.ready
				? clampToRange(value, {
						min: activeImagePositionRanges.coverageBounds.minX,
						max: activeImagePositionRanges.coverageBounds.maxX
					})
				: value
		);
	}

	function handleChangePositionY(value: number) {
		store.setImagePositionY(
			coverageActive && activeImagePositionRanges.ready
				? clampToRange(value, {
						min: activeImagePositionRanges.coverageBounds.minY,
						max: activeImagePositionRanges.coverageBounds.maxY
					})
				: value
		);
	}

	const normalizeCoveredTransform = useCallback(() => {
		if (!coverageActive || !activeImagePositionRanges.ready) return;
		const { minScale, coverageBounds } = activeImagePositionRanges;
		const nextScale = Math.max(store.imageScale, minScale);
		const nextPositionX = clampToRange(store.imagePositionX, {
			min: coverageBounds.minX,
			max: coverageBounds.maxX
		});
		const nextPositionY = clampToRange(store.imagePositionY, {
			min: coverageBounds.minY,
			max: coverageBounds.maxY
		});

		if (nextScale !== store.imageScale) store.setImageScale(nextScale);
		if (nextPositionX !== store.imagePositionX) {
			store.setImagePositionX(nextPositionX);
		}
		if (nextPositionY !== store.imagePositionY) {
			store.setImagePositionY(nextPositionY);
		}
	}, [
		activeImagePositionRanges,
		coverageActive,
		store
	]);

	function handleToggleCoverageLock(enabled: boolean) {
		store.setImageCoverageLockEnabled(enabled);
		if (!enabled || !activeImagePositionRanges.ready) return;
		const { minScale, coverageBounds } = activeImagePositionRanges;
		if (store.imageScale < minScale) store.setImageScale(minScale);
		store.setImagePositionX(
			clampToRange(store.imagePositionX, {
				min: coverageBounds.minX,
				max: coverageBounds.maxX
			})
		);
		store.setImagePositionY(
			clampToRange(store.imagePositionY, {
				min: coverageBounds.minY,
				max: coverageBounds.maxY
			})
		);
	}

	// When Mirror Fill turns ON with Keep Covered also ON, the user wants the
	// scale to SNAP DOWN to the new minimum so they immediately see the
	// composition at its smallest coverage-valid size and can decide whether
	// to add more copies. The ranges hook re-runs after the toggle takes
	// effect — this effect picks it up and snaps once per transition.
	const pendingMirrorFillSnap = useRef(false);
	function handleToggleMirrorFill(enabled: boolean) {
		store.setImageMirrorFill(enabled);
		if (enabled && coverageActive) {
			pendingMirrorFillSnap.current = true;
		}
	}
	useEffect(() => {
		if (!pendingMirrorFillSnap.current) return;
		if (!store.imageMirrorFill || !coverageActive) {
			pendingMirrorFillSnap.current = false;
			return;
		}
		if (!activeImagePositionRanges.ready) return;
		store.setImageScale(activeImagePositionRanges.minScale);
		pendingMirrorFillSnap.current = false;
		// Only react to ranges/mirrorFill changes; don't re-snap on every
		// store change (scale included).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		activeImagePositionRanges.ready,
		activeImagePositionRanges.minScale,
		store.imageMirrorFill,
		coverageActive
	]);

	useEffect(() => {
		normalizeCoveredTransform();
	}, [normalizeCoveredTransform]);

	return {
		handleChangePositionX,
		handleChangePositionY,
		handleChangeScale,
		handleToggleCoverageLock,
		handleToggleMirrorFill
	};
}
