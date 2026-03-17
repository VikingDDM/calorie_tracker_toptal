import { useEffect, useState } from 'react';
import { Alert, Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material';

export default function ObservabilityFeed({ token }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const source = new EventSource(`http://localhost:8000/api/observability/stream?token=${encodeURIComponent(token)}`);

    const handleMessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setEvents((current) => [parsed, ...current].slice(0, 12));
      } catch {
        // Ignore malformed events.
      }
    };

    source.addEventListener('message', handleMessage);

    return () => {
      source.close();
    };
  }, [token]);

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h6">
          Live observability
        </Typography>
        {events.length === 0 ? (
          <Alert severity="info">Live backend events will appear here after activity starts.</Alert>
        ) : (
          <List dense>
            {events.map((event, index) => (
              <ListItem key={`${event.timestamp}-${index}`} disableGutters>
                <ListItemText
                  primary={event.type}
                  secondary={`${new Date(event.timestamp).toLocaleString()} | ${JSON.stringify(event.payload)}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
