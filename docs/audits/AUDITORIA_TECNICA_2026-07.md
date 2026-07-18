# Auditoría Técnica — Julio 2026

**Alcance:** 100% del código fuente (512 archivos TS/TSX, ~117k líneas) auditado por dominio: rendering/performance, store/persistencia/audio, UI/design-system. Los archivos críticos (`LyricsOverlay.ts`, `TrackTitleOverlay.ts`, `liquidGlass.ts`) fueron verificados línea por línea.

**Estado al momento de la auditoría:** `main`, App `0.3.0-alpha.1`, Store persist v102, 500+ commits.

---

## 1. Mapa de arquitectura de render

El wallpaper se compone apilando **5–6 loops de `requestAnimationFrame` simultáneos**, cada uno con su propio canvas full-screen (z-order de atrás hacia adelante):

| #   | Capa                | Tipo           | Contenido                                                           | Loop            |
| --- | ------------------- | -------------- | ------------------------------------------------------------------- | --------------- |
| 1   | `SceneLayerCanvas`  | Three.js (R3F) | ParticleField, RainLayer, geometría 3D                              | useFrame        |
| 2   | `ImageLayerCanvas`  | Canvas 2D      | Imagen de fondo, transiciones, filtros, RGB shift, scanlines, noise | rAF condicional |
| 3   | `AudioLayerCanvas`  | Canvas 2D      | Logo → Spectrum (main + instancias) → Track Title → **Lyrics**      | rAF capped 60Hz |
| 4   | `StageLightsCanvas` | Canvas 2D      | Luces de escenario audio-reactivas                                  | rAF propio      |
| 5   | `FlashLightCanvas`  | Canvas 2D      | Flash de bordes                                                     | rAF propio      |
| 6   | HUD / Quick Actions | React DOM      | Sin loop de render                                                  | —               |

**Limitación arquitectónica confirmada** (ya intuida en auditorías previas): el costo real no son los cálculos por capa sino la suma de canvases full-screen + `shadowBlur`. En 4K con todo activado se observan 40–60 ms/frame. La solución de fondo (largo plazo) es un layer WebGL único para spectrum+lyrics+title con glow por shader.

---

## 2. Bottlenecks de performance (por severidad)

| #   | Bottleneck                                                  | Severidad   | Esfuerzo | Ganancia est.       | Ubicación                                                   |
| --- | ----------------------------------------------------------- | ----------- | -------- | ------------------- | ----------------------------------------------------------- |
| 1   | shadowBlur por glifo en lyrics/title                        | **CRÍTICO** | Medio    | 20–40 ms/frame      | `LyricsOverlay.ts:276-296`, `TrackTitleOverlay.ts:281-300`  |
| 2   | Clears full-screen múltiples + pases post-FX separados      | Alto        | Medio    | 5–10 ms/frame       | `AudioLayerCanvas.tsx:100`, `imageCanvasEffects.ts:164-201` |
| 3   | measureText/wrapText por frame en lyrics                    | Alto        | Bajo     | 3–5 ms/frame        | `LyricsOverlay.ts:70-91, 473-495`                           |
| 4   | Gradientes recreados por frame                              | Medio       | Bajo     | 1–2 ms/frame        | `trackTextTreatment.ts:36,44,65`                            |
| 5   | Realloc de Float32Arrays al cambiar barCount                | Medio       | Medio    | GC pauses           | `CircularSpectrum.ts:148-165`                               |
| 6   | Snapshot full-frame cada 200ms (transiciones spectrum)      | Medio       | Medio    | 165 MB/s en 4K      | `CircularSpectrum.ts:640-660`                               |
| 7   | Pixelate = 3 canvases full-screen                           | Medio       | Alto     | 5–8 ms/frame        | `CircularSpectrum.ts:100-117, 664-701`                      |
| 8   | Film noise procedural por píxel (CPU)                       | Medio       | Bajo     | 2–3 ms/frame        | `imageCanvasEffects.ts:76-126`                              |
| 9   | Frame history ring hasta 6 canvases (~50MB VRAM)            | Bajo        | Medio    | Memoria + blits     | `spectrumFrameEffects.ts:318-368`                           |
| 10  | feedbackCanvas/history nunca liberados al desactivar efecto | Bajo        | Bajo     | ~50MB al desactivar | `spectrumFrameEffects.ts:302-316`                           |
| 11  | StageLights + FlashLight corren con audio en silencio       | Bajo        | Medio    | 2–3 ms/frame        | `StageLightsCanvas.tsx`, `FlashLightCanvas.tsx`             |

### Detalle del #1 (causa del lag de lyrics con muchos efectos)

`drawLine()` en `LyricsOverlay.ts:250-298` hace, **por cada línea visible por cada frame**:

1. Pase de glow con `ctx.shadowBlur = glowBlur × reach` (reach 1–3 → hasta ~150px efectivos de kernel de blur) dibujando **glifo por glifo** (`drawSpacedText`).
2. Segundo pase de texto con `shadowBlur = glowBlur × 0.35`.
3. `ctx.measureText()` **por carácter** en cada pase (`drawSpacedText:89`).
4. Gradiente nuevo en `applyTextTreatment()` si el treatment es gradient/metallic/glass.
5. `wrapText()` re-mide todas las palabras aunque el texto no cambió (`:473-495`).

Con glow-pulse activo (el `glowMultiplier` cambia cada frame) + varias líneas visibles + treatment con gradiente, el pase de lyrics solo consume decenas de ms. **Contraste:** `TrackTitleOverlay.ts:303-444` ya resuelve esto con un cache (`buildTextRenderKey` + `renderTextToCache`): renderiza el texto con glow UNA vez a un offscreen canvas y por frame solo hace `drawImage`. Lyrics nunca recibió ese patrón. → **Fix aplicado en esta misma sesión** (ver `PLAN_CONSOLIDACION_2026-07.md`, Fase P).

### Fixes propuestos para el resto

- **#2:** combinar RGB shift + film noise + scanlines en un solo pase save/restore; clip a dirty-rects en el audio canvas.
- **#5:** pre-alocar arrays al máximo esperado con headroom 1.5×; guard por `barCountCache`.
- **#6:** capturar snapshot solo al detectar cambio de familia, no por timer.
- **#8:** pre-render del noise a textura tileable 256×256 y componer con `drawImage` + offset.
- **#10:** desalocar `feedbackCanvas` si afterglow ≤ 0.001 por 3+ frames; ídem history si ghostFrames y motionTrails están apagados.
- **#11:** gate de ambos loops con `audio.amplitude > 0.001 || !motionPaused`.

---

## 3. Bugs de rendering

| #   | Bug                                                                                                      | Ubicación                                              | Fix                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Sin early-return si `peak <= floor` en energy bloom (protegido solo por `Math.max(0.06, …)`)             | `spectrumFrameEffects.ts:145-150`                      | `if (peak <= floor + 0.001) return { normalized: 0, risingEdge: 0 }`                                                                          |
| R2  | El renderer sigue recorriendo todo el pipeline si el canvas queda temporalmente en 0×0 durante un resize | `CircularSpectrum.ts` (`drawSpectrum`)                 | Guard temprano por tamaño ✅ **corregido en Fase B**                                                                                          |
| R3  | `wrapText()` con `maxWidth <= 0` devuelve palabras sin truncar → overflow                                | `LyricsOverlay.ts:41-68`                               | Guard `if (maxWidth <= 1) return ['']` ✅ **corregido en esta sesión**                                                                        |
| R4  | Posible acumulación de listeners de resize por callbacks inestables                                      | `AudioLayerCanvas.tsx`, `useAudioCaptureController.ts` | **Descartado al contrastar Fase B:** las callbacks ya usan `useCallback` y el effect desmonta listener + suscripción de calidad correctamente |
| R5  | Posible desbalance del stack si falla `getContext('2d')` del scratch                                     | `liquidGlass.ts`                                       | **Descartado al contrastar Fase B:** el contexto scratch ya está guardado y el `restore()` exterior siempre se ejecuta                        |

## 4. Bugs de store / persistencia / audio

| #   | Bug                                                                                                                                                         | Severidad      | Ubicación                                            | Fix                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Instancias de Spectrum 2 creadas antes de v91 pueden carecer de `spectrumScale` (y keys posteriores) → `undefined` → crash del tab Spectrum en saves viejos | **ALTA**       | `wallpaperStoreMigrations.ts`                        | **Ya resuelto antes de la auditoría:** merge con `createDefaultSpectrumInstance()`; Fase B añadió regresión que recorre todas las keys actuales |
| S2  | Lyrics huérfanas: `removeAudioTrack()` no borra la entrada en `audioLyricsByTrackAssetId` (lyrics keyed por **assetId**, playlist por **trackId**)          | Media          | `audioPlaylistSlice.ts`                              | Limpieza por `assetId` solo cuando ningún track restante lo comparte ✅ **corregido en Fase B**                                                 |
| S3  | Cargas activas/queued que terminan fuera de orden y evento `ended` de la pista saliente durante crossfade pueden provocar estado o avance obsoleto          | Media          | `AudioMixEngine.ts`, `useAudioPlaylistController.ts` | Generaciones de carga, resultado `boolean` y guard de `ended` durante crossfade ✅ **corregido en Fase B**                                      |
| S4  | `objectUrl` de `FileAudioAnalyzer` puede filtrarse si falla la construcción del grafo de WebAudio                                                           | Media          | `FileAudioAnalyzer.ts` (`start`)                     | Cleanup completo antes de propagar errores; autoplay bloqueado sigue siendo estado recuperable ✅ **corregido en Fase B**                       |
| S5  | Quota de localStorage llena → el save falla con solo un warning en consola → al recargar se pierde toda la sesión sin aviso                                 | **Media-ALTA** | `wallpaperStore.ts`, `StoragePersistenceNotice.tsx`  | Estado externo de fallo + aviso traducido en el editor con recomendación de export ✅ **corregido en Fase B**                                   |

**Precedente:** el patrón de S1 ya causó un bug en producción (caso `spectrumScale` v91, documentado en memoria del proyecto: key persistida nueva sin bump de versión = migrate no corre).

---

## 5. Liquid glass — análisis de fidelidad vs macOS

**Estado al iniciar la auditoría:** Canvas 2D puro con centro transparente y un único blit magnificado uniformemente sobre todo el rim. El corte interior era abrupto, el tinte era plano y los speculars eran dos hairlines duras.

**Estado tras la Fase L:** `liquidGlass.ts` divide el rim en bandas concéntricas adaptativas por calidad (2 en low, 3 en medium y 4 en high), con magnificación y peso Fresnel decrecientes hacia el centro. Los speculars usan gradientes direccionales y high añade una aberración rojo/cian sutil. Lyrics y Now Playing transmiten su `performanceMode` al helper compartido.

**Por qué no se ve fiel al macOS real:**

| Feature macOS                                                                                       | Implementación tras Fase L                   | Gap restante                                      |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Refracción progresiva: distorsión máxima en el borde exacto, decae hacia adentro con curva de lente | 2–4 bandas con magnificación decreciente     | Aproximación por bandas; un shader sería continuo |
| Fresnel: opacidad/tinte dependiente del ángulo (transparente de frente, opaco oblicuo)              | Peso de tinte decreciente por banda          | Aproximación 2D                                   |
| Aberración cromática sutil en bordes                                                                | Pass rojo/cian de baja alpha en calidad high | ✅                                                |
| Speculars derivados de iluminación, con gradiente                                                   | Strokes con gradientes direccionales         | ✅                                                |
| Blur consciente de profundidad                                                                      | Blur gaussiano uniforme                      | Medio                                             |
| Micro-textura de superficie                                                                         | Superficie ópticamente plana                 | Medio                                             |
| Centro transparente                                                                                 | ✅ correcto                                  | —                                                 |
| Magnificación de rim                                                                                | ✅ adaptativa por calidad                    | —                                                 |

**Trabajo ejecutado:**

1. **Curva de lente en el rim:** bandas concéntricas con magnificación decreciente hasta 1×.
2. **Fresnel aproximado:** peso de alpha decreciente por banda sobre el tinte.
3. **Speculars con gradiente:** brillo direccional sin hairlines uniformes.
4. **Aberración cromática opcional:** segundo pass desplazado a baja alpha solo en performance high.

Los consumidores Canvas actuales son lyrics y `NowPlayingWidget.ts`; las superficies DOM del HUD conservan su tratamiento CSS independiente. Falta calibración visual del usuario y, como mejora futura, refracción continua por shader.

---

## 6. Inventario de consolidación selectiva (~130 LOC candidatas)

La estimación inicial de ~460 LOC mezclaba deuda real con funciones requeridas por el producto. Después de contrastarla con los requisitos, este es el inventario corregido:

| Feature                                                       | Decisión          | Motivo                                                                                                   |
| ------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `lyrixaLayerOverrides` + render mode dual (`bundle`/`editor`) | **Conservar**     | Lyrixa debe representar simultáneamente voz principal y backing vocals en capas con layout independiente |
| Manual glow color decoupling (6 keys v92)                     | **Conservar**     | Spectrum 1 y Spectrum 2 necesitan Visual Accents y glow independientes                                   |
| Calibration synthetic groups                                  | **Conservar**     | Es una herramienta efímera de desarrollo; no aumenta el payload persistido                               |
| `motionProfileSlots` legacy                                   | Candidata ~80 LOC | Solo después de comprobar JSON antiguos y añadir migración sin pérdida                                   |
| `spectrumSecondOverride` per-image                            | Candidata ~50 LOC | Solo después de migrar de forma lossless a scene-first y probar precedencia                              |

**Nota sobre la poda:** ninguna candidata se remueve por conteo de LOC. Cada remoción requiere auditoría de saves reales, migración que limpie o transforme keys persistidas, bump de versión y regresión de importación.

---

## 7. UI / consistencia del editor

- **Sin `EditorTabLayout`:** `TrackTitleTab.tsx` (1377 líneas) y `LyricsTabBody.tsx` (1322) usan view-state manual y JSX crudo; son los 2 tabs más grandes y los que más se desvían del patrón.
- **`FeatureGate` ausente:** SpectrumTab, LogoTab y MotionTab leen el switch maestro pero muestran los controles igual con la feature apagada (el usuario ajusta sliders sin efecto visible).
- **`TabFade` faltante** en el view-switching interno de SpectrumTab.
- **Lógica de persistencia de view duplicada** en LogoTab/TrackTitleTab → extraer hook `useTabViewState(key, default)`.
- **i18n:** 20–40 strings hardcodeadas en inglés: `FILTER_TARGET_LABELS` (`LooksTab.tsx:52-71`), títulos de secciones en `SpectrumFxPanel` ("Radial rotation", "Retro pixel / LED"), nombres de treatments en LyricsTabBody, labels sueltos en TrackTitleTab/LogoTab.
- **IA del editor:** 14 tabs principales + sub-views (Spectrum 5, Logo 3, TrackTitle 3), profundidad max 2 (bien). ~200+ controles totales. La reactividad de audio está repartida en 3 tabs (Audio, BG, Motion) — el usuario tiene que cazarla.
- **Dead code a verificar:** `LegacyTabAdapter.tsx`, entradas stale en `controlTabsLazy.tsx`, alcanzabilidad de `CalibrationTab` en el registry.

---

## 8. Preparación para backend (estado actual)

**Qué se persiste hoy:** 3 capas — localStorage (todo el estado serializable, ~200KB proyecto chico / ~2-3MB mediano), IndexedDB (blobs de imágenes/logo, URLs reconstruidas al cargar), runtime puro (nunca persiste).

**Bloqueantes para sync/backend:**

1. **Slots por índice posicional**: las escenas referencian `spectrumProfileSlots[i]` por índice. Reordenar/borrar slots en otro dispositivo rompe bindings. → Migrar a UUIDs (`{ spectrumSlotId: "spec-abc" | 'off' | null }`).
2. **Blobs sin metadata**: IndexedDB guarda blobs por assetId sin versión ni hash — imposible reconciliar.
3. **Doble modelo de composición**: overrides per-image (legacy) coexisten con scene-first (v98) sin precedencia versionada. Deprecar overrides antes de sincronizar.
4. **Bundles Lyrixa inline** en el estado: moverlos a asset records separados como las imágenes.
5. **Versionado**: persistir `STORE_PERSIST_VERSION` en cada payload de sync y tener migraciones server-aware.

**Fortaleza:** el modelo scene-first (v98) y la separación estado/blobs ya apuntan en la dirección correcta; la migración a UUIDs es el paso 0 real.

---

## 9. Cobertura de tests

- **47 archivos de test.** Bien cubierto: navegación de playlist, media session, persistencia (partialize + estado de error), scene-first, spectrum, slideshow, limpieza de lyrics por asset y bandas adaptativas de liquid glass.
- **Cobertura mínima añadida en Fase B:** backfill de todas las keys de Spectrum 2, carreras de carga, `ended` durante crossfade y fin de pista promovida en `AudioMixEngine`, y cleanup de objectURL cuando falla `FileAudioAnalyzer.start()`.
- **Pendiente:** fixtures completos por cada versión v91–v102, más curvas/finalización de crossfade, autoplay bloqueado y precedencia override-per-image vs slot.

---

_Documento generado a partir de auditoría exhaustiva por dominios (julio 2026). Los file:line de los archivos críticos fueron verificados por lectura directa; el resto proviene de la pasada de auditoría y puede desplazarse algunas líneas con futuros cambios._
