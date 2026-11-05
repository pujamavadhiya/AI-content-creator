import json
import re
import math
import random
import hashlib
import logging
from typing import Optional, List, Dict, Any
from anthropic import AsyncAnthropic
from app.ai.providers.base import BaseAIProvider
from app.config import settings

logger = logging.getLogger(__name__)

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
        # Look for markdown code fence ```json ... ``` or ``` ... ```
        m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if m:
            cleaned = m.group(1).strip()
        try:
            return json.loads(cleaned)
        except Exception:
            # Fallback search checking whether array or object appears first
            first_brace = cleaned.find("{")
            first_bracket = cleaned.find("[")
            if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
                last_bracket = cleaned.rfind("]")
                if last_bracket > first_bracket:
                    try:
                        return json.loads(cleaned[first_bracket:last_bracket + 1])
                    except Exception:
                        pass
            elif first_brace != -1:
                last_brace = cleaned.rfind("}")
                if last_brace > first_brace:
                    try:
                        return json.loads(cleaned[first_brace:last_brace + 1])
                    except Exception:
                        pass
            raise

    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_instruction: Optional[str] = None
    ) -> str:
        self._ensure_configured()
        clamped_temp = max(0.0, min(1.0, float(temperature)))
        clamped_tokens = max(1, min(8192, int(max_tokens)))

        kwargs: Dict[str, Any] = {
            "model": self.model_name,
            "max_tokens": clamped_tokens,
            "temperature": clamped_temp,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_instruction and system_instruction.strip():
            kwargs["system"] = system_instruction.strip()

        response = await self.client.messages.create(**kwargs)
        return response.content[0].text

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        self._ensure_configured()
        clamped_temp = max(0.0, min(1.0, float(temperature)))
        sys = (system_instruction or "").strip()
        if sys:
            sys += "\n"
        sys += "Output strictly valid JSON with no conversational framing or markdown wrappers outside the json structure."

        kwargs: Dict[str, Any] = {
            "model": self.model_name,
            "max_tokens": 4096,
            "temperature": clamped_temp,
            "system": sys,
            "messages": [{"role": "user", "content": prompt}],
        }

        response = await self.client.messages.create(**kwargs)
        text = response.content[0].text
        return self._extract_json(text)

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Anthropic Claude does not provide a native text embeddings endpoint.
        Gracefully fall back to Gemini or OpenAI embedding models if keys are configured,
        or generate a deterministic normalized pseudo-embedding vector (768 dimensions)
        so reference indexing, retrieval, and similarity operations never crash.
        """
        # Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                from app.ai.providers.gemini_provider import GeminiProvider
                gemini = GeminiProvider(api_key=settings.GEMINI_API_KEY)
                return await gemini.generate_embedding(text)
            except Exception as e:
                logger.warning(f"Claude embedding fallback to Gemini failed: {e}")

        # Try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                from app.ai.providers.openai_provider import OpenAIProvider
                openai_prov = OpenAIProvider(api_key=settings.OPENAI_API_KEY)
                return await openai_prov.generate_embedding(text)
            except Exception as e:
                logger.warning(f"Claude embedding fallback to OpenAI failed: {e}")

        # Deterministic normalized embedding fallback (dimension 768)
        h = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(h[:4], "big")
        rng = random.Random(seed)
        vec = [rng.gauss(0.0, 1.0) for _ in range(768)]
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

    async def test_connection(self) -> Dict[str, Any]:
        self._ensure_configured()
        response = await self.client.messages.create(
            model=self.model_name,
            max_tokens=10,
            messages=[{"role": "user", "content": "Ping"}]
        )
        return {
            "provider": "claude",
            "success": True,
            "message": f"Successfully connected to Claude API ({self.model_name})",
            "model": self.model_name
        }
