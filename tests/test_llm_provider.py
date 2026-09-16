import pytest
from unittest.mock import AsyncMock, patch
from app.services.llm_provider import LLMProvider
from app.core.config import get_settings

settings = get_settings()

@pytest.mark.anyio
async def test_llm_provider_nvidia_success():
    # Mock Nvidia NIM Service response
    with patch("app.services.llm_provider.NvidiaNIMService") as MockNvidiaService:
        mock_instance = MockNvidiaService.return_value
        mock_instance.generate_chat_completion = AsyncMock(return_value="Nvidia advice")
        
        provider = LLMProvider()
        settings.explabs_api_key = "some_valid_looking_key"
        
        res = await provider.generate_farmer_explanation(
            recommendation="Sow Chilli",
            evidence=["Soil ph 6.5"],
            risks=[],
            confidence=0.9,
            language="English"
        )
        assert res == "Nvidia advice"
        mock_instance.generate_chat_completion.assert_called_once()

@pytest.mark.anyio
async def test_llm_provider_groq_fallback():
    # Mock Nvidia NIM failure, Groq success
    with patch("app.services.llm_provider.NvidiaNIMService") as MockNvidiaService, \
         patch("app.services.llm_provider.GroqAIClient") as MockGroqClient:
         
        mock_nvidia = MockNvidiaService.return_value
        mock_nvidia.generate_chat_completion = AsyncMock(side_effect=Exception("Connection timed out"))
        
        mock_groq = MockGroqClient.return_value
        mock_groq.generate_chat_completion = AsyncMock(return_value="Groq advice")
        
        settings.explabs_api_key = "some_valid_looking_key"
        settings.groq_api_key = "groq_key"
        
        provider = LLMProvider()
        res = await provider.generate_farmer_explanation(
            recommendation="Sow Chilli",
            evidence=["Soil ph 6.5"],
            risks=[],
            confidence=0.9,
            language="English"
        )
        assert res == "Groq advice"
        mock_nvidia.generate_chat_completion.assert_called_once()
        mock_groq.generate_chat_completion.assert_called_once()

@pytest.mark.anyio
async def test_llm_provider_local_fallback_when_all_fail():
    with patch("app.services.llm_provider.NvidiaNIMService") as MockNvidiaService, \
         patch("app.services.llm_provider.GroqAIClient") as MockGroqClient:
         
        mock_nvidia = MockNvidiaService.return_value
        mock_nvidia.generate_chat_completion = AsyncMock(side_effect=Exception("Connection timed out"))
        
        mock_groq = MockGroqClient.return_value
        mock_groq.generate_chat_completion = AsyncMock(side_effect=Exception("Groq rate limit"))
        
        settings.explabs_api_key = "some_valid_looking_key"
        settings.groq_api_key = "groq_key"
        
        provider = LLMProvider()
        res = await provider.generate_farmer_explanation(
            recommendation="Sow Chilli",
            evidence=["Soil ph 6.5"],
            risks=["High market risk"],
            confidence=0.9,
            language="English"
        )
        assert "[Local Secure Fallback Activated: External AI providers are offline.]" in res
        assert "Advisory Directive: Sow Chilli" in res
        assert "90%" in res
        assert "High market risk" in res
