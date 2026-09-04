import { useCallback, useEffect, useRef } from 'react';
import type { useBackgroundPositionRanges } from './useBackgroundPositionRanges';
import type { BackgroundStore } from './useBackgroundStore';

type BackgroundPositionRanges = ReturnType<typeof useBackgroundPositionRanges>;

type CoverageStore = Pick<
	BackgroundStore,
	| 'imageCoverageLockEnabled'
	| 'imageFitMode'
	| 'imageMirrorFill'
	| 'imagePositionX'
	| 'imagePositionY'
	| 'imageScale'
	| 'setImageCoverageLockEnabled'
	| 'setImageFitMode'
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
	}, [activeImagePositionRanges, coverageActive, store]);

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

	// Some coverage-relevant changes shift the minimum scale needed to cover the
	// screen: turning Mirror Fill ON, or switching the Fit Mode. When Keep
	// Covered is active the user wants the scale to SNAP to the freshly computed
	// minimum so they immediately see the composition at its smallest
	// coverage-valid size (Mirror Fill) or the recalculated minimum for the new
	// fit (Fit Mode). The ranges hook re-runs after the change takes effect —
	// this effect picks up the new minScale and snaps once per transition.
	const pendingCoverageSnap = useRef(false);
	function handleToggleMirrorFill(enabled: boolean) {
		store.setImageMirrorFill(enabled);
		if (enabled && coverageActive) {
			pendingCoverageSnap.current = true;
		}
	}
	function handleChangeFitMode(value: CoverageStore['imageFitMode']) {
		store.setImageFitMode(value);
		if (coverageActive) {
			pendingCoverageSnap.current = true;
		}
	}
	useEffect(() => {
		if (!pendingCoverageSnap.current) return;
		if (!coverageActive) {
			pendingCoverageSnap.current = false;
			return;
		}
		if (!activeImagePositionRanges.ready) return;
		store.setImageScale(activeImagePositionRanges.minScale);
		pendingCoverageSnap.current = false;
		// Only react to ranges/coverage changes; don't re-snap on every store
		// change (scale included).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		activeImagePositionRanges.ready,
		activeImagePositionRanges.minScale,
		coverageActive
	]);

	useEffect(() => {
		normalizeCoveredTransform();
	}, [normalizeCoveredTransform]);

	return {
		handleChangeFitMode,
		handleChangePositionX,
		handleChangePositionY,
		handleChangeScale,
		handleToggleCoverageLock,
		handleToggleMirrorFill
	};
}
