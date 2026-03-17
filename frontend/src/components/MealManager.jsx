import { useState } from 'react';
import { Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';

export default function MealManager({ meals, onRename }) {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const openDialog = (meal) => {
    setSelectedMeal(meal);
    setName(meal.name);
    setError('');
  };

  const closeDialog = () => {
    setSelectedMeal(null);
    setName('');
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Meal name is required.');
      return;
    }
    await onRename(selectedMeal.id, name.trim());
    closeDialog();
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h6">
            Meals
          </Typography>
          <List disablePadding>
            {meals.map((meal) => (
              <ListItem
                key={meal.id}
                secondaryAction={
                  <Button onClick={() => openDialog(meal)} size="small">
                    Rename
                  </Button>
                }
              >
                <ListItemText primary={meal.name} secondary={`Limit: ${meal.entryLimit} entries per day`} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedMeal)} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Rename meal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField fullWidth label="Meal name" value={name} onChange={(event) => setName(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
