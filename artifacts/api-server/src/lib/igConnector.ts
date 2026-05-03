/**
 * IG Group REST API connector.
 *
 * Prerequisites (set as environment variables):
 *   IG_API_KEY      — IG API key from My Account → API keys
 *   IG_USERNAME     — IG account username (or email)
 *   IG_PASSWORD     — IG account password
 *   IG_ACCOUNT_TYPE — "demo" | "live" (default: "demo")
 *
 * IG REST API docs: https://labs.ig.com/rest-trading-api-reference
 */
import { logger } from "./logger";

type AccountType = "demo" | "live";

interface IgSession {
  cst: string;
  xSecurityToken: string;
  accountType: AccountType;
  expiresAt: number;
}

interface IgMarketSnapshot {
  bid: number | null;
  offer: number | null;
  updateTime: string;
  netChange: number;
  percentageChange: number;
  high: number | null;
  low: number | null;
  marketStatus: string;
}

interface IgPriceBar {
  snapshotTime: string;
  openPrice: { bid: number; ask: number };
  closePrice: { bid: number; ask: number };
  highPrice: { bid: number; ask: number };
  lowPrice: { bid: number; ask: number };
  lastTradedVolume: number;
}

export interface LivePrice {
  symbol: string;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  status: string;
  timestamp: string;
  source: "ig" | "mock";
}

let _session: IgSession | null = null;

function getBaseUrl(accountType: AccountType): string {
  return accountType === "live"
    ? "https://api.ig.com/gateway/deal"
    : "https://demo-api.ig.com/gateway/deal";
}

function isConfigured(): boolean {
  return !!(
    process.env["IG_API_KEY"] &&
    process.env["IG_USERNAME"] &&
    process.env["IG_PASSWORD"]
  );
}

async function authenticate(): Promise<IgSession> {
  const accountType = (process.env["IG_ACCOUNT_TYPE"] ?? "demo") as AccountType;
  const baseUrl = getBaseUrl(accountType);

  const res = await fetch(`${baseUrl}/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-IG-API-KEY": process.env["IG_API_KEY"] ?? "",
      "Version": "2",
    },
    body: JSON.stringify({
      identifier: process.env["IG_USERNAME"],
      password: process.env["IG_PASSWORD"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IG authentication failed (${res.status}): ${text}`);
  }

  const cst = res.headers.get("CST");
  const xSecurityToken = res.headers.get("X-SECURITY-TOKEN");

  if (!cst || !xSecurityToken) {
    throw new Error("IG did not return session tokens");
  }

  return {
    cst,
    xSecurityToken,
    accountType,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
}

async function getSession(): Promise<IgSession> {
  if (_session && _session.expiresAt > Date.now() + 30_000) {
    return _session;
  }
  _session = await authenticate();
  return _session;
}

function igHeaders(session: IgSession): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-IG-API-KEY": process.env["IG_API_KEY"] ?? "",
    "CST": session.cst,
    "X-SECURITY-TOKEN": session.xSecurityToken,
    "Version": "1",
  };
}

export async function getLivePrice(epic: string): Promise<LivePrice> {
  if (!isConfigured()) {
    logger.warn({ epic }, "IG Group not configured — returning mock price");
    return mockPrice(epic);
  }

  try {
    const session = await getSession();
    const baseUrl = getBaseUrl(session.accountType);
    const res = await fetch(`${baseUrl}/markets/${encodeURIComponent(epic)}`, {
      headers: igHeaders(session),
    });

    if (!res.ok) {
      logger.warn({ epic, status: res.status }, "IG market request failed, falling back to mock");
      return mockPrice(epic);
    }

    const data = (await res.json()) as { snapshot: IgMarketSnapshot };
    const snap = data.snapshot;

    const bid = snap.bid;
    const ask = snap.offer;
    const mid = bid !== null && ask !== null ? (bid + ask) / 2 : null;

    return {
      symbol: epic,
      bid,
      ask,
      mid,
      change: snap.netChange,
      changePercent: snap.percentageChange,
      high: snap.high,
      low: snap.low,
      status: snap.marketStatus,
      timestamp: new Date().toISOString(),
      source: "ig",
    };
  } catch (err) {
    logger.error({ epic, err }, "IG price fetch error, falling back to mock");
    return mockPrice(epic);
  }
}

export async function getPriceBars(
  epic: string,
  resolution: "DAY" | "HOUR" | "HOUR_4" | "MINUTE_30" | "WEEK" = "HOUR",
  count = 90
): Promise<IgPriceBar[]> {
  if (!isConfigured()) return [];

  try {
    const session = await getSession();
    const baseUrl = getBaseUrl(session.accountType);
    const url = `${baseUrl}/prices/${encodeURIComponent(epic)}?resolution=${resolution}&max=${count}&pageSize=0`;
    const res = await fetch(url, { headers: { ...igHeaders(session), Version: "3" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { prices: IgPriceBar[] };
    return data.prices ?? [];
  } catch {
    return [];
  }
}

export function isIgConfigured(): boolean {
  return isConfigured();
}

function seededRand(seed: number) {
  let s = (seed % 2147483647 + 2147483647) % 2147483647 || 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mockPrice(symbol: string): LivePrice {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRand(seed + Math.floor(Date.now() / 60_000));

  const basePrices: Record<string, number> = {
    AAPL: 189, MSFT: 420, GOOGL: 175, AMZN: 182, NVDA: 875,
    TSLA: 245, META: 510, SPX: 5200, NDX: 18200, DJI: 39000,
    FTSE: 8200, DAX: 18500, EURUSD: 1.083, GBPUSD: 1.268,
    USDJPY: 154.2, XAUUSD: 2340, XAGUSD: 28.5, OIL: 82.4,
    BRENT: 86.2, GC: 2340, SI: 28.5, CL: 82.4,
  };

  const base = basePrices[symbol.toUpperCase()] ?? 100 * (1 + (seed % 50) / 10);
  const spread = base * 0.0002;
  const drift = (rng() - 0.48) * base * 0.015;
  const bid = Math.round((base + drift) * 10000) / 10000;
  const ask = Math.round((bid + spread) * 10000) / 10000;
  const change = Math.round(drift * 100) / 100;
  const changePercent = Math.round((drift / base) * 10000) / 100;

  return {
    symbol,
    bid,
    ask,
    mid: Math.round((bid + ask) * 5000) / 10000,
    change,
    changePercent,
    high: Math.round((bid + Math.abs(drift) * 1.8) * 100) / 100,
    low: Math.round((bid - Math.abs(drift) * 1.5) * 100) / 100,
    status: "TRADEABLE",
    timestamp: new Date().toISOString(),
    source: "mock",
  };
}
