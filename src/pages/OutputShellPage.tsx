import WallpaperAppProviders from '@/components/app/WallpaperAppProviders';
import OutputRecoveryLayer from '@/components/app/OutputRecoveryLayer';
import OutputPresentationCursorPolicy from '@/components/app/OutputPresentationCursorPolicy';
import OutputModeDevDiagnostics from '@/components/app/OutputModeDevDiagnostics';
import OutputRenderScaleStage from '@/components/app/OutputRenderScaleStage';
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport';
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { useOutputModeAudioAutostart } from '@/runtime/useOutputModeAudioAutostart';
import { useRuntimeUiMode } from '@/runtime/useRuntimeUiMode';

export default function OutputShellPage() {
	useRestoreWallpaperAssets();
	useOutputModeAudioAutostart();
	const { isRecordingMode } = useRuntimeUiMode();

	return (
		<WallpaperAppProviders>
			<OutputRecoveryLayer />
			<OutputPresentationCursorPolicy />
			<OutputRenderScaleStage enabled={isRecordingMode}>
				<WallpaperViewport outputMode />
			</OutputRenderScaleStage>
			<OutputModeDevDiagnostics
				editorShellMounted={false}
				hudMounted={false}
				diagnosticsMounted={false}
			/>
		</WallpaperAppProviders>
	);
}
