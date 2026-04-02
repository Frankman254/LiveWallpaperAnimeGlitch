import { useEffect, useSyncExternalStore } from 'react'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'
import {
  getSpectrumDiagnosticsSnapshot,
  resetSpectrumDiagnosticsTelemetry,
  subscribeSpectrumDiagnosticsTelemetry,
} from '@/lib/debug/spectrumDiagnosticsTelemetry'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'

function approxEqual(a: number, b: number, eps = 0.002): boolean {
  return Math.abs(a - b) <= eps
}

export default function SpectrumDiagnosticsHud() {
  const t = useT()
  const enabled = useWallpaperStore((s) => s.showSpectrumDiagnosticsHud)
  const editorTheme = useWallpaperStore((s) => s.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  const logoPositionX = useWallpaperStore((s) => s.logoPositionX)
  const logoPositionY = useWallpaperStore((s) => s.logoPositionY)
  const spectrumCircularClone = useWallpaperStore((s) => s.spectrumCircularClone)
  const logoEnabled = useWallpaperStore((s) => s.logoEnabled)
  const spectrumMode = useWallpaperStore((s) => s.spectrumMode)
  const cloneHudRelevant = spectrumCircularClone && logoEnabled && spectrumMode === 'linear'

  useEffect(() => {
    if (!enabled) return
    resetSpectrumDiagnosticsTelemetry()
    return () => resetSpectrumDiagnosticsTelemetry()
  }, [enabled])

  const snap = useSyncExternalStore(
    subscribeSpectrumDiagnosticsTelemetry,
    getSpectrumDiagnosticsSnapshot,
    getSpectrumDiagnosticsSnapshot
  )

  if (!enabled) return null

  function renderSlice(
    label: string,
    slice: NonNullable<typeof snap.primary>,
    showFollowHint: boolean,
    withTopBorder: boolean
  ) {
    const posLockedToLogo = slice.followLogoEffective
      && approxEqual(slice.positionNormX, logoPositionX)
      && approxEqual(slice.positionNormY, logoPositionY)
    const gainPct = Math.round(slice.globalGain * 100)

    return (
      <div
        key={label}
        className={
          withTopBorder ? 'border-t border-white/10 pt-1.5' : ''
        }
      >
        <div className={`mb-0.5 ${theme.sectionTitle}`}>{label}</div>
        <div
          className="mb-1 h-1.5 w-full overflow-hidden rounded bg-black/45"
          title={t.hint_spectrum_diag_hud}
        >
          <div
            className={`h-full rounded-sm ${theme.toggleOn} opacity-90`}
            style={{ width: `${Math.min(100, Math.round(slice.envelopeNormalized * 100))}%` }}
          />
        </div>
        <div className={`grid gap-0.5 ${theme.panelSubtle}`}>
          <div>
            {t.label_spectrum_diag_channel}:{' '}
            <span className={theme.sectionTitle}>
              {slice.bandModeRequested} → {slice.resolvedChannel}
            </span>
          </div>
          <div>
            {t.label_spectrum_diag_drive}:{' '}
            <span className={theme.sectionTitle}>{slice.channelInstant.toFixed(3)}</span>
            {' · '}
            {t.label_spectrum_diag_smoothed}:{' '}
            <span className={theme.sectionTitle}>{slice.channelSmoothed.toFixed(3)}</span>
          </div>
          <div>
            {t.label_spectrum_diag_bins}:{' '}
            <span className={theme.sectionTitle}>{slice.meanBinEnergy.toFixed(4)}</span>
            {' · '}
            {t.label_spectrum_diag_gain}:{' '}
            <span className={theme.sectionTitle}>{slice.globalGain.toFixed(3)}</span> ({gainPct}%)
          </div>
          <div>
            {t.label_spectrum_diag_mode}: <span className={theme.sectionTitle}>{slice.spectrumMode}</span>
            {' · '}
            {slice.barCount} bars
          </div>
          <div>
            {t.label_spectrum_diag_inner_r}:{' '}
            <span className={theme.sectionTitle}>{slice.innerRadius.toFixed(1)}</span>
            {' · '}cx,cy{' '}
            <span className={theme.sectionTitle}>
              {Math.round(slice.canvasCx)},{Math.round(slice.canvasCy)}
            </span>
          </div>
          <div>
            pos{' '}
            <span className={theme.sectionTitle}>
              {slice.positionNormX.toFixed(3)},{slice.positionNormY.toFixed(3)}
            </span>
          </div>
          {showFollowHint && (
            <div className="text-[9px]">
              {t.label_spectrum_diag_follow}:{' '}
              <span className={theme.sectionTitle}>
                {slice.followLogoSetting ? t.label_bg_scale_meter_yes : t.label_bg_scale_meter_no}
              </span>
              {slice.followLogoEffective ? ` · ${t.label_spectrum_diag_follow_effective}` : ''}
              {posLockedToLogo && slice.followLogoEffective
                ? ` · ${t.label_spectrum_diag_pos_matches_logo}`
                : ''}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-full rounded-md border px-2.5 py-2 font-mono text-[10px] leading-tight shadow-lg backdrop-blur-sm ${theme.sectionShell}`}
      aria-hidden
    >
      <div className={`mb-1 ${theme.sectionTitle}`}>{t.label_spectrum_diag_hud_title}</div>
      {!snap.primary && (
        <div className={theme.panelSubtle}>{t.label_spectrum_diag_no_data}</div>
      )}
      {snap.primary && renderSlice(t.label_spectrum_diag_primary, snap.primary, true, false)}
      {cloneHudRelevant && (
        snap.clone
          ? renderSlice(t.label_spectrum_diag_clone, snap.clone, true, true)
          : (
            <div className={`mt-1 border-t border-white/10 pt-1 text-[9px] ${theme.panelSubtle}`}>
              {t.label_spectrum_diag_clone_idle}
            </div>
          )
      )}
    </div>
  )
}
