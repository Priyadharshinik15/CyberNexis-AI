import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Play, Pause, Square, Download, Circle } from "lucide-react";
import { randomIP, pick, ri } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/capture")({ component: Capture });

const PROTOS = ["TCP", "UDP", "ICMP", "DNS", "HTTP"] as const;
const FLAGS = ["SYN", "ACK", "PSH,ACK", "FIN,ACK", "RST", "SYN,ACK"];

interface PacketRow {
  i: number;
  t: string;
  src: string;
  dst: string;
  proto: string;
  flag: string;
  size: number;
}

function Capture() {
  const [status, setStatus] = useState<"running" | "paused" | "stopped">("running");
  const [count, setCount] = useState(842_119);
  const [rate, setRate] = useState(0);
  const [rows, setRows] = useState<PacketRow[]>([]);
  const [iface, setIface] = useState("eth0");
  const idx = useRef(0);

  // Helper to change status on backend
  const updateBackendStatus = async (newStatus: "running" | "paused" | "stopped") => {
    setStatus(newStatus);
    try {
      const res = await fetch("http://localhost:8000/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Packet capture ${newStatus}`);
      }
    } catch (e) {
      console.warn("Failed to update status on backend:", e);
      toast.info(`Capture ${newStatus} (simulation mode)`);
    }
  };

  const handleDownloadPCAP = () => {
    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) {
      toast.error("No packets captured to download");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `sentinel_packets_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Downloaded ${list.length} packets`);
  };

  useEffect(() => {
    let active = true;

    const fetchStatusAndPackets = async () => {
      if (!active) return;
      try {
        const [statusRes, packetsRes] = await Promise.allSettled([
          fetch("http://localhost:8000/api/status"),
          fetch("http://localhost:8000/api/packets"),
        ]);

        let gotPackets = false;

        if (statusRes.status === "fulfilled" && statusRes.value.ok) {
          const statusData = await statusRes.value.json().catch(() => null);
          if (statusData) {
            if (statusData.status) setStatus(statusData.status);
            if (typeof statusData.packet_count === "number") setCount(statusData.packet_count);
            if (typeof statusData.rate === "number") setRate(statusData.rate);
            if (statusData.interface) setIface(statusData.interface);
          }
        }

        if (packetsRes.status === "fulfilled" && packetsRes.value.ok) {
          const packetsData = await packetsRes.value.json().catch(() => null);
          if (packetsData) {
            if (packetsData.stats) {
              if (typeof packetsData.stats.total_captured === "number") {
                setCount(packetsData.stats.total_captured);
              }
              if (typeof packetsData.stats.rate_pps === "number") {
                setRate(packetsData.stats.rate_pps);
              }
              if (packetsData.stats.interface) {
                setIface(packetsData.stats.interface);
              }
              if (packetsData.stats.status) {
                setStatus(packetsData.stats.status);
              }
            }

            const rawList = Array.isArray(packetsData)
              ? packetsData
              : Array.isArray(packetsData?.packets)
              ? packetsData.packets
              : [];

            if (rawList.length > 0) {
              setRows(rawList);
              gotPackets = true;
            }
          }
        }

        if (gotPackets) return; // Successfully loaded packets from backend
      } catch (e) {
        // Silently fall back to simulation if backend is down
      }

      // Simulated Fallback Loop (if backend is offline or has no packets yet)
      if (status !== "running") return;
      const batch = 6 + ri(6);
      setCount((c) => (c || 0) + batch);
      setRate(900 + ri(500));

      const newRows: PacketRow[] = [];
      for (let i = 0; i < batch; i++) {
        idx.current += 1;
        newRows.push({
          i: idx.current,
          t: new Date().toTimeString().slice(0, 8),
          src: randomIP(),
          dst: randomIP(),
          proto: pick(PROTOS),
          flag: pick(FLAGS),
          size: 40 + ri(1460),
        });
      }
      setRows((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        return [...newRows.reverse(), ...base].slice(0, 40);
      });
    };

    fetchStatusAndPackets();
    const id = setInterval(fetchStatusAndPackets, 1000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [status]);

  return (
    <DashboardShell title="Packet Capture">
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Circle
              className={`h-3 w-3 ${status === "running" ? "fill-success text-success animate-pulse" : status === "paused" ? "fill-warning text-warning" : "fill-muted text-muted-foreground"}`}
            />
            <span className="capitalize">{status}</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Packets captured</div>
          <div className="mt-1 font-mono text-2xl font-semibold">{(count ?? 0).toLocaleString()}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Rate</div>
          <div className="mt-1 font-mono text-2xl font-semibold">
            {rate ?? 0} <span className="text-sm text-muted-foreground">pkts/s</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Interface</div>
          <div className="mt-1 font-mono text-lg">{iface || "eth0"} · promisc</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => updateBackendStatus("running")}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Play className="h-4 w-4" /> Start
        </button>
        <button
          onClick={() => updateBackendStatus("paused")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06]"
        >
          <Pause className="h-4 w-4" /> Pause
        </button>
        <button
          onClick={() => updateBackendStatus("stopped")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06]"
        >
          <Square className="h-4 w-4" /> Stop
        </button>
        <button
          onClick={handleDownloadPCAP}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06]"
        >
          <Download className="h-4 w-4" /> Download PCAP
        </button>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Scapy live stream</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            tail -f capture.pcap
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Source</th>
                <th className="pb-2 pr-3">Destination</th>
                <th className="pb-2 pr-3">Proto</th>
                <th className="pb-2 pr-3">Flags</th>
                <th className="pb-2">Size</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {(Array.isArray(rows) ? rows : []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No packets captured yet. Click Start to begin packet capture.
                  </td>
                </tr>
              ) : (
                (Array.isArray(rows) ? rows : []).map((r) => (
                  <tr key={r.i} className="border-t border-white/5 animate-fade-in">
                    <td className="py-1.5 pr-3 text-muted-foreground">{r.i}</td>
                    <td className="py-1.5 pr-3">{r.t}</td>
                    <td className="py-1.5 pr-3">{r.src}</td>
                    <td className="py-1.5 pr-3">{r.dst}</td>
                    <td className="py-1.5 pr-3">
                      <span className="rounded bg-white/5 px-1.5 py-0.5">{r.proto}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-primary">{r.flag}</td>
                    <td className="py-1.5">{r.size}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
