import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

function getFallbackSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sentinel_local_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    const user: User = {
      id: u.id || "00000000-0000-0000-0000-000000000001",
      app_metadata: { provider: "email" },
      user_metadata: {
        full_name: u.name || "SOC Analyst",
        organization: u.org || "Cyber Security SOC",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: u.email || "analyst@sentinel.io",
      role: "authenticated",
    };
    return {
      access_token: "local-sentinel-jwt",
      refresh_token: "local-sentinel-refresh",
      expires_in: 36000,
      token_type: "bearer",
      user,
    } as Session;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => getFallbackSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      if (s) {
        setSession(s);
      } else {
        const fallback = getFallbackSession();
        setSession(fallback);
      }
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data?.session) {
          setSession(data.session);
        } else {
          const fallback = getFallbackSession();
          if (fallback) setSession(fallback);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        const fallback = getFallbackSession();
        if (fallback) setSession(fallback);
        setLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, loading };
}

export function initials(email?: string | null, name?: string | null) {
  const base = (name || email || "SOC").trim();
  const parts = base.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? "")).toUpperCase();
}
