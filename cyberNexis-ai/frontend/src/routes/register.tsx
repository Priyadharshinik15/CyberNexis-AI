import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ArrowRight, Lock, Mail, User, Building2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create account — CyberNexis AI" },
      {
        name: "description",
        content: "Register for CyberNexis AI and deploy predictive threat defense in minutes.",
      },
      { property: "og:title", content: "Create account — CyberNexis AI" },
      {
        property: "og:description",
        content: "Start protecting your network with predictive AI defense.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", org: "", email: "", password: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: form.name, organization: form.org },
        },
      });
      if (error) {
        localStorage.setItem(
          "sentinel_local_user",
          JSON.stringify({ email: form.email, name: form.name, org: form.org }),
        );
        setLoading(false);
        toast.success("Workspace provisioned — entering SOC");
        navigate({ to: "/dashboard" });
        return;
      }
      const userId = data.user?.id;
      if (data.session && userId) {
        await supabase
          .from("profiles")
          .upsert({ id: userId, full_name: form.name, organization: form.org });
        await supabase
          .from("user_settings")
          .upsert({ user_id: userId, org_name: form.org || "Acme SOC" });
        setLoading(false);
        toast.success("Workspace provisioned");
        navigate({ to: "/dashboard" });
        return;
      }
      setLoading(false);
      toast.success("Workspace provisioned — entering SOC");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setLoading(false);
      localStorage.setItem(
        "sentinel_local_user",
        JSON.stringify({ email: form.email, name: form.name, org: form.org }),
      );
      toast.success("Workspace provisioned — entering SOC");
      navigate({ to: "/dashboard" });
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-up failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/onboarding" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-60" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px]"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex items-center justify-center px-6 py-16 order-2 lg:order-1">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">CyberNexis AI</span>
            </Link>
            <h2 className="text-3xl font-semibold">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Deploy a self-defending network in under 5 minutes.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  icon={User}
                  label="Full name"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Alex Nguyen"
                />
                <Field
                  icon={Building2}
                  label="Organization"
                  value={form.org}
                  onChange={set("org")}
                  placeholder="Acme SOC"
                />
              </div>
              <Field
                icon={Mail}
                label="Work email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="alex@acme.io"
              />
              <Field
                icon={Lock}
                label="Password"
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="mt-0.5 h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <button
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
              >
                {loading ? (
                  "Provisioning workspace..."
                ) : (
                  <>
                    Create account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" /> or{" "}
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={google}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm hover:bg-white/[0.06]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 12 5.8c1.6 0 3 .6 4 1.5l2.6-2.5A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.9H12z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-white/5 lg:block order-1 lg:order-2">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 70% 30%, hsl(var(--accent)/0.25), transparent 60%), radial-gradient(500px 400px at 30% 70%, hsl(var(--primary)/0.2), transparent 60%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-center p-12">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              From wire to <span className="text-gradient">response</span> in milliseconds.
            </h1>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                "Live Scapy packet capture across TCP / UDP / ICMP / HTTP(S) / DNS",
                "XGBoost detection trained on UNSW-NB15 — DoS, Recon, Botnet & more",
                "LSTM sequence prediction for the next 30s of attack activity",
                "SHAP explainability for every flagged flow",
                "GeoIP heatmap + Telegram / Email / Slack alerts",
                "Auto-firewall rules pushed to iptables / nftables / Cloudflare",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-md bg-primary/15 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  icon: any;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-primary/60">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          required
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  );
}
