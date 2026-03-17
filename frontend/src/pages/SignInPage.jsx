import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const demoTokens = ['ADMIN_TOKEN', 'USER1_TOKEN', 'USER2_TOKEN', 'USER3_TOKEN'];

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('USER1_TOKEN');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await signIn(token.trim());
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/app');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'grey.100' }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent>
          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <Typography variant="h4">Sign in</Typography>
            <Typography color="text.secondary" variant="body2">
              Use one of the predefined backend tokens to enter the application.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField fullWidth label="Access token" value={token} onChange={(event) => setToken(event.target.value)} />
            <Typography variant="body2">{`Demo tokens: ${demoTokens.join(', ')}`}</Typography>
            <Button disabled={submitting} type="submit" variant="contained">
              Sign in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
