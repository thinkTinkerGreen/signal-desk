import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, BarChart2, Percent, Activity } from "lucide-react";
import { useGetPortfolio, useGetPortfolioHistory } from "@workspace/api-client-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

function MetricCard({
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
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
        {Icon && (
          <div className="p-1.5 rounded-md bg-muted">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className={cn("text-2xl font-bold font-mono tracking-tight", positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-foreground")}>
        {value}
      </p>
      {sub && <p className={cn("text-xs mt-1.5 font-mono", positive === true ? "text-emerald-500/80" : positive === false ? "text-red-500/80" : "text-muted-foreground")}>{sub}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
        <p className="text-sm font-bold font-mono text-primary">
          ${payload[0].value?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function Portfolio() {
  const { data: portfolio } = useGetPortfolio();
  const { data: history = [] } = useGetPortfolioHistory();

  const totalPnl = portfolio?.totalPnl ?? 0;
  const dayPnl = portfolio?.dayPnl ?? 0;

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: h.value,
  }));

  const isPositive = totalPnl >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Full portfolio overview and performance metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          label="Total Value"
          value={portfolio ? `$${portfolio.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"}
          icon={Wallet}
          index={0}
        />
        <MetricCard
          label="Cash Balance"
          value={portfolio ? `$${portfolio.cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "--"}
          icon={Wallet}
          index={1}
        />
        <MetricCard
          label="Invested"
          value={portfolio ? `$${portfolio.investedValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "--"}
          icon={BarChart2}
          index={2}
        />
        <MetricCard
          label="Total P&L"
          value={totalPnl >= 0 ? `+$${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `-$${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={portfolio ? `${portfolio.totalPnlPercent >= 0 ? "+" : ""}${portfolio.totalPnlPercent.toFixed(2)}%` : undefined}
          positive={isPositive}
          icon={isPositive ? TrendingUp : TrendingDown}
          index={3}
        />
        <MetricCard
          label="Day P&L"
          value={dayPnl >= 0 ? `+$${dayPnl.toFixed(2)}` : `-$${Math.abs(dayPnl).toFixed(2)}`}
          sub={portfolio ? `${portfolio.dayPnlPercent >= 0 ? "+" : ""}${portfolio.dayPnlPercent.toFixed(2)}% today` : undefined}
          positive={dayPnl >= 0}
          icon={Activity}
          index={4}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Win Rate", value: portfolio ? `${portfolio.winRate}%` : "--", positive: portfolio ? portfolio.winRate >= 50 : undefined, icon: Percent },
          { label: "Open Positions", value: portfolio ? String(portfolio.openPositions) : "--", icon: BarChart2 },
          { label: "Total Trades", value: portfolio ? String(portfolio.totalTrades) : "--", icon: Activity },
        ].map(({ label, value, positive, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
            </div>
            <p className={cn("text-3xl font-bold font-mono", positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-foreground")}>
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Portfolio chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Portfolio Value History</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">90-day performance</p>
          </div>
          {history.length > 0 && (
            <div className="text-right">
              <p className={cn("text-sm font-bold font-mono", isPositive ? "text-emerald-400" : "text-red-400")}>
                {isPositive ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground font-mono">vs. 90 days ago</p>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              interval={14}
            />
            <YAxis
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(217 91% 60%)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
