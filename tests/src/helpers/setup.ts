import { beforeAll, afterAll } from "vitest";
import { db } from "@workspace/db";
import { ingestionRulesTable } from "@workspace/db";

const DEFAULT_RULES = {
  minConfidence: 0,
  allowStocks: true,
  allowIndices: true,
  allowForex: true,
  requireReasoning: false,
  requireStopLoss: false,
  requireTargetPrice: false,
};

beforeAll(async () => {
  const existing = await db.select().from(ingestionRulesTable).limit(1);
  if (existing.length === 0) {
    await db.insert(ingestionRulesTable).values({
      ...DEFAULT_RULES,
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(ingestionRulesTable)
      .set({ ...DEFAULT_RULES, updatedAt: new Date() });
  }
});

afterAll(async () => {
  // Reset rules to defaults after each file so they don't pollute next file
  await db
    .update(ingestionRulesTable)
    .set({ ...DEFAULT_RULES, updatedAt: new Date() });
});
