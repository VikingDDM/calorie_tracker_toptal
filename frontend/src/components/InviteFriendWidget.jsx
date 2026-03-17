import { useState } from 'react';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export default function InviteFriendWidget({ onInvite, submitting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setError('');
    const result = await onInvite({ name: name.trim(), email: email.trim() });
    setSuccess(result);
    setName('');
    setEmail('');
  };

  return (
    <Card>
      <CardContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h6">Invite a friend</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">
              {`Password: ${success.generatedPassword} | Token: ${success.generatedToken}`}
            </Alert>
          )}
          <TextField fullWidth label="Friend name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField fullWidth label="Friend email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button disabled={submitting} type="submit" variant="contained">
            Invite user
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
