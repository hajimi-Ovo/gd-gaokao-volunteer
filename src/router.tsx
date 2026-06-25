import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import InputPage from './pages/InputPage'
import RecommendPage from './pages/RecommendPage'
import VolunteerPage from './pages/VolunteerPage'
import SchoolDetailPage from './pages/SchoolDetailPage'
import MajorDetailPage from './pages/MajorDetailPage'
import ComparePage from './pages/ComparePage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/input" element={<InputPage />} />
      <Route path="/recommend" element={<RecommendPage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/school/:id" element={<SchoolDetailPage />} />
      <Route path="/major/:id" element={<MajorDetailPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
