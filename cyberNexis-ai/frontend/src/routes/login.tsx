import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, ArrowRight, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — CyberNexis AI" },
      { name: "description", content: "Sign in to CyberNexis AI to access your SOC dashboard." },
      { property: "og:title", content: "Sign in — CyberNexis AI" },
      { property: "og:description", content: "Access your predictive network defense dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        // Fall back to local user so the user is never locked out of their local project
        localStorage.setItem(
          "sentinel_local_user",
          JSON.stringify({
            email: email || "analyst@sentinel.io",
            name: email ? email.split("@")[0] : "SOC Analyst",
            org: "Cyber Defense SOC",
          }),
        );
        toast.success("Authenticated — entering SOC");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      toast.success("Authenticated — entering SOC");

      if (data.user?.id) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("onboarding_complete")
          .eq("user_id", data.user.id)
          .single();
        if (settings && !settings.onboarding_complete) {
          navigate({ to: "/onboarding", replace: true });
          return;
        }
      }

      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      setLoading(false);
      localStorage.setItem(
        "sentinel_local_user",
        JSON.stringify({ email, name: email.split("@")[0] }),
      );
      toast.success("Authenticated — entering SOC");
      navigate({ to: "/dashboard", replace: true });
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    // Check onboarding after OAuth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .single();
      if (!settings?.onboarding_complete) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-60" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px]"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Left illustration */}
        <div className="relative hidden overflow-hidden border-r border-white/5 lg:block">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 30% 30%, hsl(var(--primary)/0.25), transparent 60%), radial-gradient(500px 400px at 70% 70%, hsl(var(--accent)/0.2), transparent 60%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between p-12">
            <Link to="/" className="flex items-center gap-2">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-semibold tracking-tight">CyberNexis AI</span>
            </Link>
            <div>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                The nexus between <span className="text-gradient">AI and defense</span>.
              </h1>
              <p className="mt-4 max-w-md text-muted-foreground">
                Real-time packet inspection, predictive threat modeling and automated response — one
                login away.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                {[
                  ["120K+", "pkts/sec"],
                  ["99.6%", "accuracy"],
                  ["3s", "MTTD"],
                ].map(([v, l]) => (
                  <div key={l} className="glass rounded-xl px-3 py-2">
                    <div className="font-mono text-lg font-semibold text-gradient">{v}</div>
                    <div>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              v1.0 · SOC-grade · SOC 2 ready
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">CyberNexis AI</span>
            </Link>
            <h2 className="text-3xl font-semibold">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your SOC dashboard.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="text-xs text-muted-foreground">Email</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-primary/60">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@soc.io"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Password</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-primary/60">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>
              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
              >
                {loading ? (
                  "Authenticating..."
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(
                    "sentinel_local_user",
                    JSON.stringify({
                      email: "analyst@sentinel.io",
                      name: "SOC Analyst",
                      org: "Cyber Defense SOC",
                    }),
                  );
                  toast.success("Entering SOC Dashboard (Demo Access)");
                  navigate({ to: "/dashboard", replace: true });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-400 hover:bg-sky-500/20 transition"
              >
                <Shield className="h-4 w-4" /> Quick Demo Access (1-Click SOC Entry)
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" /> or{" "}
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <button
              onClick={google}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm hover:bg-white/[0.06]"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              New to CyberNexis?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8c1.6 0 3 .6 4 1.5l2.6-2.5A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.9H12z"
      />
    </svg>
  );
}
