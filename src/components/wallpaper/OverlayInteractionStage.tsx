import { useShallow } from 'zustand/react/shallow';
import { getLogoRenderState } from '@/components/audio/ReactiveLogo';
import {
	resolveResponsiveLogoSettings,
	resolveResponsiveSpectrumSettings,
	resolveResponsiveTrackTitleSettings
} from '@/features/layout/responsiveLayout';
import { resolveSpectrumPlacement } from '@/features/spectrum/runtime/spectrumPlacement';
import { useViewportResolution } from '@/features/layout/viewportMetrics';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useOverlayDragController } from '@/components/wallpaper/overlayInteraction/useOverlayDragController';

export default function OverlayInteractionStage({
	visible
}: {
	visible: boolean;
}) {
	const {
		overlays,
		selectedOverlayId,
		setSelectedOverlayId,
		updateOverlay,
		logoEnabled,
		logoBaseSize,
		logoMinScale,
		logoPositionX,
		logoPositionY,
		logoBackdropEnabled,
		logoBackdropPadding,
		logoGlowBlur,
		setLogoPositionX,
		setLogoPositionY,
		audioTrackTitleEnabled,
		audioTrackTimeEnabled,
		audioTrackTitlePositionX,
		audioTrackTitlePositionY,
		audioTrackTitleWidth,
		audioTrackTitleFontSize,
		audioTrackTimePositionX,
		audioTrackTimePositionY,
		audioTrackTimeWidth,
		audioTrackTimeFontSize,
		layoutResponsiveEnabled,
		layoutReferenceWidth,
		layoutReferenceHeight,
		setAudioTrackTitleLayoutMode,
		setAudioTrackTitlePositionX,
		setAudioTrackTitlePositionY,
		setAudioTrackTimePositionX,
		setAudioTrackTimePositionY,
		spectrumEnabled,
		spectrumMode,
		spectrumFollowLogo,
		spectrumLinearOrientation,
		spectrumLinearDirection,
		spectrumLogoGap,
		spectrumRadialFitLogo,
		spectrumBarCount,
		spectrumBarWidth,
		spectrumMaxHeight,
		spectrumMirror,
		spectrumShadowBlur,
		spectrumInnerRadius,
		spectrumSpan,
		spectrumPositionX,
		spectrumPositionY,
		setSpectrumPositionX,
		setSpectrumPositionY
	} = useWallpaperStore(
		useShallow(state => ({
			overlays: state.overlays,
			selectedOverlayId: state.selectedOverlayId,
			setSelectedOverlayId: state.setSelectedOverlayId,
			updateOverlay: state.updateOverlay,
			logoEnabled: state.logoEnabled,
			logoBaseSize: state.logoBaseSize,
			logoMinScale: state.logoMinScale,
			logoPositionX: state.logoPositionX,
			logoPositionY: state.logoPositionY,
			logoBackdropEnabled: state.logoBackdropEnabled,
			logoBackdropPadding: state.logoBackdropPadding,
			logoGlowBlur: state.logoGlowBlur,
			setLogoPositionX: state.setLogoPositionX,
			setLogoPositionY: state.setLogoPositionY,
			audioTrackTitleEnabled: state.audioTrackTitleEnabled,
			audioTrackTimeEnabled: state.audioTrackTimeEnabled,
			audioTrackTitlePositionX: state.audioTrackTitlePositionX,
			audioTrackTitlePositionY: state.audioTrackTitlePositionY,
			audioTrackTitleWidth: state.audioTrackTitleWidth,
			audioTrackTitleFontSize: state.audioTrackTitleFontSize,
			audioTrackTimePositionX: state.audioTrackTimePositionX,
			audioTrackTimePositionY: state.audioTrackTimePositionY,
			audioTrackTimeWidth: state.audioTrackTimeWidth,
			audioTrackTimeFontSize: state.audioTrackTimeFontSize,
			layoutResponsiveEnabled: state.layoutResponsiveEnabled,
			layoutReferenceWidth: state.layoutReferenceWidth,
			layoutReferenceHeight: state.layoutReferenceHeight,
			setAudioTrackTitleLayoutMode: state.setAudioTrackTitleLayoutMode,
			setAudioTrackTitlePositionX: state.setAudioTrackTitlePositionX,
			setAudioTrackTitlePositionY: state.setAudioTrackTitlePositionY,
			setAudioTrackTimePositionX: state.setAudioTrackTimePositionX,
			setAudioTrackTimePositionY: state.setAudioTrackTimePositionY,
			spectrumEnabled: state.spectrumEnabled,
			spectrumMode: state.spectrumMode,
			spectrumFollowLogo: state.spectrumFollowLogo,
			spectrumLinearOrientation: state.spectrumLinearOrientation,
			spectrumLinearDirection: state.spectrumLinearDirection,
			spectrumLogoGap: state.spectrumLogoGap,
			spectrumRadialFitLogo: state.spectrumRadialFitLogo,
			spectrumBarCount: state.spectrumBarCount,
			spectrumBarWidth: state.spectrumBarWidth,
			spectrumMaxHeight: state.spectrumMaxHeight,
			spectrumMirror: state.spectrumMirror,
			spectrumShadowBlur: state.spectrumShadowBlur,
			spectrumInnerRadius: state.spectrumInnerRadius,
			spectrumSpan: state.spectrumSpan,
			spectrumPositionX: state.spectrumPositionX,
			spectrumPositionY: state.spectrumPositionY,
			setSpectrumPositionX: state.setSpectrumPositionX,
			setSpectrumPositionY: state.setSpectrumPositionY
		}))
	);

	const controlPanelActiveTab = useWallpaperStore(
		s => s.controlPanelActiveTab
	);
	const viewport = useViewportResolution();

	const canDragLogo = logoEnabled && controlPanelActiveTab === 'logo';
	const canDragTrackTitle =
		audioTrackTitleEnabled && controlPanelActiveTab === 'track';
	const canDragTrackTime =
		audioTrackTimeEnabled && controlPanelActiveTab === 'track';
	const canDragOverlay =
		controlPanelActiveTab === 'overlays' ||
		controlPanelActiveTab === 'layers';

	const viewportWidth = viewport.width;
	const viewportHeight = viewport.height;
	const responsiveLogo = resolveResponsiveLogoSettings(
		{
			layoutResponsiveEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight,
			logoBaseSize,
			logoGlowBlur,
			logoShadowBlur: 0,
			logoBackdropPadding
		},
		viewportWidth,
		viewportHeight
	);
	const responsiveSpectrum = resolveResponsiveSpectrumSettings(
		{
			layoutResponsiveEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight,
			spectrumLogoGap,
			spectrumCloneGap: 0,
			spectrumInnerRadius,
			spectrumBarWidth,
			spectrumMinHeight: 1,
			spectrumMaxHeight,
			spectrumShadowBlur,
			spectrumOscilloscopeLineWidth: 1,
			spectrumCloneBarWidth: 1,
			spectrumCloneMinHeight: 1,
			spectrumCloneMaxHeight: 12,
			spectrumCloneShadowBlur: 0
		},
		viewportWidth,
		viewportHeight
	);
	const responsiveTrackText = resolveResponsiveTrackTitleSettings(
		{
			layoutResponsiveEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight,
			audioTrackTitleFontSize,
			audioTrackTitleLetterSpacing: 0,
			audioTrackTitleScrollSpeed: 0,
			audioTrackTitleStrokeWidth: 0,
			audioTrackTitleGlowBlur: 0,
			audioTrackTitleBackdropPadding: 0,
			audioTrackTitleFilterBlur: 0,
			audioTrackTimeFontSize,
			audioTrackTimeLetterSpacing: 0,
			audioTrackTimeStrokeWidth: 0,
			audioTrackTimeGlowBlur: 0,
			audioTrackTimeFilterBlur: 0
		},
		viewportWidth,
		viewportHeight
	);
	const effectiveLogoBaseSize = responsiveLogo.logoBaseSize;
	const effectiveLogoBackdropPadding = responsiveLogo.logoBackdropPadding;
	const effectiveLogoGlowBlur = responsiveLogo.logoGlowBlur;
	const effectiveSpectrumBarWidth = responsiveSpectrum.spectrumBarWidth;
	const effectiveSpectrumMaxHeight = responsiveSpectrum.spectrumMaxHeight;
	const effectiveSpectrumShadowBlur = responsiveSpectrum.spectrumShadowBlur;
	const effectiveSpectrumInnerRadius = responsiveSpectrum.spectrumInnerRadius;
	const effectiveTrackTitleFontSize =
		responsiveTrackText.audioTrackTitleFontSize;
	const effectiveTrackTimeFontSize =
		responsiveTrackText.audioTrackTimeFontSize;
	const logoScale = Math.max(getLogoRenderState().scale, logoMinScale, 0.75);
	const resolvedSpectrumPlacement = resolveSpectrumPlacement(
		{
			logoEnabled,
			logoBaseSize: effectiveLogoBaseSize,
			logoMinScale,
			logoPositionX,
			logoPositionY,
			logoBackdropEnabled,
			logoBackdropPadding: effectiveLogoBackdropPadding,
			spectrumMode,
			spectrumFollowLogo,
			spectrumRadialFitLogo,
			spectrumLogoGap: responsiveSpectrum.spectrumLogoGap,
			spectrumCloneGap: 0,
			spectrumInnerRadius: effectiveSpectrumInnerRadius,
			spectrumPositionX,
			spectrumPositionY
		},
		{
			variant: 'main',
			logoScale
		}
	);
	const canDragSpectrum =
		spectrumEnabled &&
		controlPanelActiveTab === 'spectrum' &&
		!resolvedSpectrumPlacement.positionLockedToLogo;
	const logoCenterX = viewportWidth / 2 + logoPositionX * viewportWidth * 0.5;
	const logoCenterY =
		viewportHeight / 2 - logoPositionY * viewportHeight * 0.5;
	const logoRadius =
		(effectiveLogoBaseSize * logoScale) / 2 +
		(logoBackdropEnabled ? effectiveLogoBackdropPadding : 0) +
		Math.max(12, effectiveLogoGlowBlur * 0.35);

	const linearDirection =
		spectrumLinearOrientation === 'vertical'
			? spectrumLinearDirection === 'normal'
				? 1
				: -1
			: spectrumLinearDirection === 'normal'
				? -1
				: 1;
	const spectrumCenterX =
		viewportWidth / 2 +
		resolvedSpectrumPlacement.spectrumPositionX * viewportWidth * 0.5;
	const spectrumCenterY =
		viewportHeight / 2 -
		resolvedSpectrumPlacement.spectrumPositionY * viewportHeight * 0.5;
	const shadowPad = Math.max(14, effectiveSpectrumShadowBlur * 0.45 + 8);
	const clampedSpan = Math.max(0.2, Math.min(1, spectrumSpan ?? 1));
	const linearTotalSpan =
		(spectrumLinearOrientation === 'vertical'
			? viewportHeight
			: viewportWidth) * clampedSpan;
	const linearGap = Math.max(
		0,
		linearTotalSpan / Math.max(spectrumBarCount, 1) -
			effectiveSpectrumBarWidth
	);
	const linearStride = effectiveSpectrumBarWidth + linearGap;
	const linearLength = Math.max(
		0,
		spectrumBarCount * linearStride - linearGap
	);
	const linearStart =
		spectrumLinearOrientation === 'vertical'
			? (viewportHeight - linearLength) / 2
			: (viewportWidth - linearLength) / 2;

	const spectrumBounds = (() => {
		if (!canDragSpectrum) return null;

		if (spectrumMode === 'linear') {
			const extent = effectiveSpectrumMaxHeight + shadowPad;
			if (spectrumLinearOrientation === 'vertical') {
				const mirroredX = spectrumMirror
					? spectrumCenterX - extent * linearDirection
					: spectrumCenterX;
				const forwardX = spectrumCenterX + extent * linearDirection;
				const minX = Math.min(spectrumCenterX, forwardX, mirroredX);
				const maxX = Math.max(spectrumCenterX, forwardX, mirroredX);
				return {
					left: minX - shadowPad,
					top: linearStart - shadowPad,
					width: Math.max(28, maxX - minX + shadowPad * 2),
					height: Math.max(28, linearLength + shadowPad * 2)
				};
			}

			const mirroredY = spectrumMirror
				? spectrumCenterY - extent * linearDirection
				: spectrumCenterY;
			const forwardY = spectrumCenterY + extent * linearDirection;
			const minY = Math.min(spectrumCenterY, forwardY, mirroredY);
			const maxY = Math.max(spectrumCenterY, forwardY, mirroredY);
			return {
				left: linearStart - shadowPad,
				top: minY - shadowPad,
				width: Math.max(28, linearLength + shadowPad * 2),
				height: Math.max(28, maxY - minY + shadowPad * 2)
			};
		}

		const radialOuterRadius =
			resolvedSpectrumPlacement.spectrumInnerRadius +
			effectiveSpectrumMaxHeight +
			shadowPad;
		return {
			left: spectrumCenterX - radialOuterRadius,
			top: spectrumCenterY - radialOuterRadius,
			width: Math.max(36, radialOuterRadius * 2),
			height: Math.max(36, radialOuterRadius * 2)
		};
	})();
	const trackTitleBounds = canDragTrackTitle
		? {
				left:
					viewportWidth / 2 +
					audioTrackTitlePositionX * viewportWidth * 0.5 -
					(viewportWidth * Math.max(0.2, audioTrackTitleWidth)) / 2,
					top:
						viewportHeight / 2 -
						audioTrackTitlePositionY * viewportHeight * 0.5 -
						effectiveTrackTitleFontSize * 0.9,
					width: viewportWidth * Math.max(0.2, audioTrackTitleWidth),
					height: Math.max(36, effectiveTrackTitleFontSize * 1.9)
			  }
			: null;
	const trackTimeBounds = canDragTrackTime
		? {
				left:
					viewportWidth / 2 +
					audioTrackTimePositionX * viewportWidth * 0.5 -
					(viewportWidth * Math.max(0.2, audioTrackTimeWidth)) / 2,
					top:
						viewportHeight / 2 -
						audioTrackTimePositionY * viewportHeight * 0.5 -
						effectiveTrackTimeFontSize * 0.8,
					width: viewportWidth * Math.max(0.2, audioTrackTimeWidth),
					height: Math.max(30, effectiveTrackTimeFontSize * 1.7)
			  }
			: null;

	const {
		handleOverlayPointerDown,
		handleLogoPointerDown,
		handleSpectrumPointerDown,
		handleTrackTitlePointerDown,
		handleTrackTimePointerDown
	} = useOverlayDragController({
		visible,
		viewportWidth,
		viewportHeight,
		logoPositionX,
		logoPositionY,
		audioTrackTitlePositionX,
		audioTrackTitlePositionY,
		audioTrackTimePositionX,
		audioTrackTimePositionY,
		spectrumPositionX,
		spectrumPositionY,
		setSelectedOverlayId,
		updateOverlay,
		setLogoPositionX,
		setLogoPositionY,
		setAudioTrackTitleLayoutMode,
		setAudioTrackTitlePositionX,
		setAudioTrackTitlePositionY,
		setAudioTrackTimePositionX,
		setAudioTrackTimePositionY,
		setSpectrumPositionX,
		setSpectrumPositionY
	});

	if (!visible) return null;

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				pointerEvents: 'none',
				zIndex: 200
			}}
		>
			{(() => {
				const overlay =
					canDragOverlay
						? overlays.find(
								item =>
									item.id === selectedOverlayId &&
									item.enabled &&
									item.url
							)
						: null;
				if (!overlay) return null;

				return (
					<button
						key={overlay.id}
						type="button"
						onPointerDown={event =>
							handleOverlayPointerDown(event, overlay)
						}
						onClick={() => setSelectedOverlayId(overlay.id)}
						style={{
							position: 'absolute',
							left: `calc(50% + ${overlay.positionX * 100}vw)`,
							top: `calc(50% - ${overlay.positionY * 100}vh)`,
							width: overlay.width * overlay.scale,
							height: overlay.height * overlay.scale,
							transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
							pointerEvents: 'auto',
							zIndex: overlay.zIndex,
							background: 'transparent',
							border: 'none',
							boxShadow: 'none',
							outline: 'none',
							appearance: 'none',
							touchAction: 'none',
							userSelect: 'none',
							WebkitUserSelect: 'none',
							WebkitTouchCallout: 'none',
							cursor: 'grab'
						}}
						aria-label="Drag overlay"
					/>
				);
			})()}

			{canDragSpectrum ? (
				<button
					type="button"
					onPointerDown={handleSpectrumPointerDown}
					style={{
						position: 'absolute',
						left: spectrumBounds?.left ?? 0,
						top: spectrumBounds?.top ?? 0,
						width: spectrumBounds?.width ?? 0,
						height: spectrumBounds?.height ?? 0,
						pointerEvents: 'auto',
						border: 'none',
						background: 'transparent',
						boxShadow: 'none',
						outline: 'none',
						appearance: 'none',
						touchAction: 'none',
						userSelect: 'none',
						WebkitUserSelect: 'none',
						WebkitTouchCallout: 'none',
						cursor: 'grab'
					}}
					aria-label="Drag spectrum"
				/>
			) : null}

			{canDragLogo ? (
				<button
					type="button"
					onPointerDown={handleLogoPointerDown}
					style={{
						position: 'absolute',
						left: logoCenterX - logoRadius,
						top: logoCenterY - logoRadius,
						width: Math.max(28, logoRadius * 2),
						height: Math.max(28, logoRadius * 2),
						pointerEvents: 'auto',
						border: 'none',
						background: 'transparent',
						boxShadow: 'none',
						outline: 'none',
						appearance: 'none',
						touchAction: 'none',
						userSelect: 'none',
						WebkitUserSelect: 'none',
						WebkitTouchCallout: 'none',
						cursor: 'grab'
					}}
					aria-label="Drag logo"
				/>
			) : null}

			{canDragTrackTitle && trackTitleBounds ? (
				<button
					type="button"
					onPointerDown={handleTrackTitlePointerDown}
					style={{
						position: 'absolute',
						left: trackTitleBounds.left,
						top: trackTitleBounds.top,
						width: trackTitleBounds.width,
						height: trackTitleBounds.height,
						pointerEvents: 'auto',
						border: 'none',
						background: 'transparent',
						boxShadow: 'none',
						outline: 'none',
						appearance: 'none',
						touchAction: 'none',
						userSelect: 'none',
						WebkitUserSelect: 'none',
						WebkitTouchCallout: 'none',
						cursor: 'grab'
					}}
					aria-label="Drag track title"
				/>
			) : null}

			{canDragTrackTime && trackTimeBounds ? (
				<button
					type="button"
					onPointerDown={handleTrackTimePointerDown}
					style={{
						position: 'absolute',
						left: trackTimeBounds.left,
						top: trackTimeBounds.top,
						width: trackTimeBounds.width,
						height: trackTimeBounds.height,
						pointerEvents: 'auto',
						border: 'none',
						background: 'transparent',
						boxShadow: 'none',
						outline: 'none',
						appearance: 'none',
						touchAction: 'none',
						userSelect: 'none',
						WebkitUserSelect: 'none',
						WebkitTouchCallout: 'none',
						cursor: 'grab'
					}}
					aria-label="Drag track time"
				/>
			) : null}
		</div>
	);
}
