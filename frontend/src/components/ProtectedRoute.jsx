import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/app'} replace />;
  }

  return children;
}
