import { useEffect, useSyncExternalStore } from 'react'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'
import {
  getLogoDiagnosticsSnapshot,
  resetLogoDiagnosticsTelemetry,
  subscribeLogoDiagnosticsTelemetry,
} from '@/lib/debug/logoDiagnosticsTelemetry'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function LogoDiagnosticsHud() {
  const t = useT()
  const enabled = useWallpaperStore((s) => s.showLogoDiagnosticsHud)
  const editorTheme = useWallpaperStore((s) => s.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  const logoMinScale = useWallpaperStore((s) => s.logoMinScale)
  const logoMaxScale = useWallpaperStore((s) => s.logoMaxScale)
  const logoEnabledStore = useWallpaperStore((s) => s.logoEnabled)

  useEffect(() => {
    if (!enabled) return
    resetLogoDiagnosticsTelemetry()
    return () => resetLogoDiagnosticsTelemetry()
  }, [enabled])

  const snap = useSyncExternalStore(
    subscribeLogoDiagnosticsTelemetry,
    getLogoDiagnosticsSnapshot,
    getLogoDiagnosticsSnapshot
  )

  if (!enabled) return null

  const span = Math.max(1e-6, logoMaxScale - logoMinScale)
  const scaleTen = Math.min(10, Math.max(0, ((snap.envelopeScale - logoMinScale) / span) * 10))
  const normPct = Math.round(snap.normalizedAmplitude * 100)

  return (
    <div
      className={`w-full rounded-md border px-2.5 py-2 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-sm ${theme.sectionShell}`}
      aria-hidden
    >
      <div className={`mb-1 ${theme.sectionTitle}`}>{t.label_logo_diag_hud_title}</div>
      {!logoEnabledStore && (
        <div className={theme.panelSubtle}>{t.label_logo_diag_logo_off}</div>
      )}
      <div
        className="mb-1.5 h-2 w-full overflow-hidden rounded bg-black/45"
        title={t.hint_logo_diag_hud}
      >
        <div
          className={`h-full rounded-sm ${theme.toggleOn} opacity-90`}
          style={{ width: `${Math.min(100, Math.round((scaleTen / 10) * 100))}%` }}
        />
      </div>
      <div className={`grid gap-0.5 ${theme.panelSubtle}`}>
        <div>
          {t.label_logo_diag_scale_ten}:{' '}
          <span className={theme.sectionTitle}>{scaleTen.toFixed(1)}</span>
          /10 ({logoMinScale.toFixed(2)}–{logoMaxScale.toFixed(2)})
        </div>
        <div>
          {t.label_spectrum_diag_channel}:{' '}
          <span className={theme.sectionTitle}>
            {snap.bandModeRequested} → {snap.resolvedChannel}
          </span>
        </div>
        <div>
          {t.label_logo_diag_drive}:{' '}
          <span className={theme.sectionTitle}>{snap.driveScaled.toFixed(3)}</span>
          {' · '}
          {t.label_spectrum_diag_smoothed}:{' '}
          <span className={theme.sectionTitle}>{snap.channelInstant.toFixed(3)}</span>
        </div>
        <div>
          {t.label_logo_diag_envelope}:{' '}
          <span className={theme.sectionTitle}>{snap.envelopeScale.toFixed(3)}</span>
          {' · norm '}
          <span className={theme.sectionTitle}>{snap.normalizedAmplitude.toFixed(3)}</span> ({normPct}%)
        </div>
        <div>
          σ {snap.smoothedAmplitude.toFixed(3)} · peak {snap.adaptivePeak.toFixed(3)} · floor{' '}
          {snap.adaptiveFloor.toFixed(3)}
        </div>
        <div>
          size {snap.logoBaseSize.toFixed(0)} →{' '}
          <span className={theme.sectionTitle}>{snap.renderedSize.toFixed(1)}</span> px
        </div>
        <div>
          pos{' '}
          <span className={theme.sectionTitle}>
            {snap.logoPositionX.toFixed(3)},{snap.logoPositionY.toFixed(3)}
          </span>
        </div>
        <div className="text-[9px]">
          {t.label_spectrum_diag_follow}:{' '}
          <span className={theme.sectionTitle}>
            {snap.spectrumFollowLogo ? t.label_bg_scale_meter_yes : t.label_bg_scale_meter_no}
          </span>
          {snap.spectrumUsesLogoPlacement
            ? ` · ${t.label_logo_diag_spectrum_uses_logo}`
            : ''}
        </div>
      </div>
    </div>
  )
}
