import { useEffect, useSyncExternalStore } from 'react'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'
import {
  getBackgroundScaleTelemetrySnapshot,
  resetBackgroundScaleTelemetry,
  subscribeBackgroundScaleTelemetry,
} from '@/lib/debug/backgroundScaleTelemetry'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function BackgroundScaleMeter() {
  const t = useT()
  const enabled = useWallpaperStore((s) => s.showBackgroundScaleMeter)
  const editorTheme = useWallpaperStore((s) => s.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]

  useEffect(() => {
    if (!enabled) return
    resetBackgroundScaleTelemetry()
    return () => resetBackgroundScaleTelemetry()
  }, [enabled])

  const snap = useSyncExternalStore(
    subscribeBackgroundScaleTelemetry,
    getBackgroundScaleTelemetrySnapshot,
    getBackgroundScaleTelemetrySnapshot
  )

  if (!enabled) return null

  const maxB = snap.maxBoost
  const growth01 = maxB > 1e-6 ? Math.min(1, Math.max(0, snap.bassBoost / maxB)) : 0
  const scaleTen = growth01 * 10
  const pct = Math.round(growth01 * 100)
  const totalScale = snap.baseScale + snap.bassBoost
  const normPct = Math.round(snap.envelopeNormalized * 100)

  return (
    <div
      className={`w-full rounded-md border px-2.5 py-2 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-sm ${theme.sectionShell}`}
      aria-hidden
    >
      <div className={`mb-1 flex items-center justify-between gap-2 ${theme.sectionTitle}`}>
        <span>{t.label_bg_scale_meter}</span>
        {!snap.hasSignal && (
          <span className={theme.panelSubtle}>{t.label_bg_scale_meter_no_bg}</span>
        )}
      </div>

      <div
        className="mb-1.5 h-2 w-full overflow-hidden rounded bg-black/45"
        title={t.hint_bg_scale_meter}
      >
        <div
          className={`h-full rounded-sm ${theme.toggleOn} opacity-90`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`grid grid-cols-1 gap-0.5 ${theme.panelSubtle}`}>
        <div>
          {t.label_bg_scale_meter_grow}: <span className={theme.sectionTitle}>{scaleTen.toFixed(1)}</span>
          /10 · {pct}%
        </div>
        <div>
          {t.label_bg_scale_meter_drive}:{' '}
          <span className={theme.sectionTitle}>{snap.driveInstant.toFixed(3)}</span>
          {' · '}
          {t.label_bg_scale_meter_router}:{' '}
          <span className={theme.sectionTitle}>{snap.channelRouterSmoothed.toFixed(3)}</span>
        </div>
        <div>
          {t.label_bg_scale_meter_envelope}:{' '}
          <span className={theme.sectionTitle}>{snap.bassBoost.toFixed(3)}</span>
          {' · norm '}
          <span className={theme.sectionTitle}>{snap.envelopeNormalized.toFixed(3)}</span> ({normPct}%)
        </div>
        <div>
          σ {snap.envelopeSmoothed.toFixed(3)} · peak {snap.adaptivePeak.toFixed(3)} · floor{' '}
          {snap.adaptiveFloor.toFixed(3)}
        </div>
        <div>
          {t.label_bg_scale_meter_total}:{' '}
          <span className={theme.sectionTitle}>
            {snap.baseScale.toFixed(2)} + {snap.bassBoost.toFixed(3)} = {totalScale.toFixed(3)}
          </span>
        </div>
        <div>
          {t.label_bg_scale_meter_reactive}:{' '}
          <span className={theme.sectionTitle}>
            {snap.imageBassReactive ? t.label_bg_scale_meter_yes : t.label_bg_scale_meter_no}
          </span>
        </div>
      </div>
    </div>
  )
}
