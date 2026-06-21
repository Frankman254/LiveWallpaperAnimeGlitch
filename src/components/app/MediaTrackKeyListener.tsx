import { useMediaTrackKeys } from '@/context/audioData/useMediaTrackKeys';

/**
 * Mounts the global F7/F9 (previous/next track) keyboard fallback once, above
 * the routes, so it works identically in Edit and Presentation mode. Renders
 * nothing.
 */
export default function MediaTrackKeyListener() {
	useMediaTrackKeys();
	return null;
}
