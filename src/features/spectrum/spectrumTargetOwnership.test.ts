import { describe, expect, it, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');

function reset() {
	mem.clear();
	useWallpaperStore.setState({
		spectrumPositionX: 0,
		spectrumPositionY: 0,
		spectrumFamily: 'classic',
		spectrumManualGlow: false,
		spectrumGlowIntensity: 0.7,
		spectrumLedCellSize: 1,
		spectrumLedCellGap: 0.28,
		spectrumLedAngle: 0,
		spectrumLedShape: 'square',
		activeSpectrumTarget: 'main',
		spectrumInstances: [createDefaultSpectrumInstance()]
	});
}

/**
 * The user's ownership rule, enforced at the store boundary: a per-target write
 * touches ONLY its spectrum; only the explicit Global/Both action touches both.
 */
describe('spectrum target ownership', () => {
	beforeEach(reset);

	it('isolates position changes per target', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPositionX: 0.5 });
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0.5);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);

		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumPositionY: -0.3 });
		expect(useWallpaperStore.getState().spectrumPositionY).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionY
		).toBe(-0.3);
	});

	it('isolates family changes per target', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumFamily: 'spiral' });
		expect(useWallpaperStore.getState().spectrumFamily).toBe('classic');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumFamily
		).toBe('spiral');
	});

	it('isolates glow changes per target', () => {
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumManualGlow: true,
			spectrumGlowIntensity: 2.4
		});
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(true);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]
				?.spectrumManualGlow
		).toBe(false);
	});

	it('randomizes only the targeted spectrum', () => {
		const instanceBefore = JSON.stringify(
			useWallpaperStore.getState().spectrumInstances[0]
		);
		useWallpaperStore.getState().randomizeSpectrumTarget('main', 'manual');
		// The second spectrum is untouched by a main-target shuffle.
		expect(
			JSON.stringify(useWallpaperStore.getState().spectrumInstances[0])
		).toBe(instanceBefore);

		const mainFamilyBefore = useWallpaperStore.getState().spectrumFamily;
		useWallpaperStore
			.getState()
			.randomizeSpectrumTarget('instance', 'manual');
		expect(useWallpaperStore.getState().spectrumFamily).toBe(
			mainFamilyBefore
		);
	});

	it('resets only the targeted spectrum', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		const slotsBefore = [
			{
				name: 'User Spectrum Slot',
				values: null
			}
		];
		const secondSlotsBefore = [{ name: 'User Spectrum 2 Slot', values: null }];
		useWallpaperStore.setState({
			spectrumProfileSlots: slotsBefore,
			spectrumSecondProfileSlots: secondSlotsBefore
		});
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPositionX: 0.8,
			spectrumManualGlow: true,
			spectrumLedCellSize: 2.5,
			spectrumLedCellGap: 0.9,
			spectrumLedAngle: 45,
			spectrumLedShape: 'circle'
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPositionX: 0.5,
			spectrumManualGlow: true,
			spectrumLedCellSize: 3,
			spectrumLedCellGap: 0.6,
			spectrumLedAngle: -25,
			spectrumLedShape: 'diamond'
		});

		// Reset the instance only; main keeps its custom values.
		useWallpaperStore.setState({ activeSpectrumTarget: 'instance' });
		useWallpaperStore.getState().resetSpectrumTarget('instance');
		expect(useWallpaperStore.getState().activeSpectrumTarget).toBe(
			'instance'
		);
		expect(useWallpaperStore.getState().spectrumProfileSlots).toBe(
			slotsBefore
		);
		expect(useWallpaperStore.getState().spectrumSecondProfileSlots).toBe(
			secondSlotsBefore
		);
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0.8);
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(true);
		expect(useWallpaperStore.getState().spectrumLedCellSize).toBe(2.5);
		expect(useWallpaperStore.getState().spectrumLedCellGap).toBe(0.9);
		expect(useWallpaperStore.getState().spectrumLedAngle).toBe(45);
		expect(useWallpaperStore.getState().spectrumLedShape).toBe('circle');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]
				?.spectrumManualGlow
		).toBe(false);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]
				?.spectrumLedCellSize
		).toBe(1);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumLedShape
		).toBe('square');

		// Reset main only; the freshly-defaulted instance stays default.
		useWallpaperStore.setState({ activeSpectrumTarget: 'main' });
		useWallpaperStore.getState().resetSpectrumTarget('main');
		expect(useWallpaperStore.getState().activeSpectrumTarget).toBe('main');
		expect(useWallpaperStore.getState().spectrumProfileSlots).toBe(
			slotsBefore
		);
		expect(useWallpaperStore.getState().spectrumSecondProfileSlots).toBe(
			secondSlotsBefore
		);
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0);
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(false);
		expect(useWallpaperStore.getState().spectrumLedCellSize).toBe(1);
		expect(useWallpaperStore.getState().spectrumLedShape).toBe('square');
	});

	it('reset-all visual affects both spectrums but preserves slots', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		const slotsBefore = [
			{
				name: 'Keep me',
				values: null
			}
		];
		const secondSlotsBefore = [{ name: 'Keep me too', values: null }];
		useWallpaperStore.setState({
			spectrumProfileSlots: slotsBefore,
			spectrumSecondProfileSlots: secondSlotsBefore
		});
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPositionX: 0.7 });
		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumPositionX: -0.6 });

		useWallpaperStore.getState().resetSpectrumToDefaults();
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);
		// Both spectrum slot banks survive a visual reset.
		expect(useWallpaperStore.getState().spectrumProfileSlots).toBe(
			slotsBefore
		);
		expect(useWallpaperStore.getState().spectrumSecondProfileSlots).toBe(
			secondSlotsBefore
		);
	});

	it('restore-factory Spectrum is the explicit destructive slots restore', () => {
		const slotsBefore = [
			{
				name: 'User slot',
				values: null
			}
		];
		const secondSlotsBefore = [{ name: 'User slot 2', values: null }];
		useWallpaperStore.setState({
			spectrumProfileSlots: slotsBefore,
			spectrumSecondProfileSlots: secondSlotsBefore
		});

		useWallpaperStore.getState().restoreFactorySpectrumDefaults();

		// The destructive action replaces BOTH spectrum slot banks with factory.
		expect(useWallpaperStore.getState().spectrumProfileSlots).not.toBe(
			slotsBefore
		);
		expect(
			useWallpaperStore.getState().spectrumProfileSlots.length
		).toBeGreaterThan(1);
		expect(useWallpaperStore.getState().spectrumSecondProfileSlots).not.toBe(
			secondSlotsBefore
		);
		expect(
			useWallpaperStore.getState().spectrumSecondProfileSlots.length
		).toBeGreaterThan(1);
	});

	it('saving a slot for one spectrum never touches the other bank', () => {
		useWallpaperStore.setState({
			spectrumProfileSlots: [
				{ name: 'M1', values: null },
				{ name: 'M2', values: null },
				{ name: 'M3', values: null }
			],
			spectrumSecondProfileSlots: [
				{ name: 'S1', values: null },
				{ name: 'S2', values: null },
				{ name: 'S3', values: null }
			]
		});

		// Saving Spectrum 1's slot leaves the Spectrum 2 bank reference intact.
		const secondBankRef =
			useWallpaperStore.getState().spectrumSecondProfileSlots;
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		expect(useWallpaperStore.getState().spectrumProfileSlots[0].values).not.toBeNull();
		expect(useWallpaperStore.getState().spectrumSecondProfileSlots).toBe(
			secondBankRef
		);

		// …and vice versa.
		const mainBankRef = useWallpaperStore.getState().spectrumProfileSlots;
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'instance');
		expect(
			useWallpaperStore.getState().spectrumSecondProfileSlots[0].values
		).not.toBeNull();
		expect(useWallpaperStore.getState().spectrumProfileSlots).toBe(
			mainBankRef
		);
	});
});
