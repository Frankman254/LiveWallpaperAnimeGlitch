/**
 * Flash Edge Drive — singleton compartido entre FlashLightCanvas y los
 * renderers de borde por capa.
 *
 * FlashLightCanvas actualiza este valor cada frame (siempre, aunque el
 * Flash Light visual esté desactivado). Los renderers de capa lo leen para
 * sincronizarse exactamente con la misma envolvente del Flash Light.
 */

let _drive = 0;
let _color = '#ffffff';

/** Llamado desde FlashLightCanvas en cada frame. */
export function updateFlashEdgeDrive(drive: number, color: string): void {
	_drive = drive;
	_color = color;
}

/** Drive actual del Flash Light (0–~0.92). */
export function getFlashEdgeDrive(): number {
	return _drive;
}

/** Color resuelto del Flash Light (hex). */
export function getFlashEdgeColor(): string {
	return _color;
}
