import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGetAssets, useGetSignals } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const assetClassBadge: Record<string, string> = {
  stocks: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  indices: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  forex: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

function formatPrice(price: number, assetClass: string) {
  if (assetClass === "forex" && price < 100) return price.toFixed(4);
  if (price >= 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 2 });
  return price.toFixed(2);
}

export function Watchlist() {
  const { data: assets = [] } = useGetAssets();
  const { data: signals = [] } = useGetSignals();

  const signalBySymbol: Record<string, string> = {};
  signals.forEach((s) => {
    if (!signalBySymbol[s.symbol]) signalBySymbol[s.symbol] = s.signalType;
  });

  const grouped: Record<string, typeof assets> = { stocks: [], indices: [], forex: [] };
  assets.forEach((a) => {
    if (grouped[a.assetClass]) grouped[a.assetClass].push(a);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitored assets with latest price data</p>
      </div>

      {(["stocks", "indices", "forex"] as const).map((cls, groupIdx) => (
        <div key={cls}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono">{cls}</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono">{grouped[cls].length} assets</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {grouped[cls].map((asset, i) => {
              const signal = signalBySymbol[asset.symbol];
              const isUp = asset.changePercent >= 0;

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.1 + i * 0.04 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-base text-foreground">{asset.symbol}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider", assetClassBadge[asset.assetClass] || "")}>
                          {asset.assetClass}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{asset.name}</p>
                    </div>

                    {signal && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                        signal === "buy" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : signal === "sell" ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      )}>
                        {signal === "buy" ? <TrendingUp className="w-2.5 h-2.5" /> : signal === "sell" ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                        {signal}
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold font-mono text-foreground">
                        {formatPrice(asset.currentPrice, asset.assetClass)}
                      </p>
                      <div className={cn("flex items-center gap-1 mt-1", isUp ? "text-emerald-400" : "text-red-400")}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-xs font-mono font-semibold">
                          {isUp ? "+" : ""}{asset.change >= 0.01 || asset.change <= -0.01 ? asset.change.toFixed(2) : asset.change.toFixed(4)}
                        </span>
                        <span className="text-xs font-mono">
                          ({isUp ? "+" : ""}{asset.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-muted-foreground font-mono space-y-0.5">
                      {asset.volume !== "N/A" && (
                        <p>Vol: <span className="text-foreground/70">{asset.volume}</span></p>
                      )}
                      {asset.marketCap !== "N/A" && (
                        <p>Cap: <span className="text-foreground/70">{asset.marketCap}</span></p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
