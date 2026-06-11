import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const sourcePath = process.argv[2];
if (!sourcePath) {
	throw new Error(
		'Usage: npm run defaults:import -- /absolute/path/to/settings.json'
	);
}

const projectRoot = resolve(import.meta.dirname, '..');
const targetPath = resolve(projectRoot, 'src/lib/canonicalFactoryPresets.ts');
const targetSource = readFileSync(targetPath, 'utf8');
const settingsEnvelope = JSON.parse(readFileSync(resolve(sourcePath), 'utf8'));

if (
	settingsEnvelope.format !== 'lwag-settings' ||
	typeof settingsEnvelope.state !== 'object' ||
	settingsEnvelope.state === null
) {
	throw new Error(
		'Expected an lwag-settings JSON export with a state object.'
	);
}

const state = settingsEnvelope.state;
const FACTORY_LOGO_TOKEN = '__CANONICAL_FACTORY_LOGO_URL__';

const ADDITIONAL_SETTINGS_KEYS = [
	'rgbShiftAudioAttack',
	'rgbShiftAudioRelease',
	'rgbShiftAudioReactivitySpeed',
	'rgbShiftAudioPeakWindow',
	'rgbShiftAudioPeakFloor',
	'rgbShiftAudioPunch',
	'particleAudioSmoothing',
	'particleAudioAttack',
	'particleAudioRelease',
	'particleAudioReactivitySpeed',
	'particleAudioPeakWindow',
	'particleAudioPeakFloor',
	'particleAudioPunch',
	'particleAudioDriftEnabled',
	'particleAudioDriftAngle',
	'particleAudioDriftAmount',
	'particleAudioDriftBase',
	'particleAudioDriftChannel',
	'particleAudioDriftThreshold',
	'particleAudioDriftRelease',
	'particleAudioDriftMode',
	'particleAudioDriftInvertOnLowEnergy',
	'particleDepthFlowEnabled',
	'particleDepthFlowAmount',
	'particleDepthFlowDirection',
	'particleDepthFlowChannel',
	'particleDepthFlowThreshold',
	'particleDepthFlowSensitivity',
	'particleDepthFlowAttack',
	'particleDepthFlowRelease',
	'particleDepthFlowSpeed',
	'particleDepthFlowSpread',
	'particleDepthFlowFocusX',
	'particleDepthFlowFocusY',
	'particleDepthFlowMode',
	'stageLightsEnabled',
	'stageLightsIntensity',
	'stageLightsBeamCount',
	'stageLightsMinBeamCount',
	'stageLightsMaxBeamCount',
	'stageLightsBeamWidth',
	'stageLightsBeamLength',
	'stageLightsSoftness',
	'stageLightsSpeed',
	'stageLightsFixedMotion',
	'stageLightsColorSource',
	'stageLightsColor',
	'stageLightsAudioReactive',
	'stageLightsAudioChannel',
	'stageLightsAudioAmount',
	'stageLightsAudioOscillationAmount',
	'stageLightsAudioHoldMs',
	'stageLightsAudioDecay',
	'stageLightsAudioGateEnabled',
	'stageLightsPeakFlash',
	'stageLightsPeakThreshold',
	'stageLightsBandThresholds',
	'stageLightsOpacity',
	'stageLightsBlendMode',
	'stageLightsOrigin',
	'stageLightsMovementMode',
	'stageLightsInvertDirection',
	'stageLightsMirrorDirections',
	'flashLightEnabled',
	'flashLightIntensity',
	'flashLightColorSource',
	'flashLightColor',
	'flashLightSoftness',
	'flashLightBrightness',
	'flashLightDecay',
	'flashLightAudioChannel',
	'flashLightThreshold',
	'flashLightBandThresholds',
	'flashLightSensitivity',
	'flashLightRetriggerMs',
	'flashLightShape',
	'flashLightBlendMode',
	'cameraFxEnabled',
	'cameraMotionEnabled',
	'cameraMotionMode',
	'cameraMotionAmount',
	'cameraMotionSpeed',
	'cameraMotionDrive',
	'cameraMotionAudioInfluence',
	'cameraMotionAudioChannel',
	'cameraMotionDirection',
	'cameraMotionTarget',
	'cameraMotionTargets',
	'cameraShakeEnabled',
	'cameraShakeAmount',
	'cameraShakeDecay',
	'cameraShakeThreshold',
	'cameraShakeBandThresholds',
	'cameraShakeTargets',
	'cameraShakeSensitivity',
	'cameraShakeRetriggerMs',
	'cameraShakeChannel',
	'cameraShakeMode',
	'cameraShakeFrequency',
	'cameraShakeRoughness'
];

const ADDITIONAL_SPECTRUM_KEYS = [
	'spectrumShockwaveBandThresholds',
	'spectrumCloneShockwaveBandThresholds',
	'spectrumRotationDrive',
	'spectrumRotationAudioAmount',
	'spectrumRotationChannel',
	'spectrumRotationDirection',
	'spectrumRotationSmoothing',
	'spectrumCloneRotationDrive',
	'spectrumCloneRotationAudioAmount',
	'spectrumCloneRotationChannel',
	'spectrumCloneRotationDirection',
	'spectrumCloneRotationSmoothing'
];

function readCanonicalObject(exportName) {
	const marker = `export const ${exportName} = `;
	const start = targetSource.indexOf(marker);
	if (start < 0) throw new Error(`Could not find ${exportName}.`);

	const objectStart = start + marker.length;
	const objectEnd = targetSource.indexOf(
		'\n} as Partial<WallpaperState>;',
		objectStart
	);
	if (objectEnd < 0) throw new Error(`Could not parse ${exportName}.`);

	return Function(
		'CANONICAL_FACTORY_LOGO_URL',
		`"use strict"; return (${targetSource.slice(objectStart, objectEnd + 2)});`
	)(FACTORY_LOGO_TOKEN);
}

function importKeys(existing, additionalKeys) {
	const next = {};
	for (const key of new Set([...Object.keys(existing), ...additionalKeys])) {
		if (key === 'stageLightsBeamLength' && !(key in state)) {
			next[key] = 0.95;
			continue;
		}
		if (key === 'stageLightsAudioHoldMs' && !(key in state)) {
			next[key] = 90;
			continue;
		}
		if (key === 'stageLightsAudioDecay' && !(key in state)) {
			next[key] = 0.82;
			continue;
		}
		if (key === 'cameraMotionTargets' && !(key in state)) {
			if (state.cameraMotionTarget === 'all') {
				next[key] = [
					'global-background',
					'background',
					'selected-overlay',
					'logo',
					'spectrum',
					'particles',
					'rain',
					'track-title',
					'lyrics',
					'stage-lights',
					'flash-light'
				];
			} else if (state.cameraMotionTarget === 'background-spectrum') {
				next[key] = ['background', 'spectrum'];
			} else {
				next[key] =
					typeof state.cameraMotionTarget === 'string'
						? [state.cameraMotionTarget]
						: ['background'];
			}
			continue;
		}
		if (key === 'cameraShakeTargets' && !(key in state)) {
			next[key] = [
				'global-background',
				'background',
				'selected-overlay',
				'logo',
				'spectrum',
				'particles',
				'rain',
				'track-title',
				'lyrics',
				'stage-lights',
				'flash-light'
			];
			continue;
		}
		if (!(key in state)) {
			throw new Error(`Settings export is missing expected key: ${key}`);
		}
		next[key] = state[key];
	}
	return next;
}

function renderObject(value) {
	return JSON.stringify(value, null, '\t').replace(
		`"${FACTORY_LOGO_TOKEN}"`,
		'CANONICAL_FACTORY_LOGO_URL'
	);
}

const currentSettings = readCanonicalObject('CANONICAL_FACTORY_SETTINGS_PATCH');
const currentSpectrum = readCanonicalObject('CANONICAL_FACTORY_SPECTRUM_PATCH');
const nextSettings = importKeys(currentSettings, ADDITIONAL_SETTINGS_KEYS);
const nextSpectrum = importKeys(currentSpectrum, ADDITIONAL_SPECTRUM_KEYS);

// Factory defaults must stay independent from local IndexedDB asset references.
nextSettings.logoId = null;
nextSettings.logoUrl = FACTORY_LOGO_TOKEN;

const settingsMarker = 'export const CANONICAL_FACTORY_SETTINGS_PATCH = ';
const header = targetSource.slice(0, targetSource.indexOf(settingsMarker));
const output = `${header}export const CANONICAL_FACTORY_SETTINGS_PATCH = ${renderObject(
	nextSettings
)} as Partial<WallpaperState>;

export const CANONICAL_FACTORY_SPECTRUM_PATCH = ${renderObject(
	nextSpectrum
)} as Partial<WallpaperState>;

export const CANONICAL_DEFAULT_STATE_PATCH = {
	...CANONICAL_FACTORY_SETTINGS_PATCH,
	...CANONICAL_FACTORY_SPECTRUM_PATCH,
	logoId: null,
	logoUrl: CANONICAL_FACTORY_LOGO_URL
} as Partial<WallpaperState>;
`;

writeFileSync(targetPath, output);
process.exit(0);
