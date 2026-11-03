import json
import re
from typing import Optional, List, Dict, Any
from anthropic import AsyncAnthropic
from app.ai.providers.base import BaseAIProvider
from app.config import settings

class ClaudeProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model_name = model_name or settings.ANTHROPIC_MODEL or "claude-3-5-sonnet-20241022"
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None

    def _ensure_configured(self):
        if not self.api_key:
            raise ValueError(
                "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in Settings or your .env file."
            )
        if not self.client:
            self.client = AsyncAnthropic(api_key=self.api_key)

    def _extract_json(self, text: str) -> Any:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        return json.loads(cleaned.strip())

    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_instruction: Optional[str] = None
    ) -> str:
        self._ensure_configured()
        response = await self.client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_instruction or "",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        self._ensure_configured()
        sys = (system_instruction or "") + "\nOutput strictly valid JSON with no conversational framing."
        response = await self.client.messages.create(
            model=self.model_name,
            max_tokens=4096,
            temperature=temperature,
            system=sys.strip(),
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text
        return self._extract_json(text)

    async def generate_embedding(self, text: str) -> List[float]:
        # Claude does not provide a native embeddings endpoint; raise descriptive error
        raise NotImplementedError("Anthropic Claude does not support embeddings. Use Gemini or OpenAI embedding models.")

    async def test_connection(self) -> Dict[str, Any]:
        self._ensure_configured()
        response = await self.client.messages.create(
            model=self.model_name,
            max_tokens=5,
            messages=[{"role": "user", "content": "Ping"}]
        )
        return {
            "provider": "claude",
            "success": True,
            "message": f"Successfully connected to Claude API ({self.model_name})",
            "model": self.model_name
        }

