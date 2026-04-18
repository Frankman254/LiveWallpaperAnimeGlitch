import { useContext } from 'react';
import { AudioDataContext } from '@/context/audioData/audioDataContext';
import type { AudioDataContextValue } from '@/context/audioData/audioDataShared';

export function useAudioContext(): AudioDataContextValue {
	const ctx = useContext(AudioDataContext);
	if (!ctx) {
		throw new Error(
			'useAudioContext must be used inside AudioDataProvider'
		);
	}
	return ctx;
}
