import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type UserSettings = Tables<"user_settings">;

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_settings").select("*").eq("user_id", userId).single(),
      ]);
      if (!cancelled) {
        setProfile(p ?? null);
        setSettings(s ?? null);
        setLoading(false);
      }
    };

    fetchAll();

    const uniqueId = Math.random().toString(36).substring(2, 9);

    // Real-time profile updates
    const profileSub = supabase
      .channel(`profile:${userId}:${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setProfile(null);
          else setProfile(payload.new as Profile);
        },
      )
      .subscribe();

    // Real-time settings updates
    const settingsSub = supabase
      .channel(`settings:${userId}:${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_settings", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setSettings(null);
          else setSettings(payload.new as UserSettings);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(profileSub);
      supabase.removeChannel(settingsSub);
    };
  }, [userId]);

  const updateProfile = async (updates: Partial<Pick<Profile, "full_name" | "organization">>) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  const updateSettings = async (
    updates: Partial<Omit<UserSettings, "user_id" | "created_at" | "updated_at">>,
  ) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();
    if (!error && data) setSettings(data);
    return { data, error };
  };

  return { profile, settings, loading, updateProfile, updateSettings };
}
