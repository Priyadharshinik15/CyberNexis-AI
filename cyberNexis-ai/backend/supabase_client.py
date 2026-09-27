"""
supabase_client.py
Provides two Supabase clients:
  - supabase_admin  — service-role key, bypasses RLS (server-side inserts)
  - get_user_client — per-request client scoped to a user JWT
"""
import config
try:
    from supabase import create_client, Client
except Exception as e:
    create_client = None
    Client = None
    print(f"[Supabase] Notice: Supabase library not available or version mismatch ({e}). Running in standalone mode.")

# ── Admin client (service role) ───────────────────────────────────────────────
# Used for server-side writes (inserting alerts, seeding rows, etc.)
# Falls back to publishable key if service role key is not configured.

def _make_admin_client():
    if not create_client:
        return None
    key = config.SUPABASE_SERVICE_ROLE_KEY or config.SUPABASE_PUBLISHABLE_KEY
    if not config.SUPABASE_URL or not key:
        return None
    return create_client(config.SUPABASE_URL, key)

try:
    supabase_admin = _make_admin_client()
    if supabase_admin:
        print("[Supabase] Admin client initialised.")
    else:
        print("[Supabase] Standalone mode (delegated frontend inserts active).")
except Exception as e:
    supabase_admin = None  # type: ignore
    print(f"[Supabase] WARNING - could not create admin client: {e}")


# ── In-Memory Standalone Fallbacks ─────────────────────────────────────────────
_in_memory_profiles = {
    "00000000-0000-0000-0000-000000000001": {
        "id": "00000000-0000-0000-0000-000000000001",
        "full_name": "SOC Analyst",
        "organization": "Cyber Security SOC",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
}

_in_memory_settings = {
    "00000000-0000-0000-0000-000000000001": {
        "id": "1",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "onboarding_complete": True,
        "org_name": "Cyber Security SOC",
        "timezone": "UTC",
        "sensitivity": 80,
        "email_alerts": True,
        "sms_alerts": False,
        "auto_firewall": True,
    }
}

_in_memory_alerts = []


def get_user_client(jwt: str):
    """Return a Supabase client that forwards the user's JWT, respecting RLS."""
    if not create_client:
        return None
    client = create_client(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY)
    # Override the auth header so Supabase uses the user's JWT for RLS
    client.postgrest.auth(jwt)
    return client


def verify_jwt(token: str) -> dict | None:
    """
    Verify a Supabase JWT and return the user dict, or None if invalid.
    Supports offline/standalone fallback mode for demo and airgapped environments.
    """
    if not token:
        return None

    # Offline / local token fallback matching frontend client.ts
    if token.startswith("local-jwt-") or token.startswith("dev-") or token == "standalone":
        return {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "analyst@sentinel.io",
            "user_metadata": {
                "full_name": "SOC Analyst",
                "organization": "Cyber Security SOC",
            },
        }

    if not supabase_admin:
        return {
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "analyst@sentinel.io",
            "user_metadata": {
                "full_name": "SOC Analyst",
                "organization": "Cyber Security SOC",
            },
        }

    try:
        resp = supabase_admin.auth.get_user(token)
        if resp and resp.user:
            return {
                "id": resp.user.id,
                "email": resp.user.email,
                "user_metadata": resp.user.user_metadata or {},
            }
    except Exception as e:
        print(f"[Supabase] JWT verification failed: {e}")
        err_str = str(e).lower()
        if "connection" in err_str or "connect" in err_str or "refused" in err_str or "dns" in err_str:
            return {
                "id": "00000000-0000-0000-0000-000000000001",
                "email": "analyst@sentinel.io",
                "user_metadata": {
                    "full_name": "SOC Analyst",
                    "organization": "Cyber Security SOC",
                },
            }
    return None


def insert_alert(alert_payload: dict) -> dict | None:
    """
    Insert a single alert row into the public.alerts table using the admin client.
    Falls back to in-memory store if cloud Supabase is unreachable.
    """
    if supabase_admin:
        try:
            resp = supabase_admin.table("alerts").insert(alert_payload).execute()
            if resp.data:
                return resp.data[0]
        except Exception as e:
            print(f"[Supabase] insert_alert to cloud failed: {e}")

    # In-memory storage fallback
    saved = dict(alert_payload)
    if "id" not in saved:
        saved["id"] = f"alert-{len(_in_memory_alerts)+1}"
    if "created_at" not in saved:
        import datetime
        saved["created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _in_memory_alerts.insert(0, saved)
    if len(_in_memory_alerts) > 200:
        _in_memory_alerts.pop()
    return saved


def get_alerts(user_id: str, limit: int = 60) -> list:
    """Fetch the most recent alerts for a user."""
    if supabase_admin:
        try:
            resp = (
                supabase_admin.table("alerts")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            if resp.data is not None:
                return resp.data
        except Exception as e:
            print(f"[Supabase] get_alerts failed: {e}")

    return [a for a in _in_memory_alerts if a.get("user_id") == user_id][:limit]


def acknowledge_alert(alert_id: str, user_id: str) -> bool:
    """Set acknowledged=True for a specific alert."""
    if supabase_admin:
        try:
            supabase_admin.table("alerts").update({"acknowledged": True}).eq("id", alert_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            print(f"[Supabase] acknowledge_alert failed: {e}")

    for a in _in_memory_alerts:
        if a.get("id") == alert_id and a.get("user_id") == user_id:
            a["acknowledged"] = True
            return True
    return True


def get_profile(user_id: str) -> dict | None:
    if supabase_admin:
        try:
            resp = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
            if resp.data:
                return resp.data
        except Exception:
            pass

    return _in_memory_profiles.get(user_id, {
        "id": user_id,
        "full_name": "SOC Analyst",
        "organization": "Cyber Security SOC",
    })


def get_settings(user_id: str) -> dict | None:
    if supabase_admin:
        try:
            resp = supabase_admin.table("user_settings").select("*").eq("user_id", user_id).single().execute()
            if resp.data:
                return resp.data
        except Exception:
            pass

    return _in_memory_settings.get(user_id, {
        "id": "1",
        "user_id": user_id,
        "onboarding_complete": True,
        "org_name": "Cyber Security SOC",
        "auto_firewall": True,
    })


def upsert_settings(user_id: str, updates: dict) -> dict | None:
    if supabase_admin:
        try:
            payload = {"user_id": user_id, **updates}
            resp = supabase_admin.table("user_settings").upsert(payload).execute()
            if resp.data:
                return resp.data[0]
        except Exception as e:
            print(f"[Supabase] upsert_settings failed: {e}")

    current = _in_memory_settings.get(user_id, {"id": "1", "user_id": user_id})
    current.update(updates)
    _in_memory_settings[user_id] = current
    return current

