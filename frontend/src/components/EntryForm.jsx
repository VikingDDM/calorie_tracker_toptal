import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';

const initialState = {
  takenAt: new Date().toISOString().slice(0, 16),
  foodName: '',
  calories: '',
  mealId: '',
};

export default function EntryForm({ meals, onSubmit, submitting, title = 'Add food entry', submitLabel = 'Add entry' }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (meals.length > 0 && !form.mealId) {
      setForm((current) => ({ ...current, mealId: meals[0].id }));
    }
  }, [meals, form.mealId]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.foodName.trim()) {
      setError('Food name is required.');
      return;
    }
    if (!form.calories || Number(form.calories) <= 0) {
      setError('Calories must be greater than zero.');
      return;
    }
    if (!form.mealId) {
      setError('Please select a meal.');
      return;
    }

    setError('');
    await onSubmit({
      takenAt: new Date(form.takenAt).toISOString(),
      foodName: form.foodName.trim(),
      calories: Number(form.calories),
      mealId: Number(form.mealId),
    });
    setForm((current) => ({ ...initialState, mealId: current.mealId || '' }));
  };

  return (
    <Card>
      <CardContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h6">{title}</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 220 }}>
              <TextField
                fullWidth
                label="Date & time"
                type="datetime-local"
                value={form.takenAt}
                onChange={handleChange('takenAt')}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }, minWidth: 220 }}>
              <TextField fullWidth label="Food name" value={form.foodName} onChange={handleChange('foodName')} />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.666% - 16px)' }, minWidth: 140 }}>
              <TextField fullWidth label="Calories" type="number" value={form.calories} onChange={handleChange('calories')} />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(16.666% - 16px)' }, minWidth: 160 }}>
              <TextField fullWidth select label="Meal" value={form.mealId} onChange={handleChange('mealId')}>
                {meals.map((meal) => (
                  <MenuItem key={meal.id} value={meal.id}>
                    {meal.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
          <Button disabled={submitting} type="submit" variant="contained">
            {submitLabel}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
