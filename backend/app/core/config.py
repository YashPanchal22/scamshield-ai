"""Server configuration. Secrets come from environment only — never commit real keys."""
import os
class Settings:
    app_name: str = "ScamShield AI"
    # Optional integrations. Empty = graceful fallback (rule-based only).
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
settings = Settings()
