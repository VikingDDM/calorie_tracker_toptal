import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const initialForm = {
  userId: '',
  mealId: '',
  foodName: '',
  calories: '',
  takenAt: new Date().toISOString().slice(0, 16),
};

export default function AdminEntryManager({
  users,
  meals,
  onUserChange,
  onCreate,
  onUpdate,
  editEntry,
  onCloseEdit,
}) {
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (users.length > 0 && !createForm.userId) {
      const firstUser = users[0];
      setCreateForm((current) => ({ ...current, userId: firstUser.id }));
      onUserChange(firstUser.id);
    }
  }, [users, createForm.userId, onUserChange]);

  useEffect(() => {
    if (meals.length > 0 && !createForm.mealId) {
      setCreateForm((current) => ({ ...current, mealId: meals[0].id }));
    }
  }, [meals, createForm.mealId]);

  useEffect(() => {
    if (!editEntry) {
      return;
    }
    setEditForm({
      userId: editEntry.userId,
      mealId: editEntry.mealId,
      foodName: editEntry.foodName,
      calories: editEntry.calories,
      takenAt: new Date(editEntry.takenAt).toISOString().slice(0, 16),
    });
    setEditError('');
  }, [editEntry]);

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!createForm.userId || !createForm.mealId || !createForm.foodName.trim() || Number(createForm.calories) <= 0) {
      setError('All fields are required and calories must be greater than zero.');
      return;
    }
    setError('');
    await onCreate({
      userId: Number(createForm.userId),
      mealId: Number(createForm.mealId),
      foodName: createForm.foodName.trim(),
      calories: Number(createForm.calories),
      takenAt: new Date(createForm.takenAt).toISOString(),
    });
    setCreateForm((current) => ({
      ...initialForm,
      userId: current.userId,
      mealId: current.mealId,
      takenAt: new Date().toISOString().slice(0, 16),
    }));
  };

  const submitEdit = async () => {
    if (!editEntry) {
      return;
    }
    if (!editForm.mealId || !editForm.foodName.trim() || Number(editForm.calories) <= 0) {
      setEditError('All fields are required and calories must be greater than zero.');
      return;
    }
    setEditError('');
    await onUpdate(editEntry.id, {
      userId: Number(editForm.userId),
      mealId: Number(editForm.mealId),
      foodName: editForm.foodName.trim(),
      calories: Number(editForm.calories),
      takenAt: new Date(editForm.takenAt).toISOString(),
    });
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submitCreate}>
            <Typography variant="h6">Admin entry manager</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              fullWidth
              select
              label="User"
              value={createForm.userId}
              onChange={(event) => {
                const userId = Number(event.target.value);
                setCreateForm((current) => ({ ...current, userId, mealId: '' }));
                onUserChange(userId);
              }}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {`${user.name} (${user.role})`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Meal"
              value={createForm.mealId}
              onChange={(event) => setCreateForm((current) => ({ ...current, mealId: event.target.value }))}
            >
              {meals.map((meal) => (
                <MenuItem key={meal.id} value={meal.id}>
                  {meal.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Date & time"
              type="datetime-local"
              value={createForm.takenAt}
              onChange={(event) => setCreateForm((current) => ({ ...current, takenAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Food name"
              value={createForm.foodName}
              onChange={(event) => setCreateForm((current) => ({ ...current, foodName: event.target.value }))}
            />
            <TextField
              fullWidth
              label="Calories"
              type="number"
              value={createForm.calories}
              onChange={(event) => setCreateForm((current) => ({ ...current, calories: event.target.value }))}
            />
            <Button type="submit" variant="contained">
              Create entry
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog fullWidth maxWidth="sm" open={Boolean(editEntry)} onClose={onCloseEdit}>
        <DialogTitle>Edit entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editError && <Alert severity="error">{editError}</Alert>}
            <TextField fullWidth label="User ID" value={editForm.userId} disabled />
            <TextField
              fullWidth
              select
              label="Meal"
              value={editForm.mealId}
              onChange={(event) => setEditForm((current) => ({ ...current, mealId: event.target.value }))}
            >
              {meals.map((meal) => (
                <MenuItem key={meal.id} value={meal.id}>
                  {meal.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Date & time"
              type="datetime-local"
              value={editForm.takenAt}
              onChange={(event) => setEditForm((current) => ({ ...current, takenAt: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Food name"
              value={editForm.foodName}
              onChange={(event) => setEditForm((current) => ({ ...current, foodName: event.target.value }))}
            />
            <TextField
              fullWidth
              label="Calories"
              type="number"
              value={editForm.calories}
              onChange={(event) => setEditForm((current) => ({ ...current, calories: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEdit}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
