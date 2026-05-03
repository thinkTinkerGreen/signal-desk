import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  BarChart2, Globe, Layers, Gem, Cpu, Search,
  Wifi, WifiOff, Network, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetSignals } from "@workspace/api-client-react";

type AssetClass = "stocks" | "indices" | "forex" | "commodities";

interface AssetInfo { symbol: string; name: string }
interface MarketAssets { stocks: AssetInfo[]; indices: AssetInfo[]; forex: AssetInfo[]; commodities: AssetInfo[] }
interface LivePrice {
  symbol: string; bid: number | null; ask: number | null; mid: number | null;
  change: number; changePercent: number; high: number | null; low: number | null;
  status: string; timestamp: string; source: "ig" | "mock";
}

const TAB_META: { id: AssetClass; label: string; icon: React.ElementType; color: string }[] = [
  { id: "stocks", label: "Stocks", icon: Cpu, color: "text-blue-400" },
  { id: "indices", label: "Indices", icon: BarChart2, color: "text-amber-400" },
  { id: "forex", label: "Forex", icon: Globe, color: "text-emerald-400" },
  { id: "commodities", label: "Commodities", icon: Gem, color: "text-orange-400" },
];

const CLASS_COLORS: Record<AssetClass, string> = {
  stocks: "#60a5fa",
  indices: "#fbbf24",
  forex: "#34d399",
  commodities: "#fb923c",
};

function fmt(v: number | null, dec = 2) {
  if (v == null) return "--";
  return Math.abs(v) >= 1000
    ? v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : v.toFixed(dec);
}

function PriceRow({ asset, price }: { asset: AssetInfo; price?: LivePrice }) {
  const up = (price?.changePercent ?? 0) > 0;
  const down = (price?.changePercent ?? 0) < 0;

  return (
    <Link href={`/market/${asset.symbol}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/60 hover:bg-card hover:border-border cursor-pointer transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-bold text-foreground truncate">{asset.symbol}</p>
          <p className="text-[10px] text-muted-foreground truncate">{asset.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-mono font-bold text-foreground">
            {price ? fmt(price.mid) : "—"}
          </p>
          <p className={cn(
            "text-[10px] font-mono",
            up ? "text-emerald-400" : down ? "text-red-400" : "text-muted-foreground"
          )}>
            {price ? `${up ? "+" : ""}${fmt(price.changePercent)}%` : "—"}
          </p>
        </div>
        <div className={cn(
          "w-1 h-8 rounded-full shrink-0",
          up ? "bg-emerald-500" : down ? "bg-red-500" : "bg-border"
        )} />
      </motion.div>
    </Link>
  );
}

// ─── Mind Map Node (pure SVG) ────────────────────────────────────────────────
function MindMap({ assets, prices, onSelect }: {
  assets: MarketAssets;
  prices: Map<string, LivePrice>;
  onSelect: (symbol: string) => void;
}) {
  const W = 800, H = 500;
  const CX = W / 2, CY = H / 2;

  const nodes: { symbol: string; name: string; ac: AssetClass; x: number; y: number; r: number }[] = [];

  const LAYOUT: Record<AssetClass, { cx: number; cy: number; radius: number }> = {
    stocks:      { cx: CX - 220, cy: CY - 100, radius: 110 },
    indices:     { cx: CX + 220, cy: CY - 100, radius: 95  },
    forex:       { cx: CX - 220, cy: CY + 110, radius: 95  },
    commodities: { cx: CX + 220, cy: CY + 110, radius: 95  },
  };

  for (const [ac, list] of Object.entries(assets) as [AssetClass, AssetInfo[]][]) {
    const layout = LAYOUT[ac];
    list.slice(0, 7).forEach((a, i, arr) => {
      const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
      nodes.push({
        symbol: a.symbol, name: a.name, ac,
        x: layout.cx + Math.cos(angle) * layout.radius,
        y: layout.cy + Math.sin(angle) * layout.radius,
        r: 22,
      });
    });
    // Hub node
    nodes.push({ symbol: ac.toUpperCase(), name: ac, ac, x: layout.cx, y: layout.cy, r: 32 });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        {Object.entries(CLASS_COLORS).map(([ac, color]) => (
          <radialGradient key={ac} id={`grad-${ac}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.08" />
          </radialGradient>
        ))}
      </defs>

      {/* Hub background circles */}
      {Object.entries(LAYOUT).map(([ac, l]) => (
        <circle key={ac} cx={l.cx} cy={l.cy} r={l.radius + 30} fill={`url(#grad-${ac})`} />
      ))}

      {/* Edges: leaf → hub */}
      {nodes.filter(n => !Object.keys(assets).map(a => a.toUpperCase()).includes(n.symbol)).map(n => {
        const hub = nodes.find(h => h.symbol === n.ac.toUpperCase());
        if (!hub) return null;
        return (
          <line
            key={`edge-${n.symbol}`}
            x1={n.x} y1={n.y} x2={hub.x} y2={hub.y}
            stroke={CLASS_COLORS[n.ac]} strokeOpacity="0.25" strokeWidth="1"
          />
        );
      })}

      {/* Hub → center */}
      {Object.entries(LAYOUT).map(([ac, l]) => (
        <line
          key={`hub-${ac}`}
          x1={l.cx} y1={l.cy} x2={CX} y2={CY}
          stroke={CLASS_COLORS[ac as AssetClass]} strokeOpacity="0.3" strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      ))}

      {/* Center node */}
      <circle cx={CX} cy={CY} r={44} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <text x={CX} y={CY - 6} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="9" fontFamily="monospace" fontWeight="bold">SIGNAL</text>
      <text x={CX} y={CY + 7} textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontFamily="monospace" fontWeight="bold">DESK</text>

      {/* Asset nodes */}
      {nodes.map(n => {
        const isHub = Object.keys(assets).map(a => a.toUpperCase()).includes(n.symbol);
        const p = prices.get(n.symbol);
        const up = (p?.changePercent ?? 0) > 0;
        const down = (p?.changePercent ?? 0) < 0;
        const color = CLASS_COLORS[n.ac];

        return (
          <g key={n.symbol} onClick={() => !isHub && onSelect(n.symbol)} style={{ cursor: isHub ? "default" : "pointer" }}>
            <circle
              cx={n.x} cy={n.y} r={n.r + 3}
              fill={color} fillOpacity="0.08"
              stroke={color} strokeOpacity="0.3" strokeWidth="1"
            />
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill="hsl(var(--card))"
              stroke={up ? "#34d399" : down ? "#f87171" : color}
              strokeWidth={isHub ? 1.5 : 1}
            />
            <text
              x={n.x} y={n.y - (isHub ? 0 : 3)}
              textAnchor="middle"
              fill={isHub ? color : "hsl(var(--foreground))"}
              fontSize={isHub ? 8 : 7}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {isHub ? n.symbol : n.symbol.length > 5 ? n.symbol.slice(0, 5) : n.symbol}
            </text>
            {!isHub && p && (
              <text
                x={n.x} y={n.y + 8}
                textAnchor="middle"
                fill={up ? "#34d399" : down ? "#f87171" : "hsl(var(--muted-foreground))"}
                fontSize="5.5"
                fontFamily="monospace"
              >
                {up ? "+" : ""}{fmt(p.changePercent, 1)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function Market() {
  const [tab, setTab] = useState<AssetClass>("stocks");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [assets, setAssets] = useState<MarketAssets | null>(null);
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [loading, setLoading] = useState(false);
  const [igOk, setIgOk] = useState(false);
  const [search, setSearch] = useState("");
  const { data: signals = [] } = useGetSignals();

  const BASE = import.meta.env.BASE_URL ?? "/";

  async function fetchAssets() {
    const r = await fetch(`${BASE}api/market/assets`);
    const d: MarketAssets = await r.json();
    setAssets(d);
    return d;
  }

  async function fetchPrices(assetMap: MarketAssets) {
    setLoading(true);
    const all = [
      ...assetMap.stocks, ...assetMap.indices,
      ...assetMap.forex, ...assetMap.commodities,
    ];
    const symbols = all.map(a => a.symbol);

    const r = await fetch(`${BASE}api/market/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    const data: LivePrice[] = await r.json();
    const map = new Map(data.map(p => [p.symbol, p]));
    setPrices(map);
    setLoading(false);

    const status = await fetch(`${BASE}api/market/status`).then(r => r.json());
    setIgOk(status.igConfigured);
  }

  const refresh = useCallback(async () => {
    const a = assets ?? await fetchAssets();
    await fetchPrices(a);
  }, [assets]);

  useEffect(() => {
    fetchAssets().then(a => fetchPrices(a));
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, []);

  const tabAssets = assets ? assets[tab] : [];
  const filtered = tabAssets.filter(a =>
    !search || a.symbol.includes(search.toUpperCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Signals per symbol for annotation
  const signalCounts = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.symbol] = (acc[s.symbol] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live prices across all asset classes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* IG status badge */}
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border",
            igOk
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              : "text-amber-400 border-amber-500/30 bg-amber-500/10"
          )}>
            {igOk ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {igOk ? "IG LIVE" : "SIM DATA"}
          </div>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn("px-2.5 py-1.5", view === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={cn("px-2.5 py-1.5", view === "map" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Network className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:border-border/80 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Mind Map view */}
      <AnimatePresence mode="wait">
        {view === "map" && assets && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-border bg-card/40 overflow-hidden"
            style={{ height: 500 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
              <Network className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Asset Network</span>
            </div>
            <MindMap
              assets={assets}
              prices={prices}
              onSelect={(s) => window.location.href = `${BASE}market/${s}`}
            />
          </motion.div>
        )}

        {/* Grid view */}
        {view === "grid" && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-border mb-4">
              {TAB_META.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-medium font-mono uppercase tracking-wider border-b-2 transition-all",
                    tab === t.id
                      ? `border-primary text-primary`
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className={cn("w-3.5 h-3.5", tab === t.id ? "text-primary" : t.color)} />
                  {t.label}
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">
                    {assets ? assets[t.id].length : "—"}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search symbol or name..."
                className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Asset grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {filtered.map((asset, i) => {
                const p = prices.get(asset.symbol);
                const sigs = signalCounts[asset.symbol] ?? 0;
                const up = (p?.changePercent ?? 0) > 0;
                const down = (p?.changePercent ?? 0) < 0;
                return (
                  <Link key={asset.symbol} href={`/market/${asset.symbol}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-border cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-mono font-bold text-foreground">{asset.symbol}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{asset.name}</p>
                        </div>
                        {sigs > 0 && (
                          <span className="text-[10px] font-mono bg-primary/15 text-primary border border-primary/25 rounded px-1.5 py-0.5">
                            {sigs}▲
                          </span>
                        )}
                      </div>

                      <div className="flex items-end justify-between">
                        <p className="text-sm font-mono font-bold text-foreground">
                          {p ? fmt(p.mid) : "—"}
                        </p>
                        <div className="flex items-center gap-1">
                          {up ? <TrendingUp className="w-3 h-3 text-emerald-400" /> :
                           down ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                           <Minus className="w-3 h-3 text-muted-foreground" />}
                          <span className={cn(
                            "text-[11px] font-mono",
                            up ? "text-emerald-400" : down ? "text-red-400" : "text-muted-foreground"
                          )}>
                            {p ? `${up ? "+" : ""}${fmt(p.changePercent)}%` : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="text-[10px] font-mono text-muted-foreground">
                          H: {p ? fmt(p.high) : "—"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          L: {p ? fmt(p.low) : "—"}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
