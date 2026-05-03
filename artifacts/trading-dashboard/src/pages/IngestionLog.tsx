import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { useGetIngestionLog } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type Status = "all" | "accepted" | "rejected";
type Source = "all" | "agent" | "tradingview" | "manual";

const statusOptions: Status[] = ["all", "accepted", "rejected"];
const sourceOptions: Source[] = ["all", "agent", "tradingview", "manual"];

export function IngestionLog() {
  const [status, setStatus] = useState<Status>("all");
  const [source, setSource] = useState<Source>("all");

  const { data: entries = [], isLoading } = useGetIngestionLog(
    { status, limit: 200 },
    { query: { queryKey: ["ingestion-log", status], refetchInterval: 10_000 } }
  );

  const filtered = source === "all" ? entries : entries.filter((e) => e.source === source);

  const acceptedCount = entries.filter((e) => e.accepted).length;
  const rejectedCount = entries.filter((e) => !e.accepted).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ingestion Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit trail of all incoming signal attempts
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
            Total
          </p>
          <p className="text-3xl font-bold font-mono text-foreground">{entries.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
            Accepted
          </p>
          <p className="text-3xl font-bold font-mono text-emerald-400">{acceptedCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-red-500/5 border border-red-500/25 rounded-xl p-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
            Rejected
          </p>
          <p className="text-3xl font-bold font-mono text-red-400">{rejectedCount}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  status === s
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Source:</span>
          <div className="flex gap-1">
            {sourceOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  source === s
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 bg-muted/30 border-b border-border px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          <span className="w-6 mr-3">Status</span>
          <span>Symbol / Signal</span>
          <span className="text-right mr-6">Source</span>
          <span className="text-right mr-6">Key</span>
          <span className="text-right">Time</span>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No ingestion events yet — send a signal via the API to get started
          </div>
        )}

        <div className="divide-y divide-border/60">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-start px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              {/* Status icon */}
              <div className="w-6 mr-3 mt-0.5">
                {entry.accepted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Symbol + signal type + rejection reason */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-foreground">
                    {entry.symbol}
                  </span>
                  <SignalBadge type={entry.signalType} />
                </div>
                {entry.rejectionReason && (
                  <p className="text-[11px] text-red-400/80 mt-0.5 leading-tight">
                    {entry.rejectionReason}
                  </p>
                )}
              </div>

              {/* Source */}
              <div className="mr-6">
                <SourceBadge source={entry.source} />
              </div>

              {/* Key name */}
              <div className="mr-6 text-right">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {entry.keyName ?? "—"}
                </span>
              </div>

              {/* Timestamp */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(entry.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-right mt-0.5">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    buy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    sell: "bg-red-500/15 text-red-400 border-red-500/25",
    hold: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  };
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border",
        styles[type] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {type}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    agent: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    tradingview: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    manual: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[10px] font-mono border",
        styles[source] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {source}
    </span>
  );
}
