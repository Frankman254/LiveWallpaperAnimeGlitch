import { useNavigate } from 'react-router-dom';
import { useRuntimeUiMode } from './useRuntimeUiMode';

export function useEnterOutputMode() {
	const navigate = useNavigate();
	const { enterEditMode, enterPresentationMode, enterRecordingMode } =
		useRuntimeUiMode();

	return {
		goEdit: () => {
			enterEditMode();
			navigate('/edit');
		},
		goPresentation: () => {
			enterPresentationMode();
			navigate('/present');
		},
		goRecording: () => {
			enterRecordingMode();
			navigate('/record');
		}
	};
}
