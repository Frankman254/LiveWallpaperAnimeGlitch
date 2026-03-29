# Tareas — LiveWallpaperAnimeGlitch refactor pro

## Fase 0 — Auditoría y base
- [ ] Revisar estructura actual del proyecto y mapear módulos existentes
- [ ] Identificar settings huérfanos o duplicados
- [ ] Identificar conflictos entre BG zoom, logo reactive, spectrum y slideshow
- [ ] Documentar valores efectivos vs valores del UI
- [ ] Actualizar README a la arquitectura real (Vite/React, no Next.js)

## Fase 1 — Editor y Preview
- [ ] Crear routing o layout para `/editor`
- [ ] Crear routing o layout para `/preview`
- [ ] Conectar ambas vistas al mismo store global
- [ ] Permitir abrir preview en nueva ventana
- [ ] Garantizar sincronización en tiempo real

## Fase 2 — Modelo por capas
- [ ] Diseñar tipos base para layers
- [ ] Crear registry de layers
- [ ] Implementar `BackgroundImageLayer`
- [ ] Implementar `SlideshowLayer`
- [ ] Implementar `FixedOverlayImageLayer`
- [ ] Implementar `LogoLayer`
- [ ] Implementar `SpectrumLayer`
- [ ] Implementar `CircularSpectrumLayer`
- [ ] Implementar `ParticleBackgroundLayer`
- [ ] Implementar `ParticleForegroundLayer`
- [ ] Implementar `RainLayer`
- [ ] Implementar `FXLayer`
- [ ] Agregar soporte para `zIndex`, `enabled`, `position`, `scale`, `rotation`, `opacity`, `blendMode`

## Fase 3 — Background y Slideshow
- [ ] Crear fit modes: contain, cover, stretch, fit-width, fit-height, original-size, smart-cover
- [ ] Guardar transform por imagen individual
- [ ] Agregar zoom por imagen
- [ ] Agregar X/Y por imagen
- [ ] Agregar fit mode por imagen
- [ ] Agregar opción de reset transform al cambiar imagen
- [ ] Agregar opción de conservar transform entre imágenes
- [ ] Permitir intervalo en segundos y minutos
- [ ] Agregar duración configurable de transición
- [ ] Implementar varias transiciones:
  - [ ] fade
  - [ ] crossfade
  - [ ] slide left/right
  - [ ] zoom fade
  - [ ] blur dissolve
  - [ ] glitch transition
- [ ] Corregir deformación en ultrawide 3440x1440

## Fase 4 — Audio
- [ ] Mejorar reproducción de audio file
- [ ] Agregar play
- [ ] Agregar pause
- [ ] Agregar stop
- [ ] Agregar seek
- [ ] Agregar current time / duration
- [ ] Agregar loop
- [ ] Agregar volumen
- [ ] Mostrar fuente activa de audio
- [ ] Agregar presets UX para FFT size: Fast / Balanced / Detailed
- [ ] Añadir tooltips explicando FFT Size

## Fase 5 — Audio-reactividad avanzada
- [ ] Implementar envelope con attack/release
- [ ] Agregar smoothing configurable
- [ ] Agregar deadzone
- [ ] Agregar clamp mínimo y máximo
- [ ] Agregar curvas de respuesta: linear, ease, logarithmic, exponential
- [ ] Agregar selección de band source: full, bass, low-mid, mid, high-mid, treble, custom
- [ ] Aplicar nuevo modelo reactivo a background bass zoom
- [ ] Aplicar nuevo modelo reactivo a logo
- [ ] Aplicar nuevo modelo reactivo a spectrum
- [ ] Aplicar nuevo modelo reactivo a particles si corresponde

## Fase 6 — Spectrum
- [ ] Permitir posiciones: top, top-inverted, bottom, left, right, center, free-position, circular
- [ ] Corregir followLogo para que use posición real del logo
- [ ] Agregar más band modes
- [ ] Aumentar rango de rotation speed
- [ ] Agregar dirección clockwise/counterclockwise
- [ ] Corregir rainbow real en wave
- [ ] Optimizar rendimiento en shape line
- [ ] Agregar control de anchor/offset
- [ ] Revisar performance del circular spectrum

## Fase 7 — Logo
- [ ] Agregar minScale
- [ ] Agregar maxScale
- [ ] Agregar baseSize refinado
- [ ] Agregar bandMode
- [ ] Agregar attack/release
- [ ] Agregar smoothing
- [ ] Agregar glow y shadow más configurables
- [ ] Agregar backdrop
- [ ] Agregar lockPosition
- [ ] Agregar draggable mode opcional
- [ ] Corregir saturación del logo con música intensa
- [ ] Separar percepción visual de BG zoom vs logo reactive

## Fase 8 — Partículas
- [ ] Añadir formas:
  - [ ] circle
  - [ ] square
  - [ ] triangle
  - [ ] star
  - [ ] plus
  - [ ] minus
  - [ ] diamond
  - [ ] cross
- [ ] Revisar si conviene sprite atlas o shader shape
- [ ] Mejorar foreground para que se vea claramente encima
- [ ] Agregar solid/gradient/rainbow/random palette
- [ ] Agregar glow
- [ ] Agregar blur/halo fake
- [ ] Agregar drift direction
- [ ] Agregar audio-reactive size
- [ ] Agregar audio-reactive opacity
- [ ] Optimizar rendimiento con muchas partículas

## Fase 9 — Rain
- [ ] Permitir width mínimo más pequeño
- [ ] Ampliar speed range
- [ ] Agregar 3D depth angle
- [ ] Permitir fall angle entre -180 y 180
- [ ] Agregar más colores
- [ ] Agregar rainbow mode
- [ ] Agregar variación por gota
- [ ] Permitir dirección fondo→frente y frente→fondo

## Fase 10 — FX
- [ ] Reclasificar FX en Background Motion / Glitch / Scanlines
- [ ] Implementar nuevos tipos de glitch:
  - [ ] horizontal slices
  - [ ] vertical slices
  - [ ] diagonal glitch
  - [ ] invert direction
  - [ ] block glitch
  - [ ] pixel glitch
  - [ ] geometric glitch
  - [ ] shape-based overlays
- [ ] Agregar jitter/frequency/direction más claros
- [ ] Afinar audio sensitivity del glitch con rangos más pequeños
- [ ] Expandir scanlines:
  - [ ] always on
  - [ ] pulse
  - [ ] random burst
  - [ ] beat reactive
- [ ] Ajustar spacing, thickness, opacity

## Fase 11 — Overlays decorativos
- [ ] Crear sistema de overlays fijos
- [ ] Permitir insertar png/logo/sticker/mascota
- [ ] Evaluar soporte gif
- [ ] Permitir drag con mouse
- [ ] Permitir lock/unlock
- [ ] Guardar zIndex
- [ ] Guardar posición, escala, rotación, opacidad
- [ ] Minimizar impacto en performance

## Fase 12 — Presets
- [ ] Implementar dirty state
- [ ] Crear estado `Custom`
- [ ] Confirmar antes de aplicar preset si hay cambios sin guardar
- [ ] Agregar save custom preset
- [ ] Agregar duplicate preset
- [ ] Agregar revert to preset
- [ ] Mejorar presets por defecto con configuraciones más pro

## Fase 13 — Persistencia
- [ ] Persistir settings ligeros en localStorage
- [ ] Evaluar IndexedDB para blobs/imágenes pesadas
- [ ] Persistir slideshow
- [ ] Persistir transforms por imagen
- [ ] Persistir logo
- [ ] Persistir overlays
- [ ] Persistir preset/custom state
- [ ] Recuperar escena completa al recargar

## Fase 14 — UI/UX
- [ ] Rediseñar panel
- [ ] Agrupar secciones: Scene / Background / Slideshow / Audio / Spectrum / Logo / Particles / Rain / FX / Overlays / Presets / Performance / System
- [ ] Agregar tooltips
- [ ] Agregar unidades visibles
- [ ] Agregar reset por sección
- [ ] Mostrar valor efectivo real cuando haya clamps o límites de performance
- [ ] Revisar si conviene inspector lateral + preview limpio
- [ ] Evaluar panel desacoplado o modular

## Fase 15 — Branding
- [ ] Crear favicon
- [ ] Crear identidad visual básica
- [ ] Ajustar nombre y presentación del proyecto

## Fase 16 — QA
- [ ] Probar monitor ultrawide 3440x1440
- [ ] Probar imagen pequeña sin deformación
- [ ] Probar slideshow con múltiples transiciones
- [ ] Probar audio file play/pause/stop
- [ ] Probar spectrum layouts
- [ ] Probar circular + followLogo
- [ ] Probar logo reactive con música intensa y música suave
- [ ] Probar particles foreground/background
- [ ] Probar rain con rangos nuevos
- [ ] Probar persistencia completa tras recargar
- [ ] Probar presets sin destrucción de custom config
