import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)
REGISTRY_PATH = "data/registry.json"

class DataRegistry:
    def __init__(self) -> None:
        self.registry_data = self._load()

    def _load(self) -> List[Dict[str, Any]]:
        if os.path.exists(REGISTRY_PATH):
            try:
                with open(REGISTRY_PATH, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save(self) -> None:
        os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
        try:
            with open(REGISTRY_PATH, "w") as f:
                json.dump(self.registry_data, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save data registry: {str(e)}")

    def register_dataset(
        self,
        source: str,
        dataset: str,
        state: str,
        district: str,
        crop: str,
        start_date: str,
        end_date: str,
        record_count: int,
        data_status: str = "validated"
    ) -> None:
        """
        Appends or updates a data collection entry in the registry.
        """
        # Find if duplicate registration exists
        updated = False
        for entry in self.registry_data:
            if (
                entry.get("source") == source and
                entry.get("dataset") == dataset and
                entry.get("state") == state and
                entry.get("district") == district and
                entry.get("crop") == crop
            ):
                entry["start_date"] = start_date
                entry["end_date"] = end_date
                entry["record_count"] = record_count
                entry["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                entry["data_status"] = data_status
                updated = True
                break
                
        if not updated:
            self.registry_data.append({
                "source": source,
                "dataset": dataset,
                "state": state,
                "district": district,
                "crop": crop,
                "start_date": start_date,
                "end_date": end_date,
                "record_count": record_count,
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "data_status": data_status
            })
            
        self._save()

    def get_registered_entries(self) -> List[Dict[str, Any]]:
        return self.registry_data
