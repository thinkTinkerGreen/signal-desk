import { Router } from "express";
import { db, positionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePositionBody, ClosePositionParams } from "@workspace/api-zod";

const router = Router();

router.get("/positions", async (req, res) => {
  const positions = await db.select().from(positionsTable);
  res.json(
    positions.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      assetClass: p.assetClass,
      direction: p.direction,
      quantity: p.quantity,
      entryPrice: p.entryPrice,
      currentPrice: p.currentPrice,
      targetPrice: p.targetPrice,
      stopLoss: p.stopLoss,
      pnl: p.pnl,
      pnlPercent: p.pnlPercent,
      openedAt: p.openedAt,
    }))
  );
});

router.post("/positions", async (req, res) => {
  const parsed = CreatePositionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const pnl =
    d.direction === "long"
      ? (d.entryPrice - d.entryPrice) * d.quantity
      : (d.entryPrice - d.entryPrice) * d.quantity;
  const pnlPercent = 0;

  const [position] = await db
    .insert(positionsTable)
    .values({
      symbol: d.symbol,
      name: d.name,
      assetClass: d.assetClass,
      direction: d.direction,
      quantity: d.quantity,
      entryPrice: d.entryPrice,
      currentPrice: d.entryPrice,
      targetPrice: d.targetPrice,
      stopLoss: d.stopLoss,
      pnl,
      pnlPercent,
    })
    .returning();

  res.status(201).json({
    id: position.id,
    symbol: position.symbol,
    name: position.name,
    assetClass: position.assetClass,
    direction: position.direction,
    quantity: position.quantity,
    entryPrice: position.entryPrice,
    currentPrice: position.currentPrice,
    targetPrice: position.targetPrice,
    stopLoss: position.stopLoss,
    pnl: position.pnl,
    pnlPercent: position.pnlPercent,
    openedAt: position.openedAt,
  });
});

router.delete("/positions/:id", async (req, res) => {
  const parsed = ClosePositionParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.delete(positionsTable).where(eq(positionsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
