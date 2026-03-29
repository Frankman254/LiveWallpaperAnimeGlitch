import { HashRouter, Routes, Route } from 'react-router-dom'
import EditorPage from '@/pages/EditorPage'
import PreviewPage from '@/pages/PreviewPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </HashRouter>
  )
}
