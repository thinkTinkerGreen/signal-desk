import { Router } from "express";
import { db, positionsTable } from "@workspace/db";

const router = Router();

router.get("/portfolio", async (req, res) => {
  const positions = await db.select().from(positionsTable);

  const investedValue = positions.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity,
    0
  );
  const currentValue = positions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0
  );
  const cashBalance = 24350.5;
  const totalValue = cashBalance + currentValue;
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnlPercent =
    investedValue > 0 ? (totalPnl / investedValue) * 100 : 0;
  const dayPnl = totalPnl * 0.12;
  const dayPnlPercent = totalPnlPercent * 0.12;

  res.json({
    totalValue: Math.round(totalValue * 100) / 100,
    cashBalance,
    investedValue: Math.round(investedValue * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
    dayPnl: Math.round(dayPnl * 100) / 100,
    dayPnlPercent: Math.round(dayPnlPercent * 100) / 100,
    openPositions: positions.length,
    winRate: 68.4,
    totalTrades: 47,
  });
});

router.get("/portfolio/history", async (req, res) => {
  const baseValue = 100000;
  const history = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const noise = (Math.random() - 0.45) * 800;
    const trend = (89 - i) * 120;
    const value = baseValue + trend + noise;
    history.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(value * 100) / 100,
    });
  }
  res.json(history);
});

export default router;
