import ParticleField from '@/components/wallpaper/ParticleField'

export default function ParticlesForeground({ renderOrder = 30 }: { renderOrder?: number }) {
  return <ParticleField renderOrder={renderOrder} zPosition={0.5} />
}
