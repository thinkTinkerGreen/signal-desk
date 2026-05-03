# SignalDesk — Bloomberg-style Trading Terminal

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec — do NOT change `info.title`)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack Query, wouter, framer-motion, lucide-react, lightweight-charts
- **Charts**: TradingView Lightweight Charts™ (candlestick in AssetDetail)
- **Theme**: dark terminal / Bloomberg aesthetic

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/tests run test` — run all 45 integration tests against live API server

## GitHub

- **Repository**: https://github.com/thinkTinkerGreen/signal-desk
- **GitHub user**: thinkTinkerGreen
- **Token**: stored as `GITHUB_TOKEN` secret
- **Note**: `git remote add` and `git push` are blocked in main agent — use a project task to push tags

## Iterations

### Iteration 1 — `tag: iteration-1`
- Full trading signal dashboard (Stocks, Indices, Forex)
- 5 pages: Dashboard, Signals, Portfolio, Positions, Watchlist
- Mock signal data seeded in DB
- Basic POST endpoint to accept signals from external agents

### Iteration 2 — `tag: iteration-2`
- API key authentication on POST /api/signals and POST /api/webhooks/tradingview (X-API-Key header)
- TradingView-compatible webhook endpoint at /api/webhooks/tradingview
- Configurable validation rules (min confidence, asset class toggles, required fields) stored in DB
- Settings page: create/revoke API keys, configure validation rules, webhook reference
- Ingestion Log page: audit trail of every signal attempt
- New DB tables: api_keys, ingestion_rules, ingestion_log
- Test harness: 25 integration tests across health, signals, keys, ingestion, webhooks
- Terraform infrastructure: AWS (ECS Fargate + RDS + ALB), GCP (Cloud Run + Cloud SQL), Azure (Container Apps + PostgreSQL)

### Iteration 3 — `tag: iteration3-Bloom` (current)
- **Commodities** asset class added across entire stack (Stocks, Indices, Forex, Commodities)
- **Market Explorer** page (`/market`): 4-tab grid view + SVG mind-map network view of all assets
- **Asset Detail** page (`/market/:symbol`): Bloomberg-style layout with:
  - TradingView Lightweight Charts™ candlestick (1H, 90 bars)
  - BID/ASK/HIGH/LOW/CHANGE/CHG%/STATUS/SRC metrics strip
  - News panel with deterministic sentiment-tagged mock news (per-symbol, per-asset-class)
  - Signal history and latest signal detail (target, stop loss, R:R, timeframe)
  - IG Group integration status card
- **IG Group connector** (`igConnector.ts`): reads `IG_API_KEY`, `IG_USERNAME`, `IG_PASSWORD`, `IG_ACCOUNT_TYPE`; falls back to deterministic mock prices
- **News generator** (`newsGenerator.ts`): per-asset-class Bloomberg-style headlines, deterministic per-symbol seed
- New market routes: `/api/market/prices/:symbol`, `/api/market/prices` (batch), `/api/market/news/:symbol`, `/api/market/assets`, `/api/market/status`
- **Settings page** updated: Commodities toggle (NEW badge), IG Group env var reference card
- **OpenAPI spec** updated to v0.2.0 with commodities enum on all schemas and full market endpoint definitions
- Codegen re-run: new hooks `getMarketPrice`, `getBatchPrices`, `getMarketNews`, `getMarketAssets`, `getMarketStatus`
- **Tests**: 45/45 passing — 6 spec files including new `market.test.ts` and 3 commodities webhook tests

## Artifacts

### Trading Signal Dashboard (`artifacts/trading-dashboard`)
- **Preview path**: `/`
- **Kind**: react-vite web app
- **Pages**:
  - `/` — Dashboard
  - `/market` — Market Explorer (4 asset classes, grid + mind-map)
  - `/market/:symbol` — Asset Detail (Bloomberg-style, candlestick chart, news, signals)
  - `/signals` — Signals list
  - `/portfolio` — Portfolio overview
  - `/positions` — Open positions
  - `/watchlist` — Watchlist
  - `/ingestion` — Ingestion log
  - `/settings` — API keys, validation rules, IG Group config, webhook reference

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Kind**: Express API server
- **Routes**:
  - `GET /api/signals` — list signals (filterable by asset_class, signal_type)
  - `POST /api/signals` — create signal (**requires X-API-Key**)
  - `GET /api/signals/summary` — summary counts
  - `GET /api/portfolio`, `GET /api/portfolio/history`
  - `GET /api/positions`, `POST /api/positions`, `DELETE /api/positions/:id`
  - `GET /api/assets`
  - `GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/:id`
  - `GET /api/ingestion/rules`, `PUT /api/ingestion/rules`
  - `GET /api/ingestion/log`
  - `POST /api/webhooks/tradingview` (**requires X-API-Key**)
  - `GET /api/market/prices/:symbol` — live price (IG or mock)
  - `POST /api/market/prices` — batch prices (up to 50 symbols)
  - `GET /api/market/news/:symbol` — deterministic news feed
  - `GET /api/market/assets` — all assets grouped by class
  - `GET /api/market/status` — IG connection status

## Database Schema

- `signals` — trading signals with symbol, asset class (stocks/indices/forex/commodities), signal type, confidence, prices, R:R, reasoning
- `positions` — open trading positions
- `assets` — watchlist assets
- `api_keys` — hashed API keys with name, prefix, active flag, last used timestamp
- `ingestion_rules` — single-row config: min confidence, asset class toggles (incl. allowCommodities), required field flags
- `ingestion_log` — audit trail
- `news_cache` — schema defined (future: cache real news API responses)
- `integration_configs` — schema defined (future: store encrypted IG Group credentials)

## Signal Integration

`POST /api/signals` and `POST /api/webhooks/tradingview` both require `X-API-Key: <key>` header.
Create keys from the Settings page. Webhook infers asset class from ticker format automatically.

**Supported asset classes**: stocks, indices, forex, commodities

**Commodity symbol examples**: XAUUSD (Gold), XAGUSD (Silver), OIL (WTI), BRENT, NG (Natural Gas), COPPER, WEAT, CORN

**Webhook payload:**
```json
{
  "ticker": "XAUUSD",
  "action": "buy",
  "price": 2355.00,
  "confidence": 78,
  "target": 2400,
  "stop": 2320,
  "timeframe": "1D",
  "message": "Safe-haven breakout above $2350"
}
```

## IG Group Integration

Set environment variables to enable live market data:
- `IG_API_KEY` — REST API key from IG Account settings
- `IG_USERNAME` — IG username
- `IG_PASSWORD` — IG password
- `IG_ACCOUNT_TYPE` — `"live"` or `"demo"` (default: `"demo"`)

Without these, all market prices use deterministic simulation data.

## Test Suite

Run with: `pnpm --filter @workspace/tests run test`

6 spec files, 45 tests (all passing):
- `health.test.ts` — healthcheck
- `signals.test.ts` — CRUD, filtering, auth
- `keys.test.ts` — key lifecycle and auth enforcement
- `ingestion.test.ts` — validation rules and log
- `webhooks.test.ts` — TradingView webhook + commodities inference (XAUUSD, USOIL, XAGUSD)
- `market.test.ts` — prices, batch, news, assets, status endpoints
