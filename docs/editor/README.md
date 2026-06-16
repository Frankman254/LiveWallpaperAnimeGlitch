# Editor UI — documentación vigente

Documentación alineada con el estado actual del editor (pestañas `Modern*Tab`, scaffold compartido, jerarquía canónica).

> La carpeta `docs/` raíz y sus subcarpetas `plans/`, `status/` y `archive/` contienen material histórico o desactualizado. Para trabajo activo del editor, usar **solo esta carpeta**.

## Índice

| Documento                                                    | Contenido                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| [PLAN_JERARQUIA_PESTANAS.md](./PLAN_JERARQUIA_PESTANAS.md)   | Reglas de jerarquía, anatomía canónica y mecanismo de enforcement   |
| [SESION_CLAUDE_2026-06-05.md](./SESION_CLAUDE_2026-06-05.md) | Contexto de la sesión en terminal, fases de implementación y estado |

## Lectura recomendada

1. `PLAN_JERARQUIA_PESTANAS.md` — qué orden debe tener cada pestaña y por qué
2. Código fuente: `src/ui/EditorTabLayout.tsx`, `EditorTabHeader.tsx`, `EditorTabFooter.tsx`
3. Referencia migrada: `src/components/controls/tabs/modern/ModernSpectrumTab.tsx`
4. `SESION_CLAUDE_2026-06-05.md` — progreso y pendientes al cerrar la sesión

## Reglas de mantenimiento

- Nuevos planes o decisiones de UI del editor van aquí, no en `docs/plans/`.
- Al completar una migración de pestaña, actualizar el checklist en la sesión más reciente o añadir una entrada breve de estado.
