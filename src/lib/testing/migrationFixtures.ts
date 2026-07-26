/**
 * Representative saved projects, one per schema version.
 *
 * These are NOT minimal objects built to satisfy one assertion. Each one is
 * shaped the way a real save looked AT THAT VERSION — legacy field names,
 * missing keys that did not exist yet, index-based references before v104 —
 * so `fixture → migrateWallpaperStore → assertions` exercises the real chain.
 *
 * The point is regression cover for USER DATA. A migration that throws is easy
 * to notice; one that silently drops a bound profile or resets a palette is
 * not, and that is what these are for.
 *
 * Excluded from the app build via `tsconfig.json`.
 *
 * When adding a version: copy the closest older fixture, apply only what that
 * version actually changed, and add assertions for the fields it introduced.
 */

/** Loose on purpose: these are historical shapes, not the current type. */
export type LegacySave = Record<string, unknown>;

export type MigrationFixture = {
	version: number;
	label: string;
	/** What this version's shape is meant to prove survives migration. */
	proves: string;
	state: LegacySave;
};

/** Values every fixture carries so cross-version survival is comparable. */
const COMMON = {
	// ── Background images (2, one bound to a profile by index) ──────────────
	// `originalFileName` is the real field — `BackgroundImageItem` has no
	// `name`. Fixtures only catch regressions if they match the real shape.
	backgroundImages: [
		{
			assetId: 'img-sunset',
			originalFileName: 'sunset.png',
			url: null,
			playbackSwitchAt: 12
		},
		{
			assetId: 'img-night',
			originalFileName: 'night.png',
			url: null,
			playbackSwitchAt: 90
		}
	],
	activeImageId: 'img-sunset',

	// ── Audio ──────────────────────────────────────────────────────────────
	audioFileLoop: true,
	audioPaused: false,

	// ── Logo ───────────────────────────────────────────────────────────────
	logoEnabled: true,
	logoBaseSize: 180,
	logoPositionX: -0.4,
	logoPositionY: 0.25,

	// ── Track title / lyrics ───────────────────────────────────────────────
	audioTrackTitleEnabled: true,
	audioLyricsEnabled: true,
	audioLyricsFontSize: 42,

	// ── Overlays ───────────────────────────────────────────────────────────
	overlays: [
		{
			id: 'ov-1',
			assetId: 'ov-asset-1',
			name: 'Frame',
			url: null,
			enabled: true,
			// Overlays are floored at 90 by design (they sit above every
			// wallpaper layer), so a realistic save never goes below it.
			zIndex: 92,
			positionX: 0.1,
			positionY: -0.2,
			scale: 1.4,
			rotation: 15,
			opacity: 0.8
		}
	],

	// ── Spectrum 1 visual identity ─────────────────────────────────────────
	spectrumEnabled: true,
	spectrumFamily: 'classic',
	spectrumMode: 'radial',
	spectrumOpacity: 0.77,
	spectrumBarCount: 128,
	spectrumInnerRadius: 140
} satisfies LegacySave;

/** Profile slots as saved before v104 (no `id` field existed yet). */
const LEGACY_SPECTRUM_SLOTS = [
	{ name: 'Calm', values: { spectrumBarCount: 64, spectrumOpacity: 0.3 } },
	{ name: 'Hype', values: { spectrumBarCount: 200, spectrumOpacity: 0.95 } }
];

const LEGACY_LOGO_SLOTS = [
	{ name: 'Big logo', values: { logoBaseSize: 300 } },
	{ name: 'Small logo', values: { logoBaseSize: 60 } }
];

/** Slots as saved from v104 onward — stable ids, no indexes anywhere. */
const ID_SPECTRUM_SLOTS = [
	{
		id: 'slot-calm',
		name: 'Calm',
		values: { spectrumBarCount: 64, spectrumOpacity: 0.3 }
	},
	{
		id: 'slot-hype',
		name: 'Hype',
		values: { spectrumBarCount: 200, spectrumOpacity: 0.95 }
	}
];

const ID_LOGO_SLOTS = [
	{ id: 'slot-logo-big', name: 'Big logo', values: { logoBaseSize: 300 } },
	{ id: 'slot-logo-small', name: 'Small logo', values: { logoBaseSize: 60 } }
];

/** Bindings expressed as array indexes — the pre-v104 world. */
const indexBoundImages = () => [
	{ ...COMMON.backgroundImages[0], spectrumProfileSlotIndex: 1 },
	{ ...COMMON.backgroundImages[1], logoProfileSlotIndex: 0 }
];

/** The same bindings expressed as stable ids — v104 onward. */
const idBoundImages = () => [
	{ ...COMMON.backgroundImages[0], spectrumProfileSlotId: 'slot-hype' },
	{ ...COMMON.backgroundImages[1], logoProfileSlotId: 'slot-logo-big' }
];

const indexBoundScene = () => [
	{
		id: 'scene-main',
		name: 'Main scene',
		spectrumSlotIndex: 1,
		logoSlotIndex: 0,
		particlesSlotIndex: 'off',
		rainSlotIndex: null
	}
];

const idBoundScene = () => [
	{
		id: 'scene-main',
		name: 'Main scene',
		spectrumSlotId: 'slot-hype',
		logoSlotId: 'slot-logo-big',
		particlesSlotId: 'off',
		rainSlotId: null
	}
];

/** Liquid Glass keys, which only exist from v100 on. */
const LIQUID_GLASS = {
	nowPlayingLiquidGlassEnabled: true,
	nowPlayingLiquidGlassBlur: 18,
	nowPlayingLiquidGlassMagnify: 1.3,
	nowPlayingLiquidGlassTint: 0.4,
	audioLyricsLiquidGlassEnabled: true,
	audioLyricsLiquidGlassBlur: 12
};

export const MIGRATION_FIXTURES: readonly MigrationFixture[] = [
	{
		version: 96,
		label: 'v96 — pre-split, index bindings, legacy Motion bundle',
		proves: 'Spectrum 2 bank is created without contaminating Spectrum 1; legacy Motion + per-image S2 override are rescued, not deleted.',
		state: {
			...COMMON,
			backgroundImages: [
				{
					...indexBoundImages()[0],
					// Retired in v103 — must be rescued into an S2 slot.
					spectrumSecondOverride: { spectrumOpacity: 0.42 }
				},
				indexBoundImages()[1]
			],
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			sceneSlots: indexBoundScene(),
			// Retired in v103 — must be split into particles + rain slots.
			motionProfileSlots: [
				{
					name: 'Storm',
					values: {
						particleCount: 321,
						rainEnabled: true,
						rainDropCount: 777
					}
				}
			],
			spectrumPixelate: true,
			spectrumPixelateScale: 4,
			spectrumRadialShape: 'moon'
		}
	},
	{
		version: 97,
		label: 'v97 — Spectrum 2 has its own bank for the first time',
		proves: 'An existing S2 bank is preserved verbatim instead of being reseeded from S1.',
		state: {
			...COMMON,
			backgroundImages: indexBoundImages(),
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{ name: 'S2 Only', values: { spectrumOpacity: 0.12 } }
			],
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			sceneSlots: indexBoundScene()
		}
	},
	{
		version: 98,
		label: 'v98 — scene-first model',
		proves: '`defaultSceneSlotId` round-trips instead of being reset.',
		state: {
			...COMMON,
			backgroundImages: indexBoundImages(),
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{ name: 'S2 Only', values: { spectrumOpacity: 0.12 } }
			],
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			sceneSlots: indexBoundScene(),
			defaultSceneSlotId: 'scene-main'
		}
	},
	{
		version: 99,
		label: 'v99 — Spectrum 2 instance with sparse keys',
		proves: 'A partially-populated instance is backfilled without losing the values it does carry.',
		state: {
			...COMMON,
			backgroundImages: indexBoundImages(),
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{ name: 'S2 Only', values: { spectrumOpacity: 0.12 } }
			],
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			sceneSlots: indexBoundScene(),
			defaultSceneSlotId: 'scene-main',
			spectrumInstances: [
				{ id: 'inst-2', enabled: true, spectrumOpacity: 0.33 }
			]
		}
	},
	{
		version: 102,
		label: 'v102 — Liquid Glass present, still index bindings',
		proves: 'Liquid Glass values tuned at v102 are kept (the re-seed only applies BELOW v102).',
		state: {
			...COMMON,
			...LIQUID_GLASS,
			backgroundImages: indexBoundImages(),
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{ name: 'S2 Only', values: { spectrumOpacity: 0.12 } }
			],
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			sceneSlots: indexBoundScene(),
			defaultSceneSlotId: 'scene-main'
		}
	},
	{
		version: 103,
		label: 'v103 — Motion already split, bindings still numeric',
		proves: 'Index bindings still resolve after the Motion conversion has already happened.',
		state: {
			...COMMON,
			...LIQUID_GLASS,
			backgroundImages: indexBoundImages(),
			spectrumProfileSlots: LEGACY_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{ name: 'S2 Only', values: { spectrumOpacity: 0.12 } }
			],
			logoProfileSlots: LEGACY_LOGO_SLOTS,
			particlesProfileSlots: [
				{ name: 'Storm', values: { particleCount: 321 } }
			],
			rainProfileSlots: [
				{ name: 'Storm', values: { rainDropCount: 777 } }
			],
			sceneSlots: indexBoundScene(),
			defaultSceneSlotId: 'scene-main'
		}
	},
	{
		version: 104,
		label: 'v104 — stable ids everywhere',
		proves: 'Id-based bindings pass through untouched; no re-minting, no retargeting.',
		state: {
			...COMMON,
			...LIQUID_GLASS,
			backgroundImages: idBoundImages(),
			spectrumProfileSlots: ID_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{
					id: 'slot-s2',
					name: 'S2 Only',
					values: { spectrumOpacity: 0.12 }
				}
			],
			logoProfileSlots: ID_LOGO_SLOTS,
			sceneSlots: idBoundScene(),
			defaultSceneSlotId: 'scene-main'
		}
	},
	{
		version: 105,
		label: 'v105 — per-liquid-layer pixelate',
		proves: 'Per-layer pixelate flags survive; sharpness is seeded at 0.',
		state: {
			...COMMON,
			...LIQUID_GLASS,
			backgroundImages: idBoundImages(),
			spectrumProfileSlots: ID_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{
					id: 'slot-s2',
					name: 'S2 Only',
					values: { spectrumOpacity: 0.12 }
				}
			],
			logoProfileSlots: ID_LOGO_SLOTS,
			sceneSlots: idBoundScene(),
			defaultSceneSlotId: 'scene-main',
			spectrumLiquidLayer1Pixelate: true,
			spectrumLiquidLayer3Pixelate: true,
			spectrumRadialShape: 'shield'
		}
	},
	{
		version: 106,
		label: 'v106 — current shape',
		proves: 'Migrating a current save is a no-op for every meaningful value.',
		state: {
			...COMMON,
			...LIQUID_GLASS,
			backgroundImages: idBoundImages(),
			spectrumProfileSlots: ID_SPECTRUM_SLOTS,
			spectrumSecondProfileSlots: [
				{
					id: 'slot-s2',
					name: 'S2 Only',
					values: { spectrumOpacity: 0.12 }
				}
			],
			logoProfileSlots: ID_LOGO_SLOTS,
			sceneSlots: idBoundScene(),
			defaultSceneSlotId: 'scene-main',
			spectrumLiquidLayer1Pixelate: true,
			spectrumRadialShape: 'star6',
			spectrumRadialSharpness: 0.65
		}
	}
] as const;
