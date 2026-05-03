import { describe, it, expect, beforeAll } from "vitest";
import { api, createTestKey } from "../helpers/client";

describe("TradingView Webhook", () => {
  let apiKey: string;

  beforeAll(async () => {
    const k = await createTestKey("webhook-test");
    apiKey = k.key;
  });

  it("POST /api/webhooks/tradingview — returns 401 without key", async () => {
    const res = await api.post("/webhooks/tradingview", {
      ticker: "AAPL", action: "buy", price: 189,
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/webhooks/tradingview — creates signal from full payload", async () => {
    const res = await api.withKey(apiKey).post<{
      symbol: string; signalType: string; assetClass: string; currentPrice: number;
    }>("/webhooks/tradingview", {
      ticker: "GOOGL", action: "buy", price: 175.5,
      confidence: 82, target: 195, stop: 165,
      message: "Breakout above key resistance with volume confirmation",
      timeframe: "1D",
    });
    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe("GOOGL");
    expect(res.body.signalType).toBe("buy");
    expect(res.body.currentPrice).toBe(175.5);
    expect(res.body.assetClass).toBe("stocks");
  });

  it("POST /api/webhooks/tradingview — infers forex asset class for EURUSD", async () => {
    const res = await api.withKey(apiKey).post<{ assetClass: string; signalType: string }>(
      "/webhooks/tradingview",
      { ticker: "EURUSD", action: "sell", price: 1.082, confidence: 75 }
    );
    expect(res.status).toBe(201);
    expect(res.body.assetClass).toBe("forex");
    expect(res.body.signalType).toBe("sell");
  });

  it("POST /api/webhooks/tradingview — infers indices asset class for SPX", async () => {
    const res = await api.withKey(apiKey).post<{ assetClass: string }>(
      "/webhooks/tradingview",
      { ticker: "SPX", action: "buy", price: 5800, confidence: 70 }
    );
    expect(res.status).toBe(201);
    expect(res.body.assetClass).toBe("indices");
  });

  it("POST /api/webhooks/tradingview — returns 400 on missing required fields", async () => {
    const res = await api.withKey(apiKey).post("/webhooks/tradingview", {
      ticker: "AAPL",
      // missing: action, price
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/webhooks/tradingview — infers commodities class for XAUUSD (Gold)", async () => {
    const res = await api.withKey(apiKey).post<{ assetClass: string; symbol: string }>(
      "/webhooks/tradingview",
      { ticker: "XAUUSD", action: "buy", price: 2355, confidence: 78, target: 2400, stop: 2320 }
    );
    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe("XAUUSD");
    expect(res.body.assetClass).toBe("commodities");
  });

  it("POST /api/webhooks/tradingview — infers commodities class for USOIL", async () => {
    const res = await api.withKey(apiKey).post<{ assetClass: string }>(
      "/webhooks/tradingview",
      { ticker: "USOIL", action: "sell", price: 78.5, confidence: 65 }
    );
    expect(res.status).toBe(201);
    expect(res.body.assetClass).toBe("commodities");
  });

  it("POST /api/webhooks/tradingview — infers commodities class for SILVER", async () => {
    const res = await api.withKey(apiKey).post<{ assetClass: string }>(
      "/webhooks/tradingview",
      { ticker: "XAGUSD", action: "hold", price: 29.5, confidence: 60 }
    );
    expect(res.status).toBe(201);
    expect(res.body.assetClass).toBe("commodities");
  });
});
