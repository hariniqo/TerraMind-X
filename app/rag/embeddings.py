import logging
from typing import List
from app.core.config import get_settings
import httpx

logger = logging.getLogger(__name__)
settings = get_settings()

class EmbeddingGenerator:
    def __init__(self) -> None:
        self.api_key = settings.nvidia_api_key
        self.base_url = str(settings.nvidia_base_url).rstrip("/")
        self.model = "nvidia/embeddings-nv-embed-qa-4"

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Retrieves text embeddings from NVIDIA NIM Embeddings API.
        Falls back to a mock vector (e.g. 384 dimensions) if credentials are missing or call fails.
        """
        if self.api_key and self.api_key != "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":
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "input": texts,
                    "model": self.model,
                    "input_type": "query"
                }
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.post(
                        f"{self.base_url}/embeddings",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    return [item["embedding"] for item in data["data"]]
            except Exception as e:
                logger.error(f"NVIDIA NIM embeddings failed: {e}. Returning mock embeddings.")
        
        # 384-dimensional mock embeddings to prevent runtime errors in pipeline
        return [[0.0] * 384 for _ in texts]
