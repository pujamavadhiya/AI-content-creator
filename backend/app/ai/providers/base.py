from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any

class BaseAIProvider(ABC):
    """Abstract Base Class for all AI model providers."""

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        system_instruction: Optional[str] = None
    ) -> str:
        """Generate unstructured text response."""
        pass

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None
    ) -> Any:
        """Generate parsed JSON output (dict or list)."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate dense vector embedding for text."""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Verify API key and model connectivity."""
        pass

