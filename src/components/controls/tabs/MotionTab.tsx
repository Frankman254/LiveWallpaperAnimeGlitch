import ParticlesTab from './ParticlesTab';
import RainTab from './RainTab';
import SectionDivider from '../ui/SectionDivider';

type Props = {
	onResetParticles: () => void;
	onResetRain: () => void;
};

export default function MotionTab({
	onResetParticles,
	onResetRain
}: Props) {
	return (
		<>
			<ParticlesTab onReset={onResetParticles} />
			<SectionDivider label="Rain" />
			<RainTab onReset={onResetRain} />
		</>
	);
}
