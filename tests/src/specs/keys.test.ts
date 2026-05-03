import { describe, it, expect } from "vitest";
import { api } from "../helpers/client";

describe("API Key management", () => {
  let createdId: number;
  let createdKey: string;

  it("POST /api/keys — creates a new API key", async () => {
    const res = await api.post<{ id: number; key: string; name: string; active: boolean; prefix: string }>(
      "/keys",
      { name: "ci-test-key" }
    );
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("ci-test-key");
    expect(res.body.active).toBe(true);
    expect(res.body.key).toMatch(/^sk_/);
    expect(res.body.prefix).toMatch(/^sk_/);
    createdId = res.body.id;
    createdKey = res.body.key;
  });

  it("GET /api/keys — lists keys without exposing full value", async () => {
    const res = await api.get<Array<{ id: number; prefix: string; key?: string }>>("/keys");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((k) => k.id === createdId);
    expect(found).toBeDefined();
    expect(found!.key).toBeUndefined();
    expect(found!.prefix).toBeDefined();
  });

  it("DELETE /api/keys/:id — revokes the key", async () => {
    const res = await api.delete(`/keys/${createdId}`);
    expect(res.status).toBe(204);
  });

  it("Revoked key cannot create signals — returns 401", async () => {
    const res = await api.withKey(createdKey).post("/signals", {
      symbol: "AAPL", name: "Apple", assetClass: "stocks", signalType: "buy",
      confidence: 80, currentPrice: 189, targetPrice: 210, stopLoss: 175,
      riskReward: 2.0, timeframe: "1D", reasoning: "revoke test",
    });
    expect(res.status).toBe(401);
  });
});
