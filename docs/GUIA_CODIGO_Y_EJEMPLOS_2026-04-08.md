# Guía de código y ejemplos (handoff corto)

## 1. Dónde mirar primero

- Editor shell:
  - `src/components/controls/ControlPanel.tsx`
  - `src/components/controls/EditorOverlay.tsx`
- BG / slideshow:
  - `src/components/SlideshowManager.tsx`
  - `src/components/controls/tabs/bg/BgSlideshowControls.tsx`
- Tema adaptable:
  - `src/components/controls/editorTheme.ts`
  - `src/hooks/useBackgroundPalette.ts`
  - `src/lib/backgroundPalette.ts`
- Spectrum:
  - `src/components/audio/CircularSpectrum.ts`
  - `src/components/controls/tabs/SpectrumTab.tsx`
  - `src/features/spectrum/spectrumControlConfig.ts`

## 2. Ejemplo: sincronizar imágenes con un mix largo

### UI

La opción vive en:

- `BG > Slideshow > Audio Checkpoints`

### Flujo interno

1. El usuario activa `slideshowAudioCheckpointsEnabled`.
2. El store lo guarda.
3. `SlideshowManager.tsx` deja de usar el temporizador normal.
4. Si el audio actual dura 8 minutos o más:
   - calcula `progress = currentTime / duration`
   - convierte ese progreso en un índice de imagen
   - cambia la imagen activa

## 3. Ejemplo: cambiar imagen cuando cambia la pista

### UI

- `BG > Slideshow > Track Change Sync`

### Flujo interno

1. El motor de audio cambia la pista activa.
2. `SlideshowManager.tsx` detecta el nuevo `trackId`.
3. Busca el índice del track activo dentro de los tracks habilitados.
4. Usa ese índice para mover el slideshow al slot de imagen correspondiente.

## 4. Ejemplo: tema del editor usando el color del fondo actual

### UI

- `Perf > Editor Accent Source`
- `Perf > Diag Accent Source`

### Flujo interno

1. `useBackgroundPalette.ts` resuelve qué imagen usar como fuente:
   - primero la imagen activa del slideshow
   - si no hay, el global BG
2. `backgroundPalette.ts` extrae:
   - dominante
   - secondary
   - rainbow
   - accent
3. `editorTheme.ts` convierte esa paleta en variables CSS.
4. El editor o `Diag` aplican esas variables localmente.

## 5. Ejemplo: añadir un nuevo estilo de spectrum

Si otro agente quiere agregar un estilo de spectrum:

1. Añadir el valor al tipo en `src/types/wallpaper.ts`
2. Exponerlo en `src/features/spectrum/spectrumControlConfig.ts`
3. Agregarlo al selector correcto en `src/components/controls/tabs/SpectrumTab.tsx`
4. Dibujarlo en `src/components/audio/CircularSpectrum.ts`

## 6. Ejemplo: añadir una nueva shape radial

1. Añadir shape al tipo `SpectrumRadialShape`
2. Agregarla al array `SPECTRUM_RADIAL_SHAPES`
3. Implementar su factor geométrico en `getRadialShapeFactor()` dentro de `CircularSpectrum.ts`
4. Verificar que `followLogo` solo afecte el borde interno si aplica

## 7. Qué parte sigue siendo delicada

- `CircularSpectrum.ts`
  - ya mejoró, pero sigue siendo el renderer más cargado del overlay de audio.
- `SlideshowManager.tsx`
  - ahora mezcla lógica por timer, checkpoints y cambio de track.
- sincronía entre editor / preview / mini player
  - es una zona sensible cuando hay audio, ventanas externas y assets restaurados.

## 8. Recomendación para el siguiente agente

Antes de tocar features nuevas:

1. correr `npx tsc --noEmit`
2. correr `npm run build`
3. revisar:
   - `ControlPanel.tsx`
   - `EditorOverlay.tsx`
   - `SlideshowManager.tsx`
   - `CircularSpectrum.ts`
   - `AudioDataContext.tsx`

## 9. Objetivo de este lote

Este lote intentó dejar mejor resueltas estas bases:

- editor mini con mejor separación visual
- slideshow opcional sincronizado con audio
- editor/diag con color dinámico desde el fondo
- spectrum con más variedad visual sin romper el modelo actual
