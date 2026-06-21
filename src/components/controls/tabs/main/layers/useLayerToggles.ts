import { useShallow } from 'zustand/react/shallow';
import { DEFAULT_STATE } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperLayer } from '@/types/layers';
import { isOverlayImage, type SyntheticLayer } from './layerStackHelpers';

export function useLayerToggles() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			globalBackgroundEnabled: s.globalBackgroundEnabled,
			globalBackgroundUrl: s.globalBackgroundUrl,
			globalBackgroundId: s.globalBackgroundId,
			particlesEnabled: s.particlesEnabled,
			particleLayerMode: s.particleLayerMode,
			updateOverlay: s.updateOverlay,
			setBackgroundImageEnabled: s.setBackgroundImageEnabled,
			setSlideshowEnabled: s.setSlideshowEnabled,
			setLogoEnabled: s.setLogoEnabled,
			setAudioTrackTitleEnabled: s.setAudioTrackTitleEnabled,
			setAudioTrackTimeEnabled: s.setAudioTrackTimeEnabled,
			setAudioLyricsEnabled: s.setAudioLyricsEnabled,
			setSpectrumEnabled: s.setSpectrumEnabled,
			setRainEnabled: s.setRainEnabled,
			setParticlesEnabled: s.setParticlesEnabled,
			setParticleLayerMode: s.setParticleLayerMode,
			setGlobalBackgroundEnabled: s.setGlobalBackgroundEnabled,
			setSelectedOverlayId: s.setSelectedOverlayId
		}))
	);
	const globalBackgroundLayer: SyntheticLayer = {
		id: 'global-background',
		title: t.label_global_background_image,
		kindLabel: 'scene • global-background',
		enabled: store.globalBackgroundEnabled,
		lockedOrder: true,
		hasAsset: Boolean(store.globalBackgroundUrl || store.globalBackgroundId)
	};

	function getLayerLabel(layer: WallpaperLayer): string {
		if (layer.type === 'overlay-image') return layer.name;

		const labels: Record<string, string> = {
			'background-image': t.label_scene_background,
			slideshow: 'Slideshow',
			logo: 'Logo',
			'track-title': t.tab_track,
			lyrics: t.tab_lyrics,
			spectrum: 'Spectrum',
			'particle-background': 'Particles Back',
			'particle-foreground': 'Particles Front',
			rain: 'Rain'
		};

		return labels[layer.id] ?? layer.type;
	}

	function setParticleLayerEnabled(
		target: 'background' | 'foreground',
		enabled: boolean
	) {
		if (target === 'background') {
			if (enabled) {
				store.setParticlesEnabled(true);
				if (store.particleLayerMode === 'foreground')
					store.setParticleLayerMode('both');
				else store.setParticleLayerMode('background');
				return;
			}

			if (!store.particlesEnabled) return;
			if (store.particleLayerMode === 'both')
				store.setParticleLayerMode('foreground');
			else if (store.particleLayerMode === 'background')
				store.setParticlesEnabled(false);
			return;
		}

		if (enabled) {
			store.setParticlesEnabled(true);
			if (store.particleLayerMode === 'background')
				store.setParticleLayerMode('both');
			else store.setParticleLayerMode('foreground');
			return;
		}

		if (!store.particlesEnabled) return;
		if (store.particleLayerMode === 'both')
			store.setParticleLayerMode('background');
		else if (store.particleLayerMode === 'foreground')
			store.setParticlesEnabled(false);
	}

	function toggleLayer(layer: WallpaperLayer, enabled: boolean) {
		if (isOverlayImage(layer)) {
			store.updateOverlay(layer.id, { enabled });
			return;
		}

		switch (layer.id) {
			case 'background-image':
				store.setBackgroundImageEnabled(enabled);
				return;
			case 'slideshow':
				store.setSlideshowEnabled(enabled);
				return;
			case 'logo':
				store.setLogoEnabled(enabled);
				return;
			case 'track-title':
				if (enabled) {
					store.setAudioTrackTitleEnabled(true);
				} else {
					store.setAudioTrackTitleEnabled(false);
					store.setAudioTrackTimeEnabled(false);
				}
				return;
			case 'lyrics':
				store.setAudioLyricsEnabled(enabled);
				return;
			case 'spectrum':
				store.setSpectrumEnabled(enabled);
				return;
			case 'particle-background':
				setParticleLayerEnabled('background', enabled);
				return;
			case 'particle-foreground':
				setParticleLayerEnabled('foreground', enabled);
				return;
			case 'rain':
				store.setRainEnabled(enabled);
				return;
			default:
				return;
		}
	}

	function canToggle(layer: WallpaperLayer): boolean {
		return (
			isOverlayImage(layer) ||
			[
				'background-image',
				'slideshow',
				'logo',
				'track-title',
				'lyrics',
				'spectrum',
				'particle-background',
				'particle-foreground',
				'rain'
			].includes(layer.id)
		);
	}

	function restoreLayerVisibilityDefaults() {
		store.setBackgroundImageEnabled(DEFAULT_STATE.backgroundImageEnabled);
		store.setGlobalBackgroundEnabled(DEFAULT_STATE.globalBackgroundEnabled);
	}

	return {
		globalBackgroundLayer,
		getLayerLabel,
		canToggle,
		toggleLayer,
		restoreLayerVisibilityDefaults,
		setGlobalBackgroundEnabled: store.setGlobalBackgroundEnabled,
		setSelectedOverlayId: store.setSelectedOverlayId
	};
}
