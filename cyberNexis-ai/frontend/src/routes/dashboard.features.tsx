import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useSeries, randomIP, pick, ri } from "@/lib/live-data";
import { ArrowRight, Boxes } from "lucide-react";

export const Route = createFileRoute("/dashboard/features")({ component: FeatureExtraction });

const PROTOS = ["TCP", "UDP", "ICMP"] as const;
const FLAGS = ["FIN", "SYN,ACK", "PSH,ACK", "ACK", "RST"];

function FeatureExtraction() {
  const [rows, setRows] = useState<
    {
      src: string;
      dst: string;
      proto: string;
      flag: string;
      bytes: number;
      size: number;
      dur: number;
    }[]
  >([]);

  useEffect(() => {
    let active = true;

    const fetchFeatures = async () => {
      if (!active) return;
      try {
        const res = await fetch("http://localhost:8000/api/features");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data?.features ?? []);
          setRows(list);
          return;
        }
      } catch (e) {
        // Silently fallback to mock simulator
      }

      // Simulated Fallback
      setRows((prev) => {
        const row = {
          src: randomIP(),
          dst: randomIP(),
          proto: pick(PROTOS),
          flag: pick(FLAGS),
          bytes: 200 + ri(80_000),
          size: 40 + ri(1400),
          dur: +(Math.random() * 5).toFixed(2),
        };
        const base = Array.isArray(prev) ? prev : [];
        return [row, ...base].slice(0, 10);
      });
    };

    fetchFeatures();
    const id = setInterval(fetchFeatures, 1500);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <DashboardShell title="Feature Extraction">
      <div className="mb-6 glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Pipeline</div>
            <div className="text-xs text-muted-foreground">
              Raw packet → 40+ numeric features → model input
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 overflow-x-auto">
          {[
            "Incoming packet",
            "Parse headers",
            "Aggregate flow",
            "Normalize",
            "UNSW-NB15 vector",
          ].map((s, i, a) => (
            <div key={s} className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium">
                {s}
              </div>
              {i < a.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-3 text-sm font-medium">Live extracted features</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">src_ip</th>
                <th className="pb-2 pr-3">dst_ip</th>
                <th className="pb-2 pr-3">proto</th>
                <th className="pb-2 pr-3">flags</th>
                <th className="pb-2 pr-3">bytes</th>
                <th className="pb-2 pr-3">pkt_size</th>
                <th className="pb-2">duration_s</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {(Array.isArray(rows) ? rows : []).map((r, i) => (
                <tr key={i} className="border-t border-white/5 animate-fade-in">
                  <td className="py-2 pr-3">{r.src}</td>
                  <td className="py-2 pr-3">{r.dst}</td>
                  <td className="py-2 pr-3 text-primary">{r.proto}</td>
                  <td className="py-2 pr-3">{r.flag}</td>
                  <td className="py-2 pr-3">{r.bytes.toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.size}</td>
                  <td className="py-2">{r.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
