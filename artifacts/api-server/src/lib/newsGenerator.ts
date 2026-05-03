/**
 * Deterministic mock news generator.
 * Produces realistic-looking financial headlines without external API calls.
 * In production, replace or augment with a real news API (NewsAPI, Refinitiv, etc.).
 */

interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  isBreaking: boolean;
  publishedAt: Date;
  url: string;
  tags: string;
}

const SOURCES = [
  "Reuters", "Bloomberg", "Financial Times", "Wall Street Journal",
  "MarketWatch", "CNBC", "Barron's", "Seeking Alpha",
];

const TIMEFRAMES_AGO = [
  2, 7, 15, 30, 45, 60, 90, 120, 180, 240,
];

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

const TEMPLATES: Record<string, Array<{ positive: string; negative: string; neutral: string }>> = {
  stocks: [
    {
      positive: "{sym} Beats Earnings Estimates, Raises Full-Year Guidance",
      negative: "{sym} Misses Quarterly Earnings, Cuts Revenue Outlook",
      neutral: "{sym} Reports In-Line Results, Eyes Expansion",
    },
    {
      positive: "{sym} Shares Jump on Strong Institutional Demand",
      negative: "{sym} Under Pressure as Short Interest Climbs",
      neutral: "Analysts Initiate {sym} Coverage With Hold Rating",
    },
    {
      positive: "{sym} CEO Unveils Aggressive AI Investment Plan",
      negative: "{sym} Faces Regulatory Scrutiny Over Business Practices",
      neutral: "{sym} Board Approves Share Buyback Programme",
    },
    {
      positive: "{sym} Secures Landmark Cloud Contract Worth $4.2B",
      negative: "{sym} Warns on Supply-Chain Disruptions",
      neutral: "{sym} Reaffirms Full-Year Guidance Amid Mixed Signals",
    },
  ],
  indices: [
    {
      positive: "{sym} Rallies as Fed Minutes Signal Pause in Rate Hikes",
      negative: "{sym} Slides on Recession Fears and Weak PMI Data",
      neutral: "{sym} Flat as Investors Weigh Inflation Data",
    },
    {
      positive: "{sym} Hits All-Time High on Technology Sector Surge",
      negative: "{sym} Drops 1.2% Amid Geopolitical Tensions",
      neutral: "{sym} Consolidates Near Key Support Level",
    },
    {
      positive: "{sym} Gains for Third Consecutive Session",
      negative: "{sym} Breaks Key Support; Bears Target 200-Day MA",
      neutral: "{sym} Mixed as Earnings Season Gets Underway",
    },
  ],
  forex: [
    {
      positive: "Dollar Softens; {sym} Buoyed by Hawkish ECB Remarks",
      negative: "{sym} Retreats as Risk-Off Sentiment Grips Markets",
      neutral: "{sym} Rangebound Ahead of Key Jobs Report",
    },
    {
      positive: "{sym} Breaks Resistance on Strong Macro Data",
      negative: "{sym} Hit by Carry Trade Unwind",
      neutral: "{sym} Eyes CPI Release for Near-Term Direction",
    },
  ],
  commodities: [
    {
      positive: "Gold ({sym}) Surges as Safe-Haven Demand Returns",
      negative: "Oil ({sym}) Slides on Rising Inventory Data",
      neutral: "{sym} Steady Ahead of OPEC+ Output Decision",
    },
    {
      positive: "{sym} Climbs on Supply Disruption Reports",
      negative: "{sym} Falls to 6-Month Low on Demand Concerns",
      neutral: "{sym} Eyes Weekly Supply Data for Direction",
    },
    {
      positive: "Precious Metals Rally; {sym} Tests Key Resistance at $2,050",
      negative: "Energy Prices Slip; {sym} Breaks Below $80 Handle",
      neutral: "{sym} Trading in Narrow Band Amid Thin Holiday Volumes",
    },
  ],
};

const SUMMARIES: Record<"positive" | "negative" | "neutral", string[]> = {
  positive: [
    "Institutional investors continue to accumulate positions, with options market showing bullish skew and strong call volume.",
    "Technical analysts flag a breakout above the 200-day moving average, with momentum indicators pointing higher.",
    "Fundamental catalysts including revenue beat and margin expansion support the constructive outlook.",
    "Market breadth confirms the move higher, with advancing issues outpacing declining by a 3-to-1 margin.",
    "Management's confident tone and raised guidance signal improving underlying business fundamentals.",
  ],
  negative: [
    "Risk-averse positioning and light liquidity may amplify near-term downside moves.",
    "Bears point to deteriorating breadth, overbought RSI, and rising put/call ratio as warning signs.",
    "Macro headwinds including sticky inflation and a hawkish central bank cloud the near-term outlook.",
    "Volume on the decline exceeded 30-day average, suggesting institutional distribution at current levels.",
    "Analysts flag a pattern of lower highs and lower lows, consistent with a developing downtrend.",
  ],
  neutral: [
    "Price action remains constructive above key moving averages, though momentum has slowed markedly.",
    "Market participants await the next catalyst; options implied volatility has compressed to multi-week lows.",
    "The broader consensus remains split between bulls and bears, resulting in a directionless near-term outlook.",
    "Trading ranges have narrowed considerably, with volume declining — a classic sign of market indecision.",
    "Derivatives market shows balanced positioning with no strong directional bias evident.",
  ],
};

function getAssetClass(symbol: string): "stocks" | "indices" | "forex" | "commodities" {
  const upper = symbol.toUpperCase();
  if (/^(XAUUSD|XAGUSD|GOLD|SILVER|OIL|CL|NG|GC|SI|COPPER|HG|BRENT|WTI|USOIL|BRENTOIL|NATGAS|WEAT|CORN|SOYB)/.test(upper)) return "commodities";
  if (/^[A-Z]{6}$/.test(upper) || upper.includes("/")) return "forex";
  if (["SPX", "NDX", "DJI", "FTSE", "DAX", "NKY", "US500", "US100", "UK100", "GER40", "CAC", "IBEX", "SMI", "ASX200"].includes(upper)) return "indices";
  return "stocks";
}

export function generateNews(symbol: string, count = 5): NewsItem[] {
  const assetClass = getAssetClass(symbol);
  const templates = TEMPLATES[assetClass] ?? TEMPLATES.stocks;
  const items: NewsItem[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + i * 97 + Math.floor(now / 3_600_000);
    const rng = seededRandom(seed);
    const sentimentRoll = rng();
    const sentiment: "positive" | "negative" | "neutral" =
      sentimentRoll > 0.55 ? "positive" : sentimentRoll > 0.3 ? "negative" : "neutral";

    const template = pick(templates, rng);
    const headline = (template[sentiment] as string).replace(/{sym}/g, symbol.toUpperCase());
    const summary = pick(SUMMARIES[sentiment], rng);
    const source = pick(SOURCES, rng);
    const minAgo = pick(TIMEFRAMES_AGO, rng) + Math.floor(rng() * 10);
    const publishedAt = new Date(now - minAgo * 60_000);
    const isBreaking = i === 0 && rng() > 0.7;

    items.push({
      headline,
      summary,
      source,
      sentiment,
      isBreaking,
      publishedAt,
      url: `https://example.com/news/${symbol.toLowerCase()}-${i}`,
      tags: [assetClass, symbol.toLowerCase()].join(","),
    });
  }

  return items;
}
