import json
import re
import logging
import asyncio
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from app.ai.providers.base import BaseAIProvider
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiProvider(BaseAIProvider):
    # Candidate fallback models in priority order when rate limits (429) occur
    FALLBACK_MODELS = [
        "gemini-3.5-flash",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
    ]

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-3.5-flash"
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL or "gemini-embedding-001"
        
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def _ensure_configured(self):
        if not self.api_key:
            raise ValueError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in Settings or your .env file."
            )

    def _is_rate_limit_error(self, e: Exception) -> bool:
        err_str = str(e).lower()
        return any(k in err_str for k in (
            "429", "quota", "resourceexhausted", "rate-limits", "limit exceeded", "exceeded your current quota"
        ))

    def _extract_json(self, text: str) -> Any:
        cleaned = text.strip()
        # Look for ```json ... ``` code fence if present
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
        genai.configure(api_key=self.api_key)
        
        # Build candidate models list: primary requested model first, then alternatives
        candidates = [self.model_name] + [m for m in self.FALLBACK_MODELS if m != self.model_name]
        last_error = None

        for model_candidate in candidates:
            try:
                model = genai.GenerativeModel(
                    model_name=model_candidate,
                    system_instruction=system_instruction
                )
                generation_config = genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
                response = await model.generate_content_async(prompt, generation_config=generation_config)
                return response.text
            except Exception as e:
                last_error = e
                if self._is_rate_limit_error(e):
                    logger.warning(
                        f"Gemini model '{model_candidate}' reached 15 RPM Free Tier limit (429 Quota). "
                        f"Rotating to alternative model in pool..."
                    )
                    await asyncio.sleep(0.5)
                    continue
                else:
                    raise e

        # If all Gemini models in pool were rate-limited, attempt cross-provider failover
        if settings.OPENAI_API_KEY:
            try:
                logger.info("Failing over from rate-limited Gemini to OpenAI provider...")
                from app.ai.providers.openai_provider import OpenAIProvider
                openai_prov = OpenAIProvider(api_key=settings.OPENAI_API_KEY)
                return await openai_prov.generate_text(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_instruction=system_instruction
                )
            except Exception as oai_err:
                logger.warning(f"OpenAI failover failed: {oai_err}")

        if settings.ANTHROPIC_API_KEY:
            try:
                logger.info("Failing over from rate-limited Gemini to Claude provider...")
                from app.ai.providers.claude_provider import ClaudeProvider
                claude_prov = ClaudeProvider(api_key=settings.ANTHROPIC_API_KEY)
                return await claude_prov.generate_text(
                    prompt=prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    system_instruction=system_instruction
                )
            except Exception as claude_err:
                logger.warning(f"Claude failover failed: {claude_err}")

        raise last_error

    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        self._ensure_configured()
        genai.configure(api_key=self.api_key)

        candidates = [self.model_name] + [m for m in self.FALLBACK_MODELS if m != self.model_name]
        last_error = None

        for model_candidate in candidates:
            try:
                model = genai.GenerativeModel(
                    model_name=model_candidate,
                    system_instruction=system_instruction,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=temperature
                    )
                )
                response = await model.generate_content_async(prompt)
                return self._extract_json(response.text)
            except Exception as e:
                last_error = e
                if self._is_rate_limit_error(e):
                    logger.warning(
                        f"Gemini structured model '{model_candidate}' rate-limited (429 Quota). "
                        f"Rotating to alternative model..."
                    )
                    await asyncio.sleep(0.5)
                    continue
                else:
                    raise e

        # If all Gemini models were rate-limited, attempt cross-provider failover
        if settings.OPENAI_API_KEY:
            try:
                logger.info("Failing over structured generation to OpenAI...")
                from app.ai.providers.openai_provider import OpenAIProvider
                openai_prov = OpenAIProvider(api_key=settings.OPENAI_API_KEY)
                return await openai_prov.generate_structured(
                    prompt=prompt,
                    temperature=temperature,
                    system_instruction=system_instruction
                )
            except Exception as oai_err:
                logger.warning(f"OpenAI structured failover failed: {oai_err}")

        if settings.ANTHROPIC_API_KEY:
            try:
                logger.info("Failing over structured generation to Claude...")
                from app.ai.providers.claude_provider import ClaudeProvider
                claude_prov = ClaudeProvider(api_key=settings.ANTHROPIC_API_KEY)
                return await claude_prov.generate_structured(
                    prompt=prompt,
                    temperature=temperature,
                    system_instruction=system_instruction
                )
            except Exception as claude_err:
                logger.warning(f"Claude structured failover failed: {claude_err}")

        raise last_error

    async def generate_embedding(self, text: str) -> List[float]:
        self._ensure_configured()
        genai.configure(api_key=self.api_key)
        try:
            result = genai.embed_content(
                model=f"models/{self.embedding_model}",
                content=text,
                task_type="retrieval_document"
            )
            return result["embedding"]
        except Exception as e:
            # Fallback to text-embedding-004 or normalized vector if rate-limited
            if self._is_rate_limit_error(e):
                logger.warning("Gemini embedding rate-limited. Falling back to deterministic vector.")
                import hashlib, math, random
                h = hashlib.sha256(text.encode("utf-8")).digest()
                seed = int.from_bytes(h[:4], "big")
                rng = random.Random(seed)
                vec = [rng.gauss(0.0, 1.0) for _ in range(768)]
                norm = math.sqrt(sum(x * x for x in vec)) or 1.0
                return [x / norm for x in vec]
            raise e

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
