import { Router, Request } from "express";
import { db, signalsTable } from "@workspace/db";
import { requireApiKey } from "../lib/apiKeyAuth";
import { validateAndLog } from "../lib/ingestionValidator";
import { TradingViewWebhookBody } from "@workspace/api-zod";

const router = Router();

// TradingView sends alert data as JSON POST
// Alert message format: {"ticker":"AAPL","action":"buy","price":189.45,"confidence":80}
router.post("/webhooks/tradingview", requireApiKey, async (req, res) => {
  const parsed = TradingViewWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ticker, action, price, confidence = 75, target, stop, message, timeframe } = parsed.data;

  // Map TradingView action to signalType
  const signalType = (["buy", "sell", "hold"].includes(action.toLowerCase())
    ? action.toLowerCase()
    : "hold") as "buy" | "sell" | "hold";

  // Infer asset class from ticker heuristics
  const assetClass = inferAssetClass(ticker);

  const payload = {
    symbol: ticker.toUpperCase(),
    assetClass,
    signalType,
    confidence,
    reasoning: message ?? "",
    stopLoss: stop,
    targetPrice: target,
  };

  const keyName = (req as Request & { apiKeyName?: string }).apiKeyName;
  const validation = await validateAndLog(payload, "tradingview", keyName);

  if (!validation.accepted) {
    res.status(422).json({ error: validation.rejectionReason });
    return;
  }

  const currentPrice = price;
  const targetPrice = target ?? currentPrice * (signalType === "buy" ? 1.05 : 0.95);
  const stopLoss = stop ?? currentPrice * (signalType === "buy" ? 0.97 : 1.03);
  const riskReward =
    Math.abs(targetPrice - currentPrice) / Math.abs(currentPrice - stopLoss) || 1;

  const [signal] = await db
    .insert(signalsTable)
    .values({
      symbol: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      assetClass,
      signalType,
      confidence,
      currentPrice,
      targetPrice,
      stopLoss,
      riskReward: Math.round(riskReward * 10) / 10,
      timeframe: timeframe ?? "1D",
      reasoning: message ?? `TradingView alert: ${action.toUpperCase()} ${ticker}`,
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

function inferAssetClass(ticker: string): "stocks" | "indices" | "forex" | "commodities" {
  const upper = ticker.toUpperCase();
  // Commodities: precious metals, energy, agricultural
  if (/^(XAUUSD|XAGUSD|GOLD|SILVER|OIL|CL|NG|GC|SI|COPPER|HG|BRENT|WTI|USOIL|BRENTOIL|NATGAS|WEAT|CORN|SOYB|COCOA|COFFEE|SUGAR|COTTON)/.test(upper))
    return "commodities";
  // Forex pairs: 6 alpha chars (e.g. EURUSD) or contains slash
  if (/^[A-Z]{6}$/.test(upper) || upper.includes("/")) return "forex";
  // Common indices
  if (["SPX", "NDX", "DJI", "FTSE", "DAX", "NKY", "US500", "US100", "UK100", "GER40", "CAC", "IBEX", "SMI", "ASX200"].includes(upper))
    return "indices";
  return "stocks";
}

export default router;
