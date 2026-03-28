import { useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import SliderControl from './SliderControl'
import ToggleControl from './ToggleControl'
import PresetSelector from './PresetSelector'
import ImageUploader from './ImageUploader'
import type { PerformanceMode } from '@/types/wallpaper'

const PERFORMANCE_MODES: PerformanceMode[] = ['low', 'medium', 'high']

export default function ControlPanel() {
  const [open, setOpen] = useState(false)
  const store = useWallpaperStore()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors"
      >
        {open ? '×' : '⚙'}
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 w-72 bg-black/90 border border-cyan-900 rounded-lg p-4 flex flex-col gap-4 backdrop-blur-sm shadow-xl shadow-cyan-500/10 max-h-[80vh] overflow-y-auto">
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">
            Live Wallpaper Controls
          </span>

          <PresetSelector />
          <ImageUploader />

          <div className="h-px bg-cyan-900" />

          <SliderControl
            label="Glitch Intensity"
            value={store.glitchIntensity}
            min={0} max={0.5} step={0.01}
            onChange={store.setGlitchIntensity}
          />
          <SliderControl
            label="RGB Shift"
            value={store.rgbShift}
            min={0} max={0.02} step={0.001}
            onChange={store.setRgbShift}
          />
          <SliderControl
            label="Scanlines"
            value={store.scanlineIntensity}
            min={0} max={0.5} step={0.01}
            onChange={store.setScanlineIntensity}
          />
          <SliderControl
            label="Parallax"
            value={store.parallaxStrength}
            min={0} max={0.1} step={0.005}
            onChange={store.setParallaxStrength}
          />
          <SliderControl
            label="Particles"
            value={store.particleCount}
            min={0} max={150} step={5}
            onChange={store.setParticleCount}
          />
          <SliderControl
            label="Particle Speed"
            value={store.particleSpeed}
            min={0} max={2} step={0.1}
            onChange={store.setParticleSpeed}
          />

          <div className="h-px bg-cyan-900" />

          <ToggleControl
            label="Rain"
            value={store.rainEnabled}
            onChange={store.setRainEnabled}
          />
          {store.rainEnabled && (
            <SliderControl
              label="Rain Intensity"
              value={store.rainIntensity}
              min={0} max={1} step={0.05}
              onChange={store.setRainIntensity}
            />
          )}

          <div className="h-px bg-cyan-900" />

          <ToggleControl
            label="Audio Reactive"
            value={store.audioReactive}
            onChange={store.setAudioReactive}
          />
          {store.audioReactive && (
            <SliderControl
              label="Audio Sensitivity"
              value={store.audioSensitivity}
              min={0} max={3} step={0.1}
              onChange={store.setAudioSensitivity}
            />
          )}

          <div className="h-px bg-cyan-900" />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400 uppercase tracking-widest">Performance</span>
            <div className="flex gap-2">
              {PERFORMANCE_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => store.setPerformanceMode(mode)}
                  className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                    store.performanceMode === mode
                      ? 'bg-cyan-500 border-cyan-500 text-black'
                      : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-cyan-900" />

          <button
            onClick={store.reset}
            className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}
