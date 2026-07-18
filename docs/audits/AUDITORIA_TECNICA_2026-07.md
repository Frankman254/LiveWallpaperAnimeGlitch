# Auditoría Técnica — Julio 2026

**Alcance:** 100% del código fuente (512 archivos TS/TSX, ~117k líneas) auditado por dominio: rendering/performance, store/persistencia/audio, UI/design-system. Los archivos críticos (`LyricsOverlay.ts`, `TrackTitleOverlay.ts`, `liquidGlass.ts`) fueron verificados línea por línea.

**Estado al momento de la auditoría:** `main`, App `0.3.0-alpha.1`, Store persist v102, 500+ commits.

---

## 1. Mapa de arquitectura de render

El wallpaper se compone apilando **5–6 loops de `requestAnimationFrame` simultáneos**, cada uno con su propio canvas full-screen (z-order de atrás hacia adelante):

| # | Capa | Tipo | Contenido | Loop |
|---|------|------|-----------|------|
| 1 | `SceneLayerCanvas` | Three.js (R3F) | ParticleField, RainLayer, geometría 3D | useFrame |
| 2 | `ImageLayerCanvas` | Canvas 2D | Imagen de fondo, transiciones, filtros, RGB shift, scanlines, noise | rAF condicional |
| 3 | `AudioLayerCanvas` | Canvas 2D | Logo → Spectrum (main + instancias) → Track Title → **Lyrics** | rAF capped 60Hz |
| 4 | `StageLightsCanvas` | Canvas 2D | Luces de escenario audio-reactivas | rAF propio |
| 5 | `FlashLightCanvas` | Canvas 2D | Flash de bordes | rAF propio |
| 6 | HUD / Quick Actions | React DOM | Sin loop de render | — |

**Limitación arquitectónica confirmada** (ya intuida en auditorías previas): el costo real no son los cálculos por capa sino la suma de canvases full-screen + `shadowBlur`. En 4K con todo activado se observan 40–60 ms/frame. La solución de fondo (largo plazo) es un layer WebGL único para spectrum+lyrics+title con glow por shader.

---

## 2. Bottlenecks de performance (por severidad)

| # | Bottleneck | Severidad | Esfuerzo | Ganancia est. | Ubicación |
|---|-----------|-----------|----------|---------------|-----------|
| 1 | shadowBlur por glifo en lyrics/title | **CRÍTICO** | Medio | 20–40 ms/frame | `LyricsOverlay.ts:276-296`, `TrackTitleOverlay.ts:281-300` |
| 2 | Clears full-screen múltiples + pases post-FX separados | Alto | Medio | 5–10 ms/frame | `AudioLayerCanvas.tsx:100`, `imageCanvasEffects.ts:164-201` |
| 3 | measureText/wrapText por frame en lyrics | Alto | Bajo | 3–5 ms/frame | `LyricsOverlay.ts:70-91, 473-495` |
| 4 | Gradientes recreados por frame | Medio | Bajo | 1–2 ms/frame | `trackTextTreatment.ts:36,44,65` |
| 5 | Realloc de Float32Arrays al cambiar barCount | Medio | Medio | GC pauses | `CircularSpectrum.ts:148-165` |
| 6 | Snapshot full-frame cada 200ms (transiciones spectrum) | Medio | Medio | 165 MB/s en 4K | `CircularSpectrum.ts:640-660` |
| 7 | Pixelate = 3 canvases full-screen | Medio | Alto | 5–8 ms/frame | `CircularSpectrum.ts:100-117, 664-701` |
| 8 | Film noise procedural por píxel (CPU) | Medio | Bajo | 2–3 ms/frame | `imageCanvasEffects.ts:76-126` |
| 9 | Frame history ring hasta 6 canvases (~50MB VRAM) | Bajo | Medio | Memoria + blits | `spectrumFrameEffects.ts:318-368` |
| 10 | feedbackCanvas/history nunca liberados al desactivar efecto | Bajo | Bajo | ~50MB al desactivar | `spectrumFrameEffects.ts:302-316` |
| 11 | StageLights + FlashLight corren con audio en silencio | Bajo | Medio | 2–3 ms/frame | `StageLightsCanvas.tsx`, `FlashLightCanvas.tsx` |

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

| # | Bug | Ubicación | Fix |
|---|-----|-----------|-----|
| R1 | Sin early-return si `peak <= floor` en energy bloom (protegido solo por `Math.max(0.06, …)`) | `spectrumFrameEffects.ts:145-150` | `if (peak <= floor + 0.001) return { normalized: 0, risingEdge: 0 }` |
| R2 | NaN en `cx/cy` si canvas está en 0×0 durante un resize transitorio → el spectrum desaparece | `CircularSpectrum.ts:403-408` | Guard `Number.isFinite && > 0` antes de calcular centro |
| R3 | `wrapText()` con `maxWidth <= 0` devuelve palabras sin truncar → overflow | `LyricsOverlay.ts:41-68` | Guard `if (maxWidth <= 1) return ['']` ✅ **corregido en esta sesión** |
| R4 | Listeners de resize acumulados: el deps array incluye funciones del context (`getCurrentTime`, etc.) que pueden cambiar identidad por render | `AudioLayerCanvas.tsx:70-71,134-139` | Estabilizar con `useCallback` en `useAudioData()` |
| R5 | `liquidGlass` sin fallback si `getContext('2d')` del scratch falla → falla silenciosa | `liquidGlass.ts:162-164` | Early-return explícito con restore |

## 4. Bugs de store / persistencia / audio

| # | Bug | Severidad | Ubicación | Fix |
|---|-----|-----------|-----------|-----|
| S1 | Instancias de Spectrum 2 creadas antes de v91 pueden carecer de `spectrumScale` (y keys posteriores) → `undefined` → crash del tab Spectrum en saves viejos | **ALTA** | `wallpaperStoreMigrations.ts` (~final de `migrateWallpaperStore`) | Backfill explícito de TODAS las keys de cada instancia con la misma hidratación de perfiles, independiente de la versión de origen |
| S2 | Lyrics huérfanas: `removeAudioTrack()` no borra la entrada en `audioLyricsByTrackAssetId` (lyrics keyed por **assetId**, playlist por **trackId**) | Media | `audioPlaylistSlice.ts` / `useAudioPlaylistController.ts` | Al borrar track: si ningún otro track usa el assetId → borrar entry |
| S3 | Race: next/prev manual durante crossfade de fin de pista puede dejar `isCrossfading` inconsistente → skip silencioso o crash raro | Media-baja | `AudioMixEngine.ts` (~`maybeStartCrossfade()`) | Guard `if (!this.active || !this.active.analyzer) return` |
| S4 | `objectUrl` de `FileAudioAnalyzer` puede filtrar en paths de excepción (autoplay bloqueado + instancia abandonada sin `stop()`) | Media | `FileAudioAnalyzer.ts:75-119` | Patrón try/finally + revoke en todos los paths |
| S5 | Quota de localStorage llena → el save falla con solo un warning en consola → al recargar se pierde toda la sesión sin aviso | **Media-ALTA** | `wallpaperStore.ts:39-51` | Toast "Almacenamiento lleno" + sugerir export (ya hubo mitigación de thumbnails, falta el aviso) |

**Precedente:** el patrón de S1 ya causó un bug en producción (caso `spectrumScale` v91, documentado en memoria del proyecto: key persistida nueva sin bump de versión = migrate no corre).

---

## 5. Liquid glass — análisis de fidelidad vs macOS

**Implementación actual** (`liquidGlass.ts`, 249 líneas, verificada a mano): Canvas 2D puro. Centro del panel 100% transparente; el rim (anillo) samplea el wallpaper ya dibujado, lo blurea/satura en un scratch canvas, y lo re-dibuja **magnificado uniformemente** (un solo `drawImage` escalado 1–1.6× sobre todo el anillo, clip evenodd). Tinte plano opcional + dos hairlines blancas como specular.

**Por qué no se ve fiel al macOS real:**

| Feature macOS | Implementación actual | Gap |
|---------------|----------------------|-----|
| Refracción progresiva: distorsión máxima en el borde exacto, decae hacia adentro con curva de lente | Magnificación **uniforme** en todo el anillo → corte abrupto en el borde interior del ring | **ALTO** — es la diferencia más visible |
| Fresnel: opacidad/tinte dependiente del ángulo (transparente de frente, opaco oblicuo) | Alpha plano en todo el rim | **ALTO** |
| Aberración cromática sutil en bordes | Ninguna | Alto |
| Speculars derivados de iluminación, con gradiente | 2 hairlines duras hand-drawn | Alto |
| Blur consciente de profundidad | Blur gaussiano uniforme | Medio |
| Micro-textura de superficie | Superficie ópticamente plana | Medio |
| Centro transparente | ✅ correcto | — |
| Magnificación de rim | ✅ existe (básica) | — |

**Propuesta concreta (~40-60 líneas, ~2ms extra en 1080p):**
1. **Curva de lente en el rim**: en lugar de un solo drawImage uniforme, dibujar el rim en 3–4 bandas concéntricas con magnificación decreciente (borde exterior 1.6× → borde interior 1.0×). Elimina el corte abrupto y da el "bending" característico.
2. **Fresnel aproximado**: gradiente radial de alpha sobre el rim (opaco en el borde, transparente hacia el centro) aplicado al tinte.
3. **Speculars con gradiente**: reemplazar hairlines por strokes con gradiente lineal (brillo arriba-izquierda, apagado abajo-derecha) simulando luz ambiental.
4. **Aberración cromática opcional**: segundo blit del rim desplazado 1px con `globalCompositeOperation='screen'` y tinte rojo/cian a baja alpha (solo en performance high).

Aplica a los 3 consumidores: lyrics (`LyricsOverlay.ts:567-588`), `NowPlayingWidget.ts` y superficies UI.

---

## 6. Inventario de features sobre-construidas (~460 LOC removibles)

| Feature | LOC | ¿Core? | Impacto de remover | Nota |
|---------|-----|--------|-------------------|------|
| `lyrixaLayerOverrides` + render mode dual (`bundle`/`editor`) | ~250 | No | Medio | **Los "canales" extra de lyrics nunca usados.** El path multi-layer (grupos por layerId, overrides de posición/color/escala por layer) existe en store + renderer + migraciones pero solo se usa el layer principal |
| `motionProfileSlots` legacy | ~80 | No | Medio (solo migración) | Deprecado desde el split particles/rain; solo vive en saves viejos |
| `spectrumSecondOverride` per-image | ~50 | No | Bajo | 1–2 referencias reales (tests) |
| Manual glow color decoupling (6 keys v92) | ~50 | No | Medio | Nice-to-have poco usado |
| Calibration synthetic groups | ~30 | No | Bajo | Ya es efímero (no persiste) |

**Nota sobre la poda:** cada remoción debe pasar por migración (limpiar keys persistidas) y confirmarse feature por feature (directiva de consolidación del proyecto).

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

- **41 archivos de test.** Bien cubierto: navegación de playlist, media session, persistencia (partialize), scene-first, spectrum (9 tests: instancias, ownership, accents), slideshow.
- **Sin cobertura (crítico):**
  - **0 tests de migraciones** v91–v102 (donde ya hubo un bug en prod).
  - **0 tests de `AudioMixEngine`** (crossfade, races).
  - **0 tests de `FileAudioAnalyzer`** (lifecycle de objectURL, cleanup).
  - Precedencia override-per-image vs slot sin test.

---

*Documento generado a partir de auditoría exhaustiva por dominios (julio 2026). Los file:line de los archivos críticos fueron verificados por lectura directa; el resto proviene de la pasada de auditoría y puede desplazarse algunas líneas con futuros cambios.*
