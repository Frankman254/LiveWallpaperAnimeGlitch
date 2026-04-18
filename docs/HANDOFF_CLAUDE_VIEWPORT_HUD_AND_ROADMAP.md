# Handoff: viewport / HUD al cambiar de monitor (Brave) + roadmap

## Prompt corto (copiar a Claude)

```
Contexto: app Vite/React wallpaper editor. El HUD de Quick Actions (panel derecho,
QuickActionsPanel + useQuickActionsLayout) y el layout responsive usan
useViewportResolution() que solo escucha window "resize".

Bug reproducible: al mover la ventana de Brave entre monitores (distinta resolución/DPI),
el panel del editor/HUD queda mal (recorte, sin scroll, o posición incorrecta) hasta
recargar o hasta que algo fuerza un relayout.

Objetivos en orden:
1) Arreglar la fuente de verdad del viewport al mover ventana entre pantallas: considerar
   window.visualViewport (resize + scroll), posiblemente orientationchange,
   y/o un sync en requestAnimationFrame tras "resize" porque algunos navegadores no
   actualizan innerWidth/innerHeight en el mismo frame.
2) Asegurar que useQuickActionsLayout recalcula maxLayoutHeightUnscaled y posición
   cuando cambia el viewport real disponible (no solo altura de contenido).
3) Verificar ControlPanel/EditorOverlay si comparten el mismo hook o duplican lógica;
   un solo sitio para "viewport efectivo" evita desincronización.
4) Criterios de aceptación: mover la ventana entre monitores 5–10 veces seguidas sin
   que el HUD quede cortado ni fuera de viewport; scroll interno del HUD cuando el
   contenido supera el alto disponible.

Después de eso, continúa el roadmap de refactor ya acordado en el repo (ownership
de dominio, sin mezclar lógica profunda en UI). Revisa AGENTS.md y los módulos
src/features/layout/, src/store/slices/, Audio hooks.

No hags cambios masivos no pedidos; prioriza el fix de viewport + tests manuales en
Brave y Chrome.
```

---

## Estado actual (qué ya existe)

| Área | Archivos |
|------|----------|
| Medida de viewport | `src/features/layout/viewportMetrics.ts` — `useViewportResolution` solo `resize` + `innerWidth`/`innerHeight` |
| HUD Quick Actions | `useQuickActionsLayout.ts`, `QuickActionsShell.tsx`, `QuickActionsPanel.tsx` |
| Layout responsive global | `src/features/layout/responsiveLayout.ts` — `resolveResponsiveHudLayout`, `resolveResponsiveEditorLayout`, etc. |
| Panel flotante / overlay | `ControlPanel.tsx`, `EditorOverlay.tsx` |

**Intento previo:** cap de `maxHeight` al viewport + scroll interno en el HUD (`overflow-y-auto`) + flex `min-h-0`. Eso ayuda en pantalla fija, pero **no** si el hook de viewport **no se actualiza** al mover la ventana entre monitores (comportamiento frecuente en Chromium/Brave).

---

## Hipótesis técnicas (priorizar verificación)

1. **`resize` no basta al mover entre monitores** — DPI/scale factor cambia; a veces el evento llega tarde o `innerHeight` no refleja el viewport visible aún.
2. **`visualViewport`** — más fiel al área pintable cuando hay barras de UI, zoom, o quirks del OS; conviene `visualViewport.addEventListener('resize', …)` y opcionalmente `'scroll'`.
3. **`ResizeObserver` en el panel** mide el nodo, pero si `viewportSize` en React está stale, `maxLayoutHeightUnscaled` queda **desfasado** respecto al monitor nuevo.
4. **Brave** — mismo motor Chromium; si falla solo en Brave, revisar shields/extensiones y comparar con Chrome; pero el fix suele ser el mismo (viewport + frame).

---

## Dirección de implementación sugerida

1. **Extender `getCurrentViewportResolution` / `useViewportResolution`**  
   - Sincronizar desde `window.innerWidth/innerHeight` **y** `visualViewport.width/height` (o el rect mínimo que represente el área útil).  
   - Suscribirse a `visualViewport` resize + resize de ventana.  
   - Opcional: `queueMicrotask` o `requestAnimationFrame` doble tras resize para leer valores tras el layout del navegador.

2. **Unificar consumo** — todo lo que hoy depende de `useViewportResolution` (HUD, editor scale, responsive layout) debería beneficiarse sin duplicar listeners.

3. **Pruebas manuales**  
   - Mover ventana entre monitores (distinta resolución y escala).  
   - Maximizar / restaurar.  
   - Fullscreen del editor si aplica.

4. **No persistir** valores derivados automáticos al store; solo lectura de viewport en runtime.

---

## Roadmap después del fix (continuar implementación)

Orden sugerido, alineado con conversaciones previas:

| Fase | Tema | Notas |
|------|------|--------|
| ✅ | Layout responsive + `layoutSlice` / `responsiveLayout.ts` | Base |
| ✅ | Spectrum: macros en `spectrumSlice`, `spectrumPlacement.ts` | |
| ✅ | Audio: dividir `AudioDataContext` en hooks (captura, playlist, efectos) | |
| ✅ | Fase 4: `controlPanelResetKeys`, `editorThemeClasses`, menos peso en `ControlPanel` | |
| **Siguiente** | **`setAllUiColorSources` en `systemSlice`** — desacoplar o acción explícita de sync; no mezclar Theme + Spectrum + Logo + Rain en un solo setter opaco | |
| | **Placement único** `resolveSpectrumPlacement` / followLogo — ya parcialmente en `spectrumPlacement.ts`; consolidar UI + drag + overlay | |
| | **AudioTab / persistencia** — solo tras estabilizar viewport y HUD | |

---

## Referencias rápidas en código

- `normalizedToPixel` — `quickActionsShared.ts` (posición HUD con tamaño del elemento y viewport).
- `resolveResponsiveHudLayout` — escala del HUD según referencia de layout.
- Reglas del repo: `AGENTS.md` (Next interno).

---

*Fecha de redacción: handoff para continuidad en otra sesión / otro agente.*
