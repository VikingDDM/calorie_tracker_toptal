import { useEffect, useState } from 'react';
import { Alert, Box, Snackbar, Stack } from '@mui/material';

import { api } from '../api/client';
import AdminEntryManager from '../components/AdminEntryManager';
import AdminCharts from '../components/AdminCharts';
import EntryList from '../components/EntryList';
import ObservabilityFeed from '../components/ObservabilityFeed';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [averages, setAverages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserMeals, setSelectedUserMeals] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [entriesData, comparisonData, averagesData, usersData] = await Promise.all([
        api.entries(token),
        api.entriesComparison(token),
        api.averageCalories(token),
        api.users(token),
      ]);
      setEntries(entriesData);
      setComparison(comparisonData);
      setAverages(averagesData);
      setUsers(usersData);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleDelete = async (entryId) => {
    try {
      await api.deleteEntry(token, entryId);
      setMessage('Entry deleted.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleUserChange = async (userId) => {
    try {
      const meals = await api.meals(token, userId);
      setSelectedUserMeals(meals);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const handleCreate = async (payload) => {
    try {
      await api.createEntry(token, payload);
      setMessage('Entry created.');
      await loadData();
    } catch (createError) {
      setError(createError.message);
      throw createError;
    }
  };

  const handleEditOpen = async (entry) => {
    setEditEntry(entry);
    await handleUserChange(entry.userId);
  };

  const handleUpdate = async (entryId, payload) => {
    try {
      await api.updateEntry(token, entryId, payload);
      setMessage('Entry updated.');
      setEditEntry(null);
      await loadData();
    } catch (updateError) {
      setError(updateError.message);
      throw updateError;
    }
  };

  return (
    <PageShell title="Admin Dashboard">
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        <AdminCharts averages={averages} comparison={comparison} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <AdminEntryManager
              editEntry={editEntry}
              meals={selectedUserMeals}
              onCloseEdit={() => setEditEntry(null)}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onUserChange={handleUserChange}
              users={users}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' }, minWidth: 280 }}>
            <EntryList
              adminMode
              calorieLimit={null}
              entries={entries}
              onDelete={handleDelete}
              onEdit={handleEditOpen}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' }, minWidth: 280 }}>
            <ObservabilityFeed token={token} />
          </Box>
        </Box>
      </Stack>
      <Snackbar autoHideDuration={3000} open={Boolean(message)} onClose={() => setMessage('')}>
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}
