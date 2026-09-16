import httpx
from app.core.config import get_settings
from app.schemas.recommendation import FarmContext

settings = get_settings()


class GroqAIClient:
    def __init__(self) -> None:
        self.api_key = settings.groq_api_key
        self.base_url = str(settings.groq_api_url).rstrip("/")

    async def generate_chat_completion(self, system_message: str, user_prompt: str) -> str | None:
        """
        Generic Chat Completion for Groq API using standard openai endpoint and local outputs endpoint.
        """
        if not self.api_key or self.api_key == "invalid_key":
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # 1. Try standard OpenAI-compatible /v1/chat/completions endpoint (used by Groq API)
        async with httpx.AsyncClient(timeout=20) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.2,
                        "max_tokens": 1000
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception:
                pass

            # 2. Try custom outputs endpoint /v1/outputs if standard fails
            try:
                response = await client.post(
                    f"{self.base_url}/v1/outputs",
                    headers=headers,
                    json={
                        "model": "llama-3.3",
                        "input": f"System: {system_message}\nUser: {user_prompt}",
                        "max_output_tokens": 512,
                        "temperature": 0.2
                    }
                )
                if response.status_code == 200:
                    payload = response.json()
                    if "output" in payload and isinstance(payload["output"], list):
                        return " ".join(str(item.get("content", "")) for item in payload["output"])
                    return str(payload)
            except Exception:
                pass

        return None

    async def generate_tamil_explanation(self, context: FarmContext, final_decision: dict) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is required for Groq explanation service.")

        prompt = self._build_prompt(context, final_decision)
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/v1/outputs",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3",
                    "input": prompt,
                    "max_output_tokens": 256,
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            payload = response.json()
            return self._parse_response(payload)

    def _build_prompt(self, context: FarmContext, final_decision: dict) -> str:
        return (
            "Provide a concise Tamil explanation for the following farm decision. "
            "Context: "
            f"Farmer ID: {context.farmer_id}. Land size: {context.land_size_acres} acres. "
            f"Soil type: {context.soil_type}. Moisture: {context.moisture}. pH: {context.ph_level}. "
            f"Crop history: {', '.join(context.crop_history)}. "
            f"Rainfall last 30 days: {context.rainfall_last_30_days} mm. "
            f"Market destination: {context.market_destination}. Sustainability goals: {', '.join(context.sustainability_goals)}. "
            f"Final recommendation: {final_decision}."
        )

    def _parse_response(self, payload: dict) -> str:
        if "output" in payload and isinstance(payload["output"], list):
            return " ".join(str(item.get("content", "")) for item in payload["output"])
        return str(payload)
