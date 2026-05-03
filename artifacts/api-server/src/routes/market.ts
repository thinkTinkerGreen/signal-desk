import { Router } from "express";
import { getLivePrice, isIgConfigured } from "../lib/igConnector";
import { generateNews } from "../lib/newsGenerator";

const router = Router();

// ─── GET /api/market/prices/:symbol ─────────────────────────────────────────
router.get("/market/prices/:symbol", async (req, res) => {
  const symbol = req.params.symbol?.toUpperCase();
  if (!symbol) {
    res.status(400).json({ error: "symbol is required" });
    return;
  }

  const price = await getLivePrice(symbol);
  res.json(price);
});

// ─── POST /api/market/prices (batch) ────────────────────────────────────────
router.post("/market/prices", async (req, res) => {
  const body = req.body as { symbols?: unknown };
  if (!Array.isArray(body.symbols) || body.symbols.length === 0 || body.symbols.length > 50) {
    res.status(400).json({ error: "symbols must be a non-empty array with at most 50 items" });
    return;
  }
  const symbols = body.symbols.map((s) => String(s).toUpperCase());
  const prices = await Promise.all(symbols.map((s) => getLivePrice(s)));
  res.json(prices);
});

// ─── GET /api/market/news/:symbol ────────────────────────────────────────────
router.get("/market/news/:symbol", async (req, res) => {
  const symbol = req.params.symbol?.toUpperCase();
  const count = Math.min(Number(req.query.count ?? 5), 20);

  if (!symbol) {
    res.status(400).json({ error: "symbol is required" });
    return;
  }

  const news = generateNews(symbol, count);
  res.json(news);
});

// ─── GET /api/market/news ────────────────────────────────────────────────────
// Global market news (multi-asset)
router.get("/market/news", async (req, res) => {
  const count = Math.min(Number(req.query.count ?? 10), 30);
  const symbols = ["SPX", "XAUUSD", "EURUSD", "OIL", "AAPL", "MSFT", "NVDA"];
  const all = symbols.flatMap((s) => generateNews(s, Math.ceil(count / symbols.length)));
  const sorted = all.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  res.json(sorted.slice(0, count));
});

// ─── GET /api/market/status ──────────────────────────────────────────────────
router.get("/market/status", (_req, res) => {
  res.json({
    igConfigured: isIgConfigured(),
    priceSource: isIgConfigured() ? "ig" : "mock",
    newsSource: "built-in",
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/market/assets ──────────────────────────────────────────────────
// Returns the universe of tracked assets by class including commodities
router.get("/market/assets", (_req, res) => {
  res.json({
    stocks: [
      { symbol: "AAPL", name: "Apple Inc." },
      { symbol: "MSFT", name: "Microsoft Corp." },
      { symbol: "NVDA", name: "NVIDIA Corp." },
      { symbol: "GOOGL", name: "Alphabet Inc." },
      { symbol: "AMZN", name: "Amazon.com Inc." },
      { symbol: "META", name: "Meta Platforms" },
      { symbol: "TSLA", name: "Tesla Inc." },
      { symbol: "BRK.B", name: "Berkshire Hathaway" },
      { symbol: "JPM", name: "JPMorgan Chase" },
      { symbol: "UNH", name: "UnitedHealth Group" },
    ],
    indices: [
      { symbol: "SPX", name: "S&P 500" },
      { symbol: "NDX", name: "NASDAQ 100" },
      { symbol: "DJI", name: "Dow Jones" },
      { symbol: "FTSE", name: "FTSE 100" },
      { symbol: "DAX", name: "DAX 40" },
      { symbol: "NKY", name: "Nikkei 225" },
      { symbol: "CAC", name: "CAC 40" },
      { symbol: "ASX200", name: "ASX 200" },
    ],
    forex: [
      { symbol: "EURUSD", name: "EUR/USD" },
      { symbol: "GBPUSD", name: "GBP/USD" },
      { symbol: "USDJPY", name: "USD/JPY" },
      { symbol: "USDCHF", name: "USD/CHF" },
      { symbol: "AUDUSD", name: "AUD/USD" },
      { symbol: "NZDUSD", name: "NZD/USD" },
      { symbol: "USDCAD", name: "USD/CAD" },
      { symbol: "EURGBP", name: "EUR/GBP" },
    ],
    commodities: [
      { symbol: "XAUUSD", name: "Gold" },
      { symbol: "XAGUSD", name: "Silver" },
      { symbol: "OIL", name: "WTI Crude Oil" },
      { symbol: "BRENT", name: "Brent Crude" },
      { symbol: "NG", name: "Natural Gas" },
      { symbol: "COPPER", name: "Copper" },
      { symbol: "WEAT", name: "Wheat" },
      { symbol: "CORN", name: "Corn" },
    ],
  });
});

export default router;
