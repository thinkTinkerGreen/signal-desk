import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Plus, Trash2, Copy, Check, Shield, Sliders } from "lucide-react";
import {
  useGetApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useGetIngestionRules,
  useUpdateIngestionRules,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function Settings() {
  const queryClient = useQueryClient();
  const { data: keys = [] } = useGetApiKeys();
  const { data: rules } = useGetIngestionRules();

  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const updateRules = useUpdateIngestionRules();

  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);

  // Local rules state for editing
  const [localRules, setLocalRules] = useState<{
    minConfidence: number;
    allowStocks: boolean;
    allowIndices: boolean;
    allowForex: boolean;
    requireReasoning: boolean;
    requireStopLoss: boolean;
    requireTargetPrice: boolean;
  } | null>(null);

  const activeRules = localRules ?? (rules ? {
    minConfidence: rules.minConfidence,
    allowStocks: rules.allowStocks,
    allowIndices: rules.allowIndices,
    allowForex: rules.allowForex,
    requireReasoning: rules.requireReasoning,
    requireStopLoss: rules.requireStopLoss,
    requireTargetPrice: rules.requireTargetPrice,
  } : {
    minConfidence: 0,
    allowStocks: true,
    allowIndices: true,
    allowForex: true,
    requireReasoning: false,
    requireStopLoss: false,
    requireTargetPrice: false,
  });

  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    createKey.mutate(
      { data: { name: newKeyName.trim() } },
      {
        onSuccess: (data) => {
          setCreatedKey(data.key);
          setNewKeyName("");
          queryClient.invalidateQueries({ queryKey: ["getApiKeys"] });
        },
      }
    );
  }

  function handleDeleteKey(id: number) {
    deleteKey.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["getApiKeys"] }) }
    );
  }

  function handleCopyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveRules() {
    updateRules.mutate(
      { data: activeRules },
      {
        onSuccess: () => {
          setRulesSaved(true);
          setLocalRules(null);
          queryClient.invalidateQueries({ queryKey: ["getIngestionRules"] });
          setTimeout(() => setRulesSaved(false), 2000);
        },
      }
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage API keys and signal ingestion rules
        </p>
      </div>

      {/* API Keys */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">API Keys</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          API keys are required to POST signals to{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">
            /api/signals
          </code>{" "}
          and{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">
            /api/webhooks/tradingview
          </code>
          . Send as{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-400">
            X-API-Key: &lt;key&gt;
          </code>
          .
        </p>

        {/* Create key */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
            placeholder="Key name (e.g. my-llm-agent)"
            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
          />
          <button
            onClick={handleCreateKey}
            disabled={!newKeyName.trim() || createKey.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-medium text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>

        {/* Created key — show once */}
        {createdKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Key created — copy it now, it won't be shown again
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background/60 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 break-all">
                {createdKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              I've saved it — dismiss
            </button>
          </motion.div>
        )}

        {/* Key list */}
        <div className="space-y-2">
          {keys.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              No API keys yet — create one above to start ingesting signals
            </div>
          )}
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{key.name}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    {key.prefix}••••••••••••••••
                    {key.lastUsedAt
                      ? ` · last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : " · never used"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Revoke key"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="border-t border-border" />

      {/* Validation Rules */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Signal Validation Rules</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Signals that fail these checks are rejected with a 422 and logged in the Ingestion Log.
        </p>

        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {/* Min confidence */}
          <div className="px-4 py-4 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-foreground">Minimum Confidence</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reject signals below this confidence threshold
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeRules.minConfidence}
                onChange={(e) =>
                  setLocalRules({ ...activeRules, minConfidence: Number(e.target.value) })
                }
                className="w-28 accent-primary"
              />
              <span className="text-sm font-mono text-primary w-10 text-right">
                {activeRules.minConfidence}%
              </span>
            </div>
          </div>

          {/* Asset class toggles */}
          {(
            [
              { key: "allowStocks" as const, label: "Allow Stocks", desc: "Accept stock ticker signals" },
              { key: "allowIndices" as const, label: "Allow Indices", desc: "Accept index signals (SPX, NDX, etc.)" },
              { key: "allowForex" as const, label: "Allow Forex", desc: "Accept forex pair signals" },
            ] as const
          ).map(({ key, label, desc }) => (
            <ToggleRow
              key={key}
              label={label}
              desc={desc}
              checked={activeRules[key]}
              onChange={(v) => setLocalRules({ ...activeRules, [key]: v })}
            />
          ))}

          {/* Required field toggles */}
          {(
            [
              { key: "requireReasoning" as const, label: "Require Reasoning", desc: "Reject signals with empty reasoning field" },
              { key: "requireStopLoss" as const, label: "Require Stop Loss", desc: "Reject signals without a stop loss price" },
              { key: "requireTargetPrice" as const, label: "Require Target Price", desc: "Reject signals without a target price" },
            ] as const
          ).map(({ key, label, desc }) => (
            <ToggleRow
              key={key}
              label={label}
              desc={desc}
              checked={activeRules[key]}
              onChange={(v) => setLocalRules({ ...activeRules, [key]: v })}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveRules}
            disabled={updateRules.isPending}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              rulesSaved
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : "bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary"
            )}
          >
            {rulesSaved ? "✓ Saved" : updateRules.isPending ? "Saving…" : "Save Rules"}
          </button>
          {localRules && (
            <button
              onClick={() => setLocalRules(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset changes
            </button>
          )}
        </div>
      </motion.section>

      {/* Webhook reference */}
      <div className="border-t border-border" />
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h2 className="text-base font-semibold text-foreground">Webhook Reference</h2>
        <p className="text-xs text-muted-foreground">
          TradingView alert message format — paste this as your alert JSON:
        </p>
        <pre className="bg-card border border-border rounded-xl px-4 py-3 text-[11px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`POST /api/webhooks/tradingview
X-API-Key: <your-key>

{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "confidence": 80,
  "target": {{plot("Target")}},
  "stop": {{plot("Stop")}},
  "timeframe": "{{interval}}",
  "message": "{{strategy.order.comment}}"
}`}
        </pre>
      </motion.section>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-4 py-4 flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors border",
          checked
            ? "bg-primary/20 border-primary/40"
            : "bg-muted/50 border-border"
        )}
        style={{ height: "22px" }}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full transition-all",
            checked ? "translate-x-[18px] bg-primary" : "translate-x-0 bg-muted-foreground/50"
          )}
        />
      </button>
    </div>
  );
}
