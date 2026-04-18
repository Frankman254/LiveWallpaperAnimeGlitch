# Performance & Precision Engineering: HUD Progress Bar

> Status: targeted improvement plan (point fix).
> Scope: optimize HUD progress interaction without broad architecture changes.

The HUD progress bar currently triggers a full re-render of the `QuickActionsPanel` (~1300 lines) every 16ms (60fps) via the Animation Frame loop. This causes significant performance drag, leading to unresponsive clicks and laggy interaction.

## Proposed Changes

### Component Architecture & Optimization

#### [MODIFY] [QuickActionsPanel.tsx](file:///Users/frankman254/Desktop/Personal-Projects/LiveWallpaperAnimeGlitch/src/components/wallpaper/QuickActionsPanel.tsx)

1.  **Isolate Progress State**: Move `currentTime`, `duration`, and `isDraggingSeekRef` into a new sub-component `QuickActionsProgressBar`.
2.  **RAF Encapsulation**: Move the `requestAnimationFrame` loop into the sub-component so it only affects the local progress bar UI.
3.  **Memoization**: Use `React.memo` for the sub-component to ensure it only re-renders if the theme or layout settings change, not when the global store updates unrelated properties.
4.  **Interaction Polish**:
    *   Optimize the `input` step and handlers to ensure immediate visual feedback.
    *   Clean up redundant `commitSeek` calls between `onPointerUp` and `onChange`.

## Verification Plan

### Manual Verification
*   **Response Speed**: Verify that clicking once on the bar immediately jumps the track.
*   **Interaction Smoothness**: Drag the slider and confirm the visual indicator follows the cursor at 60fps without lag.
*   **Stability**: Verify that time updates stop when the panel is closed and switch to a low-frequency interval (as currently implemented) but within the sub-component.
