/**
 * Flash Edge Renderer — contorno neon reactivo que usa el drive del Flash Light.
 *
 * LOGO / OVERLAY (alpha-contour aware):
 *   Dos pasadas sobre la imagen original usando ctx.filter='blur()':
 *   1. Bloom exterior: imagen dibujada borrosa con lighter blend →
 *      el blur se propaga desde píxeles opacos, siguiendo el alpha-contour.
 *   2. Edge interior: arco/trazo fino alrededor del radio visible → línea neon crisp.
 *
 *   No requiere offscreen canvas adicional. La GPU aplica el blur directamente.
 *   Cache: la imagen ya está cacheada en ReactiveLogo.ts y overlayLayerRegistry.ts.
 *
 * BACKGROUND:
 *   Trazo con shadowBlur alrededor del rect de la imagen (transforms ya aplicados).
 *   Fallback limpio para imágenes sin alpha. V2 puede añadir blur de imagen completa.
 *
 * SPECTRUM / OVERLAY ITEMS: V2 debt (ver deliverables).
 */

import type { LayerRect } from '@/components/wallpaper/layers/imageCanvasShared';

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}

const MAX_BLUR = 40;
const MAX_THICKNESS = 16;

export interface LogoFlashEdgeSettings {
	enabled: boolean;
	/** Multiplicador sobre el drive del Flash Light (0.1–3). */
	intensityMult: number;
	/** Grosor del trazo neon interior (px). */
	thickness: number;
	/** Radio del bloom exterior (px). */
	radius: number;
	/** 'flash' = usa color del Flash Light, 'manual' = override. */
	colorMode: 'flash' | 'manual';
	color: string;
}

export interface BgFlashEdgeSettings {
	enabled: boolean;
	intensityMult: number;
	thickness: number;
	radius: number;
	colorMode: 'flash' | 'manual';
	color: string;
}

function resolveColor(
	settings: { colorMode: string; color: string },
	flashColor: string
): string {
	return settings.colorMode === 'manual' ? settings.color : flashColor;
}

/**
 * Glow alpha-contour para logo.
 *
 * Pasada 1: dibuja la imagen borrosa (bloom exterior).
 *   ctx.filter='blur()' hace que el blur se extienda desde píxeles opacos.
 *   Píxeles transparentes no contribuyen → el glow sigue el contorno del PNG.
 *
 * Pasada 2: trazo circular alrededor del radio de la silueta visible.
 *   Útil para logos con crop circular y como refuerzo neon en todos los casos.
 */
export function drawLogoFlashEdge(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	/** Tamaño renderizado del logo (logoBaseSize × scale). */
	size: number,
	rotation: number,
	img: HTMLImageElement,
	settings: LogoFlashEdgeSettings,
	flashDrive: number,
	flashColor: string,
	isCircularCrop: boolean,
	cropRadius: number
): void {
	if (!settings.enabled || flashDrive < 0.004) return;

	const drive = clamp(flashDrive * settings.intensityMult, 0, 1);
	if (drive < 0.004) return;

	const color = resolveColor(settings, flashColor);
	const cappedRadius = clamp(settings.radius, 0, MAX_BLUR);
	const cappedThickness = clamp(settings.thickness, 1, MAX_THICKNESS);

	// -- Pasada 1: bloom exterior (alpha-contour aware via blur) --
	// drive² → expansión cuadrática para flash más agresivo en picos
	const blurPx = clamp(cappedRadius * drive * drive, 0, MAX_BLUR);
	if (blurPx > 0.5) {
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = clamp(drive * 0.9, 0, 1);
		ctx.shadowColor = color;
		ctx.shadowBlur = blurPx * 0.4;
		ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
		ctx.translate(cx, cy);
		if (rotation !== 0) ctx.rotate(rotation);
		ctx.drawImage(img, -size / 2, -size / 2, size, size);
		ctx.filter = 'none';
		ctx.restore();
	}

	// -- Pasada 2: trazo neon interior (crisp edge) --
	// Radio del trazo: borde visible del logo
	const edgeRadius = isCircularCrop
		? (size / 2) * clamp(cropRadius, 0.1, 1)
		: size / 2;

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.globalAlpha = clamp(drive, 0, 1);
	ctx.shadowColor = color;
	ctx.shadowBlur = clamp(cappedRadius * 0.35 * drive, 0, 20);
	ctx.strokeStyle = color;
	ctx.lineWidth = cappedThickness;
	ctx.translate(cx, cy);
	if (rotation !== 0) ctx.rotate(rotation);
	ctx.beginPath();
	ctx.arc(
		0,
		0,
		Math.max(1, edgeRadius + cappedThickness * 0.5),
		0,
		Math.PI * 2
	);
	ctx.stroke();
	ctx.restore();
}

/**
 * Borde neon para la imagen de fondo.
 *
 * Trazo doble alrededor del rect de la imagen (ya transformado):
 * 1. Línea fina crisp (edge core).
 * 2. Línea gruesa con shadowBlur pesado (bloom).
 *
 * drive² → expansión cuadrática para flash agresivo en picos.
 */
export function drawBgFlashEdge(
	ctx: CanvasRenderingContext2D,
	rect: LayerRect,
	settings: BgFlashEdgeSettings,
	flashDrive: number,
	flashColor: string
): void {
	if (!settings.enabled || flashDrive < 0.004) return;

	const drive = clamp(flashDrive * settings.intensityMult, 0, 1);
	if (drive < 0.004) return;

	const color = resolveColor(settings, flashColor);
	const driveSq = drive * drive;
	const cappedRadius = clamp(settings.radius, 0, MAX_BLUR);
	const cappedThickness = clamp(settings.thickness, 1, MAX_THICKNESS);
	const blurPx = clamp(cappedRadius * driveSq, 0, MAX_BLUR);

	// El rect ya tiene cx/cy/width/height en coordenadas de pantalla.
	// Expandimos ligeramente para que el borde quede justo en el exterior.
	const expand = cappedThickness * 0.5;
	const x = rect.cx - rect.width / 2 - expand;
	const y = rect.cy - rect.height / 2 - expand;
	const w = Math.max(1, rect.width + expand * 2);
	const h = Math.max(1, rect.height + expand * 2);

	// Pasada 1 — trazo fino crisp (sin blur intenso)
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.globalAlpha = clamp(drive, 0, 1);
	ctx.shadowColor = color;
	ctx.shadowBlur = Math.min(blurPx * 0.2, 8);
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, cappedThickness * 0.35);
	ctx.strokeRect(x, y, w, h);
	ctx.restore();

	// Pasada 2 — bloom exterior pesado
	if (blurPx > 0.5) {
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = clamp(drive * 0.8, 0, 1);
		ctx.shadowColor = color;
		ctx.shadowBlur = blurPx;
		ctx.strokeStyle = color;
		ctx.lineWidth = cappedThickness;
		ctx.strokeRect(x, y, w, h);
		ctx.restore();
	}
}
