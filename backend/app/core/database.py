"""
Supabase client initialization.
Uses the SERVICE ROLE KEY for backend operations (never exposed to frontend).
All direct database queries go through this client.
"""
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Support modern Supabase key formats (sb_secret_*, sb_publishable_*) in supabase-py validator
try:
    import supabase._sync.client as _sync_client
    _orig_re_match = _sync_client.re.match

    def _modern_key_match(pattern, string, *args, **kwargs):
        if isinstance(string, str) and string.startswith(("sb_secret_", "sb_publishable_")):
            return True
        return _orig_re_match(pattern, string, *args, **kwargs)

    _sync_client.re.match = _modern_key_match
except Exception as _e:
    logger.debug(f"Could not patch supabase client key regex: {_e}")

# Singleton Supabase client using the service role key
# This key has full database access and is ONLY used server-side
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return the singleton Supabase admin client."""
    global _supabase_client
    if _supabase_client is None:
        key = settings.effective_secret_key
        if not key:
            logger.error("No valid Supabase key found in environment.")
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            key,
        )
        logger.info("Supabase client initialized with server credentials")
    return _supabase_client


def get_supabase_anon() -> Client:
    """
    Return a Supabase client using the publishable/anon key.
    Used only for operations where we want Supabase RLS to apply.
    """
    return create_client(settings.SUPABASE_URL, settings.effective_publishable_key)
