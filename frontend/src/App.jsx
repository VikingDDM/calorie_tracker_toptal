import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMyEntriesPage from './pages/AdminMyEntriesPage';
import SignInPage from './pages/SignInPage';
import UserEntriesPage from './pages/UserEntriesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <UserEntriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/my-entries"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminMyEntriesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
