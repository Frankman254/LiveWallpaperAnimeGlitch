import { useShallow } from 'zustand/react/shallow';
import {
	isOutputMode,
	useRuntimeUiModeStore,
	type RuntimeUiMode
} from './runtimeUiModeStore';

export type RuntimeUiModeApi = {
	mode: RuntimeUiMode;
	isOutputMode: boolean;
	isEditMode: boolean;
	isPresentationMode: boolean;
	isRecordingMode: boolean;
	enterEditMode: () => void;
	enterPresentationMode: () => void;
	enterRecordingMode: () => void;
	exitOutputMode: () => void;
};

export function useRuntimeUiMode(): RuntimeUiModeApi {
	const mode = useRuntimeUiModeStore(s => s.mode);
	const actions = useRuntimeUiModeStore(
		useShallow(s => ({
			enterEditMode: s.enterEditMode,
			enterPresentationMode: s.enterPresentationMode,
			enterRecordingMode: s.enterRecordingMode,
			exitOutputMode: s.exitOutputMode
		}))
	);

	return {
		mode,
		isOutputMode: isOutputMode(mode),
		isEditMode: mode === 'edit',
		isPresentationMode: mode === 'presentation',
		isRecordingMode: mode === 'recording',
		...actions
	};
}

export { isOutputMode, type RuntimeUiMode };
