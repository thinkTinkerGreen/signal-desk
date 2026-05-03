import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeleteSignal } from "@workspace/api-client-react";

interface Signal {
  id: number;
  symbol: string;
  name: string;
  assetClass: string;
  signalType: string;
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  timeframe: string;
  reasoning: string;
  generatedAt: string;
}

interface SignalCardProps {
  signal: Signal;
  onDelete?: () => void;
  index?: number;
}

const signalConfig = {
  buy: {
    label: "BUY",
    icon: TrendingUp,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    barColor: "bg-emerald-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  sell: {
    label: "SELL",
    icon: TrendingDown,
    colorClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    badgeBg: "bg-red-500/20 text-red-300 border border-red-500/40",
    barColor: "bg-red-500",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
  hold: {
    label: "HOLD",
    icon: Minus,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    barColor: "bg-amber-500",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.12)]",
  },
};

const assetClassBadge: Record<string, string> = {
  stocks: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  indices: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  forex: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

function formatPrice(price: number, assetClass: string) {
  if (assetClass === "forex" && price < 100) return price.toFixed(4);
  if (price >= 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return price.toFixed(2);
}

export function SignalCard({ signal, onDelete, index = 0 }: SignalCardProps) {
  const config = signalConfig[signal.signalType as keyof typeof signalConfig] || signalConfig.hold;
  const Icon = config.icon;
  const deleteSignal = useDeleteSignal();

  const handleDelete = async () => {
    await deleteSignal.mutateAsync({ id: signal.id });
    onDelete?.();
  };

  const isUpSignal = signal.signalType === "buy";
  const priceChangeDir = signal.targetPrice > signal.currentPrice ? "up" : "down";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "relative rounded-xl border p-4 bg-card group cursor-pointer transition-all duration-200",
        config.borderClass,
        config.glow,
        "hover:border-opacity-60"
      )}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold font-mono text-foreground">{signal.symbol}</span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider", assetClassBadge[signal.assetClass] || "bg-muted text-muted-foreground border-border")}>
              {signal.assetClass}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{signal.name}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider", config.badgeBg)}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {signal.timeframe}
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Confidence</span>
          <span className={cn("text-xs font-bold font-mono", config.colorClass)}>{signal.confidence}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${signal.confidence}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
            className={cn("h-full rounded-full", config.barColor)}
          />
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Current</p>
          <p className="text-xs font-mono font-semibold text-foreground">{formatPrice(signal.currentPrice, signal.assetClass)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <Target className="w-2.5 h-2.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</p>
          </div>
          <p className={cn("text-xs font-mono font-semibold", isUpSignal ? "text-emerald-400" : "text-red-400")}>
            {formatPrice(signal.targetPrice, signal.assetClass)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <ShieldAlert className="w-2.5 h-2.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stop</p>
          </div>
          <p className="text-xs font-mono font-semibold text-red-400">
            {formatPrice(signal.stopLoss, signal.assetClass)}
          </p>
        </div>
      </div>

      {/* R:R ratio */}
      <div className="flex items-center justify-between mb-3 px-2 py-1.5 rounded-md bg-muted/50">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Risk/Reward</span>
        <span className={cn("text-xs font-bold font-mono", signal.riskReward >= 2 ? "text-emerald-400" : signal.riskReward >= 1.5 ? "text-amber-400" : "text-red-400")}>
          1:{signal.riskReward.toFixed(1)}
        </span>
      </div>

      {/* Reasoning */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {signal.reasoning}
      </p>
    </motion.div>
  );
}
