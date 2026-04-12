# Estado del Proyecto - v0.2.0

## Resumen de la Versión
Con la versión `0.2.0`, el proyecto ha superado una fase principal de reestructuración técnica y consolidación de la interfaz de usuario. Los documentos de planificación antiguos, bitácoras y planes transitorios han sido movidos a la carpeta `docs/archive`, a fin de dejar un repositorio limpio y acorde a la arquitectura real que la aplicación utiliza hoy (basada en Vite + React).

## Qué se ha logrado en esta última iteración (Refactor Final de HUD y Perfiles)
1. **Refactorización de Temas Visuales del Editor (`EditorTheme` / `rainbow`)**:
   - Se reemplazó el costoso tema dinámico `rotate-rgb` del editor por una preselección estática `rainbow`. Esto conserva la paleta multicolor original pero sin introducir *lag* en la interfaz al mantenerla maximizada o renderizar muchos subcomponentes. 
2. **Consolidación de Personalización (`EditorTab`)**:
   - Se unificó toda la configuración visual en la pestaña `Editor`.
   - El *Quick HUD* y el Editor principal comparten ahora el mismo sistema de paletas (`manual`, `theme`, `current image`), integrándose estéticamente.
3. **Modos "Por-Imagen" Ampliados (`ActiveWallpaperSection` & Stores)**:
   - Las imágenes de fondo (`BackgroundImageItem`) ahora cuentan con menús selectores para su respectivo `Logo Slot` y `Spectrum Slot`. Al cambiar de imagen de fondo, el wallpaper transiciona no sólo las variables geométricas de fondo, sino que inyecta automáticamente el set de parámetros hidratado para los módulos visuales de acuerdo al *Slot* preconfigurado.
4. **Hidratación y Endurecimiento Estricto de Slots (Spectrum, Background, Logo)**:
   - A todos los _slices_ del `Store` que rescatan variables serializadas desde `localStorage` se les implementó un _merge_ mediante `DEFAULT_STATE`.  
   - Si una sesión vieja o un perfil grabado sólo contenía modificaciones parciales, los valores faltantes ahora caen forzosamente en la definición estándar del modelo. No quedan "datos huérfanos" contaminando saltos entre modos (evitando cosas como que `peakHold` o `shadowBlur` de un Slot afecten accidentalmente a otro).
5. **Afinaciones Menores de Accesibilidad/UI**:
   - En audio, los botones de *Prev* y *Next* ahora comunican un estado visual de *apagado* lógico si la "Bandeja / Pool" activa solo detecta 1 pista.

## Estado de la Persistencia
El sistema divide su almacenamiento en dos capas:
- **Memoria Ligera (`localStorage` a través de _Zustand Persist_)**: Toda estructura estática liviana, estados de botones, números y _slots_ que definen el estilo gráfico.
- **Base de Datos (`IndexedDB`)**: Blobs de imágenes de fondo cargados paraleliscamente.

## Qué sigue recomendándose (Hoja de Ruta Futura)
1. **Audio Multitrack y Transiciones Avanzadas (La "Fase DJ")**:
   - Poseemos ahora una _playlist_. El próximo desafío radica en preanalizar *offline* / en memoria los picos (peaks/energía) de canciones para ejecutar un _crossfade_ automatizado suave "detectando" caídas en decibelios o midiendo los BPM, similar a la dinámica del `TAREA_PENDIENTE_MULTITRACK_AUDIO.md` archivado.
2. **Overlays Personalizables y Decorativos**:
   - Implementar las ideas de _Stickers_, _GIFs_, o "Mascotas". Posibilitar un módulo de `FixedOverlayImageLayer` que tenga soporte nativo a imágenes alfa *arrastrables* y rotables por pantalla por parte del usuario, al igual que los _badges_.
3. **Mejoras Prácticas UX**:
   - Soporte "Dirty" de Pestañas: advertir antes de cambiar/sobreescribir un Preset que existen cambios sin guardar.
