import type { RenderFrameContext } from './renderFrameContext';
import { RENDER_SUBSYSTEM_ORDER } from './renderFrameContext';
import { getRenderSubsystem } from './renderSubsystem';
import { recordSyncFrame } from './debugRenderSync';

export type RenderFrameOptions = {
	includeHud?: boolean;
};

export function renderFrameAt(
	ctx: RenderFrameContext,
	options: RenderFrameOptions = {}
): void {
	ctx.abortSignal?.throwIfAborted();

	for (const id of RENDER_SUBSYSTEM_ORDER) {
		if (id === 'hud' && !options.includeHud) continue;
		const subsystem = getRenderSubsystem(id);
		if (!subsystem) continue;
		ctx.abortSignal?.throwIfAborted();
		subsystem.render(ctx);
	}

	recordSyncFrame(ctx);
}
