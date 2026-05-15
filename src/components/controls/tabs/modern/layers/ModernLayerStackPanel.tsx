import { RotateCcw } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { WallpaperLayer } from '@/types/layers';
import { Button, SectionCard, ICON_SIZE } from '@/ui';
import {
	ModernGlobalBackgroundCard,
	ModernLayerCard
} from './ModernLayerCards';
import { useModernLayerStack } from './useModernLayerStack';

export default function ModernLayerStackPanel() {
	const t = useT();
	const stack = useModernLayerStack();

	function renderLayerCard(layer: WallpaperLayer) {
		const { canMoveUp, canMoveDown } = stack.getLayerMoveState(layer);

		return (
			<ModernLayerCard
				key={layer.id}
				layer={layer}
				label={stack.getLayerLabel(layer)}
				canReorder={stack.canReorder(layer)}
				canToggle={stack.canToggle(layer)}
				canMoveUp={canMoveUp}
				canMoveDown={canMoveDown}
				isDragSource={stack.draggedLayerId === layer.id}
				isDropTarget={
					stack.dropTargetLayerId === layer.id &&
					stack.draggedLayerId !== layer.id
				}
				onPointerDragStart={stack.handlePointerDragStart}
				onNativeDragStart={stack.handleNativeDragStart}
				onNativeDragOver={stack.handleNativeDragOver}
				onNativeDragLeave={stack.handleNativeDragLeave}
				onNativeDrop={stack.handleNativeDrop}
				onNativeDragEnd={stack.handleNativeDragEnd}
				onOpenOverlay={stack.setSelectedOverlayId}
				onToggle={stack.toggleLayer}
				onMove={stack.moveLayer}
				onUpdateZIndex={stack.updateZIndex}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.section_global_stack}
				subtitle={t.hint_restore_default_stack}
				action={
					<Button
						size="sm"
						density="compact"
						variant="secondary"
						onClick={stack.restoreLayerDefaults}
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						Reset
					</Button>
				}
				density="compact"
			>
				<div className="flex flex-col gap-2">
					<ModernGlobalBackgroundCard
						layer={stack.globalBackgroundLayer}
						onToggle={stack.setGlobalBackgroundEnabled}
					/>
					{stack.renderableLayers.map(renderLayerCard)}
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_controller_layers}
				subtitle="HUD, diagnostics, and editor-only control layers"
				density="compact"
			>
				<div className="flex flex-col gap-2">
					{stack.controllerLayers.map(renderLayerCard)}
				</div>
			</SectionCard>
		</div>
	);
}
