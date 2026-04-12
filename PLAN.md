# Plan de Corrección Final: Color System, HUD, BG por Imagen, UI y Documentación

## Resumen
Vamos a cerrar esta ronda con una pasada grande pero ordenada sobre 6 frentes: tema rainbow estático del editor, modelo de color del spectrum, HUD rápido, BG por imagen con slots de Logo/Spectrum, compactación del editor maximizado y limpieza/versionado/documentación. La meta es dejar el sistema más coherente, predecible y mantenible, sin seguir acumulando deuda visual ni lógica.

Decisión cerrada:
- Las referencias de slot por imagen en `BG` se guardarán **por índice**.
- Si el slot ya no existe, está vacío o queda inválido, la app caerá a:
  1. el valor actual cargado en runtime si existe,
  2. y si no, al valor por defecto del sistema.

## Cambios principales

### 1. Reemplazar `rotate-rgb` del editor por un tema `Rainbow` estático
- Quitar el tema animado `rotate-rgb` del editor y sustituirlo por un tema `rainbow` estático, sin animaciones de color continuas.
- Mantener la idea visual multicolor, pero usando una paleta fija y superficies estables para evitar lag al abrir el editor maximizado.
- El spectrum conserva su modo `Rotate RGB`, pero su comportamiento se redefine mejor:
  - `color source` decide la paleta base.
  - `color mode` decide la transformación visual.
- Regla final del spectrum:
  - `manual`
    - `solid`: usa `primary`
    - `gradient`: usa `primary + secondary`
    - `rainbow`: usa espectro visible completo
    - `Rotate RGB`: rota espectro visible completo
  - `theme`
    - `solid`: dominante del tema
    - `gradient`: dominante + secundaria del tema
    - `rainbow`: paleta del tema
    - `Rotate RGB`: rota sobre la paleta del tema
  - `current image`
    - `solid`: dominante de la imagen
    - `gradient`: dominante + secundaria de la imagen
    - `rainbow`: paleta de la imagen
    - `Rotate RGB`: rota sobre la paleta de la imagen
- No se agrega un `color source = rainbow`; se mantiene separación clara entre “fuente” y “modo”.

### 2. Nueva pestaña completa para personalización del editor y HUD
- Consolidar toda la personalización visual del editor en una pestaña propia `Editor`.
- Mover allí todas las configuraciones globales del editor y del HUD rápido, para no seguir sobrecargando `Perf`.
- La pestaña `Editor` debe incluir:
  - `Editor Theme`
  - `Editor Color Source`
  - `Manual colors`
    - accent
    - secondary
    - backdrop
    - text primary
    - text secondary
  - `Backdrop opacity`
  - `Surface opacity`
  - `Blur`
  - `Corner radius`
  - `HUD Theme Source`
  - `HUD Manual colors`
  - `HUD Backdrop opacity`
  - `HUD Surface opacity`
  - `HUD Blur`
  - `HUD Position X/Y`
  - `HUD Launcher X/Y`
  - `HUD Scale`
  - `HUD Launcher size`
  - `Global Color Shortcuts`
- `Perf` debe quedarse con:
  - performance mode
  - sleep mode
  - diagnostics toggles
  - window tools
  - version
  - quick resource telemetry

### 3. Refactor del Quick HUD
- El launcher del HUD debe ser circular y separarse visualmente del panel, con comportamiento igual al launcher del editor.
- Al pulsarlo:
  - el panel aparece en la posición configurada del panel
  - el launcher permanece en su propia posición configurada
- Mantener coordenadas normalizadas `0–1`, no píxeles.
- Recalibrar el clamp para que ni launcher ni panel se salgan del viewport aun en extremos mínimos/máximos.
- El HUD debe usar exactamente el mismo sistema de color visual del editor:
  - `manual`
  - `theme`
  - `current image`
- Mejoras funcionales del HUD:
  - seek bar clickeable para adelantar pista
  - pista actual
  - tiempo transcurrido / duración
  - botones más cuadrados y con iconografía descriptiva de reproductor, no de chat
  - traducir correctamente `Shortcuts` / `Quick Actions` al inglés donde siga mal
- Renombrar en el HUD superior:
  - el menú `slots` que corresponde a spectrum debe llamarse `Spectrum`
- Agregar en el HUD superior otro menú hermano:
  - `Logo`
  - debe cargar los `logoProfileSlots`
- Revisar el bug reportado:
  - `part BG` y `part FG` no deben activar lo mismo
  - si hoy ambos tocan el mismo flag o no reflejan el `particleLayerMode`, corregir el mapeo para que:
    - `BG` = background
    - `FG` = foreground
    - ambos = both

### 4. BG por imagen: asignar slots de Logo y Spectrum
- Extender el modelo de `backgroundImages` para que cada imagen pueda guardar:
  - `logoProfileSlotIndex?: number | null`
  - `spectrumProfileSlotIndex?: number | null`
- Al cambiar la imagen activa:
  - si hay `logoProfileSlotIndex` válido y el slot existe con valores, cargarlo
  - si hay `spectrumProfileSlotIndex` válido y el slot existe con valores, cargarlo
  - si el slot ya no existe, está vacío o es inválido:
    - mantener el estado actual cargado si ya existe
    - si no hay estado aplicable, caer a defaults del sistema
- La asignación es por índice, no por nombre.
- UI en `BG`:
  - agregar selector por imagen para `Logo Slot`
  - agregar selector por imagen para `Spectrum Slot`
  - indicar claramente cuando una imagen usa “Current / Default / Slot N”
- No debe haber side effects al borrar slots:
  - solo en el siguiente cambio de imagen se resuelve el fallback
  - no se reescribe automáticamente toda la lista de imágenes

### 5. Barrida fuerte de `BG`
- Auditar que todas las configuraciones por imagen realmente se persistan y restauren:
  - scale
  - fitMode
  - position X/Y
  - opacity
  - bass reactive
  - audio channel
  - transition type/duration/intensity/audio drive/audio channel
  - mirror
  - nuevos `logoProfileSlotIndex` / `spectrumProfileSlotIndex`
- Revisar `autoFitActiveImage()` y el flujo de “default layout vs per-image layout” para que:
  - el autofit aplique al activo correcto
  - no se desincronice de `activeImageId`
  - no sobreescriba layouts individuales por accidente
- Compactación quirúrgica de la pestaña `BG`:
  - agrupar por `Image`, `Audio`, `Transition`, `Slideshow`, `Global BG`
  - quitar huecos verticales
  - evitar filas de toggles que rompan layout en anchos estrechos
  - asegurar que controles como `Auto-cycle`, `Audio Checkpoints` y `Track Change Sync` no se encimen con los switches

### 6. Audio: botones `Prev/Next` deshabilitados con una sola pista
- En `AudioTab`, si solo hay una pista cargada o una sola pista habilitada:
  - `Prev` y `Next` deben renderizarse deshabilitados
  - el botón no debe disparar handlers
- Aplicar la misma regla en el Quick HUD para transporte.
- La lógica debe basarse en pistas utilizables, no solo en longitud bruta del array, para contemplar tracks deshabilitados.

### 7. Saved slots del Spectrum y consistencia de perfiles
- Endurecer definitivamente el sistema de slots del spectrum.
- Mantener la hidratación completa que ya se introdujo, y además:
  - verificar que el conjunto de claves guardadas coincide exactamente con `SpectrumProfileSettings`
  - asegurar que `save/load/migrate` usan la misma definición
  - auditar también `Logo` y `BG profile slots` para detectar si existe el mismo patrón de estado parcial/mezclado
- Corregir específicamente el caso reportado:
  - `spectrumShadowBlur` no debe variar al volver a un slot salvo que el slot realmente guarde otro valor
  - `peak hold` y `shadow blur` no deben contaminarse entre slots
- Añadir una comprobación de integridad simple:
  - si un slot cargado es parcial, hidratarlo completo con defaults antes de aplicar

### 8. Editor maximizado: mejor aprovechamiento del espacio
- Hacer una pasada visual sobre `EditorOverlay` y la distribución de tabs para:
  - reducir zonas vacías
  - mejorar grids en desktop ancho
  - balancear mejor cards largas y cards cortas
- Prioridad de compactación:
  1. `BG`
  2. `Track Info`
  3. `Audio`
  4. `Editor`
  5. `Perf`
- Objetivo:
  - más contenido por pantalla
  - menos scroll muerto
  - bloques relacionados más cerca

### 9. Versionado y documentación
- Subir la versión del proyecto en `package.json`.
- Recomendación por tamaño del cambio:
  - pasar de `0.1.0` a `0.2.0`
- Mostrar la versión actual de la app en `Perf`.
- Revisar y actualizar la documentación completa:
  - `README.md`
  - `docs/ARQUITECTURA_GENERAL.md`
  - `docs/AUDIO_RENDER_Y_SHADERS.md`
  - handoffs recientes
  - guías de código y cambios
- Eliminar o archivar documentos viejos si ya no se alinean con el estado real:
  - especialmente handoffs antiguos y logs que contradigan la arquitectura actual
- Crear/actualizar un informe minucioso de “qué se hizo” y “qué sigue recomendándose”:
  - estado real actual
  - cambios recientes importantes
  - problemas conocidos
  - sugerencias de mejora futuras

## Interfaces y tipos a cambiar
- `EditorTheme`
  - reemplazar `rotate-rgb` por `rainbow`
- `BackgroundImageItem`
  - agregar `logoProfileSlotIndex?: number | null`
  - agregar `spectrumProfileSlotIndex?: number | null`
- Estado del editor/HUD
  - mantener `manual/theme/current image`
  - no agregar nuevos `color source`
- Tipos del HUD
  - no cambiar modelo base, pero mover configuración final a la nueva pestaña `Editor`

## Pruebas y escenarios
- `Spectrum`
  - `manual + rainbow` usa espectro visible completo
  - `manual + Rotate RGB` rota el espectro visible completo
  - `theme/current image + Rotate RGB` rotan dentro de su paleta
- `BG por imagen`
  - asignar `Logo Slot` y `Spectrum Slot` a varias imágenes
  - cambiar entre imágenes y verificar carga correcta
  - borrar un slot referenciado y verificar fallback limpio
- `Quick HUD`
  - mover launcher y panel a extremos mínimos/máximos
  - ocultar/mostrar varias veces
  - seek bar funcional
  - `Prev/Next` deshabilitados con 1 sola pista
  - `part BG` y `part FG` cambian flags distintos
- `Audio`
  - playlist de 1 pista: `Prev/Next` deshabilitados en editor y HUD
  - playlist de varias pistas: habilitados
- `BG`
  - guardar varias configuraciones por imagen, recargar y verificar persistencia
  - probar `autofit` con varias imágenes de diferentes proporciones
- `Editor`
  - tema `rainbow` estático no debe laggear como el antiguo animado
  - versión visible en `Perf`
- Validación técnica:
  - `npx tsc --noEmit`
  - `npm run build`

## Supuestos cerrados
- El tema animado `rotate-rgb` del editor se elimina y se reemplaza por un tema `rainbow` estático por rendimiento.
- La lógica de slots por imagen usa índice.
- Si una referencia de slot ya no es válida, la app no revienta ni remapea silenciosamente a otro slot: cae a current/default.
- `color source` sigue siendo solo:
  - `manual`
  - `theme`
  - `current image`
- `rainbow` y `Rotate RGB` permanecen como `color mode`, no como `color source`.
