import { useEffect, useState } from 'react';
import { Alert, Box, Snackbar, Stack } from '@mui/material';

import { api } from '../api/client';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import InviteFriendWidget from '../components/InviteFriendWidget';
import MealManager from '../components/MealManager';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';

export default function UserEntriesPage() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [meals, setMeals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [entriesData, mealsData] = await Promise.all([api.entries(token), api.meals(token)]);
      setEntries(entriesData);
      setMeals(mealsData);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreate = async (payload) => {
    setBusy(true);
    setError('');
    try {
      await api.createEntry(token, payload);
      setMessage('Food entry created.');
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (payload) => {
    setBusy(true);
    setError('');
    try {
      const result = await api.inviteFriend(token, payload);
      setMessage('Friend invited.');
      return result;
    } catch (inviteError) {
      setError(inviteError.message);
      throw inviteError;
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (mealId, name) => {
    setBusy(true);
    setError('');
    try {
      await api.renameMeal(token, mealId, name);
      setMessage('Meal renamed.');
      await loadData();
    } catch (renameError) {
      setError(renameError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Calorie Tracker">
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' }, minWidth: 280 }}>
            <EntryForm meals={meals} onSubmit={handleCreate} submitting={busy} />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' }, minWidth: 280 }}>
            <MealManager meals={meals} onRename={handleRename} />
          </Box>
        </Box>
        <EntryList calorieLimit={user.dailyCalorieLimit} entries={entries} />
        <InviteFriendWidget onInvite={handleInvite} submitting={busy} />
      </Stack>
      <Snackbar autoHideDuration={3000} open={Boolean(message)} onClose={() => setMessage('')}>
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}
