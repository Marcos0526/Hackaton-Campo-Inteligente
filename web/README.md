# Campo Inteligente — Web

A full-stack dashboard for agricultural producers: production, transport and
financing metrics in one place. Built for the Hackatón Campo Inteligente.

The UI is in Spanish; the code and this document are in English.

## What's included

- **Email + password auth** with cookie sessions (Better Auth), sign-up,
  login, logout and protected routes.
- **Account settings**: profile name, password change and per-account
  preferences persisted in SQLite.
- **Dark / light / system theme**, stored in the account and applied on sign-in.
- **Dashboard** with KPI cards and three charts (production, transport cost and
  income capacity), period filters, live refresh every 60 seconds, loading,
  error and demo-data states.
- **API proxy** (`/api/metrics`) that fronts a real upstream API and keeps its
  key server-side. Without an upstream configured it serves deterministic demo
  data, so the app runs end-to-end with zero infrastructure.
- **Typed API boundary** with Zod contracts, TanStack Query caching and SSR
  hydration.
- **Tests**: Vitest unit tests for the data layer plus a Playwright end-to-end
  flow covering registration, dashboard, theme and settings.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript (`strict`) |
| Styling | Tailwind CSS v4, hand-rolled shadcn-style primitives |
| Auth | Better Auth 1.7 (email/password, cookie sessions) |
| Database | SQLite + Drizzle ORM (local, zero infra) |
| Data fetching | TanStack Query v5 + Zod v4 |
| Charts | Recharts 3 |
| Forms | react-hook-form + Zod |
| Tests | Vitest, Playwright (Firefox) |

## Quick start

Requires Node.js 22+.

```bash
cd web
npm install

cp .env.example .env.local
# Generate a secret and paste it into BETTER_AUTH_SECRET:
openssl rand -base64 32

npm run db:migrate   # creates ./data/app.db and the tables
npm run dev          # http://localhost:3000
```

Open the app, click **Crear una cuenta** and register. There is no seeded user;
the database is local and ignored by git.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | yes | Signs session cookies. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | yes | Public origin, e.g. `http://localhost:3000`. Also used as a trusted origin. |
| `DATABASE_URL` | yes | SQLite path, default `file:./data/app.db`. |
| `METRICS_API_URL` | no | Upstream metrics endpoint. When unset, demo data is used. |
| `METRICS_API_KEY` | no | Bearer token sent to the upstream API. Never exposed to the browser. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Turbopack). |
| `npm run build` / `npm start` | Production build and server. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest unit tests. |
| `npm run test:e2e` | Playwright flow (start the dev server first, or let it start one). |
| `npm run db:generate` | Generate a Drizzle migration after changing the schema. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:studio` | Open Drizzle Studio. |

For the E2E test, install the browser once: `npx playwright install firefox`.

## Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | public | Redirects to `/login` or `/dashboard`. |
| `/login`, `/register` | public | Auth screens; redirect to the dashboard when already signed in. |
| `/dashboard` | session | KPI cards, charts and module breakdown. |
| `/settings` | session | Profile, password and preferences. |
| `/api/auth/[...all]` | public | Better Auth handler. |
| `/api/metrics` | session | Metrics proxy / demo generator. |

`src/proxy.ts` performs an optimistic session-cookie check (Next 16 renamed
middleware to proxy). Every protected layout still validates the session
server-side with `requireSession()`, so the cookie check is only a fast
redirect, not the authorization boundary.

## Metrics API contract

`GET /api/metrics?range=7d|30d|90d|365d` (or `?from=YYYY-MM-DD&to=YYYY-MM-DD`)
returns:

```json
{
  "generatedAt": "2026-10-29T20:08:00.000Z",
  "source": "live",
  "period": { "from": "2026-09-30", "to": "2026-10-29", "days": 30 },
  "kpis": [
    {
      "id": "produccion",
      "label": "Producción total",
      "value": 23434,
      "previousValue": 25280,
      "delta": -7.3,
      "format": "number",
      "unit": "kg",
      "goodWhenDown": false,
      "hint": "Volumen estimado de cosecha en el periodo."
    }
  ],
  "series": [
    {
      "id": "campo",
      "label": "Producción diaria",
      "unit": "kg",
      "points": [{ "date": "2026-09-30", "value": 903 }]
    }
  ],
  "breakdown": [
    { "module": "campo", "label": "Maíz", "value": 9842, "share": 42 }
  ]
}
```

Rules enforced by `src/lib/api/contracts.ts`:

- `series[].id` and `breakdown[].module` are `campo | transporte | financiamiento`.
- `series[].unit` is `kg` or `mxn`; `points` must not be empty.
- `kpis[].format` is `currency | number | decimal`.
- `source` is optional and defaults to `live`; the proxy sets it explicitly.
- `period.days` is a positive integer and `from <= to`.
- Ranges are capped at 366 days.

### Connecting a real API

Set `METRICS_API_URL` (and `METRICS_API_KEY` if needed). The server calls:

```
GET {METRICS_API_URL}?from=2026-09-30&to=2026-10-29
Authorization: Bearer {METRICS_API_KEY}
```

with an 8 second timeout. The response is parsed with the same Zod contract. If
the upstream fails or returns an invalid payload, the route logs a warning and
falls back to demo data marked `source: "mock"`; the dashboard shows a "Datos
demo" badge so a failure is never silently presented as real data.

To adapt the contract, change `src/lib/api/contracts.ts` (and the mock in
`src/lib/api/mock.ts`); the client, route, dashboard and tests all derive from
it.

## How the pieces fit

```
src/
  app/
    (auth)/login, (auth)/register   Auth screens
    (app)/dashboard, (app)/settings  Protected shell
    api/auth/[...all]                Better Auth handler
    api/metrics                      Proxied metrics endpoint
  components/
    dashboard/   KPI cards, chart card, Recharts wrapper, breakdown, range filter
    settings/    Profile, password and preferences forms
    ui/          Button, input, card, select, skeleton, form message
    app-shell.tsx, theme-toggle.tsx, theme-sync.tsx
  lib/
    actions/     Server actions (profile, password, preferences, theme)
    api/         Zod contract, period helpers, demo generator, client, server loader
    db/          Drizzle schema and SQLite connection
    auth.ts      Better Auth server config
    auth-client.ts
    session.ts   getSession / requireSession
    preferences.ts
  proxy.ts       Optimistic route protection
drizzle/         SQL migrations (committed)
e2e/             Playwright flow
```

### Data model

Better Auth owns `user`, `session`, `account` and `verification`.
`user_preferences` stores `theme`, `dashboard_range` and `chart_type` keyed by
`user_id`. Preferences are created lazily on first authenticated page load.

### Theme handling

`next-themes` writes the `class` attribute on `<html>`. The settings form
previews the theme immediately and persists it through a server action; the
header toggle persists too. On the first page load of a browser tab,
`ThemeSync` applies the account preference (once per tab, tracked in
`sessionStorage`), so a local toggle is not overwritten on every navigation.

## Production notes

This scaffold runs on SQLite for zero-infra local development. SQLite on a
serverless host is ephemeral, so before deploying:

1. Move the database to Postgres (Neon/Supabase) or libSQL/Turso:
   change `src/lib/db/index.ts` and `drizzle.config.ts` to the new dialect,
   update the `drizzleAdapter` provider in `src/lib/auth.ts`, regenerate
   migrations and point `DATABASE_URL` at the new database.
2. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to production values.
3. Add email verification / password reset if the product needs them. They are
   intentionally out of scope for the hackathon build (no email provider wired).
4. Put the upstream API key in the host's secret store; it is only read by the
   server-side proxy.

## Known limitations

- No email verification, password reset or social login.
- The demo dataset is generated in-process; it is deterministic per date and is
  not meant to represent real operations.
- The upstream response must match the documented contract exactly; add a
  mapping layer if your API uses different field names.
