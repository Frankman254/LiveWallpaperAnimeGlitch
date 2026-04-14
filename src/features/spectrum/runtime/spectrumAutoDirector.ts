import {
	ALL_SPECTRUM_PRESETS,
	findPresetById,
	type SpectrumPreset
} from '@/features/spectrum/presets/spectrumPresets';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type {
	SpectrumDirectorTrigger,
	WallpaperState
} from '@/types/wallpaper';

type DirectorRuntimeState = {
	lastKick: number;
	lastFull: number;
	lastSwitchMs: number;
	lastIntervalMs: number;
	lastTrackId: string | null;
	recentPresetIds: string[];
};

const directorRuntime: DirectorRuntimeState = {
	lastKick: 0,
	lastFull: 0,
	lastSwitchMs: Number.NEGATIVE_INFINITY,
	lastIntervalMs: Number.NEGATIVE_INFINITY,
	lastTrackId: null,
	recentPresetIds: []
};

const MAX_RECENT_PRESETS = 4;

function includesTrigger(
	triggers: SpectrumDirectorTrigger[],
	trigger: SpectrumDirectorTrigger
): boolean {
	return triggers.includes(trigger);
}

function chooseByTier(
	presets: SpectrumPreset[],
	performanceMode: WallpaperState['performanceMode']
): SpectrumPreset[] {
	if (performanceMode === 'high') return presets;
	if (performanceMode === 'medium') {
		return presets.filter(
			preset => preset.performanceTier === 'light' || preset.performanceTier === 'medium'
		);
	}
	return presets.filter((preset: SpectrumPreset) => preset.performanceTier === 'light');
}

function pickRandom<T>(items: T[]): T | null {
	if (items.length === 0) return null;
	return items[Math.floor(Math.random() * items.length)] ?? null;
}

function rememberPreset(id: string): void {
	directorRuntime.recentPresetIds = [id, ...directorRuntime.recentPresetIds].slice(
		0,
		MAX_RECENT_PRESETS
	);
}

function scorePresetForTrigger(
	preset: SpectrumPreset,
	trigger: SpectrumDirectorTrigger
): number {
	const tags = preset.tags.map(tag => tag.toLowerCase());
	switch (trigger) {
		case 'kick':
			return tags.some(tag =>
				['kick', 'bass', 'aggressive', 'energy', 'pulse'].includes(tag)
			)
				? 3
				: 1;
		case 'beat':
			return tags.some(tag => ['pulse', 'wave', 'festive', 'rainbow'].includes(tag))
				? 3
				: 1;
		case 'track-change':
			return preset.category === 'cinematic' ? 3 : 1;
		case 'time':
		default:
			return 1;
	}
}

function resolveTrigger(
	state: WallpaperState,
	audio: AudioSnapshot,
	nowMs: number
): SpectrumDirectorTrigger | null {
	if (!state.spectrumAutoDirectorEnabled) {
		directorRuntime.lastTrackId = state.activeAudioTrackId;
		directorRuntime.lastKick = audio.channels.kick;
		directorRuntime.lastFull = audio.channels.full;
		return null;
	}

	const triggers = state.spectrumAutoDirectorTriggers;
	const kick = audio.channels.kick;
	const full = audio.channels.full;
	const kickRise = kick - directorRuntime.lastKick;
	const fullRise = full - directorRuntime.lastFull;
	const beatThreshold = Math.max(
		0.1,
		state.spectrumAutoDirectorEnergyThreshold * state.spectrumAutoDirectorBeatSensitivity
	);
	const kickTriggered =
		includesTrigger(triggers, 'kick') &&
		kick > state.spectrumAutoDirectorEnergyThreshold &&
		kickRise > 0.045;
	const beatTriggered =
		includesTrigger(triggers, 'beat') &&
		full > beatThreshold &&
		fullRise > 0.035;
	const trackChanged =
		includesTrigger(triggers, 'track-change') &&
		directorRuntime.lastTrackId !== null &&
		state.activeAudioTrackId !== null &&
		state.activeAudioTrackId !== directorRuntime.lastTrackId;
	const timedTrigger =
		includesTrigger(triggers, 'time') &&
		nowMs - directorRuntime.lastIntervalMs >= state.spectrumAutoDirectorIntervalMs;

	directorRuntime.lastTrackId = state.activeAudioTrackId;
	directorRuntime.lastKick = kick;
	directorRuntime.lastFull = full;

	if (trackChanged) return 'track-change';
	if (kickTriggered) return 'kick';
	if (beatTriggered) return 'beat';
	if (timedTrigger) return 'time';
	return null;
}

export function maybeSelectAutoDirectorPreset(
	state: WallpaperState,
	audio: AudioSnapshot,
	nowMs: number
): SpectrumPreset | null {
	const trigger = resolveTrigger(state, audio, nowMs);
	if (!trigger) return null;

	if (nowMs - directorRuntime.lastSwitchMs < state.spectrumAutoDirectorCooldownMs) {
		return null;
	}

	const currentPreset = state.activeSpectrumPresetId
		? findPresetById(state.activeSpectrumPresetId)
		: null;
	const candidates = chooseByTier(ALL_SPECTRUM_PRESETS, state.performanceMode)
		.filter(preset => preset.id !== state.activeSpectrumPresetId)
		.filter(
			preset =>
				!directorRuntime.recentPresetIds.includes(preset.id) ||
				ALL_SPECTRUM_PRESETS.length <= MAX_RECENT_PRESETS + 1
		)
		.filter(preset =>
			state.spectrumAutoDirectorAllowFamilySwitch || !currentPreset
				? true
				: preset.category === currentPreset.category
		);

	if (candidates.length === 0) return null;
	const weighted = candidates
		.map(preset => ({
			preset,
			score: scorePresetForTrigger(preset, trigger)
		}))
		.sort((a, b) => b.score - a.score);

	const topScore = weighted[0]?.score ?? 1;
	const top = weighted
		.filter(item => item.score === topScore)
		.map(item => item.preset);
	const selected = pickRandom(top) ?? pickRandom(candidates);
	if (!selected) return null;

	directorRuntime.lastSwitchMs = nowMs;
	if (trigger === 'time') {
		directorRuntime.lastIntervalMs = nowMs;
	} else if (nowMs - directorRuntime.lastIntervalMs >= state.spectrumAutoDirectorIntervalMs) {
		directorRuntime.lastIntervalMs = nowMs;
	}
	rememberPreset(selected.id);
	return selected;
}
