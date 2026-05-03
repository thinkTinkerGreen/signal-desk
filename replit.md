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

### Iteration 1 — `tag: iteration-1` (current)
- Full trading signal dashboard (Stocks, Indices, Forex)
- 5 pages: Dashboard, Signals, Portfolio, Positions, Watchlist
- Mock signal data seeded in DB
- Basic POST endpoint to accept signals from external agents

### Iteration 2 — Planned
- API key authentication for signal ingestion (protect POST /api/signals)
- TradingView-compatible webhook endpoint (/api/webhooks/tradingview)
- Configurable validation rules UI on the dashboard (min confidence threshold, allowed asset classes, required fields)
- Signal ingestion log / audit trail

## Artifacts

### Trading Signal Dashboard (`artifacts/trading-dashboard`)
- **Preview path**: `/`
- **Kind**: react-vite web app
- **Purpose**: Investment/trading signal dashboard for Stocks, Indices, and Forex
- **Pages**: Dashboard `/`, Signals `/signals`, Portfolio `/portfolio`, Positions `/positions`, Watchlist `/watchlist`

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Kind**: Express API server
- **Routes**: `/api/signals`, `/api/signals/summary`, `/api/portfolio`, `/api/portfolio/history`, `/api/positions`, `/api/assets`

## Database Schema

- `signals` — trading signals with symbol, asset class, signal type (buy/sell/hold), confidence, prices, R:R, reasoning
- `positions` — open trading positions with entry/current/target/stop prices and P&L
- `assets` — watchlist assets with current price and change data

## Signal Integration

The `/api/signals` POST endpoint accepts new signals from external agents/LLMs.
In Iteration 2 this will require an API key header: `X-API-Key: <key>`

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
