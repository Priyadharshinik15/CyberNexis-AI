import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Bell,
  ShieldCheck,
  KeyRound,
  Palette,
  User,
  Save,
  Copy,
  RefreshCw,
  Loader2,
  Ban,
  Send,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({ component: Settings });

const TABS = [
  { id: "general", label: "General", icon: User },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "firewall", label: "Firewall", icon: ShieldCheck },
  { id: "api", label: "API keys", icon: KeyRound },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const { user } = useAuth();
  const { profile, settings, loading, updateProfile, updateSettings } = useProfile(user?.id);

  // General tab state
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);

  // Sync local state when settings/profile load
  useEffect(() => {
    if (settings) {
      setOrgName(settings.org_name ?? "");
      setTimezone(settings.timezone ?? "UTC");
    }
    if (profile) {
      setFullName(profile.full_name ?? "");
    }
  }, [settings, profile]);

  const saveGeneral = async () => {
    setSaving(true);
    const [p, s] = await Promise.all([
      updateProfile?.({ full_name: fullName, organization: orgName }),
      updateSettings?.({ org_name: orgName, timezone }),
    ]);
    setSaving(false);
    if (p?.error || s?.error) toast.error("Failed to save settings");
    else toast.success("Settings saved");
  };

  if (loading) {
    return (
      <DashboardShell title="Settings">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading settings…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Settings">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="glass rounded-2xl p-6">
          {/* ── General ── */}
          {tab === "general" && (
            <div className="space-y-5">
              <Field label="Full name">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="Organization">
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="Email">
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed"
                />
              </Field>
              <Field label="Time zone">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-primary/60"
                >
                  {[
                    "UTC",
                    "US/Eastern",
                    "US/Pacific",
                    "Europe/London",
                    "Europe/Berlin",
                    "Asia/Kolkata",
                    "Asia/Tokyo",
                    "Australia/Sydney",
                  ].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Data retention">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-muted-foreground">
                  90 days
                </div>
              </Field>
              <button
                onClick={saveGeneral}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </button>
            </div>
          )}

          {/* ── Alerts ── */}
          {tab === "alerts" && settings && (
            <AlertsTab
              emailAlerts={settings.email_alerts}
              smsAlerts={settings.sms_alerts}
              onUpdate={updateSettings!}
            />
          )}

          {/* ── Firewall ── */}
          {tab === "firewall" && settings && (
            <FirewallTab autoFirewall={settings.auto_firewall} onUpdate={updateSettings!} />
          )}

          {/* ── API keys ── */}
          {tab === "api" && <ApiKeysTab userId={user?.id} />}

          {/* ── Appearance ── */}
          {tab === "appearance" && <AppearanceTab />}
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Sub-tabs ── */

function AlertsTab({
  emailAlerts,
  smsAlerts,
  onUpdate,
}: {
  emailAlerts: boolean;
  smsAlerts: boolean;
  onUpdate: (u: {
    email_alerts?: boolean;
    sms_alerts?: boolean;
  }) => Promise<{ data: any; error: any } | undefined>;
}) {
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const [emailEnabled, setEmailEnabled] = useState(emailAlerts);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [smtpServer, setSmtpServer] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  const [sms, setSms] = useState(smsAlerts);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [pagerEnabled, setPagerEnabled] = useState(true);
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/alerts/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.telegram) {
            setTelegramEnabled(data.telegram.enabled ?? true);
            setChatId(data.telegram.chat_id ?? "");
            setBotToken(data.telegram.bot_token ?? "");
          }
          if (data.email) {
            setEmailEnabled(data.email.enabled ?? emailAlerts);
            setSmtpServer(data.email.smtp_server ?? "smtp.gmail.com");
            setSmtpPort(data.email.smtp_port ?? 587);
            setSmtpUser(data.email.smtp_user ?? "");
            if (data.email.to_emails?.length > 0) {
              setRecipientEmail(data.email.to_emails[0]);
            }
          }
        }
      })
      .catch(() => {});
  }, [emailAlerts]);

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      toast.error("Please enter both Bot Token and Chat ID to test Telegram.");
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await fetch("http://localhost:8000/api/alerts/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Telegram test alert sent successfully! Check your chat.");
      } else {
        toast.error(`Telegram test failed: ${data.detail || data.message || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Could not connect to backend API: ${err.message}`);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email address to test Email alerts.");
      return;
    }
    setTestingEmail(true);
    try {
      const res = await fetch("http://localhost:8000/api/alerts/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: recipientEmail,
          smtp_server: smtpServer,
          smtp_port: Number(smtpPort),
          smtp_user: smtpUser,
          smtp_password: smtpPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Test email sent to ${recipientEmail}! Check your inbox.`);
      } else {
        toast.error(`Email test failed: ${data.detail || data.message || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Could not connect to backend API: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:8000/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram: {
            enabled: telegramEnabled,
            bot_token: botToken,
            chat_id: chatId,
          },
          email: {
            enabled: emailEnabled,
            smtp_server: smtpServer,
            smtp_port: Number(smtpPort),
            smtp_user: smtpUser,
            smtp_password: smtpPassword,
            to_emails: recipientEmail ? [recipientEmail] : [],
          },
        }),
      });
    } catch {
      /* ignore alert sync error */
    }

    const result = await onUpdate({ email_alerts: emailEnabled, sms_alerts: sms });
    setSaving(false);
    if (result?.error) toast.error("Failed to save alert settings");
    else toast.success("Telegram & Email alert settings saved successfully");
  };

  return (
    <div className="space-y-6">
      {/* ── Telegram Bot Alerts ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-400" />
            <div>
              <div className="font-medium text-sm">Telegram Bot Alerts</div>
              <div className="text-xs text-muted-foreground">
                Receive real-time threat notifications in your Telegram channel or chat.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTelegramEnabled(!telegramEnabled)}
            className={`relative h-6 w-11 rounded-full transition ${telegramEnabled ? "bg-primary" : "bg-white/10"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${telegramEnabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>

        {telegramEnabled && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <Field label="Telegram Bot Token">
              <input
                type="text"
                placeholder="e.g. 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </Field>
            <Field label="Telegram Chat ID">
              <input
                type="text"
                placeholder="e.g. 987654321 or -100123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </Field>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                Tip: Get a token from @BotFather, and get your chat ID from @userinfobot.
              </span>
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition disabled:opacity-50"
              >
                {testingTelegram ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Test Alert
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Email (SMTP) Alerts ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-400" />
            <div>
              <div className="font-medium text-sm">Email (SMTP) Security Alerts</div>
              <div className="text-xs text-muted-foreground">
                Send formatted HTML threat reports directly to your SOC team email.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled(!emailEnabled)}
            className={`relative h-6 w-11 rounded-full transition ${emailEnabled ? "bg-primary" : "bg-white/10"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${emailEnabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>

        {emailEnabled && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <Field label="Recipient Email Address">
              <input
                type="email"
                placeholder="e.g. security-alerts@yourcompany.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="SMTP Server Host">
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="SMTP Port">
                <input
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="SMTP Username / Email">
                <input
                  type="text"
                  placeholder="your-email@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </Field>
              <Field label="SMTP Password / App Password">
                <input
                  type="password"
                  placeholder="App Password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                Tip: For Gmail, use an App Password generated under Google Account Security.
              </span>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition disabled:opacity-50"
              >
                {testingEmail ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Test Email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Other Integrations ── */}
      <div className="space-y-3">
        <Toggle label="Slack #soc-alerts" active={slackEnabled} onChange={setSlackEnabled} />
        <Toggle label="PagerDuty on critical" active={pagerEnabled} onChange={setPagerEnabled} />
        <Toggle
          label="Webhook (SIEM / Syslog)"
          active={webhookEnabled}
          onChange={setWebhookEnabled}
        />
        <Toggle label="SMS alerts" active={sms} onChange={setSms} />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 transition"
        style={{ background: "var(--gradient-primary)" }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Alert Settings
      </button>
    </div>
  );
}

function FirewallTab({
  autoFirewall,
  onUpdate,
}: {
  autoFirewall: boolean;
  onUpdate: (u: { auto_firewall?: boolean }) => Promise<{ data: any; error: any } | undefined>;
}) {
  const [auto, setAuto] = useState(autoFirewall);
  const [cloudflare, setCloudflare] = useState(true);
  const [iptables, setIptables] = useState(true);
  const [quarantine, setQuarantine] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blockedList, setBlockedList] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/firewall")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.blocked_ips) setBlockedList(data.blocked_ips);
      })
      .catch(() => {});
  }, []);

  const unblockIp = async (ip: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/firewall/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        toast.success(`Unblocked ${ip}`);
        setBlockedList((prev) => prev.filter((item) => item !== ip));
      } else {
        toast.error("Failed to unblock IP");
      }
    } catch {
      toast.error("Backend error unblocking IP");
    }
  };

  const save = async () => {
    setSaving(true);
    const result = await onUpdate({ auto_firewall: auto });

    // Also notify active backend sniffer
    fetch("http://localhost:8000/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_firewall: auto }),
    }).catch(() => {});

    setSaving(false);
    if (result?.error) toast.error("Failed to save firewall settings");
    else toast.success("Firewall settings saved and synchronized");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Toggle label="Auto-block malicious IPs" active={auto} onChange={setAuto} />
        <Toggle label="Push rules to Cloudflare" active={cloudflare} onChange={setCloudflare} />
        <Toggle label="iptables integration" active={iptables} onChange={setIptables} />
        <Toggle label="Quarantine unknown ports" active={quarantine} onChange={setQuarantine} />
        <button
          onClick={save}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      <div className="border-t border-white/5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Active Blocked IPs ({blockedList.length})</div>
          <span className="text-xs text-muted-foreground">Automated edge firewall</span>
        </div>
        {blockedList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No IPs are currently blocked.</p>
        ) : (
          <div className="space-y-2">
            {blockedList.map((ip) => (
              <div
                key={ip}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
              >
                <span className="font-mono text-danger flex items-center gap-2">
                  <Ban className="h-3.5 w-3.5" />
                  {ip}
                </span>
                <button
                  onClick={() => unblockIp(ip)}
                  className="rounded px-2 py-1 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApiKeysTab({ userId }: { userId?: string }) {
  const [keys, setKeys] = useState([
    { id: "1", label: "cnx_live_9f2a…be21", created: "2026-01-15" },
    { id: "2", label: "cnx_test_11cc…7788", created: "2026-03-02" },
  ]);
  const [generating, setGenerating] = useState(false);

  const generateKey = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    const newKey = `cnx_live_${Math.random().toString(36).slice(2, 6)}…${Math.random().toString(36).slice(2, 6)}`;
    setKeys((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newKey, created: new Date().toISOString().slice(0, 10) },
    ]);
    setGenerating(false);
    toast.success("New API key generated");
  };

  const revokeKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Provision-scoped API keys for integrations.
      </div>
      {keys.map((k) => (
        <div
          key={k.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
        >
          <div className="flex-1">
            <div className="font-mono text-xs">{k.label}</div>
            <div className="text-[10px] text-muted-foreground">Created {k.created}</div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(k.label);
              toast.success("Copied");
            }}
            className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
          <button
            onClick={() => revokeKey(k.id)}
            className="rounded-md bg-danger/15 px-2 py-1 text-xs text-danger hover:bg-danger/25"
          >
            Revoke
          </button>
        </div>
      ))}
      <button
        onClick={generateKey}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        style={{ background: "var(--gradient-primary)" }}
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Generate new key
      </button>
    </div>
  );
}

function AppearanceTab() {
  const [darkMode, setDarkMode] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compact, setCompact] = useState(false);
  const [experimental, setExperimental] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    toast.success("Appearance settings saved");
  };

  return (
    <div className="space-y-4">
      <Toggle label="Dark mode" active={darkMode} onChange={setDarkMode} />
      <Toggle label="Reduced motion" active={reducedMotion} onChange={setReducedMotion} />
      <Toggle label="Compact tables" active={compact} onChange={setCompact} />
      <Toggle label="Show experimental widgets" active={experimental} onChange={setExperimental} />
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        style={{ background: "var(--gradient-primary)" }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
    </div>
  );
}

/* ── Helpers ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-primary" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${active ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}
