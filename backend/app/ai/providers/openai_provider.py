import json
import re
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.ai.providers.base import BaseAIProvider
from app.config import settings

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model_name = model_name or settings.OPENAI_MODEL or "gpt-4o"
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL or "text-embedding-3-small"
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    def _ensure_configured(self):
        if not self.api_key:
            raise ValueError(
                "OpenAI API key is not configured. Please set OPENAI_API_KEY in Settings or your .env file."
            )
        if not self.client:
            self.client = AsyncOpenAI(api_key=self.api_key)

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
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content or ""

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        self._ensure_configured()
        messages = []
        sys_prompt = (system_instruction or "") + "\nOutput strictly valid JSON only."
        messages.append({"role": "system", "content": sys_prompt.strip()})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content or "{}"
        return self._extract_json(text)

    async def generate_embedding(self, text: str) -> List[float]:
        self._ensure_configured()
        response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding

    async def test_connection(self) -> Dict[str, Any]:
        self._ensure_configured()
        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=5
        )
        return {
            "provider": "openai",
            "success": True,
            "message": f"Successfully connected to OpenAI ({self.model_name})",
            "model": self.model_name
        }

