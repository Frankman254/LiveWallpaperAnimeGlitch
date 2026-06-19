import { useSpectrumManualKeyboard } from '@/features/spectrum/manual/useSpectrumManualKeyboard';

export default function SpectrumManualKeyboardGate({
	enabled
}: {
	enabled: boolean;
}) {
	useSpectrumManualKeyboard(enabled);
	return null;
}
