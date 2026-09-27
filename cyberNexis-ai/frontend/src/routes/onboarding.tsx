import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ArrowRight, Check, Network, Bell, Brain, Rocket, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Setup — CyberNexis AI" },
      {
        name: "description",
        content: "Connect your network, configure alerts and select AI models.",
      },
      { property: "og:title", content: "Setup — CyberNexis AI" },
      { property: "og:description", content: "Onboard your SOC in four steps." },
    ],
  }),
  component: Onboarding,
});

const STEPS = [
  {
    icon: Network,
    title: "Connect network",
    desc: "Point CyberNexis at your traffic mirror or install the passive sniffer.",
  },
  {
    icon: Bell,
    title: "Configure alerts",
    desc: "Pick channels — Telegram, Email, Slack, Webhook — and severity thresholds.",
  },
  {
    icon: Brain,
    title: "Select AI models",
    desc: "Enable XGBoost detection, LSTM prediction and SHAP explainability.",
  },
  { icon: Rocket, title: "Finish", desc: "Deploy the Docker stack and start defending." },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Step selections
  const [network, setNetwork] = useState("mirror");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [modelXgboost, setModelXgboost] = useState(true);
  const [modelLstm, setModelLstm] = useState(true);
  const [modelShap, setModelShap] = useState(true);
  const [modelIsolation, setModelIsolation] = useState(false);

  const Icon = STEPS[step].icon;

  const finish = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const userId = session.user.id;
        await supabase.from("user_settings").upsert({
          user_id: userId,
          email_alerts: emailAlerts,
          sms_alerts: smsAlerts,
          auto_firewall: true,
          onboarding_complete: true,
          models: {
            xgboost: modelXgboost,
            lstm: modelLstm,
            shap: modelShap,
            isolation_forest: modelIsolation,
          },
          updated_at: new Date().toISOString(),
        });
        toast.success("Workspace configured — welcome to your SOC!");
      }
    } catch (err) {
      toast.error("Failed to save onboarding preferences");
    } finally {
      setSaving(false);
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-60" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px]"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
          </div>
          <span className="font-semibold">CyberNexis AI</span>
        </Link>

        {/* Progress */}
        <div className="mt-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-1 items-center gap-2">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-mono ${i <= step ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground"}`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass mt-10 flex-1 rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </div>
              <h1 className="text-2xl font-semibold">{STEPS[step].title}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>

          <div className="mt-8 grid gap-3">
            {step === 0 && (
              <>
                <OptRow
                  label="Mirror port (SPAN)"
                  active={network === "mirror"}
                  onChange={() => setNetwork("mirror")}
                />
                <OptRow
                  label="Cloud VPC flow logs"
                  active={network === "vpc"}
                  onChange={() => setNetwork("vpc")}
                />
                <OptRow
                  label="Local host — Scapy sniffer"
                  active={network === "scapy"}
                  onChange={() => setNetwork("scapy")}
                />
              </>
            )}
            {step === 1 && (
              <>
                <OptRow label="Telegram bot" active={telegramAlerts} onChange={setTelegramAlerts} />
                <OptRow
                  label="Email digest — daily"
                  active={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <OptRow label="Slack #soc-alerts" active={slackAlerts} onChange={setSlackAlerts} />
                <OptRow label="SMS alerts" active={smsAlerts} onChange={setSmsAlerts} />
              </>
            )}
            {step === 2 && (
              <>
                <OptRow
                  label="XGBoost — attack classification"
                  active={modelXgboost}
                  onChange={setModelXgboost}
                />
                <OptRow
                  label="LSTM — 30s threat forecast"
                  active={modelLstm}
                  onChange={setModelLstm}
                />
                <OptRow label="SHAP — explainable AI" active={modelShap} onChange={setModelShap} />
                <OptRow
                  label="Isolation Forest — anomaly baseline"
                  active={modelIsolation}
                  onChange={setModelIsolation}
                />
              </>
            )}
            {step === 3 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-primary">
                <div className="text-muted-foreground">$ docker compose up -d</div>
                <div className="mt-2">✓ sniffer &nbsp;&nbsp;&nbsp;&nbsp; running</div>
                <div>✓ model-server &nbsp; healthy</div>
                <div>✓ dashboard &nbsp;&nbsp;&nbsp; ready on :8443</div>
                <div>✓ postgres &nbsp;&nbsp;&nbsp;&nbsp; 3 migrations applied</div>
                <div className="mt-2 text-success">All systems armed.</div>
                <div className="mt-4 text-[10px] text-muted-foreground">
                  Network:{" "}
                  {network === "mirror"
                    ? "Mirror port (SPAN)"
                    : network === "vpc"
                      ? "Cloud VPC"
                      : "Scapy sniffer"}{" "}
                  · Alerts:{" "}
                  {[
                    telegramAlerts && "Telegram",
                    emailAlerts && "Email",
                    slackAlerts && "Slack",
                    smsAlerts && "SMS",
                  ]
                    .filter(Boolean)
                    .join(", ") || "none"}{" "}
                  · Models:{" "}
                  {[
                    modelXgboost && "XGBoost",
                    modelLstm && "LSTM",
                    modelShap && "SHAP",
                    modelIsolation && "IsoForest",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm hover:bg-white/[0.06] disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={() => (step < STEPS.length - 1 ? setStep((s) => s + 1) : finish())}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : step < STEPS.length - 1 ? (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Enter dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function OptRow({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${active ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
    >
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={active}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[hsl(var(--primary))]"
      />
    </label>
  );
}
