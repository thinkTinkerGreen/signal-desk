import { Router } from "express";
import { db, assetsTable } from "@workspace/db";

const router = Router();

router.get("/assets", async (req, res) => {
  const assets = await db.select().from(assetsTable);
  res.json(
    assets.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      assetClass: a.assetClass,
      currentPrice: a.currentPrice,
      change: a.change,
      changePercent: a.changePercent,
      volume: a.volume,
      marketCap: a.marketCap,
    }))
  );
});

export default router;
