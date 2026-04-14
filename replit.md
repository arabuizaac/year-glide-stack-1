# VisionSwipe

A photo/video timeline gallery app where users can organize their memories by years and months, and share public galleries with others.

## Architecture

**Full-stack** — React/Vite SPA frontend + Express backend server.

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **Data fetching**: TanStack Query + Supabase JS client
- **Backend**: Express.js server (port 3001) + Supabase (auth, Postgres DB, storage)

## Key Features

- Year/month timeline organization with swipeable card UI
- Public gallery sharing with username-based URLs (`/u/:username`)
- Supabase Auth (email + Google OAuth)
- File storage via Supabase Storage (vision-swipe-media bucket)
- Pesapal payment integration (via Express server routes) for storage upgrades
- Creator discovery / explore page

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `PESAPAL_CONSUMER_KEY` | Pesapal payment consumer key (optional) |
| `PESAPAL_CONSUMER_SECRET` | Pesapal payment consumer secret (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used by server for admin ops) |
| `PESAPAL_ENV` | `sandbox` or `production` (default: sandbox) |

## Development

```bash
npm run dev      # Start both Express server (port 3001) and Vite dev server (port 5000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Server

`server/index.ts` — Express server on port 3001 handles:
- `POST /api/pesapal/initiate` — Start Pesapal payment
- `POST /api/pesapal/verify` — Verify payment status
- `GET /api/pesapal/ipn` — Pesapal IPN callback

Vite proxies `/api/*` requests to `http://localhost:3001`.

## Supabase Project

Project ID: `igmwfbmxsivffiemhjby`

The Supabase project contains:
- All database tables (years, months, galleries, media, profiles, etc.)
- Row Level Security policies
- Storage bucket (`vision-swipe-media`)

## Pages

- `/` — Index/explore (swipeable public timeline discovery)
- `/auth` — Login / sign up
- `/editor` — User's personal gallery editor
- `/explore` — Discover public profiles
- `/u/:username` — Public gallery view
- `/year/:year` — Year detail / months view
- `/tutorial` — App walkthrough
- `/payment/callback` — Pesapal payment callback handler
- `/bookmarks` — Saved/bookmarked items
