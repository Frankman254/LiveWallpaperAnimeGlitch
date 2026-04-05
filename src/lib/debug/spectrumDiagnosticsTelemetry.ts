export type SpectrumDiagnosticsSlice = {
	instance: 'primary' | 'clone-circular';
	bandModeRequested: string;
	resolvedChannel: string;
	channelInstant: number;
	channelSmoothed: number;
	meanBinEnergy: number;
	envelopeNormalized: number;
	globalGain: number;
	spectrumMode: string;
	followLogoSetting: boolean;
	followLogoEffective: boolean;
	innerRadius: number;
	canvasCx: number;
	canvasCy: number;
	positionNormX: number;
	positionNormY: number;
	barCount: number;
};

export type SpectrumDiagnosticsSnapshot = {
	primary: SpectrumDiagnosticsSlice | null;
	clone: SpectrumDiagnosticsSlice | null;
};

const empty: SpectrumDiagnosticsSnapshot = {
	primary: null,
	clone: null
};

let snapshot: SpectrumDiagnosticsSnapshot = { ...empty };
const listeners = new Set<() => void>();

function notify(): void {
	listeners.forEach(listener => listener());
}

export function publishSpectrumDiagnosticsSlice(
	slice: SpectrumDiagnosticsSlice
): void {
	if (slice.instance === 'primary') {
		snapshot = { ...snapshot, primary: slice };
	} else {
		snapshot = { ...snapshot, clone: slice };
	}
	notify();
}

export function clearSpectrumDiagnosticsClone(): void {
	snapshot = { ...snapshot, clone: null };
	notify();
}

export function resetSpectrumDiagnosticsTelemetry(): void {
	snapshot = { ...empty };
	notify();
}

export function subscribeSpectrumDiagnosticsTelemetry(
	onStoreChange: () => void
): () => void {
	listeners.add(onStoreChange);
	return () => listeners.delete(onStoreChange);
}

export function getSpectrumDiagnosticsSnapshot(): SpectrumDiagnosticsSnapshot {
	return snapshot;
}
