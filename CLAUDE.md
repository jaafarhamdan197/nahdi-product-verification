@AGENTS.md

# Nahdi Product Verification Dashboard

> **GitHub repo:** https://github.com/jaafarhamdan197/nahdi-product-verification
> (public). Push to `main` with the `gh`-authenticated account
> `jaafarhamdan197`. Never commit `.env.local` or real Channable feed URLs /
> OAuth secrets — they are gitignored and live only locally and in the host
> (Cloud Run env vars / Secret Manager).

Internal tool for verifying whether item IDs (pasted from Excel) are
available in Nahdi's Channable product feeds.

## Purpose

Users paste a list of item IDs copied from an Excel sheet. The tool checks
each ID against one or more live Channable JSON feeds and reports
availability, with an Excel export of the results.

## Data feeds

Three Channable feeds, selected via env vars (`FEED_URL_AR`, `FEED_URL_EN`,
`FEED_URL_UAE` — see `.env.local.example`, actual URLs are not committed):

- **AR** — Nahdi Online KSA, Arabic
- **EN** — Nahdi Online KSA, English
- **UAE** — Nahdi Online UAE, English

Each feed is a flat JSON array of objects:

```json
{
  "id": "100519803",
  "title": "...",
  "availability": "in stock",
  "price": "12.77 SAR",
  "sale_price": "12.77 SAR",
  "image_link": "https://..."
}
```

Key behavior: **feeds only ever contain `"in stock"` items.** There is no
"out of stock" status in the data. This means an item ID missing from a
feed is the actual signal for "not available" — there's no separate status
field to check. ~48k items in the KSA feeds, ~16k in the UAE feed.

Feeds are fetched with `cache: "no-store"` and held in a short-lived
module-level in-memory snapshot (`src/lib/feeds.ts`), keyed by feed with a
TTL (`FEED_CACHE_TTL_SECONDS`, default 600s; `0` disables). This avoids
re-downloading tens of MB for the search→export flow and back-to-back
searches, while keeping data fresh enough for availability checks. The
cache is best-effort: it survives warm serverless invocations and is
simply re-fetched on a cold start.

## Architecture

- **Next.js 16** (App Router, TypeScript, Tailwind), `output: "standalone"`,
  containerized via the root `Dockerfile` and deployed to **Google Cloud Run**
  from GitHub (Cloud Build).
- **Auth**: Auth.js / NextAuth v5 with the Google provider
  (`src/auth.ts`). Two independent access-control layers:
  1. The Google OAuth consent screen is kept in **Testing** publishing
     status, so only emails added as test users in Google Cloud Console
     can complete the OAuth login at all.
  2. The `ALLOWED_EMAILS` env var (comma-separated) is the app's own
     allowlist. When set, `isEmailAllowed()` is enforced in **three**
     places — the `signIn` callback, the `authorized` proxy route guard,
     and the API routes (`resolveRequest`) — so it is re-checked on every
     request, not just at sign-in. Removing someone from `ALLOWED_EMAILS`
     locks them out on their next request rather than at JWT expiry (~30d).
     When the var is unset, access is open to any Google-authenticated
     account (dev / pre-allowlist only). To grant a user access in
     production they must be in **both** lists (test users *and*
     `ALLOWED_EMAILS`).
- **Route protection**: `src/proxy.ts` (Next.js 16 renamed the
  `middleware.ts` convention to `proxy.ts`) guards page routes via the
  matcher `["/dashboard/:path*"]`. The API routes (`/api/search`,
  `/api/export`) are intentionally NOT matched by the proxy — they
  self-guard in `resolveRequest` (session + allowlist) and return a JSON
  401/403, since a redirect to the HTML login page would break `fetch()`
  callers' `res.json()` parsing on session expiry.
- **Feed/match logic**: `src/lib/feeds.ts` (fetching, per-feed
  `Map<id, item>` lookups) and `src/lib/match.ts` (ID parsing, per-feed
  availability rows, cross-feed mismatch detection).
- **API routes**: `POST /api/search` returns JSON results;
  `POST /api/export` returns an `.xlsx` file (via `exceljs`) with one
  sheet per selected feed plus Summary and Cross-Feed Mismatches sheets.
- **UI**: `src/components/SearchTool.tsx` — feed multiselect (all three
  selected by default), ID textarea (space/comma/newline-separated,
  copied from Excel), summary cards, mismatch table, per-feed tables,
  Excel download button.

## Conventions / gotchas

- This project pins to a pre-release/breaking-changes version of Next.js
  (16.x with Turbopack default, `middleware.ts` → `proxy.ts` rename).
  Don't assume APIs match your training data — check
  `node_modules/next/dist/docs/` or run a build before relying on a
  Next.js API.
- Feed URLs and Google OAuth credentials live only in `.env.local`
  (gitignored) and are never committed. `.env.local.example` documents
  the required variables without real values.
- ID matching is exact string match against the feed's `id` field only
  (no fuzzy/title matching) — an explicit choice over title-based fallback
  matching, for simplicity and accuracy.
