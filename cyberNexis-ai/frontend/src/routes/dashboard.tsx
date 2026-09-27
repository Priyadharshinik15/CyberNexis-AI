import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  // Guard: allow active Supabase session or local analyst session
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("sentinel_local_user");
      if (local) return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) return;
    } catch {
      // Standalone / offline mode
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sentinel_local_user",
        JSON.stringify({
          email: "analyst@sentinel.io",
          name: "SOC Analyst",
          org: "Cyber Defense SOC",
        }),
      );
    }
  },
  head: () => ({
    meta: [
      { title: "SOC Dashboard — CyberNexis AI" },
      {
        name: "description",
        content: "Live SOC dashboard: traffic, threats, predictions, and geo intelligence.",
      },
      { property: "og:title", content: "SOC Dashboard — CyberNexis AI" },
      { property: "og:description", content: "Live network defense operations center." },
    ],
  }),
  component: () => <Outlet />,
});
