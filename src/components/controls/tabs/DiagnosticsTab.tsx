import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import ToggleControl from '../ToggleControl'
import ResetButton from '../ui/ResetButton'
import TabSection from '../ui/TabSection'
import DiagnosticsAudioPreviews from './DiagnosticsAudioPreviews'

export default function DiagnosticsTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <p className="text-[11px] leading-snug text-cyan-800">{t.hint_diagnostics_intro}</p>

      <TabSection title={t.section_diagnostics_huds}>
        <ToggleControl
          label={t.label_bg_scale_meter}
          value={store.showBackgroundScaleMeter}
          onChange={store.setShowBackgroundScaleMeter}
          tooltip={t.hint_bg_scale_meter}
        />
        <ToggleControl
          label={t.label_spectrum_diag_toggle}
          value={store.showSpectrumDiagnosticsHud}
          onChange={store.setShowSpectrumDiagnosticsHud}
          tooltip={t.hint_spectrum_diag_hud}
        />
        <ToggleControl
          label={t.label_logo_diag_toggle}
          value={store.showLogoDiagnosticsHud}
          onChange={store.setShowLogoDiagnosticsHud}
          tooltip={t.hint_logo_diag_hud}
        />
      </TabSection>

      <TabSection title={t.section_diagnostics_previews}>
        <DiagnosticsAudioPreviews />
      </TabSection>
    </>
  )
}
