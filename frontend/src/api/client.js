const API_BASE_URL = 'http://localhost:8000/api';

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed.' }));
    throw new Error(error.detail || 'Request failed.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  signIn: (token) => request('/auth/signin', { method: 'POST', body: { token } }),
  signOut: (token) => request('/auth/signout', { token, method: 'POST' }),
  me: (token) => request('/me', { token }),
  users: (token) => request('/users', { token }),
  meals: (token, userId) => request(`/meals${userId ? `?user_id=${userId}` : ''}`, { token }),
  renameMeal: (token, mealId, name) => request(`/meals/${mealId}`, { token, method: 'PUT', body: { name } }),
  entries: (token, userId) => request(`/entries${userId ? `?user_id=${userId}` : ''}`, { token }),
  createEntry: (token, payload) => request('/entries', { token, method: 'POST', body: payload }),
  updateEntry: (token, entryId, payload) => request(`/entries/${entryId}`, { token, method: 'PUT', body: payload }),
  deleteEntry: (token, entryId) => request(`/entries/${entryId}`, { token, method: 'DELETE' }),
  inviteFriend: (token, payload) => request('/users/invite', { token, method: 'POST', body: payload }),
  entriesComparison: (token) => request('/reports/entries-comparison', { token }),
  averageCalories: (token) => request('/reports/average-calories', { token }),
  observabilityUrl: (token) => `http://localhost:8000/api/observability/stream?token=${encodeURIComponent(token)}`,
};
