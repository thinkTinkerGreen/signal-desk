# Workspace

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
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## GitHub

- **Repository**: https://github.com/thinkTinkerGreen/signal-desk
- **GitHub user**: thinkTinkerGreen
- **Token**: stored as `GITHUB_TOKEN` secret
- **Push command**: `git push "https://thinkTinkerGreen:$GITHUB_TOKEN@github.com/thinkTinkerGreen/signal-desk.git" main`
- **Note**: `git config` writes are blocked in main agent — use the push URL with token embedded instead

## Iterations

### Iteration 1 — `tag: iteration-1`
- Full trading signal dashboard (Stocks, Indices, Forex)
- 5 pages: Dashboard, Signals, Portfolio, Positions, Watchlist
- Mock signal data seeded in DB
- Basic POST endpoint to accept signals from external agents

### Iteration 2 — `tag: iteration-2` (current)
- API key authentication on POST /api/signals and POST /api/webhooks/tradingview (X-API-Key header)
- TradingView-compatible webhook endpoint at /api/webhooks/tradingview
- Configurable validation rules (min confidence, asset class toggles, required fields) stored in DB
- Settings page at /settings: create/revoke API keys, configure validation rules, webhook reference
- Ingestion Log page at /ingestion: audit trail of every signal attempt with accept/reject status, source, key name, timestamp
- New DB tables: api_keys, ingestion_rules, ingestion_log
- Codegen script patched to preserve api-zod/src/index.ts (Orval was overwriting it)

## Artifacts

### Trading Signal Dashboard (`artifacts/trading-dashboard`)
- **Preview path**: `/`
- **Kind**: react-vite web app
- **Purpose**: Investment/trading signal dashboard for Stocks, Indices, and Forex
- **Pages**: Dashboard `/`, Signals `/signals`, Portfolio `/portfolio`, Positions `/positions`, Watchlist `/watchlist`, Ingestion Log `/ingestion`, Settings `/settings`

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Kind**: Express API server
- **Routes**:
  - `GET /api/signals` — list signals (filterable)
  - `POST /api/signals` — create signal (**requires X-API-Key**)
  - `GET /api/signals/summary` — summary counts
  - `GET /api/portfolio`, `GET /api/portfolio/history`
  - `GET /api/positions`, `POST /api/positions`, `DELETE /api/positions/:id`
  - `GET /api/assets`
  - `GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/:id` — API key management
  - `GET /api/ingestion/rules`, `PUT /api/ingestion/rules` — validation rules
  - `GET /api/ingestion/log` — audit log
  - `POST /api/webhooks/tradingview` — TradingView webhook (**requires X-API-Key**)

## Database Schema

- `signals` — trading signals with symbol, asset class, signal type (buy/sell/hold), confidence, prices, R:R, reasoning
- `positions` — open trading positions with entry/current/target/stop prices and P&L
- `assets` — watchlist assets with current price and change data
- `api_keys` — hashed API keys with name, prefix, active flag, last used timestamp
- `ingestion_rules` — single-row config: min confidence, asset class toggles, required field flags
- `ingestion_log` — audit trail: source, symbol, signal type, accepted/rejected, rejection reason, key name

## Signal Integration

`POST /api/signals` and `POST /api/webhooks/tradingview` both require `X-API-Key: <key>` header.
Create keys from the Settings page in the dashboard, or via `POST /api/keys`.

**Payload format:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "assetClass": "stocks",
  "signalType": "buy",
  "confidence": 87,
  "currentPrice": 189.45,
  "targetPrice": 210.00,
  "stopLoss": 178.00,
  "riskReward": 2.8,
  "timeframe": "1W",
  "reasoning": "..."
}
```
