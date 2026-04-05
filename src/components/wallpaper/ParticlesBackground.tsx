import ParticleField from '@/components/wallpaper/ParticleField';

export default function ParticlesBackground({
	renderOrder = 10
}: {
	renderOrder?: number;
}) {
	return <ParticleField renderOrder={renderOrder} zPosition={0.02} />;
}
