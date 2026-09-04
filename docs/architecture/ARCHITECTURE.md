# Arquitectura — el contrato

> **Qué es este documento.** No describe cómo está el código; describe cómo
> **tiene que** estar. Cuando el código y este documento no coinciden, gana este
> documento y el código es deuda.
>
> Para "¿dónde edito X hoy?" usá
> [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) — ése es el mapa descriptivo.
> Para "¿dónde va lo nuevo?" y "¿qué puede importar qué?", usá éste.
>
> Verificado contra el árbol el **2026-09-03**: 604 archivos, ~135k LOC,
> 2.484 imports, **22 aristas de deuda y 0 ciclos de runtime**.
> Lo verifica `pnpm architecture:check` en CI.

---

## 1. El sistema en 60 segundos

LiveWallpaperAnimeGlitch es un **editor de escenas audiovisuales dirigido por un
documento de escena central**. Cinco flujos y ya lo entendés:

**1 · Arranque**

```
main.tsx → App.tsx → ruta (#/edit | #/present | #/preview)
         → pages/*Page.tsx → components/app/ (providers) → viewport
```

**2 · Estado → píxeles**

```
UI (components/controls/) ──acciones──▶ store/ (Zustand)
                                          │
                                   lib/layers.ts  (estado → capas)
                                          │
                             components/wallpaper/ (compositor)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                 DOM/CSS             Canvas 2D              WebGL/R3F
                (overlays)        (imagen, audio)      (partículas, shaders)
```

Tres backends de render conviven **a propósito**: cada capa usa el más barato
que le sirve. Es la razón principal de que debuggear visual sea difícil — antes
de tocar algo, averiguá en qué backend vive.

**3 · Audio**

```
Desktop ─┐
Micro    ├─▶ IAudioSourceAdapter ─▶ analyser ─▶ bins / bands / amplitude
MP3      ─┘                                          │
                                            spectrum · logo · FX · lyrics
```

El spectrum **no sabe** de dónde vino el sonido. Ésta es la mejor abstracción
que ya tiene el proyecto; protegela.

**4 · Persistencia**

```
CONFIGURACIÓN → localStorage (Zustand persist, versionado)
ASSETS        → IndexedDB    (imágenes, audio, binarios)

persist → cerrar → abrir → migrate → rehydrate → restore assets → render
```

Toda key persistida nueva **obliga** a bumpear `STORE_PERSIST_VERSION` y a
escribir su migración. Sin eso queda `undefined` en producción y sólo se nota en
build, no en dev.

**5 · Escena**

`defaultSceneSlotId` + `resolveEffectiveSceneSlotId`: la escena efectiva gana
sobre los overrides por imagen (que son legacy). Las escenas se aplican
**explícitamente**, nunca por efecto lateral de editar.

---

## 2. Zonas y dirección de dependencias

`src/` tiene zonas. La primera carpeta bajo `src/` **es** la zona. Las flechas
apuntan hacia abajo y nunca hacia arriba.

```
  ┌──────────────────────────────────────────────┐
  │ app       App.tsx · main.tsx · pages/        │  ← rutas y shells
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ ui-layer  components/ · hooks/ · context/    │  ← React, presentación,
  │           runtime/                           │    orquestación
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ state     store/                             │  ← el documento de escena
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ domain    features/*                         │  ← motores por dominio
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ chrome    editor/                            │  ← muebles del editor,
  │                                              │    conectados al store
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ base      lib/ · ui/ · types/ · config/      │  ← hojas: sin React de
  │           utils/ · shaders/                  │    producto, sin store
  └──────────────────────────────────────────────┘

  dev/  vive fuera del grafo: sólo App.tsx puede montarlo (rutas lazy).
```

**Por qué existe `editor/`.** Se estaban confundiendo dos cosas. `ui/` es el
design system: presentación pura, no sabe que este producto existe, se podría
llevar a otra app tal cual. Pero el editor tiene muebles propios —el gate
simple/avanzado, el servicio de diálogos de confirmación, el slider atado a los
defaults de fábrica, el resolvedor de tema— que **necesitan el store**, así que
no pueden vivir en `ui/`, y que usan todos los tabs, así que tampoco pueden
vivir en un dominio. Esa zona faltaba, y su ausencia era exactamente lo que
impedía mover la UI de cada dominio a su carpeta.

`editor/` es la única zona que `features/*` puede importar hacia arriba, y es a
propósito: así un dominio puede ser dueño de su panel del editor sin tocar
`components/`.

### Tabla de reglas (esto es lo que verifica el script)

| Zona                | NO puede importar                                                            | Por qué                                                                   |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `types/`            | todo lo demás                                                                | Es el vocabulario. Si depende de algo, deja de ser vocabulario.           |
| `config/`, `utils/` | `features` `components` `store` `context` `runtime` `pages` `hooks` `lib`    | Helpers de hoja. Reusables en aislamiento o no sirven.                    |
| `ui/`               | `components` `features` `store` `context` `runtime` `pages` `editor`         | Design system. **No debe saber que este producto existe.**                |
| `editor/`           | `components` `features` `context` `runtime` `pages`                          | Chrome compartido. Ve el store, nunca un dominio ni la app.               |
| `lib/`              | `components` `context` `runtime` `pages` `hooks` `store` `features` `editor` | Lógica y persistencia agnósticas de dominio.                              |
| `features/*`        | `components` `pages`                                                         | Un motor que importa su propia UI no se puede reusar ni testear headless. |
| `store/`            | `components` `context` `runtime` `pages` `hooks` `ui`                        | El estado posee datos, no presentación. **Ya está en cero — mantenelo.**  |
| `dev/`              | (nadie lo importa salvo `App.tsx`)                                           | Laboratorios, no producto.                                                |

**Ciclos en tiempo de ejecución: prohibidos.** Los ciclos sólo de tipos
(`import type`) los borra el compilador y no rompen nada, pero igual son señal
de que el vocabulario está mal repartido.

---

## 3. Ownership: una feature es dueña de lo suyo

Ésta es la regla que más le falta al proyecto hoy, y la que más va a cambiar la
sensación de "no encuentro nada".

**Un dominio = una carpeta.** Cuando alguien pregunte "¿dónde vive Spectrum?",
la respuesta debe ser una ruta, no un párrafo.

```
features/<dominio>/
├── index.ts          ← FACHADA DEL MODELO. Sin React, sin store.
├── render.ts         ← (opcional) el camino de dibujo en canvas
├── ui.ts             ← (opcional) la superficie React del dominio
├── domain/           ← modelo, tipos, invariantes (puro)
├── runtime/          ← motor: cálculo por frame, hidratación de perfiles
├── renderers/        ← dibujo (canvas2d / webgl / dom)
├── effects/
├── controls/         ← la UI del editor de ESTE dominio
├── presets/
└── *.test.ts
```

Tres reglas:

1. **Toda feature necesita fachada.** Nadie de afuera importa un archivo
   interno. Así el interior se puede reordenar sin reescribir medio repo.
2. **La UI del dominio se muda al dominio.** `features/X` puede contener React;
   lo que no puede es importar `components/`.
3. **Un dominio puede tener más de una entrada, pero sólo entradas.**
   Y la separación NO es cosmética — ver abajo.

### 3.1 · Por qué las fachadas se parten en tres

Ésta es la lección más cara de la migración, y las dos mitades se descubrieron
rompiendo cosas, no razonando:

- Poner el **tab del editor** en `index.ts` hizo que `lib/featureProfiles` —que
  sólo quiere unos defaults puros— arrastrara el árbol de componentes entero a
  su grafo de módulos. Inicialización circular: **18 suites reventaron al
  importar**, con `DEFAULT_STATE` en `undefined`.
- Poner **`drawSpectrum`** en `index.ts` metió al `store/` en un ciclo consigo
  mismo, porque el renderer lee política de render (`performanceMode`) del
  store: `store → slice → barrel de spectrum → CircularSpectrum → store`.

De ahí las tres entradas, definidas por **quién consume qué**:

| Entrada    | Contiene                             | Quién la importa                     |
| ---------- | ------------------------------------ | ------------------------------------ |
| `./index`  | el modelo. Sin React **y sin store** | `lib/`, `store/`, migraciones, tests |
| `./render` | el camino de dibujo en canvas        | capas del wallpaper, exportador      |
| `./ui`     | la superficie React                  | los shells del editor                |

Regla práctica: **si un módulo alcanza el store, no va en `./index`.** Se
verifica igual que todo lo demás — el ciclo de runtime hace fallar
`architecture:check`.

Corolario incómodo pero honesto: `lib/constants.ts`, `lib/featureProfiles.ts` y
`features/scenes/sceneSlot.ts` importan módulos **profundos** de spectrum a
propósito, saltándose la fachada.

**Resuelto (2026-09-03).** La causa raíz era que la porción spectrum de
`DEFAULT_STATE` vivía en `lib/` en vez de en el dominio. Ahora el dominio es
dueño de sus defaults (`features/spectrum/domain/spectrumDefaults.ts`),
`lib/constants` los compone en una sola dirección, y los siete imports profundos
son dos aristas normales de fachada. El ciclo desapareció.

Nota: `./render` **no** se fundió de vuelta en `./index`, aunque el ciclo que lo
originó ya no existe. La razón que sobrevive es el peso: `renderers/`,
`geometry/` y `effects/` son ~6.800 LOC que necesitan 7 call sites, mientras
`./index` lo importan 21 — incluido `lib/constants`, que importa medio proyecto.
Fundirlos haría que todo consumidor de `DEFAULT_STATE` cargue el renderer, que
es exactamente el barrel gordo que rompió 18 suites. El split es **por
consumidor**, no por accidente.

### El estado hoy (2026-09-03)

| Dominio        | Motor + UI en su carpeta | Fachada | Estado                                         |
| -------------- | -----------------------: | :-----: | ---------------------------------------------- |
| **spectrum**   |       80 arch · ~18k LOC |  ✅ ×3  | **migrado** — index + render + ui              |
| **background** |      37 arch · ~8,4k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **lyrics**     |      16 arch · ~3,9k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **stageFx**    |      12 arch · ~2,7k LOC |  ✅ ×1  | **migrado** — sólo ui (ver abajo)              |
| **logo**       |      10 arch · ~1,7k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **particles**  |       4 arch · ~1,4k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **rain**       |        2 arch · ~340 LOC |  ✅ ×1  | **migrado** — sólo ui (no tiene modelo propio) |
| **export**     |      16 arch · ~2,0k LOC |    —    | 12 arch de UI todavía en `tabs/export/`        |

`components/controls/tabs/` bajó de **31.640 a 15.119 LOC** — menos de la mitad.
Lo que queda ahí es `export` y los _shells_ de composición (`MotionTab`,
`LayersTab`, `SceneTab`…), que sí pertenecen al editor.

**`features/motion/` ya no existe.** Nunca fue un dominio: era el nombre de una
pestaña que apilaba cuatro cosas distintas. Se repartió en `particles`, `rain`
y `stageFx` (§6.4).

**Por qué `stageFx` y `rain` no tienen `index.ts`:**

- `rain` no tiene todavía nada de modelo puro — lo que no es UI es estado del
  store o `components/wallpaper/RainLayer`, que es una capa registrada del motor
  de escena. Cuando aparezca lógica pura, se agrega el `index.ts` y se deja React
  afuera.
- `stageFx` sí tiene modelo (`stageFxConfig.ts`), pero lo importan **~80
  posiciones de tipo inline** `import('...')` desde `types/wallpaper.ts` y
  `store/wallpaperStoreTypes.ts`. Pasarlas por una fachada sería churn sobre
  declaraciones que se borran en build, y tener dos caminos para el mismo
  vocabulario es peor que uno solo claro. Queda deep-import a propósito.

---

## 4. Árbol de decisión: "¿dónde pongo esto?"

```
¿Es un tipo compartido por varios dominios?               → types/
¿Es un token, primitiva visual o control genérico?        → ui/
   (si necesita el store o un dominio, NO va en ui/)
¿Es matemática / formato / helper sin dominio?            → lib/  o  utils/
¿Pertenece a UN dominio? (spectrum, lyrics, background…)  → features/<dominio>/
   ├─ ¿dibuja?                     → features/<d>/renderers/
   ├─ ¿calcula por frame?          → features/<d>/runtime/
   ├─ ¿es el modelo/las reglas?    → features/<d>/domain/
   └─ ¿es el panel del editor?     → features/<d>/controls/
¿Es estado global persistido?                             → store/slices/
   └─ ¿key nueva? → bumpear STORE_PERSIST_VERSION + migración. Sin excepción.
¿Es composición de la escena completa?                    → components/wallpaper/
¿Es shell, ruta o provider?                               → pages/ · components/app/
¿Es un laboratorio o harness?                             → dev/
```

Si dudás entre dos, elegí **la más abajo** en la pila. Bajar después es fácil;
subir rompe a todos los que ya lo importaban.

---

## 5. Deuda congelada

`pnpm architecture:check` tolera exactamente estas violaciones y **ninguna
más**. La lista sólo puede achicarse; si borrás una y no la sacás del baseline,
el check también falla.

| Grupo                            | Aristas | Qué la causa                                                                                              |
| -------------------------------- | ------: | --------------------------------------------------------------------------------------------------------- |
| `types/` → dominios              |       5 | `types/wallpaper.ts` usa `import('...').Foo` inline. Sólo tipos: **se borra en build**, no es ciclo real. |
| `lib/` → `store` / `hooks`       |       5 | `projectSettings`, `i18n`, `wallpaperPersistenceCoordinator` son servicios de app, no librería.           |
| `lib/` → `features/`             |       6 | `lib/constants.ts` y `lib/featureProfiles.ts` arman `DEFAULT_STATE` a partir de los dominios.             |
| `features/export` → `components` |       5 | El render offline reusa `audioLayerFrameRenderer` de la UI viva.                                          |
| `editor/` → `features/stageFx`   |       1 | `MotionSharedControls` lleva un control de stageFx dentro — y **no lo importa nadie** (§7.2).             |
| **Total**                        |  **22** | 0,9 % de las aristas del grafo.                                                                           |

**Ciclos de runtime conocidos: 0.** ✅

El último (`lib/constants → lib/featureProfiles → spectrumProfileHydrate →
lib/constants`) murió cuando el dominio spectrum se quedó con sus propios
defaults. `KNOWN_CYCLES` está vacío en el script, y la idea es que siga así: si
vas a agregar una entrada ahí, mové los valores compartidos al dominio en vez.

Resueltos: el ciclo del barrel `@/ui` (los tres widgets conectados se movieron a
`editor/`) y las 4 aristas `ui/` → producto que lo causaban; los 7 imports
profundos de `lib/` a spectrum; las 3 aristas de background (dos se mudaron
adentro del dominio, y `lib/backgroundTransform.ts` —un shim de 5 líneas que no
importaba nadie— se borró).

> **Lectura honesta:** la dirección de dependencias está **casi bien** — 22
> aristas malas sobre 2.484 imports. El problema nunca fue acoplamiento
> descontrolado sino **dispersión de ownership** (§3). Por eso el plan no es
> reconstruir: es mudar cada dominio a su carpeta.

---

## 6. Plan de migración

Sin features nuevas mientras esto corre.

| Fase                        | Qué                                                                                                          | Estado    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | --------- |
| **1 · Arqueología**         | Grafo real, imports cruzados, ciclos, dispersión por dominio.                                                | ✅ hecho  |
| **2 · Contrato**            | Este documento.                                                                                              | ✅ hecho  |
| **3 · Guardrail**           | `scripts/check-architecture.mjs` + `pnpm architecture:check` con baseline congelado.                         | ✅ hecho  |
| **4a · Zona `editor/`**     | Extraer el chrome compartido (§2). Desbloqueó todo lo demás.                                                 | ✅ hecho  |
| **4b · Fachadas**           | `logo`, `spectrum`, `lyrics` con fachada. Faltan 14 features.                                                | en curso  |
| **4c · Migración vertical** | **`logo`, `spectrum` y `lyrics` ✅ hechos** (§6.1 es la plantilla). Siguen `background`, `motion`, `export`. | en curso  |
| **5 · Simplificación**      | Borrar lo muerto y resolver las ambigüedades de §8.                                                          | pendiente |

**Reglas de la migración**

- Un dominio por PR. Nunca dos en paralelo.
- Mover archivos **sin editar su contenido** en un commit; arreglar imports en
  otro. Así el diff es legible y `git log --follow` sobrevive.
- `pnpm architecture:check` verde antes y después de cada paso.
- Cada dominio migrado tacha sus líneas del baseline.

### 6.1 · La plantilla: cómo se migró `logo`

Se eligió `logo` de ensayo y no `spectrum` porque `spectrum` son 14k LOC de las
que depende todo lo demás: si el patrón falla ahí, el costo es enorme.

**Antes** — 6 archivos en 4 zonas distintas:

```
features/logo/logoPositionGrid.ts                       (132 LOC)
components/audio/ReactiveLogo.ts                        (242)  ← el motor
components/wallpaper/LogoDiagnosticsHud.tsx             (155)
components/wallpaper/quickActions/QuickActionsLogo…tsx  (209)
lib/debug/logoDiagnosticsTelemetry.ts                    (65)
features/presets/logoProfiles.ts                         (55)
```

**Después** — un dominio, una carpeta, una puerta:

```
features/logo/
├── index.ts                                    ← la fachada
├── domain/logoPositionGrid.ts (+ .test.ts)
├── runtime/ReactiveLogo.ts
├── presets/logoProfiles.ts
├── diagnostics/logoDiagnosticsTelemetry.ts
├── diagnostics/LogoDiagnosticsHud.tsx
└── controls/QuickActionsLogoPositionGrid.tsx
```

**Los pasos, en este orden:**

1. Inventariar el dominio (`find -iname '*logo*'`) y listar **todos** los
   importadores antes de tocar nada.
2. Revisar qué importa cada archivo. **El que importa `components/` no se puede
   mover todavía** — moverlo crearía una violación nueva.
3. `git mv` puro, sin editar contenido.
4. Reescribir las rutas de import en los importadores.
5. Escribir `index.ts` con la superficie pública real (mirar los `export` de
   cada módulo, no adivinar).
6. Redirigir a los importadores externos a la fachada; los internos usan rutas
   relativas — un archivo del dominio **nunca** importa su propia fachada.
7. `npx tsc -b`, después `pnpm architecture:check`, después el resto.
8. Tachar del baseline las líneas que la migración eliminó.

**Resultado:** 12 sitios de import actualizados, deuda 39 → 37 aristas (el
render offline de `features/export` ya no baja a `components/audio` a buscar el
logo), 0 violaciones nuevas, 982 tests verdes.

**Trampas que aparecieron** (van a repetirse en los otros dominios):

- Un `sed` masivo hizo que los archivos internos importaran su propia fachada
  → ciclo. Excluir la carpeta del dominio al reescribir imports.
- `LogoDiagnosticsHud` y `QuickActionsLogoPositionGrid` eran `export default`;
  la fachada los expone como **named**. Hay que arreglar cada sitio de import.
- Buscar por nombre da falsos positivos: `logoDiagnosticsHud` también es una key
  del store. Filtrar por `from '...'`, no por el nombre suelto.

**Lo que quedó fuera en la primera pasada:** `LogoTab.tsx` (769 LOC), porque
dependía del chrome compartido. Al crear `editor/` (§2) dejó de estar bloqueado
y se movió. `store/slices/logoSlice.ts` se queda en `store/` — correcto por §2.

### 6.2 · `spectrum` y `lyrics` (2026-09-03)

Mismo procedimiento, dos escalas distintas.

**spectrum** — 46 archivos movidos en dos pasos: primero la UI
(`tabs/spectrum/**` + `SpectrumTab` + los 3 HUD + `CircularSpectrum`), después
los 24 archivos sueltos de la raíz del dominio a `domain/` y `presets/`.
Resultado: `features/spectrum/` con 10 subcarpetas y tres fachadas.

**lyrics** — 16 archivos. `LyricsOverlay.ts` (1.334 LOC) vivía en
`components/audio/`; los helpers de texto en canvas que compartía con
TrackTitle (`trackTextTreatment`, `textRenderCache`, `trackFonts`,
`trackTitleOptions`) eran genéricos y bajaron a `lib/canvasText/`.

**Trampas nuevas** (además de las de §6.1):

- El codemod reescribe las aristas que **entran** a un archivo movido, pero no
  las rutas relativas que **salen** de él hacia archivos que no se movieron.
  Rompió 9 imports en spectrum. Hay un `fix_relatives` para eso; correlo
  siempre después de mover.
- Dos tests leen archivos fuente **por ruta**, no por import
  (`spectrumHudTarget.test.ts`, `spectrumPanelKeyCoverage.test.ts`). Ningún
  codemod los arregla: hay que editar los literales a mano.
- La partición de fachadas de §3.1 se descubrió acá, a los golpes.

### 6.3 · Cierre de spectrum (2026-09-03)

Los dos ítems que quedaban del dominio más grande, hechos antes de las mudanzas
grandes — a propósito: **primero se aprieta el guardrail, después se mueve**.

**Defaults al dominio.** `DEFAULT_SPECTRUM_STATE` ahora vive en
`features/spectrum/domain/spectrumDefaults.ts` y `lib/constants` lo _compone_ en
una sola dirección. Eso mató el último ciclo de runtime y colapsó 7 imports
profundos en 2 aristas de fachada.

> Hallazgo del camino: **ocho keys de rotación de spectrum estaban tiradas al
> final de `DEFAULT_STATE`**, bajo un título "Task 1", a ~140 líneas del
> `spectrumRotationSpeed` que modifican. Nadie las iba a encontrar ahí. Ahora
> están con el resto.

**El renderer ya no lee el store.** `drawSpectrum` recibe un
`SpectrumRenderPolicy` en vez de llamar a `useWallpaperStore.getState()`. Nada
bajo el camino de dibujo importa `store/`, así que el renderer es una función
pura de sus argumentos y el exportador offline puede elegir su propia calidad sin
tocar el estado vivo.

**`render.ts` se queda igual.** El plan decía fundirlo de vuelta en `index.ts`,
pero al hacer el trabajo quedó claro que el ciclo era sólo _una_ de sus dos
razones. La otra —el peso— sigue viva. Ver §3.1.

### 6.4 · `background` y `motion` (2026-09-03)

**`background`** siguió la plantilla de §6.1 sin sorpresas: 36 archivos, con
`domain/` (la matemática de encuadre), `slideshow/` (playback + el controlador
montado) y `controls/` (las 28 pantallas de `tabs/bg/`). Tres aristas de deuda
desaparecieron en vez de mudarse.

Lo interesante fue **lo que decidí no mover**, porque es la parte que se olvida:

| Candidato                                       | Por qué se queda afuera                                                                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallpaper/layers/imageCanvasBackground*`       | Dibujan el fondo, pero son _plugins_ del motor de capas (`imageCanvasShared`), que también sirve a los overlays. Moverlos cambia una arista `components → features` por una `features → components`. |
| `lib/backgroundPalette`, `useBackgroundPalette` | Se llaman "background" pero 18 y 10 módulos los usan como **fuente de color**, desde stageFx hasta lyrics. Infraestructura compartida, no estado del dominio.                                        |
| `lib/backgroundImages`                          | Sí pertenece al dominio, pero cuatro de sus consumidores cuelgan de `lib/projectSettings`, que ganaría una arista nueva. Bloqueado hasta que ese módulo salga de `lib/`.                             |

**`motion` se repartió, no se movió.** Nunca fue un dominio: era el nombre de una
pestaña que apilaba partículas, rain, stage lights y camera fx. Cada sección se
fue a su dueño real y `features/motion/` dejó de existir. Su único archivo,
`motionRandomizer.ts`, era en realidad un randomizador de **partículas** — su
propio comentario dice que rain y stage FX quedan intactos.

`MotionTab.tsx` se queda en `tabs/main/`: una pestaña que compone tres dominios
es un _shell_, no un dominio, y ahora trae cada sección por la fachada de su
dueño. Esa es la regla general para las pestañas que quedan ahí.

### 6.5 · Lo que sigue

1. **`export`** — último dominio grande sin fachada: 12 archivos de UI en
   `tabs/export/` y 5 aristas `features/export → components`.
2. **Sacar `projectSettings` y `wallpaperPersistenceCoordinator` de `lib/`** —
   son servicios de aplicación, no librería. Desbloquea mudar
   `lib/backgroundImages` al dominio y limpia 5 aristas más.
3. **`DEFAULT_STATE` fuera de `lib/`** — la última causa de `lib/ → features/`.
   `lib/constants` y `lib/featureProfiles` son "el estado por defecto de la app
   entera", que es rol de `config/` o `store/`, no de una librería pura.
4. **Decidir sobre §7** — hay ~2.200 LOC muertas confirmadas esperando el OK.

---

## 7. Hallazgos: UI desconectada y ambigua

Auditoría del 2026-09-03 sobre el grafo real. **Nada de esto se tocó** — es
material para decidir despierto.

### 7.1 · Edge Glow: un subsistema entero inalcanzable

Lo más serio que apareció. Existe un "Edge Glow" completo que **nada puede
alcanzar**, reemplazado en su momento por "Flash Edge":

| Pieza                                            |     LOC | Estado                           |
| ------------------------------------------------ | ------: | -------------------------------- |
| `features/edgeGlow/controls/EdgeGlowSection.tsx` |     357 | nadie la monta                   |
| `features/edgeGlow/edgeGlowRenderer.ts`          |     317 | nadie la llama                   |
| `bgEdgeGlow*` / `logoEdgeGlow*`                  | 28 keys | **persistidas** en cada proyecto |
| setters correspondientes                         |      56 | nadie los invoca                 |
| `sfx_edge_glow_*` en i18n                        |  7 keys | sin referencia                   |

Lo que sí vive: `flashEdgeRenderer` + `FlashEdgeSection` (otra cosa), y
`layer.edgeGlow`, un número por capa que `OverlayImageLayerView` sí lee. No
confundirlos.

**Y hay un control que miente al usuario.** `AudioRoutingSection` —panel vivo—
lista una fila "BG Edge Glow" cuyo estado activo sale de `bgEdgeGlowEnabled`, y
manda al usuario al tab Presets. Ese flag no lo puede encender ninguna UI viva y
ningún renderer lo lee: la fila **siempre** está inactiva y apunta a un control
que no existe.

### 7.2 · Archivos que nadie importa (~2.000 LOC)

Verificados uno por uno contra todo el repo:

| Archivo                                                           | LOC |
| ----------------------------------------------------------------- | --: |
| `features/background/controls/TimestampTimeline.tsx`              | 411 |
| `features/edgeGlow/controls/EdgeGlowSection.tsx`                  | 357 |
| `features/edgeGlow/edgeGlowRenderer.ts`                           | 317 |
| `components/controls/PresetSelector.tsx`                          | 204 |
| `lib/sync/remoteSyncRepository.ts`                                | 174 |
| `features/export/offlineAudioLayerRenderer.ts`                    | 163 |
| `components/audio/AudioOverlay.tsx`                               | 125 |
| `features/export/runOfflineRenderTest.ts`                         |  98 |
| `lib/textures.ts`                                                 |  75 |
| `components/controls/ImageUploader.tsx`                           |  43 |
| `components/controls/tabs/audio/AudioTabSections.tsx`             |  36 |
| `features/spectrum/effects/spectrumDrawOrder.ts`                  |  26 |
| + `discovery/constants`, `discovery/recentIds`, `spectrumFxTypes` | ~18 |
| **`editor/MotionSharedControls.tsx`** ← nuevo, confirmado         | 225 |

Ojo con dos: `offlineAudioLayerRenderer` y `runOfflineRenderTest` son del
exportador offline — puede ser andamiaje a medio terminar y no basura. Decidir
antes de borrar.

**`lib/backgroundTransform.ts` ya no está en la lista: se borró** durante la
mudanza de `background` (§6.4). Eran 5 líneas de re-export con cero importadores.

**`editor/MotionSharedControls.tsx` (225 LOC) es el caso más claro de todos.**
Ya estaba marcado como duplicado de `editor/advancedControls`; ahora está
confirmado con **cero importadores en todo el repo**, ni directos ni por la
fachada `@/editor`. Además es la **única causa** de la arista de deuda
`editor/ → features/stageFx` (§5): borrarlo la elimina sola. No lo toqué porque
§7 es material para que decidas vos, pero de la lista entera éste es el que
menos riesgo tiene.

### 7.3 · Estado persistido que nadie usa

Keys en `DEFAULT_STATE` que **ni la UI escribe ni ningún renderer lee**:

- `particleScanlineIntensity` / `Spacing` / `Thickness` — el efecto scanline
  **sobre partículas** no existe; `ParticleField.tsx` no menciona scanlines.
  Sí existen las scanlines de _Looks_ (`scanlineIntensity` sin prefijo), que
  están vivas y son otra cosa. Estas 3 viajan en cada preset guardado.
- `performanceModeBeforeSafe` — sólo en los defaults de fábrica.
- `audioSelectedChannelSmoothing` — sólo aparece en un comentario.
- `quickEditHudEnabled` — sólo listada en `workspaceKeys`. (`quickEditCaptureMode`
  sí se usa.)

### 7.4 · Ambigüedades

1. **`imageBassZoomPresetId` es de sólo escritura.** El store lo mantiene con
   cuidado —lo pone en `null` en cuanto tocás cualquier knob relacionado, lo
   setea al aplicar un preset— pero **nadie lo lee nunca**. `BgZoomAudioSection`
   no marca cuál de los 3 presets está activo. El usuario no tiene forma de
   saberlo, y el store hace contabilidad para una UI que no existe.
2. **`editor/advancedControls` y `editor/MotionSharedControls` exportan los
   mismos controles** — `OptionButtonGroup`, `SwitchRow`, `ProfileSlotsGrid`,
   dos veces. **Resuelto a medias por accidente:** al medirlo esta sesión resultó
   que `MotionSharedControls` no lo importa nadie (§7.2), así que no hay tabs
   usando dos versiones distintas — hay una versión viva y una copia muerta.
   Borrarla cierra el punto.
3. **167 de 1.750 keys de i18n sin referencia directa.** Incluye `ai_btn_cancel`
   (el botón de cancelar del AI Director que nunca se cableó), los 7
   `sfx_edge_glow_*` de §7.1 y 12 `spectrum_clone_*` del refactor clone→instancia.
   Caveat: no cubre accesos dinámicos tipo `t[variable]`; verificar antes de borrar.
4. **`pnpm lint` está rojo** por 2 errores previos en `AiDirectorPanel.tsx`: el
   icono `X` y `handleCancelAsk()` existen pero el botón nunca se renderizó. La
   cancelación de una petición al modelo está implementada y es inalcanzable.

5. **`stageFxConfig.ts` es dueño de vocabulario que no es suyo.**
   `SpectrumRotationDrive`, `SpectrumRotationChannel` y `RotationDirection` son
   de spectrum, pero viven en la config de stage FX y los importan `types/`,
   `store/`, spectrum y edgeGlow. No es urgente —son tipos, se borran en build—
   pero explica por qué `stageFx` no tiene `index.ts`: ese módulo es vocabulario
   compartido disfrazado de dominio.

Bueno: **`en.ts` y `es.ts` tienen paridad exacta** (1.750 keys cada uno).

---

## 8. Cómo se verifica

```bash
pnpm architecture:check   # límites de zona + ciclos de runtime
pnpm structure:check      # naming legacy (no vuelve "modern"/"v2")
pnpm docs:check           # drift de documentación
```

`architecture:check` falla si:

1. aparece una arista de zona prohibida que no está en el baseline;
2. aparece un ciclo de runtime nuevo;
3. una entrada del baseline ya no existe (hay que borrarla);
4. falta este documento.

Para agregar una zona o cambiar una regla se edita `FORBIDDEN` en
`scripts/check-architecture.mjs` **y** la sección 2 de este documento. Las dos
cosas o ninguna.
