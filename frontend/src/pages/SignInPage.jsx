import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('USER1_TOKEN');
  const [error, setError] = useState('');
  const [tokensError, setTokensError] = useState('');
  const [signInTokens, setSignInTokens] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadTokens() {
      try {
        const users = await api.signInTokens();
        if (!ignore) {
          setSignInTokens(users);
        }
      } catch (loadError) {
        if (!ignore) {
          setTokensError(loadError.message);
        }
      }
    }

    loadTokens();

    return () => {
      ignore = true;
    };
  }, []);

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
              Use any current user token from the backend to enter the application, including invited users.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {tokensError && <Alert severity="warning">{tokensError}</Alert>}
            <TextField fullWidth label="Access token" value={token} onChange={(event) => setToken(event.target.value)} />
            <Stack spacing={1}>
              <Typography variant="body2">Available user tokens:</Typography>
              {signInTokens.map((user) => (
                <Typography key={user.token} variant="body2">
                  {`${user.name} (${user.role}): ${user.token}`}
                </Typography>
              ))}
            </Stack>
            <Button disabled={submitting} type="submit" variant="contained">
              Sign in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
