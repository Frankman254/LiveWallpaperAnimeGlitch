import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import EditorPage from '@/pages/EditorPage';
import PreviewPage from '@/pages/PreviewPage';

export default function App() {
	return (
		<HashRouter>
			<Routes>
				<Route path="/" element={<Navigate replace to="/editor" />} />
				<Route path="/editor" element={<EditorPage />} />
				<Route path="/preview" element={<PreviewPage />} />
			</Routes>
		</HashRouter>
	);
}
