# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server with HMR
npm run build        # Production build
npm run deploy       # Build and deploy to Cloudflare Workers
npm run typecheck    # TypeScript type checking + React Router type generation
npm run lint         # ESLint
npm run lint:fix     # Auto-fix lint issues
npm run test         # Run Vitest (single run)
npm run test:watch   # Vitest watch mode
npm run cf-typegen   # Regenerate Cloudflare bindings types
```

## Architecture

**Stack**: React 19 + React Router 7 (SSR) + Cloudflare Workers + Durable Objects + Tailwind CSS 4

This is a wine cellar organizer that imports inventory from CellarTracker.com (via XML API) and lets users visually place bottles on storage shelves.

### Data Flow

```
CellarTracker XML API → server loader → React component → Durable Object (persistent)
```

Authentication uses secure HTTP-only cookie sessions (24h expiry). A demo account (`demo`/`demo`) is hardcoded in `app/utils.server.tsx`.

### Persistent Storage (Cloudflare Durable Objects)

Two Durable Object classes in `workers/app.ts`:

- **`BottlePlacementStore`** — maps `iWine` IDs to shelf positions (`placeBottle`, `getInventory`)
- **`StorageSetupStore`** — stores named shelf/rack configurations per user (`setSetup`, `getSetup`, `getSetupList`)

Bindings are defined in `wrangler.jsonc` as `BOTTLE_STORE` and `SETUP_STORE`. After changing Durable Object schemas, add a migration entry in `wrangler.jsonc`.

### Routing

Routes are defined in `app/routes.ts` and map to files under `app/routes/`:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `home.tsx` | Main organizer (wine list + storage grid) |
| `/login` | `login.tsx` | CellarTracker auth |
| `/setup` | `setup/index.tsx` | List storage configurations |
| `/setup/:name` | `setup/setup.tsx` | Configure a storage layout |

### State Management

`PositionContextProvider` (`app/components/PositionContextProvider.tsx`) is the central client-side state:
- Tracks `selectedWine`, `selectedPosition`, `storage` (placements), `activeTab`
- Uses React Router's `useFetcher` to submit bottle placements without full navigation
- Derives `inventoryByLocation` (location → wine) via `useMemo`

### Core Types (`types.ts`)

- `WineItem` — full wine record from CellarTracker
- `BottlePlacements` — `{ [iWine]: string[] }` mapping wines to positions
- `StorageSetup` — `ShelfProps[]` array defining a rack's shelf configuration
- `ShelfProps` — `{ capacity, innerRow, layers? }` for a single shelf
- `Env` — Cloudflare env bindings (`SESSION_SECRET`, Durable Object namespaces)

### Fridge/Shelf Visualization

`app/components/Storage/Fridge.tsx` renders a grid of shelf cells. Positions use a string format encoding shelf and slot. The `innerRow` concept in `ShelfProps` represents a front/back split within a single shelf slot.
