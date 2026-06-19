import OutputRecoveryLayer from '@/components/app/OutputRecoveryLayer';
import OutputPresentationCursorPolicy from '@/components/app/OutputPresentationCursorPolicy';
import OutputModeDevDiagnostics from '@/components/app/OutputModeDevDiagnostics';
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport';

export default function OutputShellPage() {
	return (
		<>
			<OutputRecoveryLayer />
			<OutputPresentationCursorPolicy />
			<WallpaperViewport outputMode />
			<OutputModeDevDiagnostics
				editorShellMounted={false}
				hudMounted={false}
				diagnosticsMounted={false}
			/>
		</>
	);
}
