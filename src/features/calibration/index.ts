/**
 * Calibration — pure model.
 *
 * The knobs behind the knobs. Every slider in the app has a range, and this is
 * where the user can move that range: `CALIBRATION_PARAMS` declares which store
 * keys are calibratable and what their factory bounds are, and
 * `calibrationRangeOverrides` (persisted) widens or narrows them per project.
 * `getEffectiveRange` is what every other panel asks before it draws a slider.
 *
 * Also here: `syntheticKickValue`, the fake beat used to drive the wallpaper
 * while nothing is playing — the renderers import it so the editor can be
 * calibrated in silence.
 *
 * React lives in `./ui`.
 */
export {
	CALIBRATION_GROUPS,
	CALIBRATION_PARAMS,
	CALIBRATION_PARAM_KEYS,
	CALIBRATION_PROFILE_SLOT_COUNT,
	MAX_CALIBRATION_SLOT_COUNT,
	SUGGESTED_CALIBRATION_VALUES,
	buildCalibrationProfileName,
	createDefaultCalibrationProfileSlots,
	getEffectiveRange
} from './calibrationConfig';
export type {
	CalibrationGroupId,
	CalibrationGroupMeta,
	CalibrationParam,
	CalibrationProfileSlot,
	CalibrationProfileValues,
	CalibrationRangeOverride,
	CalibrationRangeOverrides,
	CalibrationSyntheticGroups
} from './calibrationConfig';

export { syntheticKickValue } from './syntheticDrive';
