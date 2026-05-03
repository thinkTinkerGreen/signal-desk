import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, X, Target, ShieldAlert } from "lucide-react";
import { useGetPositions, useClosePosition } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function formatPrice(price: number, assetClass: string) {
  if (assetClass === "forex" && price < 100) return price.toFixed(4);
  if (price >= 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 0 });
  return price.toFixed(2);
}

const assetClassBadge: Record<string, string> = {
  stocks: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  indices: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  forex: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

export function Positions() {
  const { data: positions = [] } = useGetPositions();
  const closePosition = useClosePosition();
  const queryClient = useQueryClient();

  const handleClose = async (id: number) => {
    await closePosition.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ["positions"] });
  };

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Open Positions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{positions.length} active position{positions.length !== 1 ? "s" : ""}</p>
        </div>
        {positions.length > 0 && (
          <div className={cn("px-4 py-2 rounded-xl border font-mono text-sm font-bold", totalPnl >= 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400")}>
            Total P&L: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No open positions</p>
          <p className="text-xs text-muted-foreground mt-1">Act on signals to open positions</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border bg-muted/30">
            {["Asset", "Name", "Direction", "Qty", "Entry", "Current", "Target / Stop", "P&L"].map((h) => (
              <p key={h} className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {positions.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-4 items-center hover:bg-muted/20 transition-colors group",
                  pos.direction === "long" ? "border-l-2 border-l-emerald-500/50" : "border-l-2 border-l-red-500/50"
                )}
              >
                {/* Symbol */}
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">{pos.symbol}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider", assetClassBadge[pos.assetClass] || "bg-muted text-muted-foreground border-border")}>
                    {pos.assetClass}
                  </span>
                </div>

                {/* Name */}
                <span className="text-xs text-muted-foreground truncate">{pos.name}</span>

                {/* Direction */}
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase", pos.direction === "long" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                  {pos.direction === "long" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {pos.direction}
                </div>

                {/* Quantity */}
                <span className="font-mono text-xs text-foreground">{pos.quantity}</span>

                {/* Entry */}
                <span className="font-mono text-xs text-muted-foreground">{formatPrice(pos.entryPrice, pos.assetClass)}</span>

                {/* Current */}
                <span className="font-mono text-xs text-foreground font-semibold">{formatPrice(pos.currentPrice, pos.assetClass)}</span>

                {/* Target / Stop */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px]">
                    <Target className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="font-mono text-emerald-400">{formatPrice(pos.targetPrice, pos.assetClass)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <ShieldAlert className="w-2.5 h-2.5 text-red-400" />
                    <span className="font-mono text-red-400">{formatPrice(pos.stopLoss, pos.assetClass)}</span>
                  </div>
                </div>

                {/* P&L + close */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={cn("text-xs font-bold font-mono", pos.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                    </p>
                    <p className={cn("text-[10px] font-mono", pos.pnlPercent >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleClose(pos.id)}
                    disabled={closePosition.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
                    title="Close position"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
