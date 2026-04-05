# Análisis y Sugerencias de Mejora Estratégicas

Tras analizar la arquitectura actual de **LiveWallpaperAnimeGlitch**, estas son las recomendaciones de mayor impacto, divididas en lo que mejorará la vida de los usuarios finales y lo que nos aliviará los dolores de cabeza como desarrolladores.

---

## 👩‍💻 Para el Usuario Final (Mejoras de Producto y UX)

### 1. Sistema de Exportación/Importación "Todo en Uno" (.zip / .lwag)
* **El Problema Actual**: `projectSettings.ts` exporta bien la configuración (JSON), pero las imágenes binarias, logos y overlays viven aislados en `IndexedDB`.
* **La Mejora**: Crear un empaquetador que tome el JSON del `store` + los Blobs de `IndexedDB` y los comprima usando algo como `JSZip`. De esta forma, los usuarios podrían compartir sus creaciones completas (animación + música + imágenes personalizadas) como un solo archivo `.lwag` en Reddit o Discord.

### 2. Historial de Deshacer/Rehacer (Undo / Redo)
* **El Problema Actual**: El usuario comete un error al ajustar un slider complicado (ej. un glitch muy agresivo) y no puede volver fácilmente al estado de hace 5 segundos a menos que haya guardado el preset.
* **La Mejora**: Dado que usamos Zustand centralizado, es increíblemente fácil acoplar un middleware como `zundo` o implementar un historial propio de 10 posiciones. Un simple `Ctrl+Z` en el editor mejoraría la UX un 100%.

### 3. Modo de Ahorro de Energía (Sleep Mode)
* **El Problema Actual**: Los canvas 2D repintando audio, más Three.js corriendo shaders (lluvia/partículas) consumen tarjeta de video (GPU).
* **La Mejora**: Implementar un listener de visibilidad (`document.visibilityState`) e inactividad. Si el wallpaper se detecta inactivo, oculto, o si el usuario no tiene audio sonando, bajar los FPS a 10 o pausar el render de R3F por completo. Esto hace que tener el LiveWallpaper encendido no destruya la batería de laptops ni quite FPS en videojuegos pesados que el usuario esté jugando en otro monitor.

---

## 🛠️ Para Nosotros (Mejoras de Arquitectura DX y Deuda Técnica)

### 1. Desintegrar el Monolito `ImageLayerCanvas.tsx`
* **El Diagnóstico**: Este archivo es el "God Object" del proyecto. Se encarga de hacer los Fit Modes (Cover/Contain), calcular transiciones de Slideshow, hacer shift RGB, Glitch, ruido de película, Scanlines, filtros de color, Blur y recortes de Overlay. Es demasiado frágil.
* **El Remedio**: 
  1. Separar el render de las imágenes (pintura plana).
  2. Implementar un "Pipeline de Post-procesamiento" puro. Que las capas se pasen por funciones secuenciales: `applyGlitchPass(canvas) -> applyColorFilterPass(canvas) -> applyScanlinesPass(canvas)`.

### 2. Resolver la Guerra Civil: `GlitchTab` vs `FiltersTab`
* **El Diagnóstico**: Actualmente, los controles de "Filtros" y los de "Glitch" están en pestañas separadas de la UI, pero ambos alteran píxeles en el mismo contexto de canvas 2D. Esto ha causado bugs históricos donde aplicar un filtro anula el glitch, o viceversa, dependiendo de cómo responda el React Effect.
* **El Remedio**: Centralizar la estructura de estado de ambos bajo un módulo `effectsSlice`. En la UI pueden estar separados para no abrumar al usuario, pero bajo el capó deben ser un solo objeto inmutable que se pasa intacto al *Render Pipeline* para garantizar el orden matemático de los efectos sin importar en qué orden hizo click el usuario.

### 3. Validación Defensiva de JSON con Zod
* **El Diagnóstico**: La restauración de un backup/json externo directamente al Zustand es peligrosa conforme el store muta (¡ya está en la `version 21`!). Si alguien importa un backup viejo, pueden faltar llaves que hagan crashear a `WallpaperViewport`.
* **El Remedio**: Integrar `zod` para las funciones de `projectSettings.ts`. Antes de inyectar el estado al store, el JSON debe ser parseado por `Zod`. Si la validación falla por faltar un campo (ej. se agregó `newParticleSystem` en la v22), Zod puede inyectar el valor predeterminado usando un esquema estricto, protegiendo a la app de la "pantalla blanca de la muerte" (White Screen of Death en React).

### 4. Extraer la Persistencia de Zustand
* **El Diagnóstico**: [wallpaperStorePersistence.ts](file:///Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/store/wallpaperStorePersistence.ts) maneja migraciones larguísimas y divide lógicas de persistencia pesada con ligereza. El store de estado debería reaccionar a la memoria, no ser el dictador de cómo grabar al disco.
* **El Remedio**: Crear un custom hook gestor por encima de Zustand que actúe como un Coordinador. Él le dice a Zustand que actualice, a IndexedDB que grabe imágenes, y guarda metadatos en un SQLite en browser o en el mismo IDB unificado, dejando al Store exclusivamente para "Estado Activo".
