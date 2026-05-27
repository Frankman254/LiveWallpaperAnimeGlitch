import { useCallback, useEffect } from 'react';
import type { useBackgroundPositionRanges } from './useBackgroundPositionRanges';
import type { ModernBackgroundStore } from './useModernBackgroundStore';

type BackgroundPositionRanges = ReturnType<typeof useBackgroundPositionRanges>;

type CoverageStore = Pick<
	ModernBackgroundStore,
	| 'imageCoverageLockEnabled'
	| 'imagePositionX'
	| 'imagePositionY'
	| 'imageScale'
	| 'setImageCoverageLockEnabled'
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

	useEffect(() => {
		normalizeCoveredTransform();
	}, [normalizeCoveredTransform]);

	return {
		handleChangePositionX,
		handleChangePositionY,
		handleChangeScale,
		handleToggleCoverageLock
	};
}
