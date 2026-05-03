/**
 * Iteration 3: Market endpoint tests
 * Covers /api/market/prices/:symbol, batch prices, news, assets, status
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.API_BASE_URL ?? "http://localhost:8080/api";

describe("GET /market/prices/:symbol", () => {
  it("returns price data for a stock", async () => {
    const res = await fetch(`${BASE}/market/prices/AAPL`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      symbol: "AAPL",
      source: expect.stringMatching(/^(ig|mock)$/),
    });
    expect(typeof body.mid).toBe("number");
    expect(typeof body.changePercent).toBe("number");
  });

  it("returns price data for Gold (commodity)", async () => {
    const res = await fetch(`${BASE}/market/prices/XAUUSD`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe("XAUUSD");
    expect(typeof body.mid).toBe("number");
    expect(body.mid).toBeGreaterThan(0);
  });

  it("returns price data for a forex pair", async () => {
    const res = await fetch(`${BASE}/market/prices/EURUSD`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe("EURUSD");
    expect(body.mid).toBeDefined();
  });

  it("returns price data for an index", async () => {
    const res = await fetch(`${BASE}/market/prices/US500`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe("US500");
  });
});

describe("POST /market/prices (batch)", () => {
  it("returns prices for multiple symbols", async () => {
    const res = await fetch(`${BASE}/market/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: ["AAPL", "XAUUSD", "EURUSD", "US500"] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);
    const symbols = body.map((p: { symbol: string }) => p.symbol);
    expect(symbols).toContain("AAPL");
    expect(symbols).toContain("XAUUSD");
    expect(symbols).toContain("EURUSD");
    expect(symbols).toContain("US500");
  });

  it("returns 400 for empty symbols array", async () => {
    const res = await fetch(`${BASE}/market/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for more than 50 symbols", async () => {
    const symbols = Array.from({ length: 51 }, (_, i) => `SYM${i}`);
    const res = await fetch(`${BASE}/market/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    expect(res.status).toBe(400);
  });

  it("handles lowercase symbols by upcasing", async () => {
    const res = await fetch(`${BASE}/market/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: ["aapl"] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].symbol).toBe("AAPL");
  });
});

describe("GET /market/news/:symbol", () => {
  it("returns news array for a stock", async () => {
    const res = await fetch(`${BASE}/market/news/AAPL`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const item = body[0];
    expect(item).toMatchObject({
      headline: expect.any(String),
      summary: expect.any(String),
      source: expect.any(String),
      sentiment: expect.stringMatching(/^(positive|negative|neutral)$/),
    });
  });

  it("returns news for a commodity symbol", async () => {
    const res = await fetch(`${BASE}/market/news/XAUUSD`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].headline).toBeTruthy();
  });

  it("respects count query param", async () => {
    const res = await fetch(`${BASE}/market/news/TSLA?count=3`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(3);
  });

  it("news items have required shape", async () => {
    const res = await fetch(`${BASE}/market/news/MSFT?count=1`);
    const [item] = await res.json();
    expect(typeof item.headline).toBe("string");
    expect(typeof item.summary).toBe("string");
    expect(typeof item.source).toBe("string");
    expect(["positive", "negative", "neutral"]).toContain(item.sentiment);
    expect(typeof item.isBreaking).toBe("boolean");
    expect(typeof item.publishedAt).toBe("string");
    expect(typeof item.url).toBe("string");
  });
});

describe("GET /market/assets", () => {
  it("returns all four asset class lists", async () => {
    const res = await fetch(`${BASE}/market/assets`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("stocks");
    expect(body).toHaveProperty("indices");
    expect(body).toHaveProperty("forex");
    expect(body).toHaveProperty("commodities");
  });

  it("each class has symbol and name fields", async () => {
    const res = await fetch(`${BASE}/market/assets`);
    const body = await res.json();
    for (const cls of ["stocks", "indices", "forex", "commodities"] as const) {
      expect(Array.isArray(body[cls])).toBe(true);
      expect(body[cls].length).toBeGreaterThan(0);
      const first = body[cls][0];
      expect(typeof first.symbol).toBe("string");
      expect(typeof first.name).toBe("string");
    }
  });

  it("commodities include Gold and Oil", async () => {
    const res = await fetch(`${BASE}/market/assets`);
    const { commodities } = await res.json();
    const symbols: string[] = commodities.map((c: { symbol: string }) => c.symbol);
    expect(symbols).toContain("XAUUSD");
    expect(symbols.some((s) => ["OIL", "BRENT", "USOIL", "BRENTOIL", "CL"].includes(s))).toBe(true);
  });
});

describe("GET /market/status", () => {
  it("returns status object", async () => {
    const res = await fetch(`${BASE}/market/status`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("igConfigured");
    expect(body).toHaveProperty("priceSource");
    expect(body).toHaveProperty("newsSource");
    expect(body).toHaveProperty("timestamp");
    expect(typeof body.igConfigured).toBe("boolean");
  });

  it("priceSource is mock when IG not configured", async () => {
    const res = await fetch(`${BASE}/market/status`);
    const body = await res.json();
    // In test environment IG creds are not set
    if (!body.igConfigured) {
      expect(body.priceSource).toBe("mock");
    }
  });
});
