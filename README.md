# Nahdi Product Verification Dashboard

Internal tool to check whether a list of item IDs (pasted from Excel) are
available across the Nahdi Channable feeds:

- **AR** — Nahdi Online KSA, Arabic
- **EN** — Nahdi Online KSA, English
- **UAE** — Nahdi Online UAE, English

Each feed only lists items that are currently in stock, so a missing ID
means the item is not available. Feeds are fetched live (no caching) on
every search, so results always reflect the current state of the feed.

## Features

- Multiselect feed picker (all three selected by default)
- Paste item IDs from Excel (space/comma/newline separated)
- Per-feed availability breakdown + cross-feed mismatch report (items
  available in some selected feeds but missing in others)
- Excel export (one sheet per feed + Summary + Mismatches)
- Google sign-in restricted to test users added in Google Cloud Console

## Local setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

1. `AUTH_SECRET` — generate with `npx auth secret`
2. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — see below
3. Feed URLs are already pre-filled with the live Channable links

```bash
npm run dev
```

## Google Cloud OAuth setup (test app)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create
   (or select) a project.
2. **APIs & Services > OAuth consent screen**
   - User type: External
   - Publishing status: **Testing** (keeps access restricted to test users
     only — no Google verification needed)
   - Under **Test users**, add the Google account email of every person who
     should be able to log in.
3. **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (local dev)
     - `https://<your-production-domain>/api/auth/callback/google` (after
       deployment)
   - Copy the generated Client ID / Client Secret into `AUTH_GOOGLE_ID` /
     `AUTH_GOOGLE_SECRET`.

Optionally set `ALLOWED_EMAILS` (comma-separated) as a second layer of
restriction enforced by the app itself, independent of the Cloud Console
test user list.

## Deployment (Google Cloud Run via GitHub)

The app emits a standalone server (`output: "standalone"`) and is
containerized via the root `Dockerfile`. Cloud Run builds and serves it.

1. Push this repo to GitHub.
2. Google Cloud Console → **Cloud Run** → **Create service** →
   **Continuously deploy from a repository** → connect the GitHub repo
   (`main` branch). Build type: **Dockerfile**.
3. Set runtime environment variables on the service: `FEED_URL_AR`,
   `FEED_URL_EN`, `FEED_URL_UAE`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`, and `NEXTAUTH_URL` (the Cloud Run service URL).
   Store `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` via **Secret Manager** for
   best security. Do **not** set `DEV_AUTH_BYPASS` (it is force-disabled in
   production anyway).
4. Allow unauthenticated invocations (the app does its own Google auth).
5. Add `https://<cloud-run-url>/api/auth/callback/google` to the Google
   OAuth client's Authorized redirect URIs.

Cloud Run sets `PORT` (8080) and the container binds `0.0.0.0` — no extra
config needed.
