import { describe, it, expect, beforeAll } from "vitest";
import { api, createTestKey } from "../helpers/client";

describe("Signals", () => {
  let apiKey: string;

  beforeAll(async () => {
    const k = await createTestKey("signals-test");
    apiKey = k.key;
  });

  it("GET /api/signals — returns an array", async () => {
    const res = await api.get<unknown[]>("/signals");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/signals/summary — returns counts", async () => {
    const res = await api.get<{ total: number; buy: number; sell: number; hold: number; avgConfidence: number }>(
      "/signals/summary"
    );
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe("number");
    expect(typeof res.body.buy).toBe("number");
    expect(typeof res.body.avgConfidence).toBe("number");
  });

  it("POST /api/signals — returns 401 without API key", async () => {
    const res = await api.post("/signals", {
      symbol: "TSLA", name: "Tesla", assetClass: "stocks", signalType: "buy",
      confidence: 80, currentPrice: 200, targetPrice: 250, stopLoss: 180,
      riskReward: 2.5, timeframe: "1D", reasoning: "test",
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/signals — creates signal with valid API key", async () => {
    const res = await api.withKey(apiKey).post<{ id: number; symbol: string; signalType: string }>(
      "/signals",
      {
        symbol: "MSFT", name: "Microsoft", assetClass: "stocks", signalType: "buy",
        confidence: 88, currentPrice: 415, targetPrice: 470, stopLoss: 395,
        riskReward: 2.75, timeframe: "1W",
        reasoning: "Azure + AI cycle driving cloud revenue above consensus estimates.",
      }
    );
    expect(res.status).toBe(201);
    expect(res.body.symbol).toBe("MSFT");
    expect(res.body.signalType).toBe("buy");
    expect(typeof res.body.id).toBe("number");
  });

  it("GET /api/signals?asset_class=stocks — only stocks returned", async () => {
    const res = await api.get<Array<{ assetClass: string }>>("/signals?asset_class=stocks");
    expect(res.status).toBe(200);
    for (const s of res.body) expect(s.assetClass).toBe("stocks");
  });

  it("GET /api/signals?signal_type=buy — only buys returned", async () => {
    const res = await api.get<Array<{ signalType: string }>>("/signals?signal_type=buy");
    expect(res.status).toBe(200);
    for (const s of res.body) expect(s.signalType).toBe("buy");
  });

  it("POST /api/signals — returns 400 on invalid body", async () => {
    const res = await api.withKey(apiKey).post("/signals", { symbol: "INCOMPLETE" });
    expect(res.status).toBe(400);
  });
});
