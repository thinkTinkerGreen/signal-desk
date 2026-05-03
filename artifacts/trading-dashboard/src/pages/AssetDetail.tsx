import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw,
  ExternalLink, Wifi, WifiOff, Newspaper, BarChart2,
  Clock, Target, Shield, Activity, AlertCircle,
} from "lucide-react";
import { createChart, CandlestickSeries, type IChartApi, ColorType } from "lightweight-charts";
import { cn } from "@/lib/utils";
import { useGetSignals } from "@workspace/api-client-react";

interface LivePrice {
  symbol: string; bid: number | null; ask: number | null; mid: number | null;
  change: number; changePercent: number; high: number | null; low: number | null;
  status: string; timestamp: string; source: "ig" | "mock";
}
interface NewsItem {
  headline: string; summary: string; source: string; sentiment: "positive" | "negative" | "neutral";
  isBreaking: boolean; publishedAt: string; url: string;
}
interface Signal {
  id: number; symbol: string; name: string; assetClass: string; signalType: string;
  confidence: number; currentPrice: number; targetPrice: number; stopLoss: number;
  riskReward: number; timeframe: string; reasoning: string; generatedAt: string;
}

function fmt(v: number | null | undefined, dec = 2) {
  if (v == null) return "--";
  return Math.abs(v) >= 1000
    ? v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : v.toFixed(dec);
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Candlestick chart using TradingView Lightweight Charts ─────────────────
function PriceChart({ symbol, price }: { symbol: string; price: LivePrice | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Generate synthetic OHLCV data seeded from symbol + current day
  function generateBars(sym: string, mid: number, count = 90) {
    const seed = sym.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = seed % 2147483647 || 1;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const now = Date.now();
    const bars = [];
    let close = mid;

    for (let i = count; i >= 0; i--) {
      const t = Math.floor((now - i * 3_600_000) / 1000);
      const volatility = mid * 0.008;
      const open = close;
      close = open + (rng() - 0.49) * volatility;
      const high = Math.max(open, close) + rng() * volatility * 0.5;
      const low = Math.min(open, close) - rng() * volatility * 0.5;
      bars.push({ time: t, open, high, low, close });
    }
    return bars;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(215 20% 55%)",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "hsl(215 15% 18%)" },
        horzLines: { color: "hsl(215 15% 18%)" },
      },
      crosshair: {
        vertLine: { color: "hsl(217 91% 60%)", width: 1, style: 2 },
        horzLine: { color: "hsl(217 91% 60%)", width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: "hsl(215 15% 20%)" },
      timeScale: {
        borderColor: "hsl(215 15% 20%)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    const mid = price?.mid ?? 100;
    const bars = generateBars(symbol, mid);
    series.setData(bars as Parameters<typeof series.setData>[0]);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [symbol, price?.mid]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── News panel ──────────────────────────────────────────────────────────────
function NewsPanel({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const BASE = import.meta.env.BASE_URL ?? "/";

  useEffect(() => {
    fetch(`${BASE}api/market/news/${symbol}?count=6`)
      .then(r => r.json())
      .then(setNews)
      .catch(() => {});
  }, [symbol]);

  const sentColor: Record<string, string> = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-muted-foreground",
  };
  const sentBorder: Record<string, string> = {
    positive: "border-emerald-500/30",
    negative: "border-red-500/30",
    neutral: "border-border/50",
  };

  return (
    <div className="space-y-2">
      {news.length === 0 && (
        <div className="text-center text-muted-foreground text-xs py-6">Loading news…</div>
      )}
      {news.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn("p-3 rounded-lg border transition-all hover:bg-card", sentBorder[n.sentiment])}
        >
          <div className="flex items-start gap-2 mb-1">
            {n.isBreaking && (
              <span className="text-[9px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase shrink-0">
                Breaking
              </span>
            )}
            <p className="text-[11px] font-medium text-foreground leading-snug">{n.headline}</p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5 line-clamp-2">{n.summary}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{n.source}</span>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(n.publishedAt)}</span>
            <span className={cn("ml-auto text-[9px] font-mono uppercase", sentColor[n.sentiment])}>
              {n.sentiment}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Signal card ──────────────────────────────────────────────────────────────
function SignalRow({ s }: { s: Signal }) {
  const up = s.signalType === "buy";
  const down = s.signalType === "sell";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/60"
    >
      <div className={cn(
        "w-2 h-2 rounded-full shrink-0",
        up ? "bg-emerald-500" : down ? "bg-red-500" : "bg-amber-500"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-mono font-bold uppercase",
            up ? "text-emerald-400" : down ? "text-red-400" : "text-amber-400"
          )}>{s.signalType}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{s.timeframe}</span>
          <span className="text-[10px] font-mono text-primary ml-auto">{s.confidence}%</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.reasoning}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-mono text-muted-foreground">TP: {fmt(s.targetPrice)}</p>
        <p className="text-[10px] font-mono text-muted-foreground">SL: {fmt(s.stopLoss)}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function AssetDetail() {
  const [, params] = useRoute("/market/:symbol");
  const symbol = params?.symbol?.toUpperCase() ?? "";
  const [price, setPrice] = useState<LivePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chart" | "news" | "signals">("chart");
  const { data: allSignals = [] } = useGetSignals();
  const BASE = import.meta.env.BASE_URL ?? "/";

  const signals = allSignals.filter(s => s.symbol === symbol) as Signal[];

  async function fetchPrice() {
    setLoading(true);
    const r = await fetch(`${BASE}api/market/prices/${symbol}`);
    const d: LivePrice = await r.json();
    setPrice(d);
    setLoading(false);
  }

  useEffect(() => {
    if (!symbol) return;
    fetchPrice();
    const t = setInterval(fetchPrice, 15_000);
    return () => clearInterval(t);
  }, [symbol]);

  const up = (price?.changePercent ?? 0) > 0;
  const down = (price?.changePercent ?? 0) < 0;

  // Bloomberg-style metrics
  const metrics = [
    { label: "BID", value: price ? fmt(price.bid) : "—" },
    { label: "ASK", value: price ? fmt(price.ask) : "—" },
    { label: "HIGH", value: price ? fmt(price.high) : "—" },
    { label: "LOW", value: price ? fmt(price.low) : "—" },
    { label: "CHANGE", value: price ? `${up ? "+" : ""}${fmt(price.change)}` : "—", colored: true },
    { label: "CHG%", value: price ? `${up ? "+" : ""}${fmt(price.changePercent)}%` : "—", colored: true },
    { label: "STATUS", value: price?.status ?? "—" },
    { label: "SRC", value: price?.source?.toUpperCase() ?? "—" },
  ];

  if (!symbol) return (
    <div className="p-6 text-center text-muted-foreground">
      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
      Invalid symbol
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/market">
          <button className="p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-foreground">{symbol}</h1>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border",
              price?.source === "ig"
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-amber-400 border-amber-500/30 bg-amber-500/10"
            )}>
              {price?.source === "ig" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {price?.source?.toUpperCase() ?? "—"}
            </div>
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>

          {/* Price display */}
          <div className="flex items-end gap-3 mt-1">
            <span className="text-3xl font-mono font-bold text-foreground">
              {price ? fmt(price.mid) : "—"}
            </span>
            <div className="mb-0.5">
              <span className={cn(
                "text-sm font-mono font-bold",
                up ? "text-emerald-400" : down ? "text-red-400" : "text-muted-foreground"
              )}>
                {price ? `${up ? "+" : ""}${fmt(price.change)} (${up ? "+" : ""}${fmt(price.changePercent)}%)` : "—"}
              </span>
              {up ? <TrendingUp className="inline w-4 h-4 ml-1 text-emerald-400" /> :
               down ? <TrendingDown className="inline w-4 h-4 ml-1 text-red-400" /> :
               <Minus className="inline w-4 h-4 ml-1 text-muted-foreground" />}
            </div>
          </div>
        </div>

        <button
          onClick={fetchPrice}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:border-border/80 transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Bloomberg metrics strip */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={cn("px-3 py-2", i < metrics.length - 1 && "border-r border-border")}
          >
            <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">{m.label}</p>
            <p className={cn(
              "text-xs font-mono font-bold mt-0.5",
              m.colored
                ? up ? "text-emerald-400" : down ? "text-red-400" : "text-foreground"
                : "text-foreground"
            )}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Content area — 2 column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Tabs → chart, news, signals */}
        <div className="lg:col-span-2 space-y-3">
          {/* Tab bar */}
          <div className="flex gap-0 border border-border rounded-lg overflow-hidden">
            {([
              { id: "chart", label: "Price Chart", icon: BarChart2 },
              { id: "news", label: "News", icon: Newspaper },
              { id: "signals", label: `Signals (${signals.length})`, icon: Activity },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-xs font-mono flex-1 justify-center transition-all",
                  tab === t.id
                    ? "bg-primary/15 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {tab === "chart" && (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
              style={{ height: 380 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">{symbol} · 1H Candlestick · 90 bars</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono">Powered by TradingView Lightweight Charts™</span>
              </div>
              <div style={{ height: "calc(100% - 37px)" }}>
                <PriceChart symbol={symbol} price={price} />
              </div>
            </motion.div>
          )}

          {/* News */}
          {tab === "news" && (
            <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card/40 p-4 space-y-1"
              style={{ minHeight: 380 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{symbol} News</span>
              </div>
              <NewsPanel symbol={symbol} />
            </motion.div>
          )}

          {/* Signals */}
          {tab === "signals" && (
            <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card/40 p-4"
              style={{ minHeight: 380 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Signal History</span>
              </div>
              {signals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No signals for {symbol}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {signals.map(s => <SignalRow key={s.id} s={s} />)}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right panel — always-on Bloomberg metrics */}
        <div className="space-y-4">
          {/* Signal summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Signal Overview</h3>
            {signals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No signals on record</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {["buy", "sell", "hold"].map(type => {
                    const count = signals.filter(s => s.signalType === type).length;
                    return (
                      <div key={type} className="text-center">
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          type === "buy" ? "text-emerald-400" :
                          type === "sell" ? "text-red-400" : "text-amber-400"
                        )}>{count}</p>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground">{type}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Avg Confidence</span>
                    <span className="font-mono font-bold text-foreground">
                      {Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Latest Signal</span>
                    <span className="font-mono text-foreground">{timeAgo(signals[0].generatedAt)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Latest signal detail */}
          {signals[0] && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Signal</h3>
              <div className="space-y-2">
                {[
                  { icon: Target, label: "Target", value: fmt(signals[0].targetPrice) },
                  { icon: Shield, label: "Stop Loss", value: fmt(signals[0].stopLoss) },
                  { icon: BarChart2, label: "R:R", value: `${signals[0].riskReward}x` },
                  { icon: Clock, label: "Timeframe", value: signals[0].timeframe },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">{m.label}</span>
                    <span className="text-xs font-mono font-bold text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                  {signals[0].reasoning}
                </p>
              </div>
            </div>
          )}

          {/* IG link */}
          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="text-[10px] font-mono text-muted-foreground mb-1.5">IG Group Integration</p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed mb-2">
              Configure IG_API_KEY, IG_USERNAME, IG_PASSWORD env vars to enable live prices from IG Group.
            </p>
            <Link href="/settings">
              <button className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80">
                <ExternalLink className="w-3 h-3" />
                Open Settings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
