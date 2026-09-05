import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { Select, Slider, UI_COLORS } from '@/ui';
import {
	LIGHTS_PRESETS,
	LOOKS_PRESETS,
	PARTICLES_PRESETS,
	RAIN_PRESETS,
	SPECTRUM_FAMILIES,
	SPECTRUM_MODES,
	SPECTRUM_SHAPES,
	type SceneIntent
} from '@/features/aiDirector/intent/sceneIntent';
import { draftWithIntent } from '@/features/aiDirector/sceneDraft';

/**
 * Hand-editing surface for a draft's `SceneIntent`.
 *
 * Editing the intent — rather than the ~190 compiled keys — is the whole point
 * of the vocabulary: a dozen controls the user can actually reason about, with
 * the deterministic compiler turning them into a valid scene. Every edit
 * recompiles and re-previews immediately, so the wallpaper always shows what
 * the current intent means.
 */

function toOptions<T extends string>(values: ReadonlyArray<T>) {
	return values.map(value => ({ value, label: value }));
}

export default function AiIntentEditor() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			aiDraft: s.aiDraft,
			previewAiDraft: s.previewAiDraft
		}))
	);
	const draft = store.aiDraft;
	if (!draft) return null;

	function patch(next: Partial<SceneIntent>) {
		if (!draft) return;
		// Editing by hand makes the intent the user's, not the model's — the
		// source label has to stop claiming otherwise.
		store.previewAiDraft(
			draftWithIntent(draft, { ...draft.intent, ...next }, 'heuristic')
		);
	}

	const axis = (
		key: 'energy' | 'weight' | 'motion',
		label: string,
		hint: string
	) => (
		<Slider
			key={key}
			label={label}
			hint={hint}
			value={draft.intent[key]}
			onChange={value => patch({ [key]: value } as Partial<SceneIntent>)}
			min={0}
			max={1}
			step={0.01}
			formatValue={v => `${Math.round(v * 100)}`}
		/>
	);

	const choice = <K extends keyof SceneIntent>(
		key: K,
		label: string,
		values: ReadonlyArray<SceneIntent[K] & string>
	) => (
		<label key={String(key)} className="flex flex-col gap-1">
			<span
				className="text-[9px] uppercase tracking-wide"
				style={{ color: UI_COLORS.fgMute }}
			>
				{label}
			</span>
			<Select<string>
				value={draft.intent[key] as string}
				onChange={value =>
					patch({ [key]: value } as Partial<SceneIntent>)
				}
				options={toOptions(values)}
				size="sm"
				density="compact"
				full
				ariaLabel={label}
			/>
		</label>
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1.5">
				{axis('energy', t.ai_axis_energy, t.ai_axis_energy_hint)}
				{axis('weight', t.ai_axis_weight, t.ai_axis_weight_hint)}
				{axis('motion', t.ai_axis_motion, t.ai_axis_motion_hint)}
			</div>

			<div className="grid grid-cols-2 gap-2">
				{choice(
					'spectrumFamily',
					t.ai_chip_spectrum,
					SPECTRUM_FAMILIES
				)}
				{choice('spectrumShape', t.ai_field_shape, SPECTRUM_SHAPES)}
				{choice('spectrumMode', t.ai_chip_mode, SPECTRUM_MODES)}
				{choice('particles', t.ai_chip_particles, PARTICLES_PRESETS)}
				{choice('looks', t.ai_chip_looks, LOOKS_PRESETS)}
				{choice('lights', t.ai_chip_lights, LIGHTS_PRESETS)}
				{choice('rain', t.ai_chip_rain, RAIN_PRESETS)}
			</div>
		</div>
	);
}
