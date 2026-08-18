# Plan — Auditoría de retomada + AI Director

**Fecha:** 2026-08-16 · App `0.3.0-alpha.1` · Store persist **v106** · rama `main`

Dos partes: (A) estado real del proyecto tras semanas parado y qué falta para la
fase backend, (B) diseño del sistema de configuración con IA (escenas,
spectrums y efectos a partir de la imagen).

---

## Parte A — Estado y fallas

### A.0 Salud verificada (no asumida)

Corrido en este repo, hoy:

| Check              | Resultado                                        |
| ------------------ | ------------------------------------------------ |
| `npm run test:run` | 59 archivos, **794 tests, todos verdes** (2.8 s) |
| `npm run lint`     | **0 errores**, 13 warnings                       |
| `npm run build`    | **OK** (2.9 s)                                   |

El proyecto no se pudrió. Está sano y se puede retomar de inmediato. Lo que
sigue son huecos reales, no incendios.

### A.1 Fallas concretas encontradas

**1. `captureSceneSlotFromCurrent` es un stub — bloqueante.**
`src/store/slices/systemSlice.ts:542`. La firma acepta `matchKinds`, pero el
cuerpo hace `void matchKinds` y devuelve una escena **vacía**. El comentario
lo admite: _"the extra snapshotting path can be implemented once per-feature
capture flows are wired"_.

Consecuencia: hoy no existe camino de "estado actual → escena guardada". El
usuario tiene que crear la escena vacía y rellenar cada referencia a mano en la
UI. Esto es exactamente lo que la IA necesita como salida, así que **es el
prerequisito #1 del AI Director**, no un extra.

**2. El export offline renderiza casi nada.**
`src/features/export/renderSubsystems/stubs.ts`: siete subsistemas
(`background`, `looks`, `motion`, `particles`, `rain`, `overlays`, `hud`) son
no-ops. `renderFrameAt` recorre el pipeline completo pero solo las capas de
audio dibujan de verdad. Un video exportado offline hoy no se parece al
preview. Está documentado como intencional, pero significa que "export de
video" no es una feature entregable todavía — conviene marcarlo así en la UI
en vez de dejar que el usuario descubra el vacío.

**3. Techo de `localStorage` — sospechoso del bug "los setlists desaparecen".**
`src/store/wallpaperStore.ts:40-55` atrapa el fallo de cuota y avisa, pero el
mensaje es literal: _"State kept in memory only"_. Es decir: la sesión sigue
funcionando y al recargar se pierde todo lo posterior al último write exitoso.
Con 200 imágenes, hasta 120 slots de spectrum, 60 por familia y 100 setlists,
los ~5 MB de `localStorage` se alcanzan. **Esa es la firma exacta de un bug
"sin repro": no falla al guardar, falla al recargar.** Hipótesis fuerte, no
confirmada — se confirma reproduciendo con el pool cargado y mirando la consola
por `[lwag] Failed to persist`.

Arreglo correcto: mover el persist de escena a IndexedDB (los assets ya viven
ahí). No es opcional para 200 imágenes.

**4. Dos warnings de deps a revisar** (los otros 11 son `react-refresh`, ruido).
Al mirarlos de cerca, solo uno era bug — ver "Fase 0":

- `src/components/controls/tabs/main/layers/useLayerOrder.ts:155` — **bug real**:
  falta `finishPointerDrag`, un drag puede quedar colgado con un handler viejo.
- `src/components/wallpaper/quickActions/useQuickActionsViewModel.tsx:920` —
  **falso positivo**: las deps listan cada `state.x` usado, que es más preciso
  que depender de `state` entero.

**5. Bundle pesado.** Tres chunks cerca o por encima de 700 kB:
`spectrum-tab` 798 kB, `three-core` 724 kB, `index` 719 kB. Tolerable en
escritorio local, caro en cuanto haya login y carga desde red.

### A.2 Qué falta para la fase backend

Lo bueno: **la costura ya existe.** `src/lib/sync/SyncRepository.ts` define el
contrato y `localSyncRepository.ts` ya lo implementa sobre IndexedDB. Un
adaptador remoto entra sin tocar los llamadores. Entre `backend/schema/001_init.sql`
y `docker-compose.yml` ya está modelado el esquema de proyectos versionados y
assets por hash.

Lo que falta, en orden:

1. **No hay servidor.** `backend/` es solo esquema y Docker. No hay API, no hay
   auth, no hay adaptador remoto. Es la pieza grande.
2. **Formato de snapshot canónico desacoplado del persist.** `CLOUD_READINESS.md`
   ya lo identifica. Refuerzo con dato duro: `STORE_PERSIST_VERSION` va en 106 y
   sigue subiendo cada sprint. Si el snapshot en la nube se ata a ese número,
   cada sprint rompe la sync. Congelar `projectSchemaVersion` como capa
   traductora **antes** de escribir la primera fila remota.
3. **Persist a IndexedDB** (ver A.1.3) — precondición para que "proyecto grande"
   sea siquiera representable localmente.
4. **Resolución de conflictos**: `revision` existe en el esquema, pero
   last-write-wins pierde slots. Los slots de feature son append-mostly, así que
   un merge por familia de slots es viable y mucho mejor.
5. **Custodia de claves.** El README del backend ya prohíbe exponer
   `DATABASE_URL` vía `VITE_*`. **La misma regla aplica a la clave de la API de
   Claude** — y eso empuja el AI Director hacia el servidor (ver B.6).

---

## Parte B — AI Director

### B.1 El hallazgo que hace esto barato

La app **ya tiene** el sustrato exacto que la IA necesita. No hay que inventar
un canal nuevo hacia el render:

- Cada subsistema guarda su config como _slot de perfil_: objetos
  `Pick<WallpaperState, KEYS>` con listas de claves ya declaradas
  (`SPECTRUM_PROFILE_KEYS`, `PARTICLES_PROFILE_KEYS`, `LOOKS_*`, `RAIN_*`,
  `LIGHTS_*`, `CAMERA_FX_*`, `LOGO_*`, `TRACK_TITLE_*`) en
  `src/lib/featureProfiles.ts`.
- `SceneSlot` (`src/features/scenes/sceneSlot.ts`) es **solo composición**:
  referencias a esos slots, cero valores propios. Regla dura ya escrita en el
  archivo.
- `resolveEffectiveSceneSlotId` + `applySceneSlotById` ya resuelven
  "imagen activa → escena → patch de estado".

O sea: **"al cambiar la imagen debe cargar su spectrum y efectos" ya funciona.**
Eso no hay que construirlo. Lo único que falta es _quién autora las escenas_.
La IA autora escenas; el runtime ya sabe aplicarlas.

Esto reduce el alcance del feature a la mitad y elimina el riesgo de que la IA
toque el render directamente.

### B.2 Regla dura: la IA no escribe claves del store

`SPECTRUM_PROFILE_KEYS` tiene ≈190 claves. Darle eso a un modelo es caro, lento
y frágil — y ya hay precedente de lo que pasa cuando una clave entra mal
(`spectrumScale`, v91, clave persistida sin migración → `undefined` en prod).

**La IA emite un `SceneIntent` de ~15 campos. Un compilador determinista lo
expande a las ≈190 claves.**

```ts
type SceneIntent = {
	energy: number; // 0..1  calmo → agresivo
	weight: number; // 0..1  fino → macizo
	motion: number; // 0..1  quieto → caótico
	palette: { primary: string; secondary: string; accent: string };
	spectrumMode: 'radial' | 'linear';
	spectrumFamily: SpectrumFamily;
	spectrumShape: SpectrumShape;
	particles: 'off' | 'dust' | 'embers' | 'snow' | 'sparks';
	rain: 'off' | 'light' | 'heavy';
	looks: 'clean' | 'crt' | 'bloom' | 'glitch';
	lights: 'off' | 'ambient' | 'concert';
	rationale: string; // por qué, para mostrárselo al usuario
};
```

Por qué esta separación es la decisión central:

- **Testeable sin API.** El compilador es una función pura; se cubre con vitest
  igual que el resto del repo.
- **Clampeable.** Cada número pasa por `src/config/ranges.ts`
  (`snapToRange`, ya existe) y cada enum por su unión de tipos. Una clave
  desconocida se rechaza, no se escribe.
- **Versionable.** `COMPILER_VERSION`. Cuando mejores el mapeo, regeneras las
  200 escenas **sin volver a llamar al modelo**.
- **Barato.** Prompt chico, salida chica.
- **Reusa lo que hay.** `motionRandomizer.ts` y `looksRandomizer.ts` ya saben
  producir configs válidas; el compilador es lo mismo pero sesgado por intent en
  vez de aleatorio puro.

### B.3 Análisis de imagen: determinista y local primero

Antes de cualquier modelo, una firma calculada en el cliente desde
`thumbnailUrl` (ya existe en `BackgroundImageItem`) en un canvas 64×64:

```ts
type ImageSignature = {
	assetId: string;
	palette: Array<{ hex: string; weight: number }>; // 5 dominantes
	luma: number;
	saturation: number;
	contrast: number;
	edgeDensity: number; // detalle / caos visual
	colorCount: number; // pocos colores + bordes duros = pixel art
	isPixelArt: boolean;
	aspect: number;
	version: number; // ANALYZER_VERSION
};
```

Gratis, instantáneo, offline, cacheable en IndexedDB por `assetId+version`.

**Propiedad de diseño importante:** la firma sola, sin modelo, ya alimenta al
compilador y produce una escena decente (paleta de la imagen, energía derivada
de contraste + saturación + densidad de bordes). O sea **el feature funciona sin
IA y sin conexión**; el modelo aporta gusto, no es dependencia. Eso además te da
el fallback natural cuando no haya cuota o servidor.

### B.4 Preview / commit / revert

Slice nuevo `aiDirectorSlice`, **no persistido**:

- `draft: SceneDraft | null`
- `previewActive: boolean`, `snapshotBeforePreview`
- `previewDraft()` — aplica el patch compilado al estado vivo. El wallpaper se
  ve cambiar en tiempo real, sin guardar nada.
- `revertPreview()` — restaura el snapshot.
- `commitDraft(name)` — crea los slots de feature reales, crea el `SceneSlot`
  que los referencia, y lo liga a la imagen (`image.sceneSlotId`).

`commitDraft` **es** la implementación real de `captureSceneSlotFromCurrent`.
Un solo camino sirve a la IA y al botón manual "convertir en escena". Por eso
A.1.1 se arregla primero.

Esto respeta dos reglas ya establecidas del proyecto: nada se aplica solo (Apply
explícito con diff visible), y ninguna acción destructiva sin confirmar.

### B.5 Las 200 imágenes — el problema real

Una llamada por imagen es inviable en costo y tiempo. Plan:

1. **Analizar las 200 localmente** → firmas. Segundos, gratis, con barra de
   progreso cancelable.
2. **Clusterizar** las firmas (k-means sobre el vector normalizado) en K grupos.
   K por defecto 8, ajustable.
3. **Una llamada al modelo por cluster** — imagen representativa a 256 px + la
   firma media del grupo → un `SceneIntent`. **8 llamadas, no 200.**
4. **Compilar por imagen** usando el intent del cluster **más la firma propia de
   esa imagen** (su paleta, su luma). Así 25 imágenes del mismo cluster salen
   parecidas en carácter pero distintas en color e intensidad, sin llamadas
   extra.
5. **Revisión por cluster** con diff visible, aprobás grupo por grupo.

El paso 4 es lo que hace que esto no se sienta a plantilla. La variedad sale de
la imagen, no del modelo.

### B.6 Dónde corre el modelo — y por qué esto justifica el backend

`VITE_ANTHROPIC_API_KEY` **no existe como opción**: todo `VITE_*` termina en el
bundle. Misma regla que ya está escrita para `DATABASE_URL`.

- **Destino:** endpoint propio `POST /api/ai/scene-intent`. Guarda la clave,
  autentica, limita cuota y **cachea por `hash(signature) + promptVersion`** —
  dos imágenes casi idénticas no pagan dos veces.
- **Interino, para poder construir ya:** modo dev con clave propia en memoria
  (nunca persistida), detrás de `import.meta.env.DEV`. Permite desarrollar el
  feature completo antes de que exista servidor.

Esto conviene verlo al revés de como suena: **el AI Director es el que le da
razón de ser al backend.** Custodia de clave, caché compartido y cuota son
problemas con forma de servidor. Es el mejor primer cliente que puede tener la
fase backend.

### B.7 Estructura propuesta

```
src/features/aiDirector/
  analysis/imageSignature.ts        # B.3, puro + test
  analysis/signatureCache.ts        # IndexedDB
  analysis/clusterSignatures.ts     # k-means, puro + test
  intent/sceneIntent.ts             # tipo + validador/clamp
  intent/compileIntent.ts           # B.2, puro + test, COMPILER_VERSION
  intent/heuristicIntent.ts         # firma → intent sin modelo (fallback)
  client/sceneIntentClient.ts       # server, o dev BYO-key
  store/aiDirectorSlice.ts          # B.4, no persistido
  ui/                               # panel, diff, revisión por cluster
```

Todo lo puro se testea sin API. Solo `client/` toca la red.

---

## Roadmap sugerido

| Fase | Qué                                                         | Depende de |
| ---- | ----------------------------------------------------------- | ---------- |
| 0    | ✅ **Hecha** — ver "Fase 0" abajo                           | —          |
| 1    | ✅ **Hecha** — ver "Fase 1" abajo                           | 0          |
| 2    | ✅ **Hecha** — ver "Fase 2" abajo                            | 1          |
| 3    | Cliente del modelo (dev BYO-key) + panel de intent editable | 2          |
| 4    | Batch: clustering + revisión por cluster (las 200)          | 3          |
| 5    | Persist a IndexedDB (A.1.3)                                 | —          |
| 6    | Servidor: auth + `SyncRepository` remoto + `/api/ai/*`      | 3, 5       |

Las fases 0–2 ya entregan valor real y no necesitan ni una llamada a un modelo.

---

## Fase 0 — hecha (2026-08-17)

`captureSceneSlot` (`src/features/scenes/captureSceneSlot.ts`) es el inverso
puro de `buildSceneSlotActivationPatch`: estado vivo → Scene slot. Reglas que
implementa, todas cubiertas por tests:

- Los valores van al array de slots de cada feature; la Scene solo guarda la
  referencia. La regla "una Scene nunca posee valores" sigue intacta.
- Subsistema apagado → ref `'off'`, no un slot. Es necesario porque cargar un
  slot de logo fuerza `logoEnabled: true`; sin `'off'` una captura hecha con el
  logo apagado volvería encendida.
- Familias con dos switches (lights, cameraFx, trackTitle) solo son `'off'`
  cuando **ninguno** está activo.
- Looks nunca emite `'off'` — no tiene master switch y el patch de activación lo
  trata como no-op.
- **Reuso de slots**: si un slot existente ya contiene el look actual, se
  referencia en vez de duplicar. Sin esto, capturar escenas para un pool grande
  agotaría el cap de cada familia e infla el estado persistido. Verificado en la
  app: capturar dos veces el mismo look da dos Scenes apuntando a los mismos
  ids, con los contadores de slots sin crecer.
- Familia en su cap y nada que reusar → ref `null` + la familia se reporta en
  `skipped`, que la UI muestra. Nunca se descartan valores en silencio.
- Spectrum 1 y Spectrum 2 se capturan en sus arrays propios, comparando con
  `selectSpectrumActiveProfileIndexForTarget` (normaliza antes de comparar, así
  que un 0.62→0.6 no cuenta como slot distinto).

`captureSceneSlotFromCurrent` ahora devuelve `{ sceneId, skipped } | null` — el
`sceneId` es lo que la fase 2 necesita para ligar la escena a la imagen. La
Scene se agrega pero **no** se aplica ni se activa: capturar describe lo que ya
estás viendo.

Botón cámara en el header de Scene → Scenes. Nota: la acción no tenía **ningún**
llamador en la UI; el stub tampoco estaba conectado a un botón.

Los dos warnings de deps: el de `useLayerOrder` era real (listeners de drag
re-montándose y llamando un `finishPointerDrag` viejo) y se arregló con un ref
al callback más reciente, dejando el efecto con deps `[]`. El de
`useQuickActionsViewModel` **no** era un bug — las deps listan cada `state.x`
usado, que es más preciso que `state`; queda un disable con la razón escrita.

---

## Fase 1 — hecha (2026-08-17)

Cinco módulos en `src/features/aiDirector/`, todo puro salvo dos envoltorios.

**`intent/sceneIntent.ts`** — el vocabulario y la frontera de confianza.
`parseSceneIntent(raw)` acepta JSON hostil, no lanza nunca, y devuelve
`{ intent, rejected[] }`: cada campo inválido cae al default y queda listado, así
que "el modelo devolvió basura" es un estado observable en vez de una escena
gris silenciosa. Los escalares se **clampean** (5 → 1) pero los enums se
**rechazan** — un valor fuera del rango es intención mal escalada, un enum
inventado es alucinación. Los colores solo se aceptan como hex; `hsl()`/`rgb()`
se rechazan a propósito, porque los valores de slot se comparan como strings y
notación mixta rompería el reuso de slots de la fase 0.

**`analysis/imageSignature.ts`** — núcleo puro sobre píxeles RGBA. Paleta por
buckets de 4 bits con **merge de colores cercanos** (sin eso, un cielo devuelve
cinco azules indistinguibles), luma, saturación, contraste, densidad de bordes,
conteo de colores y detección de pixel art (pocos colores + alta proporción de
bordes duros). Los píxeles transparentes se ignoran en todas las métricas.

**`analysis/analyzeImageUrl.ts`** — el envoltorio de canvas. Detalle no obvio:
`imageSmoothingEnabled = false` es obligatorio. El downscale bilineal inventa
colores intermedios y borraría justo la señal que buscan el detector de pixel
art y la paleta; con nearest-neighbour un sprite de 5 colores sigue leyendo
como 5 colores.

**`analysis/signatureCache.ts`** — IndexedDB con la versión del analizador en
cada fila, así que bumpear `IMAGE_SIGNATURE_VERSION` invalida sin migración.
Toda operación degrada a miss en vez de lanzar: con IndexedDB bloqueado el
análisis debe seguir corriendo, solo sin caché.

**`intent/heuristicIntent.ts`** — firma → intent sin modelo. El ranking de
paleta no usa cobertura cruda sino "vividez" (saturación × √cobertura × cercanía
a luminosidad media), porque el fondo oscuro y sucio domina por área en casi
todo frame de anime sin aportar nada usable. `makeReadable` fuerza los colores a
una banda visible — un spectrum teñido con el casi-negro de la propia imagen es
invisible contra esa imagen, que es la forma más común de que una "paleta
derivada de la imagen" salga rota.

**`intent/compileIntent.ts`** — intent → parciales por familia. Emite un
**delta contra los defaults de fábrica**, no una config completa: solo lo que el
intent realmente implica, dejando cada knob no tocado en su default auditado.
Todo numérico pasa por `snapToRange` contra `config/ranges.ts`. `shadowBlur` se
queda en 26 de un techo de 60 incluso a energía máxima — es el cuello de botella
documentado del spectrum y el gusto no vale un desplome de FPS. Los subsistemas
por debajo del umbral de visibilidad se **apagan** en vez de emitir un valor
inerte que igual cuesta un transform por frame.

### Sobre los tests

El de más valor es el barrido de `compileIntent`: recorre el producto cruzado de
enums × escalares y verifica que **ningún numérico sale de su rango**. La tabla
de rangos del test es explícita, así que agregar un knob al compilador obliga a
declarar su rango ahí — si no, el test falla por rango no declarado.

Un test falló de verdad al escribirlo: `makeReadable` garantiza luminosidad
≥ 0.45, pero el round-trip por hex de 8 bits la baja hasta ~0.449. Es pérdida de
cuantización inherente a guardar colores como hex, no un bug; el test lleva esa
tolerancia documentada.

### Verificado en el navegador

`analyzeImageUrl` es el único módulo sin test unitario (necesita DOM), así que se
corrió el pipeline completo sobre dos imágenes sintéticas:

|                    | sprite pixel-art    | gradiente calmo   |
| ------------------ | ------------------- | ----------------- |
| colores / pixelArt | 4 / **sí**          | 29 / no           |
| energía            | 0.63                | 0.12              |
| familia · forma    | classic · **pixel** | **liquid** · wave |
| looks · luces      | crt · ambient       | clean · off       |
| smoothing · glow   | 0.61 · 1.1          | 0.83 · 0.4        |

El sprite eligió el cian neón como primario por encima del azul marino dominante
(la regla de vividez), y el gradiente casi monocromo recibió una tríada
sintetizada en vez de tres grises.

### Lo que esto ya habilita

El AI Director **funciona sin modelo y sin conexión**: firma → intent
heurístico → compilador produce una escena razonable hoy. El modelo pasa a ser
mejora de gusto, no dependencia — y es también el fallback cuando una llamada
falla o devuelve basura.

---

## Fase 2 — hecha (2026-08-17)

### La propiedad que define la fase

**Lo previsualizado es exactamente lo que se guarda.** Si preview y commit
divergen, el usuario aprueba una cosa y guarda otra — el peor fallo posible en un
flujo de "probate esto". Se garantiza _estructuralmente_, no manteniendo dos
caminos sincronizados: `commitAiDraft` **captura el estado vivo** con la captura
de la fase 0, en vez de volver a derivar valores desde el draft. Si el draft
nunca se previsualizó, se aplica primero, así la garantía se sostiene igual.

`buildDraftPatch` refleja la semántica de `buildSceneSlotActivationPatch`: mergea
`defaults de fábrica → parcial compilado`. Arrancar desde los defaults (y no
desde el estado vivo) es lo que hace que un draft sea **completo**: un knob que
el intent no menciona vuelve a su default auditado en vez de heredar lo que dejó
la escena anterior, así el mismo draft se ve igual sin importar qué había antes
en pantalla.

### El slice

`src/store/slices/aiDirectorSlice.ts` — `aiDraft`, `aiPreviewActive`,
`aiPreviewSnapshot` + `previewAiDraft` / `revertAiPreview` / `discardAiDraft` /
`commitAiDraft`.

Tres detalles que importan:

1. **Nada se persiste.** Las tres keys están en la denylist de
   `partializeWallpaperStore`. Un draft a medio previsualizar sobreviviendo a un
   reload dejaría al usuario mirando settings que nunca aceptó, sin snapshot para
   deshacerlos. Como es una _remoción_ de la persistencia, no hace falta bumpear
   `STORE_PERSIST_VERSION`.
2. **El snapshot guarda el estado del usuario, no el del preview anterior.**
   Re-previsualizar restaura el snapshot original antes de aplicar el nuevo; sin
   eso, recorrer varios drafts haría que revert volviera a un draft en vez de a
   la realidad. Hay test para eso.
3. **El snapshot es exactamente las keys que el patch pisa**, así que revert no
   deja residuo — por eso se puede ofrecer sin diálogo de confirmación.

`commitAiDraft` liga la escena nueva a la imagen del draft
(`setBackgroundImageSceneSlotId`). Eso es lo que hace que "al cambiar la imagen
cargue su spectrum y efectos" funcione: el runtime de escenas ya hace el resto.

### La UI

Tercera sub-pestaña de Scene: `scene/AiDirectorPanel.tsx`. Tres pasos explícitos
(Sugerir → probar → Guardar), no un botón mágico. La sugerencia se aplica al
wallpaper vivo para poder juzgarla contra la música real, y nada se escribe hasta
que el usuario lo pide — la misma regla de "apply explícito, diff visible" que ya
siguen las bindings de escena. Muestra los tres ejes como medidores, las
decisiones como chips, la paleta como swatches, y un badge de pixel art.

Detalle: el análisis usa `image.url`, **no** el thumbnail del editor. El
thumbnail es un webp re-codificado y su paleta no es la de la imagen.

### Verificado en la app real

Sprite pixel-art inyectado al pool → pestaña AI Director → Suggest:

- Energía 63 · Peso 53 · Movimiento 59
- classic · pixel · linear, partículas dust, looks crt, luces ambient
- Swatches cian/magenta/amarillo + badge PIXEL ART
- Hint: "Previewing on the live wallpaper. Nothing is saved until you press Save."

Los tres ejes coinciden exactamente con la verificación de la fase 1 sobre el
mismo sprite, o sea el pipeline entero es consistente de punta a punta.

### Lo que falta para cerrar el círculo

El intent todavía no es editable a mano desde la UI (el store ya lo soporta vía
`draftWithIntent`), y la fuente sigue siendo siempre la heurística — la fase 3
agrega el cliente del modelo y el panel de intent editable.
