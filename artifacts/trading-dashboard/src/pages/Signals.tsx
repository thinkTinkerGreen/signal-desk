import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import { useGetSignals, useGetSignalSummary } from "@workspace/api-client-react";
import { SignalCard } from "@/components/SignalCard";
import { cn } from "@/lib/utils";

const assetClasses = ["all", "stocks", "indices", "forex"] as const;
const signalTypes = ["all", "buy", "sell", "hold"] as const;

type AssetClass = typeof assetClasses[number];
type SignalType = typeof signalTypes[number];

export function Signals() {
  const [assetClass, setAssetClass] = useState<AssetClass>("all");
  const [signalType, setSignalType] = useState<SignalType>("all");

  const { data: signals = [], refetch } = useGetSignals(
    { asset_class: assetClass, signal_type: signalType },
    { query: { queryKey: ["signals", assetClass, signalType] } }
  );
  const { data: summary } = useGetSignalSummary();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signal Board</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time trading signals across all asset classes</p>
      </div>

      {/* Summary counts */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Signals", value: summary.total, color: "text-foreground", bg: "bg-card", border: "border-border" },
            { label: "Buy Signals", value: summary.buy, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/25", icon: TrendingUp },
            { label: "Sell Signals", value: summary.sell, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/25", icon: TrendingDown },
            { label: "Hold Signals", value: summary.hold, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/25", icon: Minus },
          ].map(({ label, value, color, bg, border, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("rounded-xl border p-4", bg, border)}
            >
              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className={cn("w-3.5 h-3.5", color)} />}
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
              </div>
              <p className={cn("text-3xl font-bold font-mono", color)}>{value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-mono uppercase tracking-wider">Filter</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {assetClasses.map((ac) => (
            <button
              key={ac}
              onClick={() => setAssetClass(ac)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all",
                assetClass === ac
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {ac}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {signalTypes.map((st) => {
            const colors: Record<string, string> = {
              buy: "bg-emerald-500 text-white",
              sell: "bg-red-500 text-white",
              hold: "bg-amber-500 text-white",
              all: "bg-primary text-primary-foreground",
            };
            return (
              <button
                key={st}
                onClick={() => setSignalType(st)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                  signalType === st
                    ? colors[st]
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {signals.length} signal{signals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Signals grid */}
      {signals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">No signals match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signals.map((signal, i) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onDelete={refetch}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
