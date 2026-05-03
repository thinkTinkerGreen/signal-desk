import { Router } from "express";
import { db, ingestionRulesTable } from "@workspace/db";
import { UpdateIngestionRulesBody } from "@workspace/api-zod";

const router = Router();

router.get("/ingestion/rules", async (_req, res) => {
  const rules = await db.select().from(ingestionRulesTable).limit(1);

  if (rules.length === 0) {
    // Return sensible defaults
    res.json({
      id: 0,
      minConfidence: 0,
      allowStocks: true,
      allowIndices: true,
      allowForex: true,
      requireReasoning: false,
      requireStopLoss: false,
      requireTargetPrice: false,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  res.json(rules[0]);
});

router.put("/ingestion/rules", async (req, res) => {
  const parsed = UpdateIngestionRulesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(ingestionRulesTable).limit(1);

  if (existing.length === 0) {
    const [created] = await db
      .insert(ingestionRulesTable)
      .values({ ...parsed.data, updatedAt: new Date() })
      .returning();
    res.json(created);
  } else {
    const [updated] = await db
      .update(ingestionRulesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .returning();
    res.json(updated);
  }
});

export default router;
