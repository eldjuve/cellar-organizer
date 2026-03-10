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

Authentication uses secure HTTP-only cookie sessions (24h expiry). A demo account (`demo`/`demo`) is hardcoded in `app/utils.server.ts`.

### Persistent Storage (Cloudflare Durable Objects)

Both Durable Object classes in `workers/app.ts` use SQLite (`ctx.storage.sql`):

- **`WineInventoryStore`** — stores wine inventory and placements. Methods: `setWines`, `getCount`, `queryWines`, `getWineMatrix`, `getFilterOptions`, `addPlacement`, `removePlacement`, `getWineById`, `lookupBarcode`
- **`StorageConfigStore`** — stores named shelf/rack configs with a UUID `id`. Methods: `setConfig` (upsert, returns id), `getConfig`, `getConfigList`, `deleteConfig`

Bindings are defined in `wrangler.jsonc` as `WINE_STORE` and `CONFIG_STORE`. After changing Durable Object schemas, add a migration entry in `wrangler.jsonc`.

> **Important:** All DO RPC method calls return Promises. Always `await` them in route loaders/actions — unawaited calls silently serialize to `{}`.

### Routing

Routes are defined in `app/routes.ts` and map to files under `app/routes/`:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `routes/layout.tsx` | Persistent shell (wine list + Outlet); redirects to first config if one exists, or login if unauthenticated |
| `/:configId` | `routes/layout.tsx` + `routes/storage-view.tsx` | Layout wraps storage view child route |
| `/login` | `routes/login.tsx` | CellarTracker auth |
| `/logout` | `routes/logout.tsx` | Logout handler |
| `/config/:id` | `routes/config/config.tsx` | Configure a storage layout |
| `/api/barcode` | `routes/api.barcode.ts` | Barcode lookup API |
| `/api/wine` | `routes/api.wine.ts` | Wine data API (used by AppContextProvider fetcher) |

### State Management

`AppContextProvider` (`app/components/AppContextProvider.tsx`) is the central client-side state:
- Tracks `activeTab`, `toggleTab`/`setActiveTab`, `selectedWine` (fetched lazily via `/api/wine?iWine=`), `selectedPosition`
- Selecting a wine auto-switches `activeTab` to `"storage"`
- Placement state is managed server-side in `WineInventoryStore`

### Component Structure

```
app/components/
  AppContextProvider.tsx   — cross-cutting client state
  CellarTrackerLink.tsx    — external link helper
  icons/                   — SVG icon components
  layout/
    TopBar.tsx             — header bar
    Logo.tsx               — SVG logo
    MobileMenu.tsx         — bottom tab bar (mobile)
  wine-list/
    List.tsx               — wine inventory list
    WineRow.tsx            — individual wine row
    FilterBar.tsx          — search/filter controls
  storage/
    StorageView.tsx        — StorageView + StorageContext provider + SSE config sync
    StorageContext.tsx     — React context for slot selection and wine matrix
    Storage.tsx            — shelf/slot grid
    Selected.tsx           — selected wine/position detail panel
    ConfigSelector.tsx     — config dropdown + edit/new links
    useWinesInConfig.ts    — optimistic wine matrix state
  barcode/
    BarcodeScanner.tsx     — camera barcode scanner
```

### Core Types (`types.ts`)

- `WineItem` — full wine record from CellarTracker
- `BottlePlacement` — `{ configId: string; shelf: number; layer: number; slot: number }`
- `StorageConfig` — `ShelfProps[]` array defining a rack's shelf configuration
- `ShelfProps` — `{ capacity, innerRow, layers? }` for a single shelf
- `StorageConfigItem` — `{ id: string; name: string }` for listing configs
- `WineMatrix` — `{ [shelf]: { [layer]: { [slot]: WineItem } } }` for the storage grid
- `Env` — Cloudflare env bindings (`SESSION_SECRET`)

### Common Pitfalls

- **Do not add a placement-count method or counter.** `WineItem.placements` is always up-to-date (kept in sync by `addPlacement`/`removePlacement` on the DO and re-fetched via `/api/wine` after every change). Use `wine.placements.length` to check how many slots a wine occupies — no separate count is needed.

### Type Declarations

`barcode-detector.d.ts` (project root) contains the BarcodeDetector Web API type declaration and is included via `tsconfig.cloudflare.json`.
