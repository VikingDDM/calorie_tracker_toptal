import { Box, Card, CardContent, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AdminCharts({ comparison, averages }) {
  const comparisonData = comparison
    ? [
        { name: 'Previous 7 days', entries: comparison.previousPeriodCount },
        { name: 'Last 7 days', entries: comparison.currentPeriodCount },
      ]
    : [];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 280 }}>
        <Card>
          <CardContent>
            <Typography gutterBottom variant="h6">
              Entries comparison
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
              Includes today in the latest 7-day window.
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="entries" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' }, minWidth: 280 }}>
        <Card>
          <CardContent>
            <Typography gutterBottom variant="h6">
              Average calories per user
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={averages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageCalories" fill="#2e7d32" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
