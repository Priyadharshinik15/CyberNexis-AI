import { Link, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Shield,
  LayoutDashboard,
  Radar,
  PackageSearch,
  Boxes,
  Brain,
  LineChart,
  Bell,
  Globe2,
  BarChart3,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Search,
  Sun,
  Moon,
  ShieldAlert,
  Activity,
  LogOut,
  ChevronDown,
  Cpu,
  FlaskConical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, initials } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAlerts } from "@/hooks/useAlerts";
import { toast } from "sonner";
import { startAlertSimulator } from "@/lib/alert-simulator";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/monitoring", label: "Network Monitoring", icon: Radar },
  { to: "/dashboard/capture", label: "Packet Capture", icon: PackageSearch },
  { to: "/dashboard/features", label: "Feature Extraction", icon: Boxes },
  { to: "/dashboard/detection", label: "AI Detection", icon: Brain },
  { to: "/dashboard/prediction", label: "Threat Prediction", icon: LineChart },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/geo", label: "Geo Attack Map", icon: Globe2 },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/mlops", label: "MLOps Dashboard", icon: FlaskConical },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
] as { to: string; label: string; icon: React.ElementType; exact?: boolean }[];

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [bellOpen, setBellOpen] = useState(false);

  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { alerts, acknowledge } = useAlerts(user?.id, 20);
  const simulatorRef = useRef<{ stop: () => void } | null>(null);

  // Start the alert simulator once we have a userId
  useEffect(() => {
    if (!user?.id) return;
    simulatorRef.current = startAlertSimulator(user.id, 4500);
    return () => simulatorRef.current?.stop();
  }, [user?.id]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signOut = async () => {
    setProfileMenuOpen(false);
    localStorage.removeItem("sentinel_local_user");
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email || "Analyst";
  const avatarInitials = initials(
    user?.email,
    profile?.full_name || user?.user_metadata?.full_name,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 cyber-grid opacity-40" />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-black/30 backdrop-blur-md lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-white/5 px-5">
            <div
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">CyberNexis AI</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                SOC v1.0
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 text-sm">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.to === "/dashboard/alerts" && unacknowledgedCount > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {unacknowledgedCount > 99 ? "99+" : unacknowledgedCount}
                    </span>
                  )}
                  {active && item.to !== "/dashboard/alerts" && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/5 p-4 space-y-3">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldAlert className="h-4 w-4 text-success" />
                <span className="font-medium">Systems armed</span>
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                <Activity className="mr-1 inline h-3 w-3" /> uptime 14d 03h · lat 12ms
              </div>
            </div>

            {/* User profile in sidebar */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.05] transition"
              >
                <div
                  className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-xs font-semibold text-background"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {avatarInitials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-xs font-medium">{displayName}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-muted-foreground transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-full rounded-xl border border-white/10 bg-black/80 py-1 backdrop-blur-md shadow-xl z-50">
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  >
                    <SettingsIcon className="h-3.5 w-3.5" /> Settings
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/5 bg-black/40 px-6 backdrop-blur-md">
            <div className="lg:hidden flex items-center gap-2">
              <div
                className="grid h-7 w-7 place-items-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-3.5 w-3.5 text-background" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold">CyberNexis</span>
            </div>
            <div className="hidden text-sm font-semibold sm:block">{title}</div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground md:flex">
                <Search className="h-3.5 w-3.5" />
                <input
                  placeholder="Search IPs, alerts, models..."
                  className="w-56 bg-transparent outline-none"
                />
                <span className="font-mono text-[10px]">⌘K</span>
              </div>
              <div className="hidden items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-mono text-success md:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                AI ONLINE
              </div>
              <button
                onClick={() => setDark((d) => !d)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Bell with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                >
                  <BellIcon className="h-4 w-4" />
                  {unacknowledgedCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                      {unacknowledgedCount > 9 ? "9+" : unacknowledgedCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md z-50">
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                      <span className="text-sm font-medium">Recent Alerts</span>
                      <button
                        onClick={() => setBellOpen(false)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                          No alerts yet
                        </div>
                      ) : (
                        alerts.slice(0, 8).map((a) => (
                          <div
                            key={a.id}
                            className={`border-b border-white/5 px-4 py-3 last:border-0 ${a.acknowledged ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-widest ${
                                  a.severity === "critical"
                                    ? "bg-danger/20 text-danger"
                                    : a.severity === "warning"
                                      ? "bg-warning/20 text-warning"
                                      : "bg-primary/20 text-primary"
                                }`}
                              >
                                {a.severity}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium">{a.attack_type}</div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  {a.message}
                                </div>
                              </div>
                              {!a.acknowledged && (
                                <button
                                  onClick={() => acknowledge(a.id)}
                                  className="flex-shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] hover:bg-white/10"
                                >
                                  Ack
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-white/5 p-2">
                      <Link
                        to="/dashboard/alerts"
                        onClick={() => setBellOpen(false)}
                        className="block rounded-xl py-2 text-center text-xs text-primary hover:bg-primary/10"
                      >
                        View all alerts →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold text-background"
                style={{ background: "var(--gradient-primary)" }}
              >
                {avatarInitials}
              </button>

              <div className="hidden font-mono text-[11px] text-muted-foreground xl:block">
                {now.toTimeString().slice(0, 8)} UTC
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
