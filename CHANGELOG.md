# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
the version scheme in `src/lib/version.ts`.

> **Versioning note** — three independent version numbers live in
> `src/lib/version.ts` and must not be conflated:
>
> - `APP_VERSION` — the human-facing product version (matches `package.json`).
> - `PROJECT_SCHEMA_VERSION` — the export/import project-package format.
> - `SETTINGS_SCHEMA_VERSION` — the standalone settings-file format.
> - `STORE_PERSIST_VERSION` — the Zustand `localStorage` migration counter (bumped
>   on every persisted-state shape change; **not** a product version).

## [Unreleased]

### Lyrics: eliminado el Liquid Glass de canvas (store v106 → v107)

- **Se borra el panel liquid-glass de canvas** (`nowPlayingLiquidGlass*`,
  `audioLyricsLiquidGlass*` y `src/components/audio/liquidGlass.ts`). Volvía a
  desenfocar y magnificar el wallpaper detrás de la letra y de la tarjeta Now
  Playing **en cada frame**, y nunca llegó a verse como se pretendía. El
  backdrop sólido de siempre sigue disponible en ambos sitios.
- **`hudLiquidGlassEnabled` NO se toca**: es el cristal del HUD del editor,
  puro CSS (`backdrop-filter`), y funciona.
- Las claves persistidas se eliminan al rehidratar, así que no quedan colgando
  en proyectos guardados.
- **`STORE_PERSIST_VERSION` 106 → 107**.

### Spectrum: saneado de las formas radiales + Puntas Afiladas (store v105 → v106)

- **Las formas ya no se salen del radio pedido.** "Fit around logo" escalaba la
  figura por `1/minFactor` sin tope: `bowtie` pedía **×20**, o sea que un anillo
  de 120px se dibujaba a 2400px y sus lóbulos se iban de pantalla mientras la
  cintura se quedaba en el radio pedido. La inflación ahora está acotada
  (`MAX_LOGO_FIT_INFLATION = 3.5`) y todas las formas se han rediseñado por
  debajo de ese techo, así que el tope nunca llega a actuar.
- **Fuera los arcos planos.** `shield` recortaba con `Math.min(1, raw)` y dejaba
  el **33.9%** del contorno como un arco circular muerto; `moon` hacía lo propio
  con `Math.max(floor, raw)` en el 15.3%. Ninguna forma clampa ya: la curva se
  diseña para que sus extremos naturales caigan donde toca.
- **`minFactor` se mide, no se declara.** Cada forma se autoría como geometría
  pura y `calibrate()` mide su pico y su valle. El valor escrito a mano ya había
  derivado: las cinco `flower*`/`lobed3` declaraban 0.611 con un mínimo real de
  0.550 y por tanto **cortaban el logo** aunque el ajuste estuviese activo.
  Además toda forma llega ahora exactamente al radio pedido — `moon` se
  dibujaba al 76% y `concaveTriangle` al 68%.
- **Cuatro formas estaban boca abajo.** En canvas la Y crece hacia abajo, así
  que `sin θ > 0` es la mitad **inferior**. `heart`, `shield`, `drop` y
  `cardioid` lo leían como eje matemático: corazón invertido, escudo con el pico
  arriba, gota con la punta abajo. Se corrige con un helper `up()` explícito.
  El corazón además tenía un **segundo cleft abajo** (`|sin 2θ|` tiene picos en
  los cuatro cuadrantes); ahora va apuntado al hemisferio superior.
- **`cross` y `bowtie` tienen aristas de verdad.** Eran aproximaciones
  trigonométricas (`|cos 2θ|^0.3` daba brazos redondos con la punta en pico, lo
  contrario de una cruz; `bowtie` era literalmente dos círculos tangentes). Se
  trazan con un helper `fromPolygon()` de intersección rayo/arista exacta.
- **Seis formas eliminadas: `cardioid`, `drop`, `heart`, `shield`, `moon` y
  `wings`.** Todas por la misma razón de fondo: `r(θ)` solo describe siluetas
  que son estrelladas respecto de su propio centro, y estas necesitan una
  cúspide real o una mordida cóncava que el rayo cruza dos veces. Cualquier
  versión suya era un borrón con el nombre equivocado o se rompía en cuanto el
  ajuste al logo la escalaba. Los presets guardados se remapean a `oval`
  (`wings` a `lens`).
- **Ninguna forma puede salirse del canvas.** El ajuste al logo escala por
  `1/minFactor`, así que un logo grande (hasta 400px ⇒ ~260px de holgura) podía
  convertir un anillo modesto en un pico de ~900px, fuera de pantalla en 1080p.
  `resolveLogoSafeRadius` recibe ahora el viewport y acota la holgura por
  `distancia al borde más cercano / MAX_LOGO_FIT_INFLATION`.
- **Nuevo: Puntas Afiladas** (`spectrumRadialSharpness`, por instancia). Estrecha
  la forma **ya seleccionada** hacia sus puntas, así que las estrellas y flores
  de lóbulo redondeado tienen ahora también versión afilada sin duplicar el
  catálogo. En 0 es un no-op exacto: los presets guardados se ven igual.
- **El picker deja de mentir.** `ShapePreview` reescalaba cada forma a su propio
  pico, así que una figura que se renderizaba al 76% se veía a tamaño completo
  en el selector. Ahora muestrea directo y refleja también el sharpness activo.
- **`STORE_PERSIST_VERSION` 105 → 106**.

### Spectrum: Classic Linear "pixel" vuelve a ser usable

- **El ecualizador LED rellenaba una vez por celda, con la sombra puesta.**
  La versión original mataba el glow a propósito (`// Pixel art means crisp
edges` + `shadowBlur = 0`); al añadir las opciones de LED se cambió por
  `shadowColor`/`shadowBlur` **por barra**, y como cada celda se rellenaba
  aparte, Canvas2D reejecutaba el blur en cada una. Medido con 96 barras,
  mirror activo y barras altas: **22.464 rellenos con blur por frame**.
- Ahora la columna entera (incluido su espejo) se acumula en **un solo path** y
  se rellena una vez: **96 rellenos**, o sea **234× menos**. Las celdas no se
  solapan, así que una sombra sobre la unión dibuja lo mismo que las sombras por
  celda — con la diferencia de que ya no se acumulan entre celdas vecinas, así
  que el glow queda algo más limpio y menos empastado.
- Cuadrados y rombos emiten sus cuatro esquinas ya rotadas en vez de un
  `save`/`rotate`/`restore` por celda (el otro coste por celda).
- **Barras que comparten color se fusionan en un solo relleno.** Con color
  `solid` el spectrum entero pasa a ser **1 relleno con blur** en vez de 96. En
  los modos de barrido cada barra tiene su propio color y degrada al
  comportamiento por barra, nunca peor. Los tramos son contiguos, así que el
  orden de pintado no cambia.
- **El neon core es un único relleno** para todo el spectrum: su color no varía
  por barra, así que no había motivo para repetirlo 96 veces.
- **El color del glow se muestrea en 16 pasos.** Las sombras de Canvas2D aceptan
  un solo color plano por operación, así que un glow que barre necesita una
  pasada por color distinto — y el manual glow viene con modo de color
  `gradient` por defecto, dándole a las 96 barras un color distinto y anulando
  toda fusión. Justo la combinación que se reportaba como lenta. Muestrear el
  barrido en 16 pasos deja ese caso en **16 rellenos con blur en vez de 96**. El
  relleno nítido conserva su color exacto por barra; solo se escalona el color
  de la sombra, que ya va desenfocada varios píxeles.
- `linearPixel.test.ts` cuenta operaciones de dibujo y falla si el número de
  rellenos vuelve a escalar con el número de celdas o de barras.

### Editor: el HUD deja de quedar bloqueado por el drag del spectrum

- **Con el editor abierto y una herramienta de arrastre armada, los controles
  del HUD no respondían** si el spectrum quedaba por debajo. `DragInteractionLayer`
  se montaba como hermano de `WallpaperViewport`, y el `<main>` del viewport
  lleva `isolation: isolate`: eso crea un contexto de apilamiento, así que el
  `z-[126]` del HUD queda **encerrado dentro** y el capturador (z-40) se pintaba
  sobre todo el subárbol pasara lo que pasara. Ahora se monta **dentro** de ese
  `<main>` con z-100: por encima de todos los canvas del wallpaper (el más alto
  es flashlight, 90) y por debajo del overlay de FPS (120) y del HUD (126).
- **El drag solo captura donde está el elemento.** El capturador cubría el
  viewport entero, así que con una herramienta armada salía el cursor de agarre
  por toda la pantalla y había una superficie transparente encima de botones que
  no tenían nada que ver con lo que se arrastraba. Nuevo `dragHitArea.ts`
  resuelve el área real en pantalla de cada objetivo (círculo para spectrum
  radial y logo, banda para spectrum lineal, caja para los textos) y la capa se
  pone `pointer-events: none` fuera de ella. Sigue abarcando el viewport para
  que un arrastre pueda continuar más allá del borde del elemento.
- **La UI siempre gana al wallpaper que tiene debajo.** La geometría sola no
  basta: un spectrum lineal pegado al borde inferior ocupa legítimamente todo el
  ancho, así que su área incluye el HUD. HUD y panel del editor se marcan con
  `data-drag-blocker` y el capturador consulta `elementsFromPoint` antes de
  activarse. Como esa API ya ignora los nodos con `pointer-events: none`, la
  capa transparente a pantalla completa del HUD no cuenta — solo sus controles
  reales.

### Editor: re-render a 60Hz que competía con los canvas

- **`MediaDock` llamaba `setCurrentTime` + `setSeekValue` en cada frame** de RAF
  mientras sonaba un archivo, re-renderizando todo el dock 60 veces por segundo
  para pintar casi siempre lo mismo (la barra tiene ~300px y la etiqueta
  resolución de un segundo). Barato en producción; caro en desarrollo, donde el
  build de dev de React va 3–5× más lento y **StrictMode ejecuta cada render dos
  veces**. Ahora `publishTime` solo entra al estado cuando el valor movería medio
  píxel de la barra o cambiaría el segundo de la etiqueta; los saltos (seek,
  cambio de pista, loop) siguen siendo inmediatos.
- **`TimestampTimeline` tenía el mismo patrón** con `setPlayheadTime`; misma
  guarda.
- **`OutputModeDevDiagnostics` medía frames para nadie.** Su `useEffect`
  arrancaba un bucle RAF perpetuo **antes** del `if (!debugVisible) return null`
  — un guard de render no es un guard de efecto. En DEV el componente se monta
  siempre en modo edición, así que ese muestreo corría siempre aunque el
  overlay estuviese oculto (que es lo normal). Ahora el efecto depende de
  `debugVisible`.

### Spectrum: glow con color real + controles centralizados (store v104 → v105)

- **Glow Color Mode arreglado en todo el sistema.** `gradient` mezclaba los dos
  colores y devolvía **un solo color** — lo mismo que escribir ese color en
  `solid`. Ahora el glow usa la MISMA maquinaria de color que el relleno
  (`asGlowColorSettings` + `getColor` / `createWaveGradient`), así que:
    - `gradient` recorre color A → color B **a lo largo del contorno** (cónico en
      radial, por eje en linear),
    - **`rainbow`** y **`visible-rotate`** existen también para el glow, con su
      propia paleta (`spectrumGlowRainbowColors`, resuelta desde
      `spectrumGlowColorSource`, así que el glow puede seguir la imagen aunque el
      relleno no).
    - Como `shadowColor` de canvas solo acepta un color plano, el halo pasa a
      `filter: blur()` sobre el propio degradado cuando el modo no es `solid`.
- **Glow Reach y Shadow Blur vuelven a hacer algo en Liquid.** El tope
  atenuaba la petición del usuario por el stack de capas (a valores por defecto
  pedía ~8px y cualquier movimiento del slider se comía dentro del cap). Ahora
  los tres diales mandan hasta el techo, y el alivio por stack se aplica solo al
  **techo** (44px fluido / 26px rígido, ampliados por Reach). Cubierto por
  `liquidGlow.test.ts`, que falla si un slider deja de responder.
- **Controles centralizados**: la sección "Glow & finish" desaparece; Glow /
  Glow Reach / Shadow Blur viven ahora arriba de **Visual accents**, junto al
  resto de los acentos.
- **Retro Pixelate sale de "Glow & finish"** (no tiene nada que ver con el
  glow) a su propia sección, y **se puede aplicar por capa o a todas a la vez**:
  nuevas keys `spectrumLiquidLayer{1,2,3}Pixelate` pixelan una sola capa de
  Liquid mediante un canvas scratch reutilizado, mientras las otras siguen
  suaves. El toggle global sigue significando "todas las capas".
- **`STORE_PERSIST_VERSION` 104 → 105**.

### Spectrum: paridad de glow y de controles entre familias

- **Glow por capa en Liquid**: cada capa dibuja ahora su propio halo (la misma
  receta de Classic Radial Wave) trazado sobre **su** contorno, así que el
  brillo sigue la forma y la deformación de cada capa. Antes liquid solo seteaba
  `shadowBlur` con tope duro de 28px (10 rígido) y sin pase de halo: Glow y
  Glow Reach eran prácticamente inertes aunque los sliders se muestran para
  todas las familias. El halo nunca supera la opacidad de su capa
  (`alphaScale` nuevo en `drawClassicGlowHaloPass`).
- **Tope de blur sensible a Glow Reach** en liquid y scope (antes el cap se
  comía el slider) y **`performanceMode` aplicado en todas las familias**:
  liquid, tunnel, orbital, spiral y scope capaban un número crudo, así que el
  mismo preset costaba mucho más en medium/low según la familia
  (`resolveGlowPerfScale`, extraído de Classic).
- **Scope radial**: el Wave Fill se pintaba DESPUÉS del trazo y del neon core,
  lavándolos; ahora el orden es fill → halo → trazo → neon core, igual que el
  lineal. Y **Mirror funciona**: el scope lee el time-domain, así que nunca
  pasaba por `applyRadialMirrorFold`; se pliega con el mismo contrato.
- **Halo de glow manual en el scope** (lineal y radial, incluidos sus espejos),
  igual que ya hacía spiral: el toggle de manual glow significa lo mismo en
  todas las familias.
- **"Fit around logo" ya no es solo de Classic**: liquid, scope, orbital y
  tunnel pasan el radio seguro a la geometría (`resolveLogoSafeRadius`), así
  que las formas con vértices hacia adentro (estrella, polígonos) dejan de
  cortar el logo. Spiral queda fuera a propósito (usa su propia forma).
- **Follow logo / Logo gap / Inner radius visibles en toda familia radial**:
  `resolveSpectrumPlacement` ya los aplicaba a cualquier familia, pero el panel
  solo los mostraba en Classic — un preset con Follow logo dejaba el spectrum
  clavado al logo sin control para soltarlo. Liquid además no tenía slider de
  Inner Radius pese a usarlo. Sin cambios de estado persistido.

### Lyrics: capas del bundle conectadas a la UI + catálogo de fuentes

- **Nueva sección "Capas del Bundle"** en la tab Lyrics: por cada capa del
  bundle de Lyrixa hay visible / posición X / posición Y / escala / opacidad /
  glow / blur / color de texto / color de glow, con reset por capa. El modelo
  `lyrixaLayerOverrides` ya existía y ambos renderers lo respetaban, pero
  **nada en el editor lo escribía** — por eso las capas quedaban congeladas
  donde Lyrixa las había dejado. Sin cambios de estado persistido (los
  overrides ya migraban), así que **no hay bump de `STORE_PERSIST_VERSION`**.
- **Position X/Y globales vuelven a mover las capas con `positionPreset`**: el
  preset del bundle ahora es solo el ancla base y el offset global se suma
  encima (antes el preset ganaba y los dos sliders parecían muertos).
- **"Líneas visibles" aplica también a bundles**: limita, por capa, cuántos
  clips simultáneos se dibujan (antes solo servía para lyrics de texto plano).
- **Honestidad en modo "Look de Lyrixa"**: la sección de estilo global se
  oculta tras un `FeatureGate` con explicación, porque ese modo dibuja el
  estilo exportado desde Lyrixa y ninguno de esos controles llegaba al canvas.
- **17 fuentes nuevas** (25 en total, compartidas con Track Title): Poster,
  Black, Modern, Geometric, Slab, Elegant, Cinematic, Futuristic, Racing,
  Stencil, Pixel, Terminal, Comic, Marker, Brush, Kawaii, Blackletter. Se
  empaquetan vía `@fontsource` y se precalientan en `ensureTrackFontsLoaded()`;
  cada botón del selector se previsualiza en su propia tipografía.

### Backend-ready: slots con identidad estable (store v103 → v104)

- **`ProfileSlot` gana un `id` estable** en todas las familias (spectrum ×2,
  logo, particles, rain, looks, lights, camera FX, track title, background).
  Los ids se generan al crear slots y la migración los acuña para todo slot
  existente.
- **Las escenas referencian slots por id, no por posición**: los campos de
  binding pasan de `*SlotIndex` (número) a `*SlotId` (id del slot). Reordenar
  o borrar slots ya no puede re-apuntar un binding de escena a otro slot — el
  prerequisito #1 para sincronización multi-dispositivo. Las referencias a
  slots borrados colapsan a `null` de forma segura.
- **Bindings per-image por id**: `logo/spectrum/particles/rain/looksProfileSlotIndex`
  → `*ProfileSlotId`, con la misma conversión.
- **Migración v104**: cada ref numérico legacy se traduce al id del slot que
  ocupaba esa posición (idempotente por construcción: un ref numérico solo
  puede venir de un save pre-v104).
- **Exports versionados**: el settings file ahora graba `storePersistVersion`
  y el import corre la cadena de migraciones del store desde esa versión —
  un archivo viejo importado hoy aterriza en el modelo actual (antes los
  settings files se normalizaban sin migrar).
- **`STORE_PERSIST_VERSION` 103 → 104**.

### Consolidación: poda de legacy + editor UX (store v102 → v103)

- **Motion bundles retirados**: los slots combinados de Motion
  (`motionProfileSlots`, particles + rain en un solo perfil) se eliminaron del
  producto. La migración **divide sin pérdida** cada slot guardado en entradas
  separadas de `particlesProfileSlots` y `rainProfileSlots` (mismo nombre) y
  elimina la key persistida.
- **Override per-image de Spectrum 2 retirado** (`spectrumSecondOverride`): la
  composición por imagen de Spectrum 2 ahora es exclusiva del flujo scene-first.
  La migración **preserva** cada override guardado como un slot con nombre
  (`S2 · <imagen>`) en `spectrumSecondProfileSlots` antes de eliminar la key.
- **Lyrics — UI de ajustes por capa Lyrixa eliminada**: los controles por capa
  (posición/color/escala/glow por layer del bundle) se quitaron del tab de
  Lyrics; el renderer sigue soportando bundles multi-capa y respeta overrides ya
  guardados. El toggle de modo de render (Nativo del Editor / Look de Lyrixa) se
  conserva y ahora está traducido.
- **Editor UX**: `SpectrumTab`/`LogoTab` usan el wrapper canónico `FeatureGate`;
  el cambio de sub-vista del Spectrum ahora cruza con `TabFade`; la persistencia
  de sub-vista de Spectrum/Logo/Track Info se unificó en el hook
  `useTabViewState`. Se tradujeron (en/es) los targets de Looks, modos de
  scanline, títulos de secciones del Spectrum, labels de overrides per-image y
  todo el panel per-image del HUD. `LegacyTabAdapter` y `MotionProfilesSection`
  (componentes muertos) se eliminaron.
- **`STORE_PERSIST_VERSION` 102 → 103**: conversión de Motion slots y overrides
  de Spectrum 2 descrita arriba; ambas keys legacy se eliminan del estado
  persistido.

### Liquid glass surfaces (store v100 → v102)

- **Reworked to a real edge lens (v102)**: the glass panel now leaves its
  **centre fully transparent** (the wallpaper shows through untouched) and only
  the **interior rim** refracts — it samples the background behind the border and
  draws it magnified, the way the lip of a real glass lens bends what's behind
  it. This removes the grey "frosted box" the full-panel version produced. The
  **Glass Magnify** slider now drives the edge-lens strength, **Glass Blur** the
  rim softness, and **Glass Tint** a light rim hue. Because the three values
  changed meaning they are **re-seeded once** for stores below v102.

- **macOS-style "liquid glass"** frosted/magnified panel behind three surfaces,
  each behind its own switch: the **Track Info / Now Playing** widget
  (`nowPlayingLiquidGlassEnabled`), the **Lyrics** block
  (`audioLyricsLiquidGlassEnabled`), and the floating **media HUD**
  (`hudLiquidGlassEnabled`). All default **off**.
- Canvas surfaces (lyrics, track info) sample the already-rendered wallpaper
  behind the panel and blur + slightly magnify it (`drawLiquidGlassPanel` in
  `components/audio/liquidGlass.ts`); the DOM HUD uses `backdrop-filter`.
- **Per-surface tuning (v101)**: each canvas surface gains **Glass Blur**,
  **Glass Magnify** and **Glass Tint** sliders
  (`nowPlayingLiquidGlass{Blur,Magnify,Tint}`,
  `audioLyricsLiquidGlass{Blur,Magnify,Tint}`) with macOS-like defaults. The
  tint **hue** reuses each surface's existing backdrop color, and geometry
  reuses the existing padding/radius. The **HUD** glass reuses the existing
  **Quick HUD Blur** and **Surface/Backdrop Opacity** sliders (its
  `backdrop-filter` now follows `--editor-shell-blur` instead of a fixed value).
- **`STORE_PERSIST_VERSION` 101 → 102**: backfills the new toggles/sliders and
  re-seeds the reworked glass tuning values onto older stores.

`STORE_PERSIST_VERSION` is at **107**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

### Spectrum S1→S2 setting bleed fix (store v99)

- **Defense-in-depth** in the S2 render path (`overlayLayerRegistry.ts`): the
  instance merge now layers `createDefaultSpectrumInstanceSettings()` between
  `responsiveState` (S1 flat values) and the raw `instance` object, so any key
  absent from a persisted instance falls back to its correct per-instance default
  instead of inheriting S1's value. Fixes `spectrumManualGlow`, `spectrumScale`,
  and `spectrumSpan` bleeding from Spectrum 1 to Spectrum 2.
- **`STORE_PERSIST_VERSION` 99**: re-runs `migrateSpectrumInstances` (which does
  `{ ...createDefaultSpectrumInstance(), ...instance }`) so the fix is also
  persisted permanently into localStorage for returning users.

`STORE_PERSIST_VERSION` is at **99**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

## [0.3.0-alpha.1]

### Scene-first model (backbone) + smooth image transition (FASE 0)

- **`defaultSceneSlotId`** (store v98): the scene applied to any image without an
  explicit `sceneSlotId`. Resolved at runtime via
  `resolveEffectiveSceneSlotId(image, state)` (explicit scene → default scene →
  base + legacy overrides) — images never copy the default id. Backfilled to null
  on old stores; carried in export/import + project-health validation.
- **Scene-first precedence** in `setActiveImageId`: an effective scene wins and
  legacy per-image overrides are ignored; overrides only apply when an image has
  no effective scene (back-compat fallback).
- **Scene actions:** `setDefaultSceneSlot` / `clearDefaultSceneSlot` (re-apply +
  transition the active image when it rides the default), `assignSceneToImage`,
  `setImageUseDefaultScene`, `duplicateScene`; `removeSceneSlot` now also clears a
  dangling default. Changing an image's effective scene emits a `visualTransition`.
- **UI:** new "Scene for this image" block (scene picker + default indicator +
  "Set as default" + legacy-overrides notice); per-image overrides reframed as
  legacy/back-compat. All strings i18n (en/es).
- **FASE 0 transition** (prior commit): overlay fade-in envelope on image/scene
  change (spectrum 1/2, particles, rain, logo) driven by `visualTransitionProgress`.

### Spectrum 2 independent slots + HUD shortcut layout

- **Independent profile slots per spectrum:** Spectrum 2 now owns its own
  `spectrumSecondProfileSlots` array — separate names, add/delete, and active
  indicator from Spectrum 1. The editor and HUD swap which array they show based
  on the active target. Save/load/add/remove route per target.
- **Persistence:** `STORE_PERSIST_VERSION` **97** — migration seeds
  `spectrumSecondProfileSlots` from the previously-shared slots so existing
  second-spectrum looks carry over with no data loss.
- **Export/Import:** project bundles now carry `spectrumSecondProfileSlots`
  (full replace on full export, additive merge on partial import).
- **Scenes ↔ Spectrum 2:** Scene slots gained an independent
  `spectrumSecondSlotIndex` (separate column in the Scene tab) so a scene can bind
  each spectrum to its own slot. A `null` ref keeps the back-compat behaviour
  where Spectrum 1's bundled portion drives the second instance; a set ref
  overrides just `spectrumInstances[0]`; `'off'` disables only the second
  spectrum. Wired through migration, export-strip, and project-health validation.
- **Per-image ↔ Spectrum 2:** Background images gained an independent
  `spectrumSecondOverride` (instance-only) with its own capture/clear — a
  "Spectrum 2" row in both the HUD per-image panel and the BG tab's per-image
  overrides. Applied on top of the Spectrum 1 override, composing onto
  `spectrumInstances[0]`, so an image can carry its own Spectrum 2 look. Wired
  through serialization and export-strip. (The pre-existing full `spectrumOverride`
  already snapshotted both spectrums; this adds independent S2-only control.)
- **HUD:** header quick-action shortcuts render in an auto-fit grid instead of a
  flex-wrap row, so the last button (Editor) no longer orphans onto a near-empty
  second line. Added an always-visible **S1/S2 target toggle** to the header row
  (shown when a second spectrum exists) so the active spectrum can be switched
  without opening the Spectrum panel.

### Output / Presentation / Recording (commits `287e007`, `2b85603`, `a53f6a8`)

- **Shared provider lifecycle:** `WallpaperAppProviders` mounts once above routes; audio continues across `#/edit` ↔ `#/present` without remounting `AudioDataProvider`.
- **Routes:** `#/edit`, `#/present`, `#/record`, `#/preview`; `#/editor` redirects to `#/edit`.
- **Output shell:** render-only viewport, recovery layer (`Ctrl+Shift+E`), cursor auto-hide policy, session output settings in Export → Live Output.
- **Real render scale (recording mode):** `outputRenderQuality.ts` scales 2D canvas backing and WebGL DPR (not CSS transform). Removed `OutputRenderScaleStage`.
- **Internal recorder hardening:** `preferCurrentTab` display capture, fullscreen after picker, disabled manual fullscreen during record, WebM VP9 preferred, clearer error strings (EN/ES).
- **Tests:** provider lifecycle, output render quality, display media options, runtime UI mode.

### Spectrum Pixel Art (commit `0bf9d914`)

- **Pixel shape:** Classic linear LED cell renderer (`drawLinearPixel`); radial falls back to bars.
- **Pixelate post-process:** Per-instance offscreen scene + down/upscale (`spectrumPixelate`, `spectrumPixelateScale`).
- **Persistence:** `STORE_PERSIST_VERSION` **96** — migration backfills pixelate keys; shape available in linear style list.
- **Helpers/tests:** `pixelArtHelpers.ts`, unit tests for scale, radial fallback, quantization.

### Documentation & tooling

- Added `docs/status/CURRENT_SYSTEM_STATUS.md`, `docs/architecture/OUTPUT_MODES.md`, `docs/features/SPECTRUM_PIXEL_ART.md`, `docs/features/SPECTRUM_ENGINE.md`, `docs/performance/PERFORMANCE_BASELINE.md`.
- Re-audited `docs/audits/RECORDING_SUBSYSTEM_AUDIT.md`.
- Added `pnpm docs:check` (`scripts/check-doc-consistency.mjs`) in CI.
- Archived superseded status snapshots to `docs/archive/`.

### Schema versions (current)

`STORE_PERSIST_VERSION` is at **98**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` remain at **1**. `APP_VERSION` / `package.json`: **0.3.0-alpha.1**.

---

## [0.3.0-alpha.1] — release hygiene (initial alpha tag)

Release-hygiene pass — aligns version references for first public alpha.

### Fixes

- **Spectrum tab crash** (`Cannot read properties of undefined (reading 'toFixed')`).
  The new `spectrumScale` setting shipped without bumping `STORE_PERSIST_VERSION`, so
  existing persisted state never ran the migration that backfills it and the Scale
  slider read `undefined`. Bumped the store version to **91** (migration now runs) and
  hardened `useSpectrumTargetSettings` to merge over defaults for both the Main and
  instance targets, so no missing key can leak `undefined` into the editor controls.
  Added a regression test asserting every `SPECTRUM_INSTANCE_SETTING_KEYS` entry has a
  default.

### Housekeeping

- Bumped `APP_VERSION` / `package.json` to `0.3.0-alpha.1`.
- Standardized on **pnpm** as the package manager; removed the stray
  `package-lock.json` (dual-lockfile cleanup).
- Updated `README.md` and `docs/README.md` to the current version, pnpm commands,
  and the new alpha scope doc; dropped stale `0.2.0` references.
- Added `docs/product/V1_ALPHA_SCOPE.md` freezing the alpha scope (in / out).
- Archived obsolete root drafts into `docs/archive/`
  (`PLAN.md`, `POLISH.md`, `SPECTRUM_ENGINE.md`, the Lights/Camera/Motion draft)
  and moved `ESTADO_PROYECTO_0_2_0.md` there.
- Removed development junk from the repo root (build `.zip`, exported settings JSON).

### Testing & tooling (Fase 3)

- Added **Vitest** with an isolated `vitest.config.ts` (Node env, no build plugins)
  and a dedicated `tsconfig.test.json`; `*.test.ts` are excluded from the app build.
- First **39 pure-logic tests**: `math`, `audioEnvelope`, version consistency
  (`APP_VERSION` ↔ `package.json`), and `resolveImageTransform` (fit modes, rotation
  extents, min-cover scale, keep-covered clamping/warnings, mirror-fill depth).
- New scripts: `test`, `test:run`, `test:types`.
- Formatted the entire repo with Prettier and cleared all ESLint **errors**
  (typed File System Access usages off `any`, `@ts-ignore` → typed input, removed an
  unused prop binding) so `lint` and `format:check` are green ahead of CI.

### CI (Fase 4)

- Added **GitHub Actions** workflow `.github/workflows/ci.yml` running on push to
  `main`, every pull request, and manual dispatch. Steps (pnpm via
  `pnpm/action-setup`, Node 22 with pnpm cache): `install --frozen-lockfile` →
  `format:check` → `lint` → `test:types` → `test:run` → `build`.
- Added a CI status badge to the README.

### Spectrum manual glow

- New opt-in **manual glow** for the classic `bars` and `wave` shapes (radial and
  linear). The fill keeps its color-source colors (rainbow / image / theme) while
  the glow is tinted by the two manual colors, **decoupled from `spectrumColorSource`**
  (the raw manual colors are carried to the renderer as runtime-only
  `spectrumGlowPrimary/SecondaryColor`), so it works in manual, image and theme alike.
- Three modes: **Core + Halo** (inner glow = primary, outer halo = secondary),
  **Gradient** (glow blends primary→secondary), **Glow + Peaks** (glow = primary,
  peak markers = secondary — offered for `bars` only, since `wave` has no peaks).
  Controls live in the Spectrum → Style panel; per-spectrum (Spectrum 1 and 2).
- When manual glow is on, the primary/secondary swatches stay editable even under the
  **Current Image / Theme** sources (shown under a "Glow colors" sub-label), so the
  glow colors no longer require switching back to Manual.
- Store persist version bumped to **93**. i18n en/es.
- **RGB split (chromatic aberration)** effect for the classic wave — an opt-in
  toggle + amount slider that re-strokes the trace with offset red/blue copies
  (additive blend) for a glitchy retro-CRT fringe. Cheap (~2 extra strokes/frame,
  Canvas-2D). On theme with the "anime glitch" identity.
- **Spiral family rework**: manual glow extended to spiral (core-halo / gradient
  modes) plus a lush additive **bloom halo** under the spine — the same premium glow
  that makes the classic wave appealing — and a subtle radial depth falloff on the
  dots. Opt-in via the manual glow toggle; off = unchanged.
- **Manual glow extended to all animated families** — spiral, oscilloscope, tunnel,
  liquid and orbital now honor the manual glow toggle. The fill keeps its color-source
  colors; the glow uses the manual colors (decoupled from the source). In Gradient mode
  the per-element glow blends primary→secondary across the shape. The oscilloscope —
  which had no bloom at all — now gets a real trace glow. All opt-in; off = unchanged.

### First-run experience (Fase 5)

- Added an inline **first-run empty state** over the wallpaper (editor only, not a
  modal) shown while no background image exists. Three golden-path CTAs: **Try a demo
  scene** (one click — generates a procedural gradient background and activates it;
  spectrum/particles are on by default so it reacts immediately), **Load image**, and
  **Load audio**. Dismissable for the session ("Start from blank") without a persisted
  flag, so no store migration. Fully internationalized (en/es).

## [0.3.0-alpha]

This release stabilizes a large wave of feature growth. `STORE_PERSIST_VERSION` is
at **82**; `PROJECT_SCHEMA_VERSION` and `SETTINGS_SCHEMA_VERSION` are at **1**.

### Editor / UI

- **Modern editor UI** with a `legacy | modern` variant switch and an isolated
  `editorTheme` resolver (branch-isolated palette, neutral image fallback, universal
  rainbow boost).
- **Simple / Advanced UI modes** — tabs collapse to essential controls in simple mode
  and reveal detailed controls in advanced mode.
- Design-system consolidation under `src/ui` (tokens + base components).

### Projects, Setlists & Scenes

- **Project / setlist system** — named curations of the global image pool with strict
  filtering when active, a Scene sub-tab, and a HUD chip.
- **Scene bindings are explicit** — edits do not auto-apply; empty slots render
  disabled and an explicit Apply with a visible diff is required.

### Background

- **Background transform model** — `Keep Screen Covered` is now independent from bass;
  a single `resolveCoveredImageTransform` helper drives both render and preview, and
  previews use the real screen aspect (WYSIWYG).
- **Mirror Fill** — minimal dynamic clones with a 1px seam overlap and Y-axis mirroring;
  `coverageActive = keepCovered && !mirrorFill`.

### Spectrum

- Spectrum **family improvements** across linear / radial / spiral / tunnel / orbital /
  liquid / oscilloscope renderers, including mirror handling.
- Time-domain pipeline (`getTimeDomainBins`) plumbed end-to-end with phosphor + grid FX.
- **Synthetic calibration** sprint — honest slider behavior, scope smoothing tied to
  scroll speed, spectrogram removed.
- **Manual spectrum control** — keyboard-driven spectrum (audio / max / add / manual
  modes) via a reusable runtime module.

### Stage FX (new)

- **Stage Lights** — directional concert beams from configurable edges, with sweep
  styles, audio reactivity (hold + decay envelope), gating, and blend modes.
- **Flash Light** — audio-peak impact overlay, independent from the beams, using a
  cached shape canvas and a decay-to-zero envelope.
- **Camera FX (Camera Motion)** — drift / circle / figure-eight / orbit / pendulum
  motion applied to marked visual roots only (HUD/editor stay fixed), with per-target
  selection.
- **Screen Shake** — horizontal / vertical / punch / jitter / kick-snap modes that
  trigger on audio peaks and decay back to rest.

### Audio

- **Multitrack playlist** system (playlist tracks, auto-advance on track end, mix UI).
- Background bass-zoom envelope with Classic / Smooth / Punchy presets.

### Import / Export

- Project-package import/export improvements, including partial imports that tolerate
  missing audio (shallow-merge path that avoids the `structuredClone` + Zustand-setter
  pitfall).

### Performance & safety caps

- Hard FX ceilings in `STAGE_FX_CAPS` / `CAMERA_FX_CAPS` so effects can never whiteout
  the screen or run unbounded blur (`maxBeamCount`, `maxBeamBlurPx`, `maxFlashOpacity`,
  `maxShakePx`, `maxMotionPx`, `maxScale`).
- Per-`performanceMode` budgets (`resolveStageLightsBudget`) that scale beam count and
  blur down on `low` / `medium`.
- **Stage Lights render audit (this release):** the beam loop now early-outs when the
  layer is effectively invisible (opacity/intensity 0 or audio-gated below threshold),
  parses the beam color once per frame instead of per gradient stop, and drops/softens
  the haze, core, and flare shadow-blur passes on `low` / `medium` performance modes.

### HUD / QuickActions

- Added on/off toggles for **Stage Lights, Flash Light, Camera FX, Screen Shake** to the
  Motion quick-actions group, plus **Keep Covered** and **Mirror Fill** (background
  transform) to the Looks group — all wired to existing store flags.
- Fully internationalized the QuickActions HUD under the `qa_*` key namespace (every chip
  label + tooltip, both EN/ES); builders now take the active translations object.

### Notes / known debt

- Stage Lights gradients are still re-created each frame because beam geometry changes
  per sweep; an offscreen gradient/mask cache is a larger architectural change deferred
  past this sprint.
