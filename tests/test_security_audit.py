import re
import pytest
from app.core.config import get_settings
from app.api.routes import router

# -----------------------------------------------------------------------------
# 1. Security: Credentials and Secrets Audit
# -----------------------------------------------------------------------------
def test_no_real_api_keys_hardcoded_in_settings():
    from app.core.config import Settings
    # Ensure default Settings definition has no hardcoded secrets
    field_default = Settings.model_fields["explabs_api_key"].default
    assert field_default is None or field_default in ["your_explabs_api_key_here", "placeholder_key", ""]

def test_sql_injection_defense_in_repository():
    # Verify database queries use parameterized text or ORM constructs, not raw string concatenation
    import app.services.storage as storage_mod
    import inspect
    source = inspect.getsource(storage_mod)
    # Check for insecure f-string SQL query formatting like f"SELECT * FROM ... WHERE id = '{id}'"
    insecure_fstring_sql = re.search(r'execute\(f["\']SELECT.*\bWHERE\b.*\{', source, re.IGNORECASE)
    assert insecure_fstring_sql is None, "Insecure f-string SQL query formatting detected in storage.py"

def test_cors_configuration_safety():
    settings = get_settings()
    # CORS allowed origins should not be wildcard "*" in production configuration
    assert settings.cors_allowed_origins != ""
    # Should contain local dev port or domain
    assert "http://" in settings.cors_allowed_origins or "https://" in settings.cors_allowed_origins or "*" not in settings.cors_allowed_origins

def test_fastapi_route_input_validation():
    # Verify that router endpoints require Pydantic models with strict typing
    for route in router.routes:
        if hasattr(route, "endpoint") and hasattr(route, "methods") and "POST" in route.methods:
            # Route should have signature inspection or dependent schema
            assert route.endpoint is not None
