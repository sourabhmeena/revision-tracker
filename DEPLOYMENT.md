# Recall Smart - Deployment & Infrastructure Guide

This document covers the complete setup of the Recall Smart app — database, backend, frontend, domain, and automated backups. Use this as a reference for redeployment or troubleshooting.

---

## Architecture

```
Browser/PWA
    │
    ▼
Vercel (Frontend - Next.js)
    │  NEXT_PUBLIC_API_URL
    ▼
Render (Backend - FastAPI)
    │  DATABASE_URL
    ▼
Neon (PostgreSQL 17)
    │
    ▼
GitHub Actions (Weekly DB Backup)
```

---

## 1. Database — Neon PostgreSQL

### Setup

1. Go to [neon.tech](https://neon.tech) and sign up (free tier)
2. Create a new project:
   - **Name:** `recall-smart` (or any name)
   - **Region:** `US West 2 (Oregon)` — closest to Render's free tier region
   - **PostgreSQL version:** 17
3. Once created, copy the **connection string** from the dashboard:
   ```
   postgresql://neondb_owner:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require
   ```

### Current connection

```
Host:     ep-sparkling-leaf-ak3x1c57-pooler.c-3.us-west-2.aws.neon.tech
Database: neondb
User:     neondb_owner
Region:   US West 2 (Oregon)
```

### Free tier limits

| Resource | Limit |
|----------|-------|
| Storage | 0.5 GB |
| Compute | 191 hours/month (auto-suspends after 5 min idle) |
| Branches | 10 |
| PITR | 7 days |

### Useful commands

```bash
# Connect via psql
psql "postgresql://neondb_owner:<password>@<endpoint>?sslmode=require"

# Manual backup
pg_dump "postgresql://neondb_owner:<password>@<endpoint>/neondb?sslmode=require" --no-owner --no-acl > backup.sql

# Restore from backup
psql "postgresql://neondb_owner:<password>@<endpoint>/neondb?sslmode=require" < backup.sql
```

### Tables

```
users      — id, email, hashed_password, created_at, settings_json
topics     — id, user_id, title, category, chapter, description, created_at, intervals_json, repeat_interval
revisions  — id, topic_id, date, completed
```

---

## 2. Backend — Render (FastAPI)

### Setup

1. Go to [render.com](https://render.com) and sign up
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo: `sourabhmeena/revision-tracker`
4. Configure:
   - **Name:** `revision-planner-api`
   - **Region:** `Oregon (US West)` — same as Neon for lowest latency
   - **Runtime:** Python
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free

   Or simply let Render auto-detect using `render.yaml` in the repo root.

5. Set environment variables in Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET_KEY` | A strong random secret (Render can auto-generate) |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` (your Vercel frontend URL) |
   | `PYTHON_VERSION` | `3.11.9` |

### Current deployment

```
URL:    https://revision-planner-api-xxxx.onrender.com
Region: Oregon (US West)
Plan:   Free (spins down after 15 min idle, ~30-50s cold start)
```

### Notes

- The `render.yaml` file in the repo root auto-configures the service
- Free tier spins down after 15 min of no requests — first request after that takes ~30-50 seconds
- Data is NOT stored on Render — everything is in Neon
- Render auto-deploys on every push to `master`

---

## 3. Frontend — Vercel (Next.js)

### Setup

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Import Project"** → select `sourabhmeena/revision-tracker`
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** (default) `next build`
   - **Output Directory:** (default) `.next`

4. Set environment variable:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://revision-planner-api-xxxx.onrender.com` (your Render backend URL) |

5. Deploy

### Current deployment

```
URL:       https://your-app.vercel.app
Framework: Next.js
Root:      frontend/
```

### Notes

- Vercel auto-deploys on every push to `master`
- The `NEXT_PUBLIC_API_URL` is baked in at build time — if you change the backend URL, you need to redeploy the frontend
- Frontend is a PWA — works offline for cached pages
- No spin-down — Vercel serves instantly, always

---

## 4. Automated Database Backups — GitHub Actions

### How it works

A GitHub Actions workflow runs `pg_dump` every Sunday at 3 AM UTC and uploads the SQL dump as a downloadable artifact (retained for 90 days).

**Workflow file:** `.github/workflows/db-backup.yml`

### Setup

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**
2. Under **"Repository secrets"**, add:

   | Secret | Value |
   |--------|-------|
   | `DATABASE_URL` | Your Neon connection string (without `channel_binding` param) |

   Example value:
   ```
   postgresql://neondb_owner:<password>@<endpoint>/neondb?sslmode=require
   ```

   **Important:** Remove `&channel_binding=require` from the URL — it causes issues with `pg_dump`.

3. The workflow requires a GitHub token with **`workflow`** scope to push `.github/workflows/` files

### Manual trigger

1. Go to **GitHub repo → Actions → Weekly DB Backup**
2. Click **"Run workflow"** → select `master` → click green **"Run workflow"**
3. Once complete, scroll to bottom of the run page → download artifact under **"Artifacts"**

### Schedule

- **Automatic:** Every Sunday at 3:00 AM UTC
- **Manual:** Anytime via the "Run workflow" button
- **Retention:** 90 days per artifact

### Restoring from backup

```bash
# Download and unzip the artifact from GitHub Actions
# Then restore:
psql "postgresql://neondb_owner:<password>@<endpoint>/neondb?sslmode=require" < backup.sql
```

---

## 5. Environment Variables Summary

### Backend (.env / Render)

| Variable | Local dev | Production (Render) |
|----------|-----------|---------------------|
| `DATABASE_URL` | Omit (uses SQLite) or Neon URL | Neon PostgreSQL connection string |
| `JWT_SECRET_KEY` | Any string | Strong random secret |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://your-app.vercel.app` |

### Frontend (Vercel)

| Variable | Local dev | Production (Vercel) |
|----------|-----------|---------------------|
| `NEXT_PUBLIC_API_URL` | Not set (defaults to `http://localhost:8000`) | Render backend URL |

### GitHub Actions

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Neon connection string (without `channel_binding`) |

---

## 6. Git & Releases

### Branch strategy

- `master` — production branch, auto-deploys to Vercel + Render

### Creating a release

```bash
# Tag the current commit
git tag -a v1.0.0 -m "Release v1.0.0 - description"

# Push the tag
git push origin v1.0.0
```

### Token scopes needed

Your GitHub Personal Access Token needs these scopes:
- **`repo`** — push code
- **`workflow`** — push `.github/workflows/` files

---

## 7. Data Safety

| Layer | Protection | Retention |
|-------|-----------|-----------|
| Neon (live DB) | Managed PostgreSQL, always persists | Indefinite |
| Neon PITR | Point-in-time recovery | 7 days (free tier) |
| GitHub Actions backup | Weekly `pg_dump` artifact | 90 days |
| GitHub (code) | Full repo history | Indefinite |

### What survives extended inactivity

| Service | After months of no use |
|---------|----------------------|
| Vercel | Stays up, serves instantly |
| Render | Sleeps, wakes in ~30-50s on first request |
| Neon | Compute sleeps, data persists forever |
| GitHub | Always available |

---

## 8. Troubleshooting

### Backend cold start is slow (~30-50s)
- Normal for Render free tier. First request after 15 min idle wakes the container.

### "pg_dump version mismatch" in backups
- Neon runs PostgreSQL 17. The workflow installs `postgresql-client-17` and uses `/usr/lib/postgresql/17/bin/pg_dump`.

### "channel_binding" error in pg_dump
- Remove `&channel_binding=require` from the `DATABASE_URL` secret in GitHub.

### Frontend shows stale data
- SWR has `dedupingInterval: 60000` (1 min). Wait or hard-refresh.

### CORS errors
- Check `CORS_ORIGINS` on Render matches your Vercel URL exactly (with `https://`, no trailing slash).
