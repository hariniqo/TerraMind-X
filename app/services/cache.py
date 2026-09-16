import os
import json
import time
from typing import Any, Optional
from app.core.config import get_settings

settings = get_settings()

class LocalJSONCache:
    def __init__(self, filename: str = ".cache.json") -> None:
        self.filename = filename
        # Safely fetch cache TTL (defaulting to 86400 seconds / 1 day)
        self.ttl = 86400
        if hasattr(settings, "cache_ttl_seconds"):
            self.ttl = int(settings.cache_ttl_seconds)
        elif os.getenv("CACHE_TTL_SECONDS"):
            self.ttl = int(os.getenv("CACHE_TTL_SECONDS"))
        self._load_cache()

    def _load_cache(self) -> None:
        if os.path.exists(self.filename):
            try:
                with open(self.filename, "r") as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {}
        else:
            self.data = {}

    def _save_cache(self) -> None:
        try:
            with open(self.filename, "w") as f:
                json.dump(self.data, f)
        except Exception:
            pass

    def get(self, key: str) -> Optional[Any]:
        if key in self.data:
            entry = self.data[key]
            if time.time() - entry["timestamp"] < self.ttl:
                return entry["value"]
            else:
                del self.data[key]
                self._save_cache()
        return None

    def set(self, key: str, value: Any) -> None:
        # Prevent caching of credentials/API keys
        key_lower = key.lower()
        if any(w in key_lower for w in ["key", "token", "auth", "bearer", "passwd", "secret"]):
            return
        self.data[key] = {
            "value": value,
            "timestamp": time.time()
        }
        self._save_cache()
