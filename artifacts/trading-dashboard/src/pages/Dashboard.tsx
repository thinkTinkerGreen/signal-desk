import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Wallet, BarChart3, Target, AlertTriangle } from "lucide-react";
import { useGetSignals, useGetPortfolio, useGetSignalSummary, useGetPositions } from "@workspace/api-client-react";
import { SignalCard } from "@/components/SignalCard";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon?: React.ElementType;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className={cn("text-2xl font-bold font-mono", positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-foreground")}>
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs mt-1 font-mono", positive === true ? "text-emerald-500" : positive === false ? "text-red-500" : "text-muted-foreground")}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export function Dashboard() {
  const { data: signals = [], refetch: refetchSignals } = useGetSignals();
  const { data: portfolio } = useGetPortfolio();
  const { data: summary } = useGetSignalSummary();
  const { data: positions = [] } = useGetPositions();

  const recentSignals = [...signals].slice(0, 6);
  const totalPnl = portfolio?.totalPnl ?? 0;
  const dayPnl = portfolio?.dayPnl ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Markets Open
        </div>
      </div>

      {/* Portfolio stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={portfolio ? `$${portfolio.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"}
          icon={Wallet}
          index={0}
        />
        <StatCard
          label="Total P&L"
          value={totalPnl >= 0 ? `+$${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `-$${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={portfolio ? `${portfolio.totalPnlPercent >= 0 ? "+" : ""}${portfolio.totalPnlPercent.toFixed(2)}% all time` : undefined}
          positive={totalPnl >= 0}
          icon={BarChart3}
          index={1}
        />
        <StatCard
          label="Day P&L"
          value={dayPnl >= 0 ? `+$${dayPnl.toFixed(2)}` : `-$${Math.abs(dayPnl).toFixed(2)}`}
          sub={portfolio ? `${portfolio.dayPnlPercent >= 0 ? "+" : ""}${portfolio.dayPnlPercent.toFixed(2)}% today` : undefined}
          positive={dayPnl >= 0}
          icon={TrendingUp}
          index={2}
        />
        <StatCard
          label="Win Rate"
          value={portfolio ? `${portfolio.winRate}%` : "--"}
          sub={portfolio ? `${portfolio.totalTrades} total trades` : undefined}
          positive={portfolio ? portfolio.winRate >= 50 : undefined}
          icon={Target}
          index={3}
        />
      </div>

      {/* Signal summary bar */}
      {summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card"
        >
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Signals Today</span>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-bold font-mono text-emerald-400">{summary.buy}</span>
            <span className="text-xs text-muted-foreground">BUY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-sm font-bold font-mono text-red-400">{summary.sell}</span>
            <span className="text-xs text-muted-foreground">SELL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-bold font-mono text-amber-400">{summary.hold}</span>
            <span className="text-xs text-muted-foreground">HOLD</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground font-mono">
            Avg Confidence: <span className="text-foreground font-semibold">{summary.avgConfidence}%</span>
          </div>
        </motion.div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent signals */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Latest Signals</h2>
            <a href="/signals" className="text-xs text-primary hover:text-primary/80 transition-colors">View all</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentSignals.map((signal, i) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onDelete={refetchSignals}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Open positions summary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Open Positions</h2>
            <a href="/positions" className="text-xs text-primary hover:text-primary/80 transition-colors">Manage</a>
          </div>
          <div className="space-y-2">
            {positions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <AlertTriangle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No open positions</p>
              </div>
            ) : (
              positions.slice(0, 5).map((pos, i) => (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 + 0.2 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-border/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", pos.direction === "long" ? "bg-emerald-500" : "bg-red-500")} />
                    <div>
                      <p className="text-xs font-mono font-bold text-foreground">{pos.symbol}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{pos.direction} · {pos.quantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-bold font-mono", pos.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                    </p>
                    <p className={cn("text-[10px] font-mono", pos.pnlPercent >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
