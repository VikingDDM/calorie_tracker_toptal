import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function PageShell({ title, children }) {
  const { user, signOut } = useAuth();

  return (
    <Box sx={{ backgroundColor: 'grey.100', minHeight: '100vh', pb: 6 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }} variant="h6">
            {title}
          </Typography>
          {user && (
            <Stack direction="row" spacing={2} alignItems="center">
              {user.role === 'ADMIN' && (
                <>
                  <Button color="inherit" component={NavLink} to="/admin/dashboard">
                    Dashboard
                  </Button>
                  <Button color="inherit" component={NavLink} to="/admin/my-entries">
                    My Entries
                  </Button>
                </>
              )}
              {user.role === 'USER' && (
                <Button color="inherit" component={NavLink} to="/app">
                  My Entries
                </Button>
              )}
              <Typography variant="body2">{user.name}</Typography>
              <Button color="inherit" onClick={signOut}>
                Sign out
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
