# LiveWallpaperAnimeGlitch — Plan maestro de refactor y expansión

## Objetivo general

Convertir el proyecto actual en un editor serio de **live wallpapers / music visualizers audio-reactive**, pasando de un MVP técnico con sliders a una herramienta modular, persistente, escalable y cómoda de usar.

El sistema debe evolucionar hacia:
- arquitectura por capas
- editor separado de preview
- mejor soporte para ultrawide
- mejor manejo de audio-reactividad
- presets no destructivos
- overlays decorativos
- persistencia real
- más efectos visuales y mejor clasificación de controles

---

## 1. Visión de producto

Actualmente el proyecto ya tiene una base funcional, pero sigue comportándose como:
- una sola vista principal
- un panel técnico
- una escena rígida
- varios controles globales que compiten entre sí
- poca separación conceptual entre background, FX, spectrum, logo y slideshow

La meta es transformarlo en un sistema con dos modos claros:

### Editor
Espacio para:
- configurar escena
- administrar assets
- editar slideshow
- ajustar audio
- mover overlays
- gestionar presets
- inspeccionar capas y propiedades

### Preview
Vista limpia en tiempo real, sin panel estorbando, pensada para:
- previsualizar el resultado final
- abrir en otra ventana/pantalla
- usar como modo “wallpaper preview”

---

## 2. Cambio arquitectónico principal

### 2.1 Separar en rutas
Crear dos rutas/pantallas:

- `/editor`
- `/preview`

### `/editor`
Debe incluir:
- panel lateral o modular por secciones
- inspector de capas
- gestor de slideshow
- gestor de overlays
- controles de audio
- controles de spectrum/logo/particles/rain/fx
- presets
- utilidades de reset, save, duplicate

### `/preview`
Debe incluir:
- solo el render visual
- sincronización en tiempo real con el editor
- opción fullscreen
- opción abrir en nueva ventana

### 2.2 Modelo de escena por capas

Dejar de tratar todo como una sola composición fija.

#### Propuesta de layers
- `BackgroundImageLayer`
- `SlideshowLayer`
- `FixedOverlayImageLayer`
- `LogoLayer`
- `SpectrumLayer`
- `CircularSpectrumLayer`
- `ParticleBackgroundLayer`
- `ParticleForegroundLayer`
- `RainLayer`
- `FXLayer`

#### Campos mínimos por layer
- `id`
- `type`
- `enabled`
- `zIndex`
- `opacity`
- `positionX`
- `positionY`
- `scale`
- `rotation`
- `blendMode`
- `locked`
- `draggable`
- `audioReactiveConfig` opcional

---

## 3. Background y slideshow

### 3.1 Fit modes por imagen
Cada imagen debe poder definir su propio modo de ajuste:

- `contain`
- `cover`
- `stretch`
- `fit-width`
- `fit-height`
- `original-size`
- `smart-cover`

Esto es crítico para monitores ultrawide como 3440x1440, evitando deformaciones y preservando proporciones.

### 3.2 Transform por imagen individual
Cada slide debe tener:
- `scale`
- `positionX`
- `positionY`
- `fitMode`
- `rotation` opcional
- `bgBassReactiveEnabled`
- `bgBassReactiveAmount`
- `bgBassBandMode`

### 3.3 Slideshow avanzado
Agregar:
- intervalo en segundos y minutos
- duración de transición configurable
- más transiciones:
  - fade
  - crossfade
  - slide left/right
  - zoom fade
  - blur dissolve
  - glitch transition
- opción de reset transform por cambio de imagen
- opción de conservar transform entre imágenes

---

## 4. Audio y audio-reactividad

### 4.1 Reproducción de archivo de audio
Cuando se use archivo mp3:
- play
- pause
- stop
- seek
- current time / duration
- loop
- volumen
- indicador de estado

### 4.2 Mejor modelo reactivo
No usar solo “sensitivity” lineal.
Cada módulo reactivo debe poder usar:

- `attack`
- `release`
- `smoothing`
- `deadzone`
- `minClamp`
- `maxClamp`
- `responseCurve`
  - linear
  - ease
  - logarithmic
  - exponential
- `bandSource`
  - full
  - bass
  - low-mid
  - mid
  - high-mid
  - treble
  - custom range

Aplicar esto a:
- background bass zoom
- logo scale
- spectrum amplitude
- particles size/opacity
- otros FX que dependan del audio

### 4.3 FFT Size — UX y explicación
Mantener control avanzado, pero también presets amigables:
- Fast
- Balanced
- Detailed

Y acompañarlo con ayuda visual/tooltips.

---

## 5. Spectrum y logo

### 5.1 Spectrum libre
Agregar posiciones/layouts:
- top
- top-inverted
- bottom
- left
- right
- center
- free-position
- circular

Si `circular + followLogo` está activo, el círculo debe seguir la posición real del logo.

#### Mejoras necesarias
- más band modes
- más rango de rotación
- dirección:
  - clockwise
  - counterclockwise
- wave rainbow real aplicado a toda la forma
- mejor rendimiento en shape line
- offsets y anclajes claros

### 5.2 Logo reactivo
Agregar:
- `minScale`
- `maxScale`
- `baseSize`
- `bandMode`
- `attack`
- `release`
- `smoothing`
- `glow`
- `shadow`
- `backdrop`
- `lockPosition`
- `draggableMode`

El logo no debe saturarse fácilmente ni quedarse pegado al tamaño máximo.

---

## 6. Glitch y FX

### 6.1 Reclasificar FX
Separar mejor:

#### Background Motion
- parallax
- bass zoom
- drift
- soft camera shake

#### Glitch
- horizontal slices
- vertical slices
- diagonal glitch
- invert direction
- block glitch
- pixel glitch
- geometric glitch
- shape-based glitch overlays
- intensity
- jitter
- direction
- audio sensitivity fina

#### Scanlines
- always on
- pulse
- random burst
- beat reactive

Con controles de:
- intensidad
- spacing
- thickness
- opacity

---

## 7. Partículas

### 7.1 Nuevas formas
Agregar al menos:
- circle
- square
- triangle
- star
- plus
- minus
- diamond
- cross

### 7.2 Más control
Permitir:
- background / foreground / both
- solid / gradient / rainbow / random palette
- size range
- glow
- blur
- halo fake
- rotation
- drift
- audio-reactive size
- audio-reactive opacity

El foreground debe quedar visualmente claro y por encima del wallpaper.

---

## 8. Rain

Base ya aceptable, pero necesita más rango y precisión.

Agregar:
- width más pequeño para líneas finas reales
- speed más amplio
- 3D depth angle
- fall angle entre -180 y 180
- más colores
- rainbow mode
- variación por gota
- dirección desde fondo hacia delante y viceversa

---

## 9. Overlays decorativos

Crear sistema para insertar overlays como:
- nombre del canal
- logos
- mascotas
- png decorativos
- stickers
- gifs si es viable

Cada overlay debe tener:
- position
- scale
- rotation
- opacity
- zIndex
- lock/unlock
- draggable mode
- persistencia

---

## 10. Presets

Rediseñar por completo.

### Problema actual
Un clic puede destruir configuración manual.

### Nuevo comportamiento
- preset activo
- dirty state
- estado `Custom`
- save custom preset
- duplicate preset
- revert to preset
- confirmación antes de sobreescribir si hay cambios

Además:
- crear presets mucho más elaborados
- no dejar presets básicos/placeholder como estado final del producto

---

## 11. Persistencia

Persistir toda la escena posible.

### Guardar
- configuración general
- background/slideshow
- logo
- spectrum
- particles
- rain
- overlays
- transforms
- preset activo / custom state

### Almacenamiento
- `localStorage` para settings livianos
- evaluar `IndexedDB` para imágenes/logo/assets pesados

No perder trabajo al refresh.

---

## 12. UI/UX del panel

El panel debe sentirse más como editor.

### Organización sugerida
- Scene
- Background
- Slideshow
- Audio
- Spectrum
- Logo
- Particles
- Rain
- FX
- Overlays
- Presets
- Performance
- System

### Mejoras
- mejor spacing
- labels más claras
- tooltips
- unidades
- reset por sección
- mostrar valor efectivo cuando performance mode o lógica interna recorten el valor real

---

## 13. Performance

Revisar especialmente:
- circular spectrum
- spectrum line shape
- foreground particles
- overlays decorativos
- coexistencia de BG bass zoom + logo reactive
- múltiples imágenes + crossfade + overlays

Optimizar sin degradar demasiado la calidad visual.

---

## 14. Persistencia visual y branding

Agregar:
- favicon del proyecto
- branding mínimo
- identidad visual básica del editor

---

## 15. Resultado esperado

El resultado final debe sentirse como un **editor de live wallpapers / music visualizers anime-cyberpop**, no como una demo técnica.

Debe soportar:
- preview limpia
- edición rica
- layering real
- persistencia
- presets seguros
- soporte ultrawide
- audio-reactividad más inteligente
- más variedad visual
