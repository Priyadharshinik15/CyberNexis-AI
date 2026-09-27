/**
 * Alert Simulator — inserts realistic alert records into Supabase
 * so that real-time subscriptions always have live data flowing.
 *
 * Call `startAlertSimulator(userId)` once after login.
 * Call the returned `stop()` to clean up.
 */
import { supabase } from "@/integrations/supabase/client";
import { ATTACK_TYPES, COUNTRIES, pick, randomIP, ri } from "./live-data";

const SEVERITIES = ["critical", "warning", "info"] as const;

function buildAlert(userId: string) {
  const country = pick(COUNTRIES);
  const sev = pick(SEVERITIES);
  const type = pick(ATTACK_TYPES);
  const ip = randomIP();
  const messages: Record<typeof sev, string[]> = {
    critical: [
      `${type} flood detected from ${country.name} — auto-firewall rule applied.`,
      `LSTM predicts follow-up ${type} within 60s. Blocking ${ip}.`,
      `High-confidence ${type} signature (${80 + ri(18)}%). Host quarantined.`,
    ],
    warning: [
      `Anomalous flow signature from ${ip} — model confidence ${70 + ri(20)}%.`,
      `Repeated SYN scan against port ${pick([22, 80, 443, 3389])} from ${country.name}.`,
      `Elevated packet rate from ${ip} — possible ${type} precursor.`,
    ],
    info: [
      `Routine ${type} probe blocked at perimeter.`,
      `New network asset discovered: ${ip} (${country.name}).`,
      `Policy audit triggered by ${type} pattern — no action required.`,
    ],
  };
  return {
    user_id: userId,
    severity: sev,
    attack_type: type,
    source_ip: ip,
    country: country.code,
    message: pick(messages[sev]),
    acknowledged: false,
  };
}

export function startAlertSimulator(userId: string, intervalMs = 4000) {
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      // Try to fetch real threat alerts from the Python backend
      const res = await fetch("http://localhost:8000/api/alerts/pending");
      if (res.ok) {
        const pendingAlerts = await res.json();
        if (pendingAlerts && pendingAlerts.length > 0) {
          const formatted = pendingAlerts.map((a: any) => ({
            ...a,
            user_id: userId,
          }));
          await supabase.from("alerts").insert(formatted);
        }
      } else {
        // Fallback to mock simulator if server returned non-200
        await supabase.from("alerts").insert(buildAlert(userId));
      }
    } catch {
      // Backend is offline, generate mock alert to keep dashboard interactive
      await supabase.from("alerts").insert(buildAlert(userId));
    }
    if (!stopped) {
      setTimeout(tick, intervalMs + ri(2000));
    }
  };

  // Seed 5 initial alerts immediately so the UI has data on first load
  const seed = async () => {
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count ?? 0) < 5) {
      const batch = Array.from({ length: 8 }, () => buildAlert(userId));
      await supabase.from("alerts").insert(batch);
    }
  };

  seed().then(() => setTimeout(tick, intervalMs));

  return {
    stop: () => {
      stopped = true;
    },
  };
}
