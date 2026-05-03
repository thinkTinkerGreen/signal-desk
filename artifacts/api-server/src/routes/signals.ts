import { Router, Request } from "express";
import { db, signalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateSignalBody,
  GetSignalsQueryParams,
  GetSignalParams,
  DeleteSignalParams,
} from "@workspace/api-zod";
import { requireApiKey } from "../lib/apiKeyAuth";
import { validateAndLog } from "../lib/ingestionValidator";

const router = Router();

router.get("/signals", async (req, res) => {
  const parsed = GetSignalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { asset_class, signal_type } = parsed.data;

  const results = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.generatedAt));

  const filtered = results.filter((s) => {
    if (asset_class && asset_class !== "all" && s.assetClass !== asset_class) return false;
    if (signal_type && signal_type !== "all" && s.signalType !== signal_type) return false;
    return true;
  });

  res.json(
    filtered.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      assetClass: s.assetClass,
      signalType: s.signalType,
      confidence: s.confidence,
      currentPrice: s.currentPrice,
      targetPrice: s.targetPrice,
      stopLoss: s.stopLoss,
      riskReward: s.riskReward,
      timeframe: s.timeframe,
      reasoning: s.reasoning,
      generatedAt: s.generatedAt,
    }))
  );
});

// POST /signals — requires API key + passes through validation rules
router.post("/signals", requireApiKey, async (req, res) => {
  const parsed = CreateSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const keyName = (req as Request & { apiKeyName?: string }).apiKeyName;
  const validation = await validateAndLog(
    {
      symbol: parsed.data.symbol,
      assetClass: parsed.data.assetClass,
      signalType: parsed.data.signalType,
      confidence: parsed.data.confidence,
      reasoning: parsed.data.reasoning,
      stopLoss: parsed.data.stopLoss,
      targetPrice: parsed.data.targetPrice,
    },
    "agent",
    keyName
  );

  if (!validation.accepted) {
    res.status(422).json({ error: validation.rejectionReason });
    return;
  }

  const [signal] = await db
    .insert(signalsTable)
    .values({
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      assetClass: parsed.data.assetClass,
      signalType: parsed.data.signalType,
      confidence: parsed.data.confidence,
      currentPrice: parsed.data.currentPrice,
      targetPrice: parsed.data.targetPrice,
      stopLoss: parsed.data.stopLoss,
      riskReward: parsed.data.riskReward,
      timeframe: parsed.data.timeframe,
      reasoning: parsed.data.reasoning,
    })
    .returning();

  res.status(201).json({
    id: signal.id,
    symbol: signal.symbol,
    name: signal.name,
    assetClass: signal.assetClass,
    signalType: signal.signalType,
    confidence: signal.confidence,
    currentPrice: signal.currentPrice,
    targetPrice: signal.targetPrice,
    stopLoss: signal.stopLoss,
    riskReward: signal.riskReward,
    timeframe: signal.timeframe,
    reasoning: signal.reasoning,
    generatedAt: signal.generatedAt,
  });
});

router.get("/signals/summary", async (_req, res) => {
  const signals = await db.select().from(signalsTable);

  const buy = signals.filter((s) => s.signalType === "buy").length;
  const sell = signals.filter((s) => s.signalType === "sell").length;
  const hold = signals.filter((s) => s.signalType === "hold").length;

  const byAssetClass = {
    stocks: signals.filter((s) => s.assetClass === "stocks").length,
    indices: signals.filter((s) => s.assetClass === "indices").length,
    forex: signals.filter((s) => s.assetClass === "forex").length,
  };

  const avgConfidence =
    signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0;

  res.json({
    total: signals.length,
    buy,
    sell,
    hold,
    byAssetClass,
    avgConfidence: Math.round(avgConfidence * 10) / 10,
  });
});

router.get("/signals/:id", async (req, res) => {
  const parsed = GetSignalParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [signal] = await db
    .select()
    .from(signalsTable)
    .where(eq(signalsTable.id, parsed.data.id));

  if (!signal) {
    res.status(404).json({ error: "Signal not found" });
    return;
  }

  res.json({
    id: signal.id,
    symbol: signal.symbol,
    name: signal.name,
    assetClass: signal.assetClass,
    signalType: signal.signalType,
    confidence: signal.confidence,
    currentPrice: signal.currentPrice,
    targetPrice: signal.targetPrice,
    stopLoss: signal.stopLoss,
    riskReward: signal.riskReward,
    timeframe: signal.timeframe,
    reasoning: signal.reasoning,
    generatedAt: signal.generatedAt,
  });
});

router.delete("/signals/:id", async (req, res) => {
  const parsed = DeleteSignalParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.delete(signalsTable).where(eq(signalsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
