import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useSeries, ATTACK_TYPES, pick, ri, randomIP } from "@/lib/live-data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Brain, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard/detection")({ component: Detection });

function Detection() {
  const [modelVersion, setModelVersion] = useState("XGBoost v3.2");
  const [accuracy, setAccuracy] = useState(99.64);
  const [fpr, setFpr] = useState(0.32);
  const [conf, setConf] = useState<{ t: string; c: number }[]>([]);
  const [shap, setShap] = useState<{ k: string; v: number }[]>([]);
  const [rows, setRows] = useState<
    { ip: string; type: string; risk: number; conf: number; verdict: "attack" | "normal" }[]
  >([]);

  useEffect(() => {
    let active = true;

    const fetchDetection = async () => {
      if (!active) return;
      try {
        const res = await fetch("http://localhost:8000/api/detection");
        if (res.ok) {
          const data = await res.json();
          setModelVersion(data.model_version);
          setAccuracy(data.accuracy);
          setFpr(data.false_positive_rate);
          setConf(data.rolling_confidence);
          setShap(data.shap);
          setRows(data.classifications);
          return; // Success, skip simulated fallback
        }
      } catch (e) {
        // Silently fallback to mock simulator
      }

      // Simulated Fallback
      setModelVersion("XGBoost v3.2");
      setAccuracy(99.64);
      setFpr(0.32);

      setConf((prev) => {
        const next = [...prev, { t: new Date().toTimeString().slice(3, 8), c: 80 + ri(20) }];
        return next.slice(-20);
      });

      setRows((prev) => {
        const isAttack = Math.random() > 0.35;
        const row = {
          ip: randomIP(),
          type: isAttack ? pick(ATTACK_TYPES) : "Normal",
          risk: isAttack ? 60 + ri(40) : ri(30),
          conf: 70 + ri(29),
          verdict: isAttack ? ("attack" as const) : ("normal" as const),
        };
        return [row, ...prev].slice(0, 8);
      });

      setShap([
        { k: "connection_count", v: 0.32 },
        { k: "protocol_tcp", v: 0.24 },
        { k: "packet_size_avg", v: 0.19 },
        { k: "flow_duration", v: 0.14 },
        { k: "bytes_out", v: 0.11 },
      ]);
    };

    fetchDetection();
    const id = setInterval(fetchDetection, 1500);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <DashboardShell title="AI Detection">
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="h-3.5 w-3.5" /> Model
          </div>
          <div className="mt-1 text-lg font-semibold">{modelVersion}</div>
          <div className="text-xs text-muted-foreground">Trained on UNSW-NB15 · 2.5M flows</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Accuracy</div>
          <div className="mt-1 text-3xl font-semibold text-gradient">{accuracy}%</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">False-positive rate</div>
          <div className="mt-1 text-3xl font-semibold">{fpr}%</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-2 text-sm font-medium">Model confidence — rolling</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={conf}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="c" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" /> Explainable AI · SHAP
          </div>
          <ul className="space-y-2 text-sm">
            {shap.map((r) => (
              <li key={r.k} className="flex items-center gap-3">
                <span className="w-44 font-mono text-xs text-muted-foreground">{r.k}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${r.v * 100}%`, background: "var(--gradient-primary)" }}
                  />
                </span>
                <span className="font-mono text-xs">{r.v.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl p-5">
        <div className="mb-3 text-sm font-medium">Live classifications</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Source IP</th>
                <th className="pb-2 pr-3">Verdict</th>
                <th className="pb-2 pr-3">Attack type</th>
                <th className="pb-2 pr-3">Risk</th>
                <th className="pb-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5 animate-fade-in">
                  <td className="py-2 pr-3 font-mono text-xs">{r.ip}</td>
                  <td className="py-2 pr-3">
                    {r.verdict === "attack" ? (
                      <span className="rounded-md bg-danger/15 px-2 py-0.5 text-[11px] text-danger">
                        Attack
                      </span>
                    ) : (
                      <span className="rounded-md bg-success/15 px-2 py-0.5 text-[11px] text-success">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs">{r.type}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${r.risk}%`,
                            background: r.risk > 60 ? "hsl(var(--danger))" : "hsl(var(--primary))",
                          }}
                        />
                      </span>
                      <span className="font-mono text-xs">{r.risk}</span>
                    </div>
                  </td>
                  <td className="py-2 font-mono text-xs">{r.conf}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
