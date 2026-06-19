import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutputPerformanceStore } from './outputPerformanceStore';
import {
	exitOutputFullscreen,
	requestOutputFullscreen
} from './requestOutputFullscreen';
import { useRuntimeUiMode } from './useRuntimeUiMode';

export function useEnterOutputMode() {
	const navigate = useNavigate();
	const { enterEditMode, enterPresentationMode, enterRecordingMode } =
		useRuntimeUiMode();
	const presentationFullscreenOnLaunch = useOutputPerformanceStore(
		s => s.presentationFullscreenOnLaunch
	);
	const recordingFullscreenOnLaunch = useOutputPerformanceStore(
		s => s.recordingFullscreenOnLaunch
	);

	const goEdit = useCallback(() => {
		void exitOutputFullscreen();
		enterEditMode();
		navigate('/edit');
	}, [enterEditMode, navigate]);

	const goPresentation = useCallback(() => {
		enterPresentationMode();
		navigate('/present');
		if (presentationFullscreenOnLaunch) {
			void requestOutputFullscreen();
		}
	}, [enterPresentationMode, navigate, presentationFullscreenOnLaunch]);

	const goRecording = useCallback(() => {
		enterRecordingMode();
		navigate('/record');
		if (recordingFullscreenOnLaunch) {
			void requestOutputFullscreen();
		}
	}, [enterRecordingMode, navigate, recordingFullscreenOnLaunch]);

	return {
		goEdit,
		goPresentation,
		goRecording
	};
}
