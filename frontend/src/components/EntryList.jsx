import { useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function formatDay(iso) {
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString();
}

export default function EntryList({ entries, calorieLimit, adminMode = false, onDelete, onEdit }) {
  const grouped = useMemo(() => {
    const groups = new Map();
    entries.forEach((entry) => {
      const day = formatDay(entry.takenAt);
      const current = groups.get(day) || { total: 0, rows: [] };
      current.total += entry.calories;
      current.rows.push(entry);
      groups.set(day, current);
    });
    return Array.from(groups.entries());
  }, [entries]);

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h6">
          Food entries
        </Typography>
        {grouped.length === 0 && <Alert severity="info">No entries yet.</Alert>}
        <Stack spacing={3}>
          {grouped.map(([day, group]) => {
            const exceeded = typeof calorieLimit === 'number' ? group.total > calorieLimit : false;
            return (
              <Stack key={day} spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">{day}</Typography>
                  <Chip
                    color={exceeded ? 'error' : 'success'}
                    label={
                      typeof calorieLimit === 'number'
                        ? `${group.total} / ${calorieLimit} calories`
                        : `${group.total} calories`
                    }
                    size="small"
                  />
                </Stack>
                {exceeded && <Alert severity="warning">Daily calorie limit exceeded.</Alert>}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      {adminMode && <TableCell>User</TableCell>}
                      <TableCell>Food</TableCell>
                      <TableCell>Meal</TableCell>
                      <TableCell>Calories</TableCell>
                      {adminMode && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.rows.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDateTime(entry.takenAt)}</TableCell>
                        {adminMode && <TableCell>{entry.userName}</TableCell>}
                        <TableCell>{entry.foodName}</TableCell>
                        <TableCell>{entry.mealName}</TableCell>
                        <TableCell>{entry.calories}</TableCell>
                        {adminMode && (
                          <TableCell align="right">
                            <Button onClick={() => onEdit(entry)} size="small">
                              Edit
                            </Button>
                            <Button color="error" onClick={() => onDelete(entry.id)} size="small">
                              Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Divider />
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
