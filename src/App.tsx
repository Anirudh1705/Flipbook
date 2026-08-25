import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HomePage } from './pages/HomePage';
import { BookViewerPage } from './pages/BookViewerPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <SpeedInsights />
      <Routes>
        {/* Public Homepage with 25-book library grid */}
        <Route path="/" element={<HomePage />} />

        {/* Dedicated high-performance flipbook reader */}
        <Route path="/book/:slug" element={<BookViewerPage />} />

        {/* Administration (Protected by Admin Whitelist) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
