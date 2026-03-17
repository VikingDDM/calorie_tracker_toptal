# Calorie Tracker

Full-stack calorie tracking application built with FastAPI, Prisma + SQLite, and React + Vite with Material UI.

## Structure

- `backend/`: FastAPI API, Prisma schema, seed data, auth/RBAC, reporting, observability stream
- `frontend/`: React app with sign-in, user page, admin dashboard, and admin self-service page

## Features

- Token-based authentication with predefined sample users
- Roles: `USER`, `ADMIN`
- Food entry creation/read for users
- Admin read/create/update/delete for any food entry
- Meal configuration stored in the database
- Per-user meal renaming without affecting other users
- Backend validation for calories and meal entry limits
- Daily calorie totals with limit exceed highlighting
- Invite-a-friend flow that creates a new `USER` and returns generated credentials
- Admin reporting for 7-day entry comparison and average calories per user
- Lightweight real-time backend observability stream for admin users

## Sample Accounts

- Admin token: `ADMIN_TOKEN`
- User tokens: `USER1_TOKEN`, `USER2_TOKEN`, `USER3_TOKEN`

Seeded credentials:

- `admin@caltrack.dev` / `admin123`
- `alice@caltrack.dev` / `alice123`
- `bob@caltrack.dev` / `bob123`
- `carla@caltrack.dev` / `carla123`

## Backend Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Generate the Prisma client:

```bash
prisma generate --schema=prisma/schema.prisma
```

5. Push the SQLite schema:

```bash
prisma db push --schema=prisma/schema.prisma
```

6. Seed sample data:

```bash
python3 seed.py
```

7. Start the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the Vite dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and expects the backend on `http://localhost:8000`.

## API Overview

### Auth

- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/me`

### Meals

- `GET /api/meals`
- `PUT /api/meals/:mealId`

### Admin users

- `GET /api/users` (`ADMIN` only)

### Food entries

- `GET /api/entries`
- `POST /api/entries`
- `PUT /api/entries/:entryId` (`ADMIN` only)
- `DELETE /api/entries/:entryId` (`ADMIN` only)

### Users

- `POST /api/users/invite`

### Reporting

- `GET /api/reports/entries-comparison` (`ADMIN` only)
- `GET /api/reports/average-calories` (`ADMIN` only)

### Observability

- `GET /api/observability/stream` (`ADMIN` only, SSE)

## Example Requests

### Sign in

```bash
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"token":"USER1_TOKEN"}'
```

### Create a food entry

```bash
curl -X POST http://localhost:8000/api/entries \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "takenAt":"2026-03-17T12:30:00Z",
    "foodName":"Chicken Wrap",
    "calories":640,
    "mealId":2
  }'
```

### Invite a friend

```bash
curl -X POST http://localhost:8000/api/users/invite \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"New Friend",
    "email":"friend@example.com"
  }'
```

### Admin reporting

```bash
curl http://localhost:8000/api/reports/entries-comparison \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

```bash
curl http://localhost:8000/api/reports/average-calories \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Notes

- Meal entry limits are enforced per user, per meal, per calendar day.
- Daily calorie limit is configurable per user in seed data or directly in the database.
- The admin dashboard shows all entries; the admin self-service page behaves like a normal user page.
