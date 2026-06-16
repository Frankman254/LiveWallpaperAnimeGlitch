# Estado del Proyecto - v0.2.0

## Estado actual

El proyecto esta en una etapa de consolidacion tecnica despues de una ronda grande de refactor por dominios (store, audio, overlays, layout responsive y render de background).

### Avances recientes confirmados

1. **Escenas y perfiles estables**
   - Se corrigio la aplicacion de escenas para evitar perdida de estado en spectrum/logo.
   - Se endurecio la hidratacion de perfiles para evitar campos incompletos en estado persistido.
2. **Refactor por ownership**
   - Se extrajeron modulos dedicados para layout responsive, drag de overlays, secciones de audio tab, migraciones/persistencia y pipeline de background.
   - Componentes grandes ahora funcionan mas como orquestadores.
3. **Mejoras de layout editor/HUD**
   - Se incorporaron calculos de escala responsive y limites de alto/ancho pre-transform para reducir overflow.
   - Aun existe un caso pendiente en multi-monitor (Brave) cuando cambia DPI/resolucion entre pantallas.
4. **Organizacion documental**
   - Se movieron planes/bitacoras a `docs/plans`, `docs/status`, `docs/guides` y `docs/archive`.
   - `docs/README.md` es ahora el indice principal.

## Estado de persistencia

- **Estado ligero:** `localStorage` via Zustand persist (`lwag-state`).
- **Assets binarios:** `IndexedDB` para wallpapers/logo/overlays y restauracion en arranque.

## Pendientes activos (alto impacto)

1. **Viewport multi-monitor**
   - Ajustar medicion de viewport para cambios de monitor/DPI usando estrategia robusta (incluyendo `visualViewport`).
   - Revalidar posicion y alto maximo del HUD/editor al mover ventana entre pantallas.
2. **Audio multitrack avanzado**
   - Extender playlist a transiciones/crossfade mas inteligentes.
3. **UX de guardado**
   - Indicadores de cambios sin guardar para presets/escenas.

## Referencias rapidas

- Arquitectura: `docs/ARQUITECTURA_GENERAL.md`
- Audio/render: `docs/AUDIO_RENDER_Y_SHADERS.md`
- Planes: `docs/plans/`
- Estado y handoffs: `docs/status/`
