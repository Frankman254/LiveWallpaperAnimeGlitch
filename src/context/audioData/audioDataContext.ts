import { createContext } from 'react';
import type { AudioDataContextValue } from './audioDataShared';

export const AudioDataContext = createContext<AudioDataContextValue | null>(
	null
);
