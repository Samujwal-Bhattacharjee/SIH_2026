"""
Supabase client initialization.
Uses the SERVICE ROLE KEY for backend operations (never exposed to frontend).
All direct database queries go through this client.
"""
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Singleton Supabase client using the service role key
# This key has full database access and is ONLY used server-side
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return the singleton Supabase admin client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,  # Backend uses service role
        )
        logger.info("Supabase admin client initialized")
    return _supabase_client


def get_supabase_anon() -> Client:
    """
    Return a Supabase client using the anon key.
    Used only for operations where we want Supabase RLS to apply.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
