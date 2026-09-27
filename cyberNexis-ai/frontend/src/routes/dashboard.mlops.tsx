import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Brain,
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Loader2,
  Database,
  BarChart3,
  ShieldCheck,
  Zap,
  Terminal,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard/mlops")({ component: MLOps });

const API = "http://127.0.0.1:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Metrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  roc_auc?: number;
  threshold?: number;
  train_samples?: number;
  test_samples?: number;
  train_duration_s?: number;
  timestamp?: string;
  confusion_matrix?: number[][];
}

interface DriftFeature {
  type: "numerical" | "categorical" | "target";
  drift_detected: boolean;
  psi?: number;
  ks_stat?: number;
  ks_pvalue?: number;
  chi2_stat?: number;
  chi2_pvalue?: number;
  ref_mean?: number;
  cur_mean?: number;
}

interface DriftReport {
  timestamp?: string;
  n_reference_samples?: number;
  n_current_samples?: number;
  n_features_checked?: number;
  n_features_drifted?: number;
  drifted_features?: string[];
  overall_drift_detected?: boolean;
  drift_severity?: "low" | "medium" | "high";
  features?: Record<string, DriftFeature>;
}

interface Decision {
  timestamp?: string;
  should_retrain?: boolean;
  triggers?: string[];
  reasons?: string[];
}

interface PipelineReport {
  pipeline_start?: string;
  pipeline_end?: string;
  duration_s?: number;
  status?: string;
  message?: string;
  stages?: Record<string, any>;
}

interface MLOpsSummary {
  setup_needed?: boolean;
  metrics?: Metrics | null;
  drift?: DriftReport | null;
  decision?: Decision | null;
  comparison?: { current?: Metrics; previous?: Metrics; delta?: Record<string, number> } | null;
  validation?: { passed?: boolean; checks?: Record<string, boolean>; notes?: string[] } | null;
  reproducibility?: {
    timestamp?: string;
    model_type?: string;
    random_seed?: number;
    metrics?: Metrics;
  } | null;
  retraining_report?: PipelineReport | null;
  mlops_dir?: string;
}

// ── Data fetching hook ─────────────────────────────────────────────────────────

function useMLOps() {
  const [data, setData] = useState<MLOpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/mlops/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MLOpsSummary = await res.json();
      setData(json);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { data, loading, offline, refetch };
}

// ── Component ──────────────────────────────────────────────────────────────────

function MLOps() {
  const { data, loading, offline, refetch } = useMLOps();
  const [running, setRunning] = useState<"drift" | "retrain" | "force" | "setup" | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-49), msg]);

  const runSetup = async () => {
    setRunning("setup");
    setLog([]);
    addLog("Starting full MLOps setup...");
    addLog("Step 1/3 — Generating synthetic training data...");
    try {
      const r1 = await fetch(`${API}/api/mlops/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const j1 = await r1.json();
      if (j1.status === "success") {
        addLog("Step 2/3 — Model trained successfully.");
        addLog("Step 3/3 — Running drift analysis...");
        const r2 = await fetch(`${API}/api/mlops/run-drift`, { method: "POST" });
        const j2 = await r2.json();
        if (j2.status === "success") {
          addLog("Setup complete! Refreshing dashboard...");
          toast.success("MLOps setup complete — model trained and reports generated");
          await refetch();
        } else {
          addLog(`Drift step error: ${j2.stderr?.slice(0, 200) ?? j2.message ?? "unknown"}`);
          toast.error("Drift analysis failed");
        }
      } else {
        addLog(`Training error: ${j1.stderr?.slice(0, 200) ?? j1.message ?? "unknown"}`);
        toast.error(`Training failed at stage: ${j1.stage ?? "train"}`);
      }
    } catch {
      addLog("Cannot reach backend. Make sure the backend is running.");
      toast.error("Backend unreachable");
    } finally {
      setRunning(null);
    }
  };

  const runDrift = async () => {
    setRunning("drift");
    setLog([]);
    addLog("Running drift analysis...");
    try {
      const res = await fetch(`${API}/api/mlops/run-drift`, { method: "POST" });
      const json = await res.json();
      if (json.status === "success") {
        addLog(json.stdout ?? "Done.");
        toast.success("Drift analysis complete");
        refetch();
      } else {
        addLog(json.stderr ?? json.message ?? "Error");
        toast.error("Drift analysis failed — check the log");
      }
    } catch {
      addLog("Backend unreachable");
      toast.error("Backend unreachable");
    } finally {
      setRunning(null);
    }
  };

  const runRetrain = async (force = false) => {
    setRunning(force ? "force" : "retrain");
    setLog([]);
    addLog(force ? "Force retraining model..." : "Running full pipeline...");
    try {
      const res = await fetch(`${API}/api/mlops/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = await res.json();
      if (json.status === "success") {
        addLog(json.stdout ?? "Done.");
        toast.success(json.message || "Pipeline completed");
        refetch();
      } else {
        addLog(json.stderr ?? json.message ?? "Error");
        toast.error(`Failed at stage: ${json.stage ?? "unknown"}`);
      }
    } catch {
      addLog("Backend unreachable");
      toast.error("Backend unreachable");
    } finally {
      setRunning(null);
    }
  };

  const metrics = data?.metrics;
  const drift = data?.drift;
  const decision = data?.decision;
  const comparison = data?.comparison;
  const validation = data?.validation;
  const repro = data?.reproducibility;
  const pipeline = data?.retraining_report;
  const setupNeeded = data?.setup_needed ?? true;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardShell title="MLOps Dashboard">
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Loading MLOps reports…
        </div>
      </DashboardShell>
    );
  }

  // ── Offline state ─────────────────────────────────────────────────────────────
  if (offline) {
    return (
      <DashboardShell title="MLOps Dashboard">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <WifiOff className="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
          <h2 className="text-xl font-semibold">Backend offline</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The Python backend is not running. Start it first, then refresh.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 px-6 py-4 font-mono text-xs text-primary">
            cd sentinel-ai\backend
            <br />
            python app.py
          </div>
          <button
            onClick={refetch}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm hover:bg-white/[0.06]"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  // ── Setup needed state ────────────────────────────────────────────────────────
  if (setupNeeded) {
    return (
      <DashboardShell title="MLOps Dashboard">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="mb-4 h-14 w-14 text-primary opacity-60" />
          <h2 className="text-2xl font-semibold">No model trained yet</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            The MLOps pipeline hasn't run. Click the button below to generate training data, train
            the XGBoost classifier, and run drift analysis — all in one click.
          </p>

          <button
            onClick={runSetup}
            disabled={!!running}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
          >
            {running === "setup" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Setting up…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" /> Run Full Setup
              </>
            )}
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            This will train on synthetic UNSW-NB15 data (~60s) and generate all reports.
          </p>

          {log.length > 0 && (
            <div className="mt-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-4 text-left">
              <div className="mb-2 flex items-center gap-2 text-xs font-mono text-primary">
                <Terminal className="h-3.5 w-3.5" /> Pipeline output
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {log.map((line, i) => (
                  <div key={i} className="font-mono text-xs text-muted-foreground">
                    {line}
                  </div>
                ))}
                {running === "setup" && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" /> running…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    );
  }

  // ── Full dashboard ────────────────────────────────────────────────────────────
  return (
    <DashboardShell title="MLOps Dashboard">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Model Operations</h1>
          <p className="text-sm text-muted-foreground">
            XGBoost · UNSW-NB15 · drift monitoring · auto-retraining
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={runDrift}
            disabled={!!running}
            className="inline-flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning hover:bg-warning/20 disabled:opacity-50"
          >
            {running === "drift" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Run Drift
          </button>
          <button
            onClick={() => runRetrain(false)}
            disabled={!!running}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {running === "retrain" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Pipeline
          </button>
          <button
            onClick={() => runRetrain(true)}
            disabled={!!running}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {running === "force" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Force Retrain
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Brain}
          label="Model"
          value={metrics?.accuracy ? "XGBoost v3.2" : "Not loaded"}
          sub={repro?.timestamp ? `Trained ${fmtDate(repro.timestamp)}` : "Run pipeline"}
          tone={metrics?.accuracy ? "success" : "danger"}
        />
        <StatCard
          icon={TrendingUp}
          label="F1 Score"
          value={metrics?.f1 ? `${(metrics.f1 * 100).toFixed(2)}%` : "—"}
          sub={`Accuracy: ${metrics?.accuracy ? (metrics.accuracy * 100).toFixed(2) : "—"}%`}
          tone={metrics?.f1 && metrics.f1 >= 0.95 ? "success" : "warning"}
        />
        <StatCard
          icon={Database}
          label="Data Drift"
          value={
            drift
              ? drift.overall_drift_detected
                ? `${(drift.drift_severity ?? "").toUpperCase()} DRIFT`
                : "STABLE"
              : "Unknown"
          }
          sub={
            drift
              ? `${drift.n_features_drifted ?? 0}/${drift.n_features_checked ?? 0} features drifted`
              : "Run drift analysis"
          }
          tone={
            drift?.overall_drift_detected
              ? drift.drift_severity === "high"
                ? "danger"
                : "warning"
              : "success"
          }
        />
        <StatCard
          icon={ShieldCheck}
          label="Retraining"
          value={decision ? (decision.should_retrain ? "NEEDED" : "NOT NEEDED") : "Unknown"}
          sub={decision?.triggers?.join(", ") || "all clear"}
          tone={decision?.should_retrain ? "warning" : "success"}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Radar */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Model performance</div>
              <div className="text-xs text-muted-foreground">XGBoost metrics (%)</div>
            </div>
            {validation && (
              <span
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium ${validation.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
              >
                {validation.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {validation.passed ? "Validated" : "Not validated"}
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <RadarChart data={buildRadarData(metrics)}>
                <defs>
                  <radialGradient id="radarFillMlops">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="hsl(var(--primary)/0.15)" />
                <PolarAngleAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="v"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#radarFillMlops)"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics table */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 text-sm font-medium">Performance metrics</div>
          <div className="space-y-3">
            {(["accuracy", "precision", "recall", "f1", "roc_auc"] as const).map((k) => (
              <MetricRow
                key={k}
                label={k === "roc_auc" ? "ROC-AUC" : k}
                current={metrics?.[k] as number | undefined}
                previous={comparison?.previous?.[k] as number | undefined}
                delta={comparison?.delta?.[k]}
              />
            ))}
            {metrics?.threshold !== undefined && (
              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                <span className="text-muted-foreground">Decision threshold</span>
                <span className="font-mono">{metrics.threshold}</span>
              </div>
            )}
            {metrics?.train_duration_s !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Train time</span>
                <span className="font-mono">{metrics.train_duration_s}s</span>
              </div>
            )}
            {metrics?.train_samples !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Train samples</span>
                <span className="font-mono">{metrics.train_samples?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Drift feature table — full width */}
        <div className="glass rounded-2xl p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Feature drift analysis</div>
              <div className="text-xs text-muted-foreground">PSI · KS-test · Chi-squared</div>
            </div>
            {drift && (
              <div className="flex items-center gap-3">
                <DriftBadge severity={drift.drift_severity} />
                <button
                  onClick={() => setExpandedFeatures((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {expandedFeatures ? "Collapse" : "Expand all"}
                  {expandedFeatures ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
          {!drift ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No drift report yet — click "Run Drift" to generate one.
            </div>
          ) : (
            <DriftTable features={drift.features ?? {}} expanded={expandedFeatures} />
          )}
        </div>

        {/* Retraining decision */}
        {decision && (
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 text-sm font-medium">Retraining decision</div>
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${decision.should_retrain ? "border-warning/30 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success"}`}
            >
              {decision.should_retrain ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {decision.should_retrain ? "Retraining is recommended" : "Model is healthy"}
            </div>
            {decision.reasons && decision.reasons.length > 0 && (
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {decision.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-warning">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            )}
            {decision.timestamp && (
              <div className="mt-4 font-mono text-[10px] text-muted-foreground">
                {fmtDate(decision.timestamp)}
              </div>
            )}
          </div>
        )}

        {/* Confusion matrix */}
        {metrics?.confusion_matrix && (
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 text-sm font-medium">Confusion matrix</div>
            <ConfusionMatrix cm={metrics.confusion_matrix} />
          </div>
        )}

        {/* Pipeline history */}
        {pipeline && (
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 text-sm font-medium">Last pipeline run</div>
            <div className="space-y-2 text-xs">
              <InfoRow label="Status">
                <PipelineStatusBadge status={pipeline.status} />
              </InfoRow>
              {pipeline.pipeline_start && (
                <InfoRow label="Started">{fmtDate(pipeline.pipeline_start)}</InfoRow>
              )}
              {pipeline.duration_s && <InfoRow label="Duration">{pipeline.duration_s}s</InfoRow>}
              {pipeline.message && (
                <InfoRow label="Message">
                  <span className="text-muted-foreground">{pipeline.message}</span>
                </InfoRow>
              )}
              {pipeline.stages &&
                Object.entries(pipeline.stages).map(([stage, info]: [string, any]) => (
                  <InfoRow key={stage} label={`Stage: ${stage}`}>
                    <span className={info.status === "OK" ? "text-success" : "text-danger"}>
                      {info.status}
                      {info.f1 && ` · F1 ${(info.f1 * 100).toFixed(2)}%`}
                    </span>
                  </InfoRow>
                ))}
            </div>
          </div>
        )}

        {/* Reproducibility */}
        {repro && (
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 text-sm font-medium">Reproducibility manifest</div>
            <div className="space-y-2 text-xs">
              <InfoRow label="Model type">{repro.model_type}</InfoRow>
              <InfoRow label="Random seed">
                <span className="font-mono">{repro.random_seed}</span>
              </InfoRow>
              <InfoRow label="Train accuracy">
                {repro.metrics?.accuracy ? `${(repro.metrics.accuracy * 100).toFixed(3)}%` : "—"}
              </InfoRow>
              <InfoRow label="Train F1">
                {repro.metrics?.f1 ? `${(repro.metrics.f1 * 100).toFixed(3)}%` : "—"}
              </InfoRow>
              <InfoRow label="Recorded">{repro.timestamp ? fmtDate(repro.timestamp) : "—"}</InfoRow>
            </div>
          </div>
        )}
      </div>

      {/* Output log */}
      {log.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-mono text-primary">
            <Terminal className="h-3.5 w-3.5" /> Pipeline output
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {log.map((line, i) => (
              <div key={i} className="font-mono text-xs text-muted-foreground">
                {line}
              </div>
            ))}
            {running && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> running…
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: "success" | "warning" | "danger" | "primary";
}) {
  const toneMap = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger  bg-danger/10",
    primary: "text-primary bg-primary/10",
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold leading-tight">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function MetricRow({
  label,
  current,
  delta,
}: {
  label: string;
  current?: number;
  previous?: number;
  delta?: number;
}) {
  const pct = current !== undefined ? `${(current * 100).toFixed(3)}%` : "—";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs capitalize text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{
            width: current !== undefined ? `${Math.min(100, current * 100).toFixed(1)}%` : "0%",
            background:
              current && current >= 0.95 ? "hsl(var(--success))" : "var(--gradient-primary)",
          }}
        />
      </div>
      <span className="w-16 text-right font-mono text-xs">{pct}</span>
      {delta !== undefined && (
        <span
          className={`flex items-center gap-0.5 text-[11px] ${delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-muted-foreground"}`}
        >
          {delta > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : delta < 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          {delta !== 0 ? `${(delta * 100).toFixed(2)}%` : ""}
        </span>
      )}
    </div>
  );
}

function DriftTable({
  features,
  expanded,
}: {
  features: Record<string, DriftFeature>;
  expanded: boolean;
}) {
  const entries = Object.entries(features);
  const drifted = entries.filter(([, f]) => f.drift_detected);
  const ok = entries.filter(([, f]) => !f.drift_detected);
  const display = expanded ? entries : [...drifted, ...ok.slice(0, 4)];

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        No feature data in drift report.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="pb-2 pr-4">Feature</th>
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">PSI / Chi²</th>
            <th className="pb-2 pr-4">Ref mean</th>
            <th className="pb-2">Cur mean</th>
          </tr>
        </thead>
        <tbody>
          {display.map(([name, f]) => (
            <tr key={name} className="border-t border-white/5">
              <td className="py-2 pr-4 font-mono">{name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{f.type}</td>
              <td className="py-2 pr-4">
                {f.drift_detected ? (
                  <span className="inline-flex items-center gap-1 text-danger">
                    <AlertTriangle className="h-3 w-3" /> Drifted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3 w-3" /> Stable
                  </span>
                )}
              </td>
              <td className="py-2 pr-4 font-mono text-muted-foreground">
                {f.psi !== undefined
                  ? f.psi.toFixed(4)
                  : f.chi2_stat !== undefined
                    ? f.chi2_stat.toFixed(2)
                    : "—"}
              </td>
              <td className="py-2 pr-4 font-mono text-muted-foreground">
                {f.ref_mean?.toFixed(2) ?? "—"}
              </td>
              <td className="py-2 font-mono text-muted-foreground">
                {f.cur_mean?.toFixed(2) ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!expanded && entries.length > display.length && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          +{entries.length - display.length} more features — click "Expand all"
        </div>
      )}
    </div>
  );
}

function ConfusionMatrix({ cm }: { cm: number[][] }) {
  const labels = ["Normal", "Attack"];
  return (
    <table className="text-center text-sm">
      <thead>
        <tr>
          <th className="pb-2 pr-3 text-xs text-muted-foreground" />
          {labels.map((l) => (
            <th key={l} className="pb-2 pr-3 text-xs text-muted-foreground">
              Pred: {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cm.map((row, i) => (
          <tr key={i}>
            <td className="py-1.5 pr-3 text-xs text-muted-foreground">Act: {labels[i]}</td>
            {row.map((v, j) => (
              <td
                key={j}
                className={`py-1.5 pr-3 font-mono text-sm font-semibold ${i === j ? "text-success" : "text-danger"}`}
              >
                {v.toLocaleString()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DriftBadge({ severity }: { severity?: string }) {
  const map: Record<string, string> = {
    low: "border-success/30 bg-success/10 text-success",
    medium: "border-warning/30 bg-warning/10 text-warning",
    high: "border-danger/30  bg-danger/10  text-danger",
  };
  if (!severity) return null;
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest ${map[severity] ?? ""}`}
    >
      {severity} drift
    </span>
  );
}

function PipelineStatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    SUCCESS: "text-success",
    SKIPPED: "text-primary",
    RUNNING: "text-warning",
    FAILED_VALIDATION: "text-danger",
    FAILED: "text-danger",
  };
  return (
    <span className={`font-semibold ${map[status] ?? "text-muted-foreground"}`}>{status}</span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRadarData(metrics?: Metrics | null) {
  const safe = (v?: number) => +((v ?? 0) * 100).toFixed(1);
  return [
    { m: "Accuracy", v: safe(metrics?.accuracy) },
    { m: "Precision", v: safe(metrics?.precision) },
    { m: "Recall", v: safe(metrics?.recall) },
    { m: "F1", v: safe(metrics?.f1) },
    { m: "ROC-AUC", v: safe(metrics?.roc_auc) },
  ];
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
