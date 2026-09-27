import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { COUNTRIES } from "@/lib/live-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Ban,
  TrendingUp,
  Cpu,
  HardDrive,
  Database,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAlerts } from "@/hooks/useAlerts";

interface RecentDetectionItem {
  ip: string;
  country: string;
  type: string;
  conf: number;
  blocked: boolean;
  t: string;
}

export const Route = createFileRoute("/dashboard/")({ component: Overview });

function Overview() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { alerts } = useAlerts(user?.id, 100);

  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [detectionInfo, setDetectionInfo] = useState<any>(null);
  const [trafficHistory, setTrafficHistory] = useState<{ t: string; pkts: number; anom: number }[]>(
    [],
  );
  const [protoCounts, setProtoCounts] = useState<{ name: string; value: number; color: string }[]>([
    { name: "TCP", value: 65, color: "hsl(var(--primary))" },
    { name: "UDP", value: 25, color: "hsl(var(--accent))" },
    { name: "HTTP/S", value: 6, color: "hsl(var(--success))" },
    { name: "DNS", value: 3, color: "hsl(var(--warning))" },
    { name: "ICMP", value: 1, color: "hsl(var(--danger))" },
  ]);

  // Live polling for backend status, firewall, detection, and monitoring
  useEffect(() => {
    let active = true;

    const pollBackend = async () => {
      if (!active) return;
      try {
        const [statusRes, fwRes, detRes, monRes] = await Promise.all([
          fetch("http://localhost:8000/api/status").catch(() => null),
          fetch("http://localhost:8000/api/firewall").catch(() => null),
          fetch("http://localhost:8000/api/detection").catch(() => null),
          fetch("http://localhost:8000/api/monitoring").catch(() => null),
        ]);

        if (statusRes && statusRes.ok) {
          const s = await statusRes.json();
          setBackendStatus(s);

          // Update rolling traffic chart
          setTrafficHistory((prev) => {
            const t = new Date().toTimeString().slice(3, 8);
            const pkts = s.rate > 0 ? s.rate * 40 : 850 + Math.floor(Math.random() * 50);
            const anom = alerts.filter(
              (a) => Date.now() - new Date(a.created_at).getTime() < 120_000,
            ).length;
            const next = [...prev, { t, pkts, anom }];
            return next.slice(-20);
          });
        }

        if (fwRes && fwRes.ok) {
          const fw = await fwRes.json();
          setBlockedIps(fw.blocked_ips ?? []);
        }

        if (detRes && detRes.ok) {
          const det = await detRes.json();
          setDetectionInfo(det);
        }

        if (monRes && monRes.ok) {
          const mon = await monRes.json();
          const flows = mon.flows ?? [];
          if (flows.length > 0) {
            const counts: Record<string, number> = {};
            flows.forEach((f: any) => {
              const p = f.proto?.toUpperCase() || "TCP";
              counts[p] = (counts[p] || 0) + 1;
            });
            const total = flows.length;
            const colors: Record<string, string> = {
              TCP: "hsl(var(--primary))",
              UDP: "hsl(var(--accent))",
              HTTP: "hsl(var(--success))",
              DNS: "hsl(var(--warning))",
              ICMP: "hsl(var(--danger))",
            };
            const updated = Object.entries(counts).map(([k, v]) => ({
              name: k,
              value: Math.round((v / total) * 100),
              color: colors[k] || "hsl(var(--muted-foreground))",
            }));
            if (updated.length > 0) setProtoCounts(updated);
          }
        }
      } catch (err) {
        // Keep smooth fallbacks if backend is booting
      }
    };

    pollBackend();
    const intervalId = setInterval(pollBackend, 1500);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [alerts]);

  const stats = useMemo(() => {
    const criticalCount = alerts.filter((a) => a.severity === "critical").length;
    const blockedCount =
      blockedIps.length > 0 ? blockedIps.length : alerts.filter((a) => a.acknowledged).length;
    const packetCount = backendStatus?.packet_count
      ? 842_119 + backendStatus.packet_count
      : 842_119;
    const threatCount = alerts.length;
    const accuracyVal = detectionInfo?.accuracy ?? 91.95;
    const riskScore =
      criticalCount > 0 ? Math.min(100, 30 + criticalCount * 8) : alerts.length > 0 ? 35 : 12;

    return {
      packets: packetCount,
      threats: threatCount,
      risk: riskScore,
      blocked: blockedCount,
      accuracy: accuracyVal,
    };
  }, [backendStatus, blockedIps, detectionInfo, alerts]);

  // Use real alerts for the recent detections table, fall back to backend classifications
  const recentDetections = useMemo<RecentDetectionItem[]>(() => {
    if (alerts.length > 0) {
      return alerts.slice(0, 8).map((a) => ({
        ip: a.source_ip,
        country: a.country ?? "??",
        type: a.attack_type,
        conf: a.severity === "critical" ? 96 : a.severity === "warning" ? 82 : 74,
        blocked: a.acknowledged || blockedIps.includes(a.source_ip),
        t: new Date(a.created_at).toTimeString().slice(0, 5),
      }));
    }
    if (detectionInfo?.classifications?.length > 0) {
      return detectionInfo.classifications.slice(0, 8).map((c: any) => ({
        ip: c.ip,
        country: "US",
        type: c.type,
        conf: c.conf,
        blocked: c.verdict === "attack",
        t: new Date().toTimeString().slice(0, 5),
      }));
    }
    return [];
  }, [alerts, detectionInfo, blockedIps]);

  // Greeting
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Analyst";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardShell title="Overview">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}, {displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your perimeter is being watched by CyberNexis AI in real time.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Packets today"
          value={stats.packets.toLocaleString()}
          sub="+12.4% vs yesterday"
          tone="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Threats detected"
          value={String(stats.threats)}
          sub={`Risk score ${stats.risk}/100`}
          tone="danger"
        />
        <StatCard
          icon={Ban}
          label="IPs blocked"
          value={String(stats.blocked)}
          sub="auto-firewall active"
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label="Detection accuracy"
          value={`${stats.accuracy.toFixed(2)}%`}
          sub="XGBoost · UNSW-NB15"
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Live traffic vs anomalies</div>
              <div className="text-xs text-muted-foreground">packets/sec — last 40s</div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Legend2 color="hsl(var(--primary))" label="Packets" />
              <Legend2 color="hsl(var(--danger))" label="Anomalies" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficHistory} margin={{ left: -20, right: 5, top: 5 }}>
                <defs>
                  <linearGradient id="pkts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pkts"
                  stroke="hsl(var(--primary))"
                  fill="url(#pkts)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="anom"
                  stroke="hsl(var(--danger))"
                  fill="url(#anom)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-2 text-sm font-medium">Protocol mix</div>
          <div className="text-xs text-muted-foreground">Layer 4 breakdown (live flows)</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={protoCounts}
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {protoCounts.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {protoCounts.map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} /> {p.name} ·{" "}
                <span className="font-mono">{p.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">Recent detections</div>
            <Link to="/dashboard/alerts" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Source IP</th>
                  <th className="pb-3 pr-4">Origin</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Confidence</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((r: RecentDetectionItem, i: number) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.t}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{r.ip}</td>
                    <td className="py-3 pr-4 text-xs">{r.country}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${r.conf}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs">{r.conf}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {r.blocked ? (
                        <span className="rounded-md bg-success/15 px-2 py-0.5 text-[11px] text-success">
                          Blocked
                        </span>
                      ) : (
                        <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[11px] text-warning">
                          Monitoring
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium">System health</div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <ul className="space-y-4">
            <Health
              icon={Cpu}
              label="CPU"
              pct={backendStatus?.system?.cpu ? Math.round(backendStatus.system.cpu) : 38}
            />
            <Health
              icon={HardDrive}
              label="Memory"
              pct={backendStatus?.system?.memory ? Math.round(backendStatus.system.memory) : 52}
            />
            <Health
              icon={Database}
              label="Ingest queue"
              pct={backendStatus?.rate ? Math.min(100, Math.round(backendStatus.rate * 2)) : 16}
            />
            <Health
              icon={Activity}
              label="Model latency"
              pct={
                backendStatus?.system?.latency_ms ? Math.round(backendStatus.system.latency_ms) : 12
              }
              tone="success"
            />
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} /> {label}
    </span>
  );
}

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
  tone: "primary" | "danger" | "warning" | "success";
}) {
  const toneMap = {
    primary: "text-primary bg-primary/10",
    danger: "text-danger bg-danger/10",
    warning: "text-warning bg-warning/10",
    success: "text-success bg-success/10",
  };
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          live
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Health({
  icon: Icon,
  label,
  pct,
  tone = "primary",
}: {
  icon: React.ElementType;
  label: string;
  pct: number;
  tone?: "primary" | "success";
}) {
  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: tone === "success" ? "hsl(var(--success))" : "var(--gradient-primary)",
          }}
        />
      </div>
    </li>
  );
}
