import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, createTestKey } from "../helpers/client";
import { db, ingestionRulesTable } from "@workspace/db";

const DEFAULT_RULES = {
  minConfidence: 0,
  allowStocks: true,
  allowIndices: true,
  allowForex: true,
  requireReasoning: false,
  requireStopLoss: false,
  requireTargetPrice: false,
};

describe("Ingestion Rules — CRUD", () => {
  afterEach(async () => {
    await db
      .update(ingestionRulesTable)
      .set({ ...DEFAULT_RULES, updatedAt: new Date() });
  });

  it("GET /api/ingestion/rules — returns current rules", async () => {
    const res = await api.get<{ minConfidence: number; allowStocks: boolean }>(
      "/ingestion/rules"
    );
    expect(res.status).toBe(200);
    expect(typeof res.body.minConfidence).toBe("number");
    expect(typeof res.body.allowStocks).toBe("boolean");
  });

  it("PUT /api/ingestion/rules — updates rules", async () => {
    const res = await api.put<{
      minConfidence: number;
      allowForex: boolean;
      requireReasoning: boolean;
    }>("/ingestion/rules", {
      minConfidence: 60,
      allowStocks: true,
      allowIndices: true,
      allowForex: false,
      requireReasoning: true,
      requireStopLoss: false,
      requireTargetPrice: false,
    });
    expect(res.status).toBe(200);
    expect(res.body.minConfidence).toBe(60);
    expect(res.body.allowForex).toBe(false);
    expect(res.body.requireReasoning).toBe(true);
  });
});

describe("Ingestion Validation — rules enforcement", () => {
  let apiKey: string;
  let keyId: number;

  beforeAll(async () => {
    // Reset rules to fully permissive before this suite
    await db
      .update(ingestionRulesTable)
      .set({ ...DEFAULT_RULES, updatedAt: new Date() });
    const k = await createTestKey("ingestion-validation");
    apiKey = k.key;
    keyId = k.id;
  });

  afterEach(async () => {
    await db
      .update(ingestionRulesTable)
      .set({ ...DEFAULT_RULES, updatedAt: new Date() });
  });

  it("rejects signal when confidence is below threshold", async () => {
    await db
      .update(ingestionRulesTable)
      .set({ minConfidence: 80, updatedAt: new Date() });
    const res = await api.withKey(apiKey).post<{ error: string }>("/signals", {
      symbol: "LOW",
      name: "LowConf",
      assetClass: "stocks",
      signalType: "buy",
      confidence: 40,
      currentPrice: 100,
      targetPrice: 120,
      stopLoss: 90,
      riskReward: 2.0,
      timeframe: "1D",
      reasoning: "weak signal",
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("below minimum");
  });

  it("rejects signal for a disallowed asset class", async () => {
    await db
      .update(ingestionRulesTable)
      .set({ allowForex: false, updatedAt: new Date() });
    const res = await api.withKey(apiKey).post<{ error: string }>("/signals", {
      symbol: "EURUSD",
      name: "EUR/USD",
      assetClass: "forex",
      signalType: "buy",
      confidence: 85,
      currentPrice: 1.08,
      targetPrice: 1.12,
      stopLoss: 1.06,
      riskReward: 2.0,
      timeframe: "4H",
      reasoning: "trend follow",
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("not allowed");
  });

  it("rejects signal when reasoning is required but empty", async () => {
    await db
      .update(ingestionRulesTable)
      .set({ requireReasoning: true, updatedAt: new Date() });
    const res = await api.withKey(apiKey).post<{ error: string }>("/signals", {
      symbol: "AAPL",
      name: "Apple",
      assetClass: "stocks",
      signalType: "buy",
      confidence: 85,
      currentPrice: 189,
      targetPrice: 210,
      stopLoss: 175,
      riskReward: 2.0,
      timeframe: "1D",
      reasoning: "",
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("Reasoning");
  });

  it("GET /api/ingestion/log — returns log array", async () => {
    const res = await api.get<unknown[]>("/ingestion/log");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/ingestion/log?status=accepted — only accepted entries", async () => {
    const res = await api.get<Array<{ accepted: boolean }>>(
      "/ingestion/log?status=accepted"
    );
    expect(res.status).toBe(200);
    for (const e of res.body) expect(e.accepted).toBe(true);
  });

  it("GET /api/ingestion/log?status=rejected — only rejected entries", async () => {
    const res = await api.get<Array<{ accepted: boolean }>>(
      "/ingestion/log?status=rejected"
    );
    expect(res.status).toBe(200);
    for (const e of res.body) expect(e.accepted).toBe(false);
  });
});
