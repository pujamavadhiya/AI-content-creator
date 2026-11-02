import json
import re
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from app.ai.providers.base import BaseAIProvider
from app.config import settings

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-2.0-flash"
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL or "text-embedding-004"
        
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def _ensure_configured(self):
        if not self.api_key:
            raise ValueError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in Settings or your .env file."
            )

    def _extract_json(self, text: str) -> Any:
        cleaned = text.strip()
        # Strip ```json ... ``` code fence if present
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
        genai.configure(api_key=self.api_key)
        
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction
        )
        generation_config = genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        response = await model.generate_content_async(prompt, generation_config=generation_config)
        return response.text

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        self._ensure_configured()
        genai.configure(api_key=self.api_key)
        
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=temperature
            )
        )
        response = await model.generate_content_async(prompt)
        return self._extract_json(response.text)

    async def generate_embedding(self, text: str) -> List[float]:
        self._ensure_configured()
        genai.configure(api_key=self.api_key)
        result = genai.embed_content(
            model=f"models/{self.embedding_model}",
            content=text,
            task_type="retrieval_document"
        )
        return result["embedding"]

    async def test_connection(self) -> Dict[str, Any]:
        self._ensure_configured()
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel(self.model_name)
        response = await model.generate_content_async("Ping")
        return {
            "provider": "gemini",
            "success": True,
            "message": f"Successfully connected to Gemini API ({self.model_name})",
            "model": self.model_name
        }
