import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useSeries, ATTACK_TYPES, pick, ri } from "@/lib/live-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { AlertTriangle, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/prediction")({ component: Prediction });

function Prediction() {
  const [nextAttack, setNextAttack] = useState<{ type: string; prob: number; etaSec: number }>({
    type: "DoS",
    prob: 82,
    etaSec: 15,
  });
  const [series, setSeries] = useState<{ t: number; actual: number | null; predicted: number }[]>(
    [],
  );

  useEffect(() => {
    let active = true;

    const fetchPrediction = async () => {
      if (!active) return;
      try {
        const res = await fetch("http://localhost:8000/api/prediction");
        if (res.ok) {
          const data = await res.json();
          setNextAttack(data.next_attack);
          setSeries(data.forecast);
          return; // Success, skip simulated fallback
        }
      } catch (e) {
        // Silently fallback to mock simulator
      }

      // Simulated Fallback
      setNextAttack({ type: pick(ATTACK_TYPES), prob: 82 + ri(14), etaSec: 12 + ri(30) });
      setSeries((prev) => {
        const t = (prev[prev.length - 1]?.t ?? 0) + 1;
        if (t < 30)
          return [
            ...prev,
            {
              t,
              actual: 20 + ri(30) + (t > 15 ? t * 2 : 0),
              predicted: 20 + ri(30) + (t > 15 ? t * 2 : 0) + ri(6),
            },
          ];
        return [...prev.slice(-40), { t, actual: null, predicted: 45 + ri(35) + (t - 30) * 3 }];
      });
    };

    fetchPrediction();
    const id = setInterval(fetchPrediction, 1500);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <DashboardShell title="Threat Prediction">
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" /> Next likely attack
          </div>
          <div className="mt-1 text-2xl font-semibold">{nextAttack.type}</div>
          <div className="text-xs text-muted-foreground">LSTM · window 128</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Probability</div>
          <div className="mt-1 text-3xl font-semibold text-gradient">{nextAttack.prob}%</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${nextAttack.prob}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> ETA
          </div>
          <div className="mt-1 text-3xl font-semibold">~{nextAttack.etaSec}s</div>
          <div className="text-xs text-muted-foreground">Recommended: preload firewall rules</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Future threat timeline</div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />
              Observed
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-accent" />
              Forecast
            </span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ left: -20, top: 5, right: 5 }}>
              <defs>
                <linearGradient id="observ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
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
              <ReferenceLine
                x={30}
                stroke="hsl(var(--accent))"
                strokeDasharray="4 4"
                label={{ value: "Now", fill: "hsl(var(--accent))", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                fill="url(#observ)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--accent))"
                fill="url(#fore)"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardShell>
  );
}
