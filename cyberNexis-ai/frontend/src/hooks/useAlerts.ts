import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Alert = Tables<"alerts">;

export function useAlerts(userId: string | undefined, limit = 60) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Initial fetch — most recent first
    supabase
      .from("alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (!cancelled) {
          setAlerts(data ?? []);
          setLoading(false);
        }
      });

    const uniqueId = Math.random().toString(36).substring(2, 9);

    // Real-time subscription — INSERT, UPDATE, DELETE
    const channel = supabase
      .channel(`alerts:${userId}:${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev].slice(0, limit));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === (payload.new as Alert).id ? (payload.new as Alert) : a)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
        (payload) => {
          setAlerts((prev) => prev.filter((a) => a.id !== (payload.old as Alert).id));
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId, limit]);

  const acknowledge = async (alertId: string) => {
    const { error } = await supabase
      .from("alerts")
      .update({ acknowledged: true })
      .eq("id", alertId);
    if (!error) {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    }
    return { error };
  };

  const acknowledgeAll = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("alerts")
      .update({ acknowledged: true })
      .eq("user_id", userId)
      .eq("acknowledged", false);
    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    }
    return { error };
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase.from("alerts").delete().eq("id", alertId);
    if (!error) setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    return { error };
  };

  return { alerts, loading, acknowledge, acknowledgeAll, deleteAlert };
}
