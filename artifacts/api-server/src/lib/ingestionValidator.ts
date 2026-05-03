import { db, ingestionRulesTable, ingestionLogTable } from "@workspace/db";

interface SignalPayload {
  symbol: string;
  assetClass: string;
  signalType: string;
  confidence: number;
  reasoning?: string;
  stopLoss?: number;
  targetPrice?: number;
}

interface ValidationResult {
  accepted: boolean;
  rejectionReason?: string;
}

export async function validateAndLog(
  payload: SignalPayload,
  source: "agent" | "tradingview" | "manual",
  keyName?: string
): Promise<ValidationResult> {
  // Load rules (default to permissive if none exist)
  const rules = await db.select().from(ingestionRulesTable).limit(1);
  const rule = rules[0];

  if (!rule) {
    // No rules configured yet — allow everything
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: true,
      keyName: keyName ?? null,
    });
    return { accepted: true };
  }

  // Confidence check
  if (payload.confidence < rule.minConfidence) {
    const reason = `Confidence ${payload.confidence}% is below minimum ${rule.minConfidence}%`;
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: false,
      rejectionReason: reason,
      keyName: keyName ?? null,
    });
    return { accepted: false, rejectionReason: reason };
  }

  // Asset class check
  const assetClassMap: Record<string, boolean> = {
    stocks: rule.allowStocks,
    indices: rule.allowIndices,
    forex: rule.allowForex,
  };
  if (!assetClassMap[payload.assetClass]) {
    const reason = `Asset class '${payload.assetClass}' is not allowed`;
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: false,
      rejectionReason: reason,
      keyName: keyName ?? null,
    });
    return { accepted: false, rejectionReason: reason };
  }

  // Required field checks
  if (rule.requireReasoning && (!payload.reasoning || payload.reasoning.trim() === "")) {
    const reason = "Reasoning is required but was not provided";
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: false,
      rejectionReason: reason,
      keyName: keyName ?? null,
    });
    return { accepted: false, rejectionReason: reason };
  }

  if (rule.requireStopLoss && (payload.stopLoss == null || payload.stopLoss <= 0)) {
    const reason = "Stop loss is required but was not provided";
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: false,
      rejectionReason: reason,
      keyName: keyName ?? null,
    });
    return { accepted: false, rejectionReason: reason };
  }

  if (rule.requireTargetPrice && (payload.targetPrice == null || payload.targetPrice <= 0)) {
    const reason = "Target price is required but was not provided";
    await db.insert(ingestionLogTable).values({
      source,
      symbol: payload.symbol,
      signalType: payload.signalType,
      accepted: false,
      rejectionReason: reason,
      keyName: keyName ?? null,
    });
    return { accepted: false, rejectionReason: reason };
  }

  // All checks passed
  await db.insert(ingestionLogTable).values({
    source,
    symbol: payload.symbol,
    signalType: payload.signalType,
    accepted: true,
    keyName: keyName ?? null,
  });
  return { accepted: true };
}
