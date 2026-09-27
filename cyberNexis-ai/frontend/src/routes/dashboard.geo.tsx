import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { COUNTRIES, ATTACK_TYPES, pick, randomIP, ri } from "@/lib/live-data";
import { MapPin, Globe2, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";

export const Route = createFileRoute("/dashboard/geo")({ component: Geo });

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Sev = "critical" | "high" | "medium" | "low";

interface Attack {
  id: string;
  srcLat: number;
  srcLng: number;
  dstLat: number;
  dstLng: number;
  ip: string;
  country: string;
  countryName: string;
  type: string;
  severity: Sev;
  born: number;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const TARGET = { lat: 51.5074, lng: -0.1278, label: "HQ · London" };

const SEV_COLOR: Record<Sev, string> = {
  critical: "#ef4444", // red
  high: "#f97316", // orange
  medium: "#a855f7", // purple
  low: "#06b6d4", // cyan
};

const SEV_GLOW: Record<Sev, string> = {
  critical: "rgba(239,68,68,0.6)",
  high: "rgba(249,115,22,0.6)",
  medium: "rgba(168,85,247,0.6)",
  low: "rgba(6,182,212,0.6)",
};

const COUNTRY_DATA: Record<string, { name: string; lat: number; lng: number }> = {
  RU: { name: "Russia", lat: 55.7558, lng: 37.6173 },
  CN: { name: "China", lat: 39.9042, lng: 116.4074 },
  US: { name: "United States", lat: 40.7128, lng: -74.006 },
  BR: { name: "Brazil", lat: -23.5505, lng: -46.6333 },
  IN: { name: "India", lat: 19.076, lng: 72.8777 },
  DE: { name: "Germany", lat: 52.52, lng: 13.405 },
  KP: { name: "North Korea", lat: 39.0392, lng: 125.7625 },
  IR: { name: "Iran", lat: 35.6892, lng: 51.389 },
  NG: { name: "Nigeria", lat: 6.5244, lng: 3.3792 },
  UA: { name: "Ukraine", lat: 50.4501, lng: 30.5234 },
  FR: { name: "France", lat: 48.8566, lng: 2.3522 },
  GB: { name: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  JP: { name: "Japan", lat: 35.6762, lng: 139.6503 },
};

/* ── Hook: load leaflet dynamically (SSR-safe) ─────────────────────────────── */

function useLeaflet() {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  useEffect(() => {
    import("leaflet").then((mod) => setL(mod.default ?? (mod as any)));
  }, []);
  return L;
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

function Geo() {
  const { user } = useAuth();
  const { alerts } = useAlerts(user?.id, 60);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [selected, setSelected] = useState<Attack | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import("leaflet").Map | null>(null);
  const arcLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const markerLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const animFrames = useRef<number[]>([]);
  const L = useLeaflet();

  /* ── Build attack list ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const mapped: Attack[] = alerts.map((a) => {
        const src = COUNTRY_DATA[a.country ?? "RU"] ?? COUNTRY_DATA.RU;
        const sevMap: Record<string, Sev> = { critical: "critical", warning: "high", info: "low" };
        return {
          id: a.id,
          srcLat: src.lat + (Math.random() - 0.5) * 3,
          srcLng: src.lng + (Math.random() - 0.5) * 3,
          dstLat: TARGET.lat,
          dstLng: TARGET.lng,
          ip: a.source_ip,
          country: a.country ?? "??",
          countryName: src.name,
          type: a.attack_type,
          severity: (sevMap[a.severity] ?? "low") as Sev,
          born: new Date(a.created_at).getTime(),
        };
      });
      setAttacks(mapped);
    } else {
      // Seed with demo data
      const demo: Attack[] = [
        {
          id: "d1",
          srcLat: 19.076,
          srcLng: 72.878,
          dstLat: 51.507,
          dstLng: -0.128,
          ip: "45.33.10.11",
          country: "IN",
          countryName: "India",
          type: "DoS",
          severity: "critical",
          born: Date.now() - 2000,
        },
        {
          id: "d2",
          srcLat: 55.756,
          srcLng: 37.617,
          dstLat: 52.52,
          dstLng: 13.405,
          ip: "185.220.101.5",
          country: "RU",
          countryName: "Russia",
          type: "Reconnaissance",
          severity: "high",
          born: Date.now() - 5000,
        },
        {
          id: "d3",
          srcLat: 39.904,
          srcLng: 116.407,
          dstLat: 40.713,
          dstLng: -74.006,
          ip: "203.0.113.67",
          country: "CN",
          countryName: "China",
          type: "Exploit",
          severity: "critical",
          born: Date.now() - 8000,
        },
        {
          id: "d4",
          srcLat: -23.551,
          srcLng: -46.633,
          dstLat: 48.857,
          dstLng: 2.352,
          ip: "198.51.100.42",
          country: "BR",
          countryName: "Brazil",
          type: "Botnet",
          severity: "medium",
          born: Date.now() - 11000,
        },
        {
          id: "d5",
          srcLat: 39.039,
          srcLng: 125.763,
          dstLat: 51.507,
          dstLng: -0.128,
          ip: "103.25.184.3",
          country: "KP",
          countryName: "North Korea",
          type: "Shellcode",
          severity: "critical",
          born: Date.now() - 15000,
        },
        {
          id: "d6",
          srcLat: 35.689,
          srcLng: 51.389,
          dstLat: 52.52,
          dstLng: 13.405,
          ip: "91.108.4.100",
          country: "IR",
          countryName: "Iran",
          type: "Worm",
          severity: "high",
          born: Date.now() - 18000,
        },
      ];
      setAttacks(demo);

      // Keep adding new simulated attacks
      const id = setInterval(() => {
        const countries = Object.values(COUNTRY_DATA);
        const src = countries[ri(countries.length)];
        const SEVS: Sev[] = ["critical", "high", "medium", "low"];
        const sev = pick(SEVS);
        setAttacks((prev) =>
          [
            {
              id: crypto.randomUUID(),
              srcLat: src.lat + (Math.random() - 0.5) * 4,
              srcLng: src.lng + (Math.random() - 0.5) * 4,
              dstLat: TARGET.lat + (Math.random() - 0.5) * 0.5,
              dstLng: TARGET.lng + (Math.random() - 0.5) * 0.5,
              ip: randomIP(),
              country: Object.keys(COUNTRY_DATA)[ri(Object.keys(COUNTRY_DATA).length)],
              countryName: src.name,
              type: pick(ATTACK_TYPES),
              severity: sev,
              born: Date.now(),
            },
            ...prev,
          ].slice(0, 40),
        );
      }, 3500);
      return () => clearInterval(id);
    }
  }, [alerts]);

  /* ── Initialise Leaflet map ────────────────────────────────────────────── */
  useEffect(() => {
    if (!L || !mapRef.current || leafletMap.current) return;

    // Fix default icon paths broken by bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current, {
      center: [20, 10],
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    // ESRI Dark Gray Canvas tiles — 100% free, dark cybersecurity theme, no API key or watermark
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap',
        maxZoom: 16,
      },
    ).addTo(map);

    arcLayer.current = L.layerGroup().addTo(map);
    markerLayer.current = L.layerGroup().addTo(map);

    // HQ target marker
    const hqIcon = L.divIcon({
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      html: `<div style="
        width:20px;height:20px;border-radius:50%;
        background:rgba(6,182,212,0.2);
        border:2px solid #06b6d4;
        box-shadow:0 0 12px 4px rgba(6,182,212,0.7);
        animation:hqPulse 2s ease-in-out infinite;
      "></div>`,
    });
    L.marker([TARGET.lat, TARGET.lng], { icon: hqIcon, zIndexOffset: 1000 })
      .bindTooltip(`<b>${TARGET.label}</b><br/>Defended perimeter`, {
        permanent: false,
        direction: "top",
      })
      .addTo(map);

    leafletMap.current = map;
    return () => {
      animFrames.current.forEach(cancelAnimationFrame);
      map.remove();
      leafletMap.current = null;
      arcLayer.current = null;
      markerLayer.current = null;
    };
  }, [L]);

  /* ── Draw attacks on map ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!L || !leafletMap.current || !arcLayer.current || !markerLayer.current) return;

    arcLayer.current.clearLayers();
    markerLayer.current.clearLayers();
    animFrames.current.forEach(cancelAnimationFrame);
    animFrames.current = [];

    attacks.slice(0, 30).forEach((a) => {
      const color = SEV_COLOR[a.severity];
      const glow = SEV_GLOW[a.severity];

      // Attacker marker with pulsing ring
      const attackerIcon = L.divIcon({
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:${color};
          box-shadow:0 0 8px 3px ${glow};
          animation:pulse 1.8s ease-in-out infinite;
        "></div>`,
      });

      L.marker([a.srcLat, a.srcLng], { icon: attackerIcon })
        .bindPopup(
          `
          <div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:200px">
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:${color}">
              ⚠ ${a.type}
            </div>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#94a3b8">Source IP</td><td style="text-align:right;font-weight:600">${a.ip}</td></tr>
              <tr><td style="color:#94a3b8">Origin</td><td style="text-align:right">${a.countryName}</td></tr>
              <tr><td style="color:#94a3b8">Target</td><td style="text-align:right">${TARGET.label}</td></tr>
              <tr><td style="color:#94a3b8">Severity</td><td style="text-align:right;color:${color};font-weight:700">${a.severity.toUpperCase()}</td></tr>
              <tr><td style="color:#94a3b8">Time</td><td style="text-align:right">${new Date(a.born).toLocaleTimeString()}</td></tr>
            </table>
          </div>
        `,
          { maxWidth: 280 },
        )
        .on("click", () => setSelected(a))
        .addTo(markerLayer.current!);

      // Animated arc from src → dst
      drawArc(L, arcLayer.current!, a, color);
    });
  }, [L, attacks]);

  /* ── Animated arc using canvas polyline ───────────────────────────────── */
  const drawArc = useCallback(
    (
      L: typeof import("leaflet"),
      layer: import("leaflet").LayerGroup,
      a: Attack,
      color: string,
    ) => {
      const steps = 60;
      const points: [number, number][] = [];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Cubic bezier control point — arc up
        const ctrlLat = (a.srcLat + a.dstLat) / 2 + Math.abs(a.srcLng - a.dstLng) * 0.25;
        const ctrlLng = (a.srcLng + a.dstLng) / 2;
        const lat = (1 - t) * (1 - t) * a.srcLat + 2 * (1 - t) * t * ctrlLat + t * t * a.dstLat;
        const lng = (1 - t) * (1 - t) * a.srcLng + 2 * (1 - t) * t * ctrlLng + t * t * a.dstLng;
        points.push([lat, lng]);
      }

      // Static faint arc
      L.polyline(points, {
        color,
        weight: 1.5,
        opacity: 0.3,
        dashArray: "4 6",
      }).addTo(layer);

      // Animated traveling dot along the arc
      let step = 0;
      const dot = L.circleMarker(points[0], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 1,
        weight: 0,
      }).addTo(layer);

      const animate = () => {
        step = (step + 1) % steps;
        dot.setLatLng(points[step]);
        animFrames.current.push(requestAnimationFrame(() => setTimeout(animate, 30)));
      };
      animFrames.current.push(requestAnimationFrame(animate));
    },
    [],
  );

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  const topCountries = Object.entries(
    attacks.reduce<Record<string, number>>((acc, a) => {
      acc[a.countryName] = (acc[a.countryName] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const sevCount = (s: Sev) => attacks.filter((a) => a.severity === s).length;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <DashboardShell title="Geo Attack Map">
      {/* Leaflet pulse animation */}
      <style>{`
        @keyframes pulse {
          0%,100%{transform:scale(1);opacity:1}
          50%{transform:scale(1.6);opacity:0.5}
        }
        @keyframes hqPulse {
          0%,100%{box-shadow:0 0 12px 4px rgba(6,182,212,0.7)}
          50%{box-shadow:0 0 24px 10px rgba(6,182,212,0.3)}
        }
        .leaflet-popup-content-wrapper{
          background:#0f172a !important;
          border:1px solid rgba(255,255,255,0.12) !important;
          border-radius:12px !important;
          color:#e2e8f0 !important;
          box-shadow:0 20px 60px rgba(0,0,0,0.6) !important;
        }
        .leaflet-popup-tip{background:#0f172a !important}
        .leaflet-popup-close-button{color:#64748b !important}
        .leaflet-popup-close-button:hover{color:#e2e8f0 !important}
        .leaflet-control-zoom a{
          background:#0f172a !important;
          color:#06b6d4 !important;
          border-color:rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover{background:#1e293b !important}
        .leaflet-control-attribution{
          background:rgba(15,23,42,0.8) !important;
          color:#475569 !important;
          font-size:10px !important;
        }
        .leaflet-control-attribution a{color:#64748b !important}
      `}</style>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* ── Map container ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10"
          style={{ minHeight: 500 }}
        >
          {/* Leaflet map div */}
          <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />

          {/* HUD — top left */}
          <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-lg border border-primary/30 bg-black/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur">
            <Globe2 className="h-3 w-3" />
            Live threat map · {attacks.length} events
          </div>

          {/* HUD — severity legend bottom left */}
          <div className="pointer-events-none absolute bottom-8 left-4 z-[1000] flex items-center gap-3 rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
            {(["critical", "high", "medium", "low"] as Sev[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: SEV_COLOR[s], boxShadow: `0 0 6px ${SEV_COLOR[s]}` }}
                />
                {s}
              </span>
            ))}
          </div>

          {/* Floating selected attack info */}
          {selected && (
            <div className="absolute right-4 top-4 z-[1000] w-64 rounded-xl border border-white/10 bg-black/85 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="text-sm font-semibold"
                  style={{ color: SEV_COLOR[selected.severity] }}
                >
                  {selected.type}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Source IP", selected.ip],
                  ["Origin", selected.countryName],
                  ["Target", TARGET.label],
                  ["Severity", selected.severity.toUpperCase()],
                  ["Time", new Date(selected.born).toLocaleTimeString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span
                      className="font-mono font-medium text-right"
                      style={{ color: k === "Severity" ? SEV_COLOR[selected.severity] : undefined }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Severity breakdown */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium">Attack severity</div>
            <div className="grid grid-cols-2 gap-2">
              {(["critical", "high", "medium", "low"] as Sev[]).map((s) => (
                <div key={s} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s}
                  </div>
                  <div className="mt-1 text-2xl font-semibold" style={{ color: SEV_COLOR[s] }}>
                    {sevCount(s)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top attackers */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium">Top attacker regions</div>
            <ul className="space-y-2">
              {topCountries.map(([name, count]) => {
                const pct = Math.min(100, (count / attacks.length) * 100);
                return (
                  <li key={name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{name}</span>
                      <span className="font-mono text-muted-foreground">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Latest events */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-3 text-sm font-medium">Latest events</div>
            <ul className="space-y-2">
              {attacks.slice(0, 8).map((a) => (
                <li
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] px-2 py-1.5 text-xs hover:bg-white/[0.04] transition"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: SEV_COLOR[a.severity],
                      boxShadow: `0 0 5px ${SEV_COLOR[a.severity]}`,
                    }}
                  />
                  <span className="font-mono truncate flex-1">{a.ip}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 shrink-0">{a.type}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-xs text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <Activity className="h-3.5 w-3.5" />
            Real-time threat monitoring active
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
