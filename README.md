# wh40k-lists-backend

Hono API for the **Dossier** Warhammer 40,000 list service. Deploys to Google Cloud Run.

## Stack

| Layer | Choice |
|---|---|
| Framework | [Hono](https://hono.dev/) + `@hono/node-server` |
| Auth | [better-auth](https://better-auth.com/) — email/password + GitHub OAuth |
| Database | [Neon Postgres](https://neon.tech/) via `@neondatabase/serverless` |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Runtime | Node.js 20 on [Cloud Run](https://cloud.google.com/run) |
| Validation | Zod |

---

## Local setup

```bash
cp .env.example .env   # fill in the values
pnpm install
pnpm db:push           # push schema to Neon
pnpm dev               # → http://localhost:8080
```

### Required env vars

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (drizzle-kit only) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Where this API is reachable (`http://localhost:8080` locally) |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `http://localhost:3000` |

Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `COOKIE_DOMAIN`

---

## API routes

```
GET  /healthz                  — health check (DB ping)
GET  /api/catalogue/factions   — all 22 factions
GET  /api/catalogue/factions/:id — faction + detachments + units
GET  /api/me                   — current session user
GET  /api/lists                — browse public lists (?faction=&q=&author=)
POST /api/lists                — create list (auth required)
GET  /api/lists/:slug          — list detail (increments view count)
PATCH /api/lists/:slug         — update list (author only)
DELETE /api/lists/:slug        — delete list (author only)
POST /api/lists/:slug/fork     — fork a list (auth required)
POST /api/lists/:slug/like     — toggle like (auth required)

# Better-auth handles everything under:
POST /api/auth/*               — sign-up, sign-in, sign-out, session, OAuth callbacks
GET  /api/auth/*
```

---

## Database

Schema lives in `src/db/schema.ts`. Better-auth tables: `user`, `session`, `account`, `verification`. App tables: `lists`, `list_likes`, `comments`, `follows`.

```bash
pnpm db:push       # dev — push schema directly, no migration file
pnpm db:generate   # generate a migration file from schema changes
pnpm db:migrate    # apply migration files
pnpm db:studio     # Drizzle Studio UI
```

To regenerate the better-auth tables after changing auth config:
```bash
pnpm auth:generate
```

---

## Deploying to Cloud Run

### Prerequisites

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Create Artifact Registry repo
gcloud artifacts repositories create dossier \
  --repository-format=docker \
  --location=us-central1

# Store secrets (replace values first)
echo -n "postgres://..." | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-32-char-secret" | gcloud secrets create BETTER_AUTH_SECRET --data-file=-
echo -n "your-github-client-id" | gcloud secrets create GITHUB_CLIENT_ID --data-file=-
echo -n "your-github-secret" | gcloud secrets create GITHUB_CLIENT_SECRET --data-file=-
```

### Deploy

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPO=dossier,_SERVICE=wh40k-lists-backend
```

Edit `BETTER_AUTH_URL` and `CORS_ORIGINS` in `cloudbuild.yaml` to match your production URLs before deploying.

### OAuth callback URL for production

Update your GitHub OAuth app's callback URL to:
```
https://YOUR_CLOUD_RUN_URL/api/auth/callback/github
```

---

## Cookie / cross-domain notes

When the frontend (Vercel) and backend (Cloud Run) are on **different origins**, sessions work by setting the cookie on the API domain (`api.dossier.example.com`) and the frontend reads it via `credentials: 'include'` fetch calls.

For this to work in production:
- Both must be on HTTPS
- Cookie is set with `SameSite=None; Secure`
- The API's `CORS_ORIGINS` must include the exact frontend origin
- `COOKIE_DOMAIN` should be set to the shared apex domain if you have one (e.g. `.dossier.example.com`)

In local dev (both `localhost`), cookies use `SameSite=Lax` and HTTPS is not required.
