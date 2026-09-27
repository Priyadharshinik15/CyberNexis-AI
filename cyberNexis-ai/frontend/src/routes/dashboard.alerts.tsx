import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { AlertTriangle, Filter, Archive, Download, Search, CheckCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/alerts")({ component: Alerts });

type Sev = "critical" | "warning" | "info";

const SEV_STYLE: Record<Sev, string> = {
  critical: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-primary/30 bg-primary/10 text-primary",
};

function Alerts() {
  const { user } = useAuth();
  const { alerts, loading, acknowledge, acknowledgeAll, deleteAlert } = useAlerts(user?.id, 60);
  const [filter, setFilter] = useState<"all" | Sev>("all");
  const [q, setQ] = useState("");
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filtered = alerts.filter((a) => {
    if (!showAcknowledged && a.acknowledged) return false;
    if (filter !== "all" && a.severity !== filter) return false;
    if (q && !a.source_ip.includes(q) && !a.attack_type.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  const unackedCount = alerts.filter((a) => !a.acknowledged).length;

  const handleAckAll = async () => {
    const { error } = (await acknowledgeAll()) ?? {};
    if (error) toast.error("Failed to acknowledge alerts");
    else toast.success("All alerts acknowledged");
  };

  const handleExport = () => {
    const csv = [
      "id,severity,attack_type,source_ip,country,message,acknowledged,created_at",
      ...alerts.map((a) =>
        [
          a.id,
          a.severity,
          a.attack_type,
          a.source_ip,
          a.country ?? "",
          `"${a.message}"`,
          a.acknowledged,
          a.created_at,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Alerts exported");
  };

  return (
    <DashboardShell title="Alert Center">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search IP, type..."
            className="w-56 bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs">
          {(["all", "critical", "warning", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1 capitalize ${filter === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAcknowledged((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${showAcknowledged ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
        >
          <Filter className="h-3.5 w-3.5" />
          {showAcknowledged ? "Hide acknowledged" : "Show acknowledged"}
        </button>

        <div className="ml-auto flex gap-2">
          {unackedCount > 0 && (
            <button
              onClick={handleAckAll}
              className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-success hover:bg-success/20"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Ack all ({unackedCount})
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs hover:bg-white/[0.06]"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-3 gap-3 md:grid-cols-6">
        {(["critical", "warning", "info"] as Sev[]).map((sev) => {
          const count = alerts.filter((a) => a.severity === sev).length;
          const unacked = alerts.filter((a) => a.severity === sev && !a.acknowledged).length;
          return (
            <div key={sev} className={`glass rounded-xl p-3 border ${SEV_STYLE[sev]}`}>
              <div className="text-[10px] uppercase tracking-widest">{sev}</div>
              <div className="mt-1 text-xl font-semibold">{count}</div>
              {unacked > 0 && (
                <div className="text-[10px] text-muted-foreground">{unacked} unacked</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2 mr-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Loading alerts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 py-16 text-muted-foreground">
          <Archive className="mb-3 h-8 w-8 opacity-30" />
          <div className="text-sm">No alerts match the current filter</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`glass flex items-start gap-4 rounded-2xl border p-4 animate-fade-in transition-opacity ${SEV_STYLE[a.severity as Sev] ?? ""} ${a.acknowledged ? "opacity-50" : ""}`}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/30">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest">
                    {a.severity}
                  </span>
                  <span className="text-sm font-medium text-foreground">{a.attack_type}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {a.source_ip}
                    {a.country ? ` · ${a.country}` : ""}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{a.message}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {!a.acknowledged && (
                  <button
                    onClick={async () => {
                      const { error } = await acknowledge(a.id);
                      if (error) toast.error("Failed to acknowledge");
                      else toast.success("Alert acknowledged");
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-foreground hover:bg-black/50"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={async () => {
                    const { error } = await deleteAlert(a.id);
                    if (error) toast.error("Failed to delete");
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-black/30 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
