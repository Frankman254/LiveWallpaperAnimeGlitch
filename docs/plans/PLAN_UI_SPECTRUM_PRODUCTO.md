# Plan de Implementacion: UI, Spectrum, Filtros y Animaciones

> Estado del documento: **plan maestro historico** (base de trabajo por fases).
> Para seguimiento ejecutado por fase, ver `docs/status/PROGRESS_SPECTRUM_2026.md`.
> Para estado global actual, ver `docs/ESTADO_PROYECTO_0_2_0.md`.

## Objetivo

Llevar `LiveWallpaperAnimeGlitch` desde un editor tecnico con muchas opciones a un producto con identidad visual fuerte, presets memorables, escenas mas variadas y una UX que guie mejor al usuario.

La meta no es solo agregar sliders. La meta es:

- ampliar las familias visuales reales del spectrum
- introducir memoria visual entre frames y transiciones mas ricas
- convertir filtros y animaciones en "looks" y "escenas"
- reorganizar la UI para que primero inspire y luego permita profundizar
- mantener el rendimiento bajo control

---

## Contexto actual del proyecto

### Lo que ya existe y vale la pena conservar

- `src/components/controls/tabs/FiltersTab.tsx`
  - ya tiene pipeline base de filtros globales: opacity, brightness, contrast, saturation, blur, hue rotate, RGB shift, noise, scanlines y reaccion al audio
- `src/components/controls/tabs/ParticlesTab.tsx`
  - ya tiene sistema util de particulas con color, glow, scanlines y audio reactivity
- `src/components/controls/tabs/OverlaysTab.tsx`
  - ya permite una composicion por capas bastante flexible
- `src/components/controls/tabs/bg/constants.ts`
  - ya tiene varias transiciones de slideshow
- `src/components/controls/tabs/SpectrumTab.tsx`
  - ya tiene muchos controles, perfiles y randomizer
- `src/components/audio/CircularSpectrum.ts`
  - ya tiene un renderer capaz con radial, linear, glow, peak hold, wave fill y color modes
- `src/components/controls/editorTheme.ts`
  - ya tiene una direccion visual adaptable al wallpaper y no conviene tirarla

### Debilidades detectadas

- el spectrum tiene muchos parametros, pero pocas familias visuales realmente distintas
- la UI del editor usa demasiado el mismo patron visual de sliders + enum buttons
- el producto no empuja presets fuertes ni flujos "creator-first"
- faltan efectos con persistencia visual entre frames
- filtros y animaciones aun no estan empaquetados como "looks", "moods" o "scenes"
- el editor es poderoso, pero aun no guia lo suficiente

---

## Referencias de producto que justifican la direccion

- Wallpaper Engine
  - destaca por editor + presets + performance + sharing + efectos listos para usar
  - referencias:
    - https://store.steampowered.com/app/431960/Wallpaper_Engine/?l=english
    - https://docs.wallpaperengine.io/en/web/audio/visualizer.html
- projectM / Milkdrop ecosystem
  - destaca por enorme variedad de lenguajes visuales y preset-driven design
  - referencias:
    - https://github.com/projectM-visualizer/projectm
    - https://github.com/projectM-visualizer/frontend-sdl-cpp
- Plane9
  - destaca por composicion de escenas y mezcla de background, foreground, postprocess y transitions
  - referencias:
    - https://www.plane9.com/download
    - https://www.plane9.com/wiki/studio
- Avee
  - destaca por templates, export, art layers y flujo orientado a creadores
  - referencia:
    - https://play.google.com/store/apps/details?id=com.daaw.avee.lite

---

## Vision de producto a implementar

El producto debe evolucionar hacia este modelo:

- `Preset -> Scene -> Fine tune`
- primero elegir un mood o plantilla
- luego editar bloques de alto nivel
- luego entrar a controles avanzados solo si hace falta

El spectrum debe pasar de ser "un renderer configurable" a ser "una plataforma de familias visuales".

---

## Roadmap general por fases

## Fase 0. Fundacion tecnica y refactor previo

### Objetivo

Preparar la base para que las siguientes mejoras no se monten sobre archivos gigantes ni lógica demasiado acoplada.

### Trabajo

- dividir `src/components/audio/CircularSpectrum.ts`
  - extraer color utilities
  - extraer runtime state / history buffers
  - extraer renderers por familia visual
  - extraer geometria radial/linear
- dividir `src/components/controls/tabs/SpectrumTab.tsx`
  - separar en subpanels `Basic`, `Motion`, `Color`, `Reactive`, `Advanced`, `Presets`
- planear migraciones en `src/store/wallpaperStorePersistence.ts`
  - nuevos campos sin romper proyectos existentes
- revisar `src/context/AudioDataContext.tsx`
  - confirmar que puede alimentar nuevos modos visuales sin generar rerenders innecesarios

### Entregables

- `src/features/spectrum/renderers/`
- `src/features/spectrum/runtime/`
- `src/features/spectrum/color/`
- `src/components/controls/tabs/spectrum/`
- primera capa de tipos nuevos en `src/types/wallpaper.ts`

### Criterios de aceptacion

- `CircularSpectrum.ts` deja de ser el punto monolitico principal
- `SpectrumTab.tsx` queda orquestando secciones, no concentrando toda la UI
- el build sigue pasando

---

## Fase 1. Arquitectura de presets y packs visuales

### Objetivo

Mover el producto a un flujo preset-first.

### Trabajo

- crear modelo de preset para spectrum, filtros, postprocess y escena
- agregar `preset packs` curados en codigo
- agregar metadata de preset:
  - id
  - nombre
  - descripcion
  - categoria
  - tags
  - thumbnail
  - intensidad recomendada
  - performance tier
- soportar `preset + overrides`
- guardar preset aplicado por wallpaper o por escena

### Presets iniciales sugeridos

- `Neon Halo`
- `Glass Scope`
- `Aurora Ribbon`
- `Monster Tunnel`
- `CRT Pulse`
- `Liquid Core`
- `Arc Reactor`
- `Signal Bloom`
- `Laser Chamber`
- `Dream Static`

### Archivos esperados

- `src/features/spectrum/presets/`
- `src/features/visualPresets/`
- `src/lib/presetThumbnails/`
- migraciones en `src/store/wallpaperStorePersistence.ts`

### Criterios de aceptacion

- el usuario puede aplicar un preset en un click
- el preset no pisa necesariamente ajustes finos manuales si el modo `overrides` esta activo
- cada preset tiene thumbnail y descripcion breve

---

## Fase 2. Spectrum 2.0: nuevas familias visuales

### Objetivo

Resolver la sensacion de spectrum "basico" agregando familias que se sientan verdaderamente distintas entre si.

### Nuevas familias a implementar

- `oscilloscope`
  - linea continua basada en waveform o energia interpolada
- `spectrogram-strip`
  - historial horizontal o vertical con scroll de energia por bandas
- `liquid-ribbon`
  - cintas suaves con relleno, estela y deformacion por energia
- `particle-swarm`
  - particulas orbitando o siendo expulsadas por bandas energicas
- `tunnel`
  - anillos o segmentos en profundidad reaccionando al beat
- `orbital-trails`
  - trails circulares con rotacion acumulada y acentos por kick

### Reutilizacion del sistema actual

- conservar `radial` y `linear`
- convertir `bars`, `blocks`, `wave`, `dots`, `capsules`, `spikes` en subestilos de familias mayores
- mantener `follow logo`, `clone`, `peak hold` y color modes donde tenga sentido

### Archivos esperados

- `src/features/spectrum/renderers/radial/`
- `src/features/spectrum/renderers/linear/`
- `src/features/spectrum/renderers/oscilloscope/`
- `src/features/spectrum/renderers/spectrogram/`
- `src/features/spectrum/renderers/liquid/`
- `src/features/spectrum/renderers/particle/`
- `src/features/spectrum/renderers/tunnel/`

### Criterios de aceptacion

- al menos 5 familias nuevas renderizando correctamente
- cada familia tiene preset demo
- el usuario percibe diferencias claras sin tocar sliders avanzados

---

## Fase 3. Memoria visual y persistencia entre frames

### Objetivo

Hacer que el spectrum deje de parecer solo una lectura instantanea del frame actual.

### Trabajo

- agregar `afterglow`
- agregar `motion trails`
- agregar `ghost frames`
- agregar `peak ribbons`
- agregar `bass shockwave`
- agregar `energy bloom halo`
- introducir buffers de historial reutilizables por renderer

### Implementacion tecnica sugerida

- runtime state por instancia en modulo aislado
- canvases auxiliares para acumulacion
- decaimiento configurable
- umbrales para desactivar efectos costosos en `performance mode`

### Criterios de aceptacion

- se nota continuidad visual entre frames
- el costo de GPU/CPU queda limitado por quality tiers
- los trails pueden apagarse o simplificarse automaticamente en modo bajo

---

## Fase 4. Transiciones de spectrum y direccion automatica

### Objetivo

Convertir el sistema en una experiencia mas "viva", no solo configurada manualmente.

### Trabajo

- transiciones entre presets de spectrum
- transiciones entre familias visuales compatibles
- morph suave de color, glow, scale y distribution
- modo `Auto Director`
  - detecta energia general
  - cambia preset por seccion o beat fuerte
  - respeta un cooldown
  - evita cambios caoticos
- soporte para cambios disparados por:
  - beat
  - kick
  - cambio de track
  - tiempo fijo

### Criterios de aceptacion

- el usuario puede activar `Auto Director` y obtener un resultado atractivo sin configurar manualmente todo
- las transiciones no generan parpadeos bruscos

---

## Fase 5. Filtros y postproceso tipo "look packs"

### Objetivo

Pasar de controles sueltos a estilos reutilizables.

### Trabajo

- crear `look presets` que combinen:
  - brightness
  - contrast
  - saturation
  - blur
  - hue rotate
  - rgb shift
  - scanlines
  - noise
  - vignette
  - bloom
  - luma threshold
  - lens warp
  - heat distortion
  - posterize
  - channel delay
  - light leaks
- mantener modo avanzado manual en `FiltersTab`
- separar filtros por grupos:
  - `Tone`
  - `Glitch`
  - `Lens`
  - `CRT`
  - `Bloom`
  - `Distortion`

### Looks iniciales sugeridos

- `CRT`
- `VHS`
- `Cyber Neon`
- `Dream Bloom`
- `Monochrome Ink`
- `Club Glitch`
- `Glass Mist`
- `Infrared Pulse`

### Archivos esperados

- `src/features/filterLooks/`
- `src/components/controls/tabs/filters/`
- `src/components/wallpaper/postprocess/`

### Criterios de aceptacion

- aplicar un look cambia el resultado de forma notoria
- el usuario puede editar el look sin perderlo por completo
- no se rompe el pipeline actual de targets de filtro

---

## Fase 6. Composicion de escenas

### Objetivo

Inspirarse en Plane9: el producto debe pensar en escenas, no solo en elementos aislados.

### Estructura de escena propuesta

- `background`
- `spectrum`
- `foreground overlays`
- `particles`
- `logo`
- `postprocess`
- `transition behavior`

### Trabajo

- crear `scene presets`
- permitir que una escena aplique:
  - preset de spectrum
  - look de filtros
  - layout sugerido
  - parametros de particulas
  - overlay defaults
- permitir escenas por imagen del slideshow
- soportar `scene override` por wallpaper activo

### Ejemplos de escenas

- `Neon Tunnel`
- `LoFi CRT Room`
- `Hologram Idol Stage`
- `Liquid Night Drive`
- `Mecha Reactor`
- `Dream Bloom Portrait`

### Criterios de aceptacion

- el usuario puede cambiar de escena completa con un click
- una escena puede convivir con ajustes manuales

---

## Fase 7. Reorganizacion total de la UI

### Objetivo

Hacer que la herramienta se sienta menos densa y mas guiada.

### Nueva arquitectura de tabs sugerida

- `Scene`
- `Spectrum`
- `Looks`
- `Layers`
- `Motion`
- `Audio`
- `Advanced`

### Dentro de Spectrum

- `Basic`
- `Motion`
- `Color`
- `Reactive`
- `Advanced`
- `Presets`

### Cambios de UX

- cards de preset con thumbnail
- quick compare antes/despues
- mini preview por preset
- indicadores de impacto en rendimiento
- macro controls:
  - `Energy`
  - `Softness`
  - `Chaos`
- separar claramente:
  - lo inspiracional
  - lo tecnico

### Componentes a crear o refactorizar

- `PresetGallery`
- `SceneGallery`
- `PerformanceBadge`
- `MacroControlGroup`
- `AdvancedSection`
- `QuickPreviewCard`

### Criterios de aceptacion

- el usuario puede llegar a un buen resultado mas rapido
- las opciones avanzadas siguen disponibles
- la densidad cognitiva baja respecto a la UI actual

---

## Fase 8. UX de descubrimiento y producto

### Objetivo

Hacer que el producto parezca mas pulido y mas "successful product".

### Trabajo

- thumbnails consistentes para presets y escenas
- onboarding rapido:
  - `Pick a vibe`
  - `Choose a soundtrack behavior`
  - `Fine tune`
- spotlight de presets recomendados
- favoritos y recientes
- boton `Surprise me`
- modo `Performance safe`
- avisos suaves cuando una configuracion entra en zona pesada

### Criterios de aceptacion

- primer uso mas amigable
- menos tiempo entre abrir app y ver algo impresionante

---

## Fase 9. Rendimiento y calidad

### Objetivo

Que la mejora visual no degrade la experiencia.

### Trabajo transversal

- quality tiers por renderer y postprocess
- desactivar o simplificar efectos pesados segun `performanceMode`
- mover cálculos repetidos fuera del render por frame
- reusar buffers y canvases auxiliares
- evitar rerenders React innecesarios en tabs y HUD
- diagnosticos de costo por familia visual

### Validacion

- `npm run build`
- pruebas manuales con escenas livianas y pesadas
- probar:
  - cambio de preset
  - drag de sliders
  - import de proyecto viejo
  - slideshow
  - follow logo
  - overlays
  - particles
  - HUD

### Metricas recomendadas

- tiempo de respuesta al cambiar preset
- FPS aproximado en escenas pesadas
- tiempo de aplicacion de escena
- memoria usada por buffers historicos

---

## Orden recomendado de ejecucion para el siguiente agente

1. Refactor de base:
   dividir `CircularSpectrum.ts` y `SpectrumTab.tsx`
2. Sistema de presets:
   spectrum presets + galleries + metadata + thumbnails
3. Nuevas familias:
   empezar por `oscilloscope`, `spectrogram-strip`, `tunnel`
4. Memoria visual:
   trails + afterglow + ghost frames
5. Look packs:
   presets de filtros y postprocess
6. Escenas:
   scene presets y overrides por wallpaper
7. UI:
   tabs nuevas, macro controls y preset-first UX
8. Auto Director:
   cambios automaticos por energia/beat/track
9. Polish:
   onboarding, favorites, recent, surprise me, performance badges

---

## Backlog tecnico detallado

### Tipos y estado

- extender `src/types/wallpaper.ts`
  - family del spectrum
  - preset ids
  - scene ids
  - look ids
  - trail settings
  - director settings
- extender store y persistence
- agregar migraciones backward compatible

### Renderer

- separar API comun de renderers
- definir `renderSpectrumFrame(context, audio, settings, runtime)`
- crear runtime state por familia

### Audio

- definir qué modos usan bins, envelope o waveform
- exponer derivadas utiles:
  - bass impact
  - high transient
  - energy average
  - stereo spread

### UI

- crear galerias con virtualizacion ligera si hace falta
- agregar preview cards con thumbnail y tags
- mover `advanced` fuera del flujo principal

### Persistencia

- guardar presets personalizados sin romper proyectos viejos
- soportar fallback si un preset ya no existe

---

## Riesgos y mitigacion

### Riesgo

Demasiadas features nuevas dentro del renderer actual.

### Mitigacion

Refactor obligatorio antes de ampliar familias.

### Riesgo

Demasiados campos nuevos en el store.

### Mitigacion

Agrupar configuraciones por dominio:

- `spectrumPresetState`
- `filterLookState`
- `sceneState`
- `directorState`

### Riesgo

Caida de rendimiento por trails y postprocess.

### Mitigacion

- quality tiers
- buffers reusables
- fallbacks por performance mode

### Riesgo

UI aun demasiado compleja.

### Mitigacion

- preset-first
- macro controls
- advanced collapse

---

## Definition of Done

Este plan se considera implementado cuando:

- el spectrum tiene nuevas familias que se sienten realmente distintas
- existen presets y escenas memorables con thumbnail
- los filtros pueden usarse como looks, no solo como sliders
- hay memoria visual entre frames
- la UI prioriza presets, mood y escenas antes que detalle tecnico
- el producto sigue importando proyectos viejos sin romperse
- el rendimiento sigue siendo usable en modos medio y bajo

---

## Siguiente agente: instrucciones directas

- no empieces agregando 40 sliders nuevos
- primero refactoriza la base del spectrum
- despues construye preset system + galleries
- prioriza resultados visuales claramente distintos
- mantén compatibilidad con proyectos existentes
- valida cada fase con build y smoke tests
- si el alcance es demasiado grande para una sola pasada, entrega en este orden:
  - `Preset system`
  - `3 nuevas familias de spectrum`
  - `Trails / afterglow`
  - `Looks`
  - `UI preset-first`
