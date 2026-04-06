# Handoff Técnico para Otro Agente de IA

Este documento resume el estado real del proyecto **LiveWallpaperAnimeGlitch** al cierre de esta sesión.

La idea no es repetir toda la arquitectura antigua, sino dejarle al siguiente agente:

- una foto clara del sistema actual,
- los cambios recientes que sí importan,
- dónde están los puntos delicados,
- y qué no debería tocar a ciegas.

---

## 1. Estado actual del proyecto

La app está en un punto bastante usable y con muchas features activas:

- editor en `#/editor`
- preview en `#/preview`
- wallpaper con fondo principal + slideshow
- BG global de respaldo
- overlays de imagen
- spectrum principal + clone radial
- logo reactivo
- partículas + lluvia
- detalles de pista en pantalla
- export/import completo del proyecto `.lwag`
- persistencia de assets en IndexedDB
- estado persistente en `localStorage`

También hay bastante deuda técnica acumulada, pero el código ya no está tan monolítico como antes.

---

## 2. Qué se corrigió en esta sesión

## 2.1 Pantalla negra al abrir `#/editor`

### Síntoma

- `#root` quedaba vacío
- pantalla completamente negra
- React no llegaba a renderizar el editor

### Causa real

Había un loop infinito de render disparado desde `AudioLayerCanvas`, pero el origen venía de `useBackgroundPalette`.

El problema concreto era este:

- `useBackgroundPalette` usaba un selector del store que devolvía **un objeto nuevo en cada render**
- ese valor hacía que el efecto de paleta se ejecutara constantemente
- eso provocaba `setState` repetidos
- React terminaba en:
  - `getSnapshot should be cached`
  - `Maximum update depth exceeded`

### Fix aplicado

Archivo:
- [useBackgroundPalette.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/hooks/useBackgroundPalette.ts)

Se dejó de seleccionar un objeto compuesto del store.
Ahora el hook lee campos primitivos por separado:

- `backgroundImageEnabled`
- `imageUrl`
- `globalBackgroundEnabled`
- `globalBackgroundUrl`

Con eso desapareció el loop y el editor volvió a montar.

### Verificación realizada

- `npx tsc --noEmit` OK
- `npm run build` OK
- render del editor confirmado por DOM headless

---

## 2.2 Track time separado del nombre de la pista

El bloque de tiempo ya no comparte contenedor con el título.

Ahora tiene:

- su propio `Position X`
- su propio `Position Y`
- estilos independientes
- filtros independientes

Archivos principales:

- [TrackTitleOverlay.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/TrackTitleOverlay.ts)
- [TrackTitleTab.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/controls/tabs/TrackTitleTab.tsx)
- [audioSlice.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/store/slices/audioSlice.ts)

---

## 2.3 Sistema de color adaptativo por imagen

Se añadió un pipeline para sacar colores dominantes de la imagen de fondo activa y usarlos en:

- spectrum
- clone spectrum
- logo
- particles
- rain
- track info

Comportamiento actual:

- `solid` usa el color dominante
- `gradient` usa los 2 principales
- `rainbow` usa 6 colores dominantes

Archivos clave:

- [backgroundPalette.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/backgroundPalette.ts)
- [useBackgroundPalette.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/hooks/useBackgroundPalette.ts)
- [AdaptiveColorInput.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/controls/ui/AdaptiveColorInput.tsx)

Importante:

- si el fondo cambia, la paleta se recalcula
- ahora que el loop del selector quedó arreglado, esto sí es seguro

---

## 2.4 `ImageLayerCanvas` ya no está tan monolítico

Se hizo una refactorización fuerte del renderer de imagen.

Antes `ImageLayerCanvas.tsx` mezclaba:

- carga de imagen
- transición
- audio state
- frame loop
- debug
- render final

Ahora quedó repartido así:

- [ImageLayerCanvas.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/ImageLayerCanvas.tsx)
  - componente coordinador
- [useImageCanvasSource.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/useImageCanvasSource.ts)
  - carga de imagen y refs base
- [imageCanvasRuntime.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasRuntime.ts)
  - loop del frame
- [imageCanvasFrameState.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasFrameState.ts)
  - resolución de métricas por frame
- [imageCanvasAudioState.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasAudioState.ts)
  - routing/canales de audio
- [imageCanvasDebugState.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasDebugState.ts)
  - publicación de telemetría
- [imageCanvasBackgroundTransitionState.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasBackgroundTransitionState.ts)
  - transición/cambio manual
- [imageCanvasBackgroundRenderer.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasBackgroundRenderer.ts)
  - render del fondo
- [imageCanvasOverlayRenderer.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/imageCanvasOverlayRenderer.ts)
  - render de overlays de imagen

Todavía no está “perfecto”, pero ya es mucho más mantenible.

---

## 2.5 Export / import `.lwag`

El paquete del proyecto ya incluye:

- configuración completa
- fondos
- overlays
- logo
- BG global
- MP3 cargado

Archivos clave:

- [wallpaperPersistenceCoordinator.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/wallpaperPersistenceCoordinator.ts)
- [imageDb.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/db/imageDb.ts)
- [projectSettings.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/projectSettings.ts)
- [ExportTab.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/controls/tabs/ExportTab.tsx)

Estado actual:

- exporta archivos grandes correctamente
- importa también el MP3
- ya hay barra de progreso
- la importación hace reset duro antes de aplicar el nuevo proyecto

Detalle a vigilar:

- si el usuario ve un warning de assets faltantes, comprobar primero si de verdad hubo un fallo real del paquete y no un estado residual viejo en la UI

---

## 3. Estado real de los sistemas más sensibles

## 3.1 Mini player / ventanas externas

Este sistema **sigue siendo delicado**.

Lo que hay que saber:

- depende muchísimo del navegador
- Brave/macOS y Brave/Windows no siempre respetan el comportamiento deseado
- ya hubo varias rondas de fixes y regresiones

El modelo que el usuario quiere es:

- ventana principal: editor maximizado
- ventana externa: solo escena
- cambios del editor reflejados sin lag

Eso todavía puede necesitar otra pasada fuerte.

Archivos que controlan esto:

- [useWindowPresentationControls.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/hooks/useWindowPresentationControls.ts)
- [useWallpaperPreviewSync.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/hooks/useWallpaperPreviewSync.ts)
- [EditorPage.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/pages/EditorPage.tsx)
- [PreviewPage.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/pages/PreviewPage.tsx)

Recomendación para otro agente:

- no tocar este sistema “de paso”
- si se vuelve a trabajar, hacerlo como tarea aislada

---

## 3.2 Spectrum

Se trabajó bastante:

- mejor separación entre principal y clone
- clone tratado como segundo spectrum radial
- UI más clara
- rainbow circular corregido
- radial shape más respetuoso del shape externo

Archivos principales:

- [SpectrumTab.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/controls/tabs/SpectrumTab.tsx)
- [CircularSpectrum.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/CircularSpectrum.ts)
- [overlayLayerRegistry.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/layers/overlayLayerRegistry.ts)

Punto delicado:

- cualquier cambio en `followLogo / fitLogo / clone` puede volver a romper la forma radial

---

## 3.3 Track info

Ya no es solo “texto”.

Ahora agrupa:

- nombre de pista
- tiempo de reproducción
- estilos
- color adaptativo
- stroke/fill separados
- filtros opcionales

Archivos clave:

- [TrackTitleTab.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/controls/tabs/TrackTitleTab.tsx)
- [TrackTitleOverlay.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/TrackTitleOverlay.ts)

Punto sensible:

- el usuario quiere calidad visual muy alta, poco blur y look profesional

---

## 4. Archivos que otro agente debería leer primero

Orden recomendado:

1. [README.md](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/README.md)
2. [docs/ARQUITECTURA_GENERAL.md](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/docs/ARQUITECTURA_GENERAL.md)
3. [docs/AUDIO_RENDER_Y_SHADERS.md](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/docs/AUDIO_RENDER_Y_SHADERS.md)
4. [src/types/wallpaper.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/types/wallpaper.ts)
5. [src/lib/constants.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/constants.ts)
6. [src/store/wallpaperStore.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/store/wallpaperStore.ts)
7. [src/store/wallpaperStorePersistence.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/store/wallpaperStorePersistence.ts)
8. [src/pages/EditorPage.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/pages/EditorPage.tsx)
9. [src/components/wallpaper/WallpaperViewport.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/WallpaperViewport.tsx)
10. [src/components/wallpaper/layers/ImageLayerCanvas.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/layers/ImageLayerCanvas.tsx)
11. [src/components/audio/layers/AudioLayerCanvas.tsx](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/layers/AudioLayerCanvas.tsx)
12. [src/components/audio/CircularSpectrum.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/CircularSpectrum.ts)
13. [src/components/audio/TrackTitleOverlay.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/audio/TrackTitleOverlay.ts)
14. [src/hooks/useBackgroundPalette.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/hooks/useBackgroundPalette.ts)
15. [src/lib/backgroundPalette.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/backgroundPalette.ts)

---

## 5. Puntos frágiles actuales

## 5.1 Selectores del store que devuelven objetos nuevos

El bug de pantalla negra acaba de demostrar que esto es peligroso.

Regla para el siguiente agente:

- no usar selectores tipo `state => ({ ... })` sin igualdad o sin una razón muy clara

Si se usa un selector compuesto:

- preferir campos primitivos por separado
- o usar una comparación tipo shallow con cuidado

---

## 5.2 Sistema de preview / mini player

Es fácil romper:

- sincronización
- restauración de assets
- performance

No mezclar esa lógica con otros cambios de UI si no es necesario.

---

## 5.3 `AudioLayerCanvas`

Aunque ya no está roto, sigue siendo sensible porque junta:

- logo
- spectrum
- track info
- postproceso por filtros

Si vuelve a aparecer un loop de render, revisar este archivo primero.

---

## 5.4 Persistencia / migraciones

El store ya va por versión `25`.

Cada cambio de shape del estado requiere revisar:

- [wallpaperStorePersistence.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/store/wallpaperStorePersistence.ts)
- [constants.ts](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/lib/constants.ts)
- slices afectados
- export/import de proyecto

---

## 6. Siguientes tareas razonables

Si otro agente toma el relevo, estas son buenas siguientes tareas:

1. compactar más la UI de tabs largas (`Audio`, `Track`, `Filters`, `Perf`)
2. terminar de sanear mini player / study mode
3. seguir rompiendo lógica residual de `ImageLayerCanvas`
4. revisar calidad visual y rendimiento de `Track info`
5. preparar sistema futuro multi-track basado en [TAREA_PENDIENTE_MULTITRACK_AUDIO.md](/Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/TAREA_PENDIENTE_MULTITRACK_AUDIO.md)

---

## 7. Validaciones que ya pasaron al cierre de esta sesión

- `npx tsc --noEmit`
- `npm run build`
- comprobación headless de que `#/editor` vuelve a renderizar

---

## 8. Resumen corto para otro agente

Si entras rápido al proyecto:

- la pantalla negra reciente ya fue corregida
- el problema era un loop en `useBackgroundPalette`
- `ImageLayerCanvas` ya está bastante más modular
- el sistema de color adaptativo ya existe y debe preservarse
- `Track info` ya maneja título y tiempo por separado
- `Mini Player` sigue siendo la zona más delicada

No conviene tocar muchas cosas a la vez.
Primero elegir un sistema, aislarlo y recién ahí cambiarlo.
