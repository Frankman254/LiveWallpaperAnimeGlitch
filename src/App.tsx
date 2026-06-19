import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import EditorPage from '@/pages/EditorPage';
import PreviewPage from '@/pages/PreviewPage';

const SpectrumFxLabPage = import.meta.env.DEV
	? () =>
			import('@/dev/spectrumFxLab/SpectrumFxLabPage').then(m => ({
				default: m.default
			}))
	: null;

function DevSpectrumFxRoute() {
	if (!SpectrumFxLabPage) return <Navigate replace to="/editor" />;
	const Lazy = lazy(SpectrumFxLabPage);
	return (
		<Suspense fallback={null}>
			<Lazy />
		</Suspense>
	);
}

export default function App() {
	return (
		<HashRouter>
			<Routes>
				<Route path="/" element={<Navigate replace to="/editor" />} />
				<Route path="/editor" element={<EditorPage />} />
				<Route path="/preview" element={<PreviewPage />} />
				{import.meta.env.DEV ? (
					<Route
						path="/dev/spectrum-fx"
						element={<DevSpectrumFxRoute />}
					/>
				) : null}
			</Routes>
		</HashRouter>
	);
}
