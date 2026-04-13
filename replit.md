# VisionSwipe

A photo/video timeline gallery app where users can organize their memories by years and months, and share public galleries with others.

## Architecture

**Frontend only** — Pure React/Vite SPA. All backend services are provided by an external Supabase project.

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **Data fetching**: TanStack Query + Supabase JS client
- **Backend**: Supabase (auth, Postgres DB, storage, edge functions)

## Key Features

- Year/month timeline organization with swipeable card UI
- Public gallery sharing with username-based URLs (`/u/:username`)
- Supabase Auth (email + Google OAuth)
- File storage via Supabase Storage (vision-swipe-media bucket)
- Pesapal payment integration (via Supabase Edge Function) for storage upgrades
- Creator discovery / explore page

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Development

```bash
npm run dev      # Start dev server on port 5000
npm run build    # Production build
npm run preview  # Preview production build
```

## Supabase Project

Project ID: `igmwfbmxsivffiemhjby`

The Supabase project contains:
- All database tables (years, months, galleries, media, profiles, etc.)
- Row Level Security policies
- Storage bucket (`vision-swipe-media`)
- Edge function: `pesapal-payment` (handles Pesapal payment gateway integration)

## Pages

- `/` — Index/explore (swipeable public timeline discovery)
- `/auth` — Login / sign up
- `/editor` — User's personal gallery editor
- `/explore` — Discover public profiles
- `/u/:username` — Public gallery view
- `/year/:year` — Year detail / months view
- `/tutorial` — App walkthrough
