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

Both Durable Object classes in `workers/app.ts` use SQLite (`ctx.storage.sql`):

- **`BottlePlacementStore`** — stores placements as rows with typed `(iWine, setup_id, shelf, layer, slot)` fields. Methods: `addPlacement`, `removePlacement`, `getInventory`
- **`StorageSetupStore`** — stores named shelf/rack configs with a UUID `id`. Methods: `setSetup` (upsert, returns id), `getSetup`, `getSetupList`

Bindings are defined in `wrangler.jsonc` as `BOTTLE_STORE` and `SETUP_STORE`. After changing Durable Object schemas, add a migration entry in `wrangler.jsonc`.

### Routing

Routes are defined in `app/routes.ts` and map to files under `app/routes/`:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `home.tsx` | Setup list / redirect to active setup |
| `/:setupId` | `storage.tsx` | Main organizer (wine list + storage grid) |
| `/login` | `login.tsx` | CellarTracker auth |
| `/setup/:id` | `setup/setup.tsx` | Configure a storage layout |

### State Management

`PositionContextProvider` (`app/components/PositionContextProvider.tsx`) is the central client-side state:
- Tracks `selectedWine`, `selectedPosition`, `storage` (placements), `activeTab`, `activeSetupId`
- Uses React Router's `useFetcher` to POST `add`/`remove` placement actions without full navigation
- Derives `inventoryByLocation` (`InventoryMatrix`: `setupId → shelf → layer → slot → WineItem`) via `useMemo`

### Core Types (`types.ts`)

- `WineItem` — full wine record from CellarTracker
- `BottlePlacement` — `{ setupId: string; shelf: number; layer: number; slot: number }`
- `BottlePlacements` — `{ [iWine: string]: BottlePlacement[] }` mapping wines to typed positions
- `StorageSetup` — `ShelfProps[]` array defining a rack's shelf configuration
- `ShelfProps` — `{ capacity, innerRow, layers? }` for a single shelf
- `SetupListItem` — `{ id: string; name: string }` for listing setups
- `Env` — Cloudflare env bindings (`SESSION_SECRET`)

### Fridge/Shelf Visualization

`app/components/Storage/Fridge.tsx` renders a grid of shelf cells. Positions are encoded as `{ shelf, layer, slot }` integers (previously a string format). The `innerRow` concept in `ShelfProps` represents a front/back split within a single shelf slot.
