# Revision Planner

A spaced repetition revision planner with calendar view, streak tracking, and customizable revision schedules.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, SQLAlchemy, Python
- **Database:** PostgreSQL (Neon) in production, SQLite for local dev
- **Auth:** JWT (python-jose + bcrypt)

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- uv (Python package manager) or pip

### Backend

```bash
cd backend
cp .env.example .env   # edit with your values

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:3000, API at http://localhost:8000.

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Backend | Postgres connection string. Omit for local SQLite. |
| `JWT_SECRET_KEY` | Backend | Secret for signing JWT tokens. Required in production. |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL (set at build time) |

## Database

### Connect to Neon Postgres

```bash
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
```

### Useful psql Commands

```sql
-- List all tables
\dt

-- See table structure
\d users
\d topics
\d revisions

-- View data
SELECT * FROM users;
SELECT * FROM topics;
SELECT * FROM revisions LIMIT 10;

-- Count revisions per topic
SELECT t.title, count(r.id) as total, sum(case when r.completed then 1 else 0 end) as done
FROM topics t JOIN revisions r ON r.topic_id = t.id
GROUP BY t.title;

-- Quit
\q
```

### Install psql (if not installed)

```bash
brew install libpq && brew link --force libpq
```

## Deployment

### Architecture

```
Browser --> Vercel (Frontend) --> Render (Backend) --> Neon (PostgreSQL)
```

### Steps

1. **Database:** Create a free Postgres at [neon.tech](https://neon.tech), copy the connection string
2. **GitHub:** Push this repo to GitHub
3. **Backend (Render):**
   - Connect your GitHub repo at [render.com](https://render.com)
   - It auto-detects `render.yaml`
   - Set env vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`
4. **Frontend (Vercel):**
   - Import repo at [vercel.com](https://vercel.com)
   - Set root directory to `frontend`
   - Add env var: `NEXT_PUBLIC_API_URL` = your Render backend URL

### Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth/month |
| Render | Spins down after 15 min idle (~30s cold start) |
| Neon | 0.5GB storage, auto-suspend on idle |
