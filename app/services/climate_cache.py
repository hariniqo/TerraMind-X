import logging
from typing import Any, Optional
from app.services.cache import LocalJSONCache

logger = logging.getLogger(__name__)

class ClimateCache:
    def __init__(self) -> None:
        self.cache = LocalJSONCache(filename=".climate_cache.json")

    @staticmethod
    def make_key(state: str, district: str, variable: str, scenario: str, model: str, year: str) -> str:
        """
        Creates a key with structure climate:{state}:{district}:{variable}:{scenario}:{model}:{year}
        """
        # Normalize keys (lowercasing and stripping whitespace)
        s = state.strip().lower().replace(" ", "_")
        d = district.strip().lower().replace(" ", "_")
        v = variable.strip().lower()
        sc = scenario.strip().lower()
        m = model.strip().lower()
        y = str(year).strip()
        return f"climate:{s}:{d}:{v}:{sc}:{m}:{y}"

    def get_projection(self, state: str, district: str, variable: str, scenario: str, model: str, year: str) -> Optional[Any]:
        key = self.make_key(state, district, variable, scenario, model, year)
        val = self.cache.get(key)
        if val is not None:
            logger.debug(f"ClimateCache HIT: {key}")
        return val

    def set_projection(self, state: str, district: str, variable: str, scenario: str, model: str, year: str, data: Any) -> None:
        key = self.make_key(state, district, variable, scenario, model, year)
        logger.debug(f"ClimateCache SET: {key}")
        self.cache.set(key, data)
