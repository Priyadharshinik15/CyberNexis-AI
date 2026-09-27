import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useSeries, randomIP, pick, ri } from "@/lib/live-data";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Wifi, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export const Route = createFileRoute("/dashboard/monitoring")({ component: Monitoring });

const PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "DNS"] as const;

function Monitoring() {
  const [sessions, setSessions] = useState("1,842");
  const [inbound, setInbound] = useState("40 MB/s");
  const [outbound, setOutbound] = useState("20 MB/s");
  const [ifaceList, setIfaceList] = useState("eth0 · eth1 · vpn0");
  const [bw, setBw] = useState<{ t: string; in: number; out: number }[]>([]);
  const [flows, setFlows] = useState<
    { src: string; dst: string; proto: string; port: number; bytes: number }[]
  >([]);

  useEffect(() => {
    let active = true;

    const fetchMonitoring = async () => {
      if (!active) return;
      try {
        const res = await fetch("http://localhost:8000/api/monitoring");
        if (res.ok) {
          const data = await res.json();
          setSessions(data.live_sessions.toLocaleString());
          setInbound(`${data.inbound_mbps} Mbps`);
          setOutbound(`${data.outbound_mbps} Mbps`);
          setIfaceList(data.interfaces.join(" · "));
          setFlows(data.flows);

          setBw((prev) => {
            const t = new Date().toTimeString().slice(3, 8);
            const next = [...prev, { t, in: data.inbound_mbps, out: data.outbound_mbps }];
            return next.slice(-30);
          });
          return; // Success, skip simulated fallback
        }
      } catch (e) {
        // Silently fallback to mock values
      }

      // Simulated Fallback
      setSessions((1842 + ri(10)).toLocaleString());
      const inVal = 40 + ri(30);
      const outVal = 20 + ri(20);
      setInbound(`${inVal} MB/s`);
      setOutbound(`${outVal} MB/s`);
      setIfaceList("eth0 · eth1 · vpn0");

      setBw((prev) => {
        const t = new Date().toTimeString().slice(3, 8);
        const next = [...prev, { t, in: inVal, out: outVal }];
        return next.slice(-30);
      });

      setFlows((prev) => {
        const row = {
          src: randomIP(),
          dst: randomIP(),
          proto: pick(PROTOCOLS),
          port: pick([80, 443, 22, 53, 3306, 8080, 25565, 3389]),
          bytes: 40 + ri(15_000),
        };
        return [row, ...prev].slice(0, 12);
      });
    };

    fetchMonitoring();
    const id = setInterval(fetchMonitoring, 1200);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <DashboardShell title="Network Monitoring">
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <MiniStat icon={Wifi} label="Live sessions" value={sessions} />
        <MiniStat icon={ArrowDownToLine} label="Inbound" value={inbound} />
        <MiniStat icon={ArrowUpFromLine} label="Outbound" value={outbound} />
        <MiniStat icon={Wifi} label="Interfaces" value={ifaceList} small />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Bandwidth</div>
            <div className="text-xs text-muted-foreground">Mbps · rolling 30s</div>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-primary" />
              Inbound
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-accent" />
              Outbound
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={bw} margin={{ left: -20, top: 5, right: 5 }}>
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
              <Line
                dot={false}
                type="monotone"
                dataKey="in"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                dot={false}
                type="monotone"
                dataKey="out"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl p-5">
        <div className="mb-3 text-sm font-medium">Live flow stream</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Destination</th>
                <th className="pb-2 pr-4">Proto</th>
                <th className="pb-2 pr-4">Port</th>
                <th className="pb-2">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f, i) => (
                <tr key={i} className="border-t border-white/5 animate-fade-in">
                  <td className="py-2 pr-4 font-mono text-xs">{f.src}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{f.dst}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px]">{f.proto}</span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{f.port}</td>
                  <td className="py-2 font-mono text-xs">{f.bytes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: any;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-2 font-semibold ${small ? "text-sm font-mono" : "text-2xl"}`}>
        {value}
      </div>
    </div>
  );
}
