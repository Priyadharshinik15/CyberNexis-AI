-- Enable Supabase Realtime for all tables used in the dashboard

ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;

-- Performance index for alerts real-time filtering
CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON public.alerts (user_id);
CREATE INDEX IF NOT EXISTS alerts_acknowledged_idx ON public.alerts (acknowledged) WHERE acknowledged = false;
