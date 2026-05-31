import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	CALIBRATION_PARAMS,
	CALIBRATION_PARAM_KEYS,
	MAX_CALIBRATION_SLOT_COUNT,
	SUGGESTED_CALIBRATION_VALUES,
	type CalibrationGroupId,
	type CalibrationProfileValues,
	type CalibrationRangeOverride,
	type CalibrationRangeOverrides
} from '@/features/calibration/calibrationConfig';
import type { WallpaperState } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

type CalibrationKey = (typeof CALIBRATION_PARAM_KEYS)[number];

function extractCalibrationValues(
	state: WallpaperState
): CalibrationProfileValues {
	const next: CalibrationProfileValues = {};
	for (const param of CALIBRATION_PARAMS) {
		const value = state[param.key];
		if (typeof value === 'number' && Number.isFinite(value)) {
			next[param.key as CalibrationKey] = value;
		}
	}
	return next;
}

function applyValues(
	values: CalibrationProfileValues
): Partial<WallpaperState> {
	const patch: Record<string, number> = {};
	for (const param of CALIBRATION_PARAMS) {
		const key = param.key as CalibrationKey;
		const value = values[key];
		if (typeof value === 'number' && Number.isFinite(value)) {
			patch[key] = value;
		}
	}
	return patch as Partial<WallpaperState>;
}

export function createCalibrationSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setCalibrationRangeOverride: (
			key: CalibrationKey,
			override: CalibrationRangeOverride | null
		) =>
			set(state => {
				const next: CalibrationRangeOverrides = {
					...state.calibrationRangeOverrides
				};
				if (!override || Object.keys(override).length === 0) {
					delete next[key];
				} else {
					next[key] = override;
				}
				return { calibrationRangeOverrides: next };
			}),
		resetCalibrationRangeOverrides: () =>
			set({ calibrationRangeOverrides: {} }),
		setCalibrationSyntheticMode: (
			group: CalibrationGroupId,
			enabled: boolean
		) =>
			set(state => {
				const current = Boolean(state.calibrationSyntheticGroups[group]);
				if (current === enabled) return state;
				const next = { ...state.calibrationSyntheticGroups };
				if (enabled) next[group] = true;
				else delete next[group];
				return { calibrationSyntheticGroups: next };
			}),
		applySuggestedCalibration: () =>
			set(applyValues(SUGGESTED_CALIBRATION_VALUES)),
		resetCalibrationToOriginalDefaults: () => {
			const original: CalibrationProfileValues = {};
			for (const param of CALIBRATION_PARAMS) {
				const key = param.key as CalibrationKey;
				const value = DEFAULT_STATE[param.key];
				if (typeof value === 'number') {
					original[key] = value;
				}
			}
			set(applyValues(original));
		},
		addCalibrationProfileSlot: () =>
			set(state => {
				if (
					state.calibrationProfileSlots.length >=
					MAX_CALIBRATION_SLOT_COUNT
				)
					return state;
				return {
					calibrationProfileSlots: [
						...state.calibrationProfileSlots,
						{
							name: `Calibración ${state.calibrationProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeCalibrationProfileSlot: (index: number) =>
			set(state => {
				if (
					index < 3 ||
					index >= state.calibrationProfileSlots.length
				)
					return state;
				return {
					calibrationProfileSlots:
						state.calibrationProfileSlots.filter(
							(_, slotIndex) => slotIndex !== index
						)
				};
			}),
		renameCalibrationProfileSlot: (index: number, name: string) =>
			set(state => {
				if (index < 0 || index >= state.calibrationProfileSlots.length)
					return state;
				const trimmed = name.trim();
				if (!trimmed) return state;
				return {
					calibrationProfileSlots: state.calibrationProfileSlots.map(
						(slot, slotIndex) =>
							slotIndex === index ? { ...slot, name: trimmed } : slot
					)
				};
			}),
		saveCalibrationProfileSlot: (index: number) =>
			set(state => {
				if (index < 0 || index >= state.calibrationProfileSlots.length)
					return state;
				const values = extractCalibrationValues(state);
				return {
					calibrationProfileSlots: state.calibrationProfileSlots.map(
						(slot, slotIndex) =>
							slotIndex === index ? { ...slot, values } : slot
					)
				};
			}),
		loadCalibrationProfileSlot: (index: number) =>
			set(state => {
				const slot = state.calibrationProfileSlots[index];
				if (!slot?.values) return state;
				return applyValues(slot.values);
			}),
		clearCalibrationProfileSlot: (index: number) =>
			set(state => {
				if (index < 0 || index >= state.calibrationProfileSlots.length)
					return state;
				return {
					calibrationProfileSlots: state.calibrationProfileSlots.map(
						(slot, slotIndex) =>
							slotIndex === index ? { ...slot, values: null } : slot
					)
				};
			})
	} satisfies Partial<WallpaperStore>;
}
