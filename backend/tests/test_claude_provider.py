import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.ai.providers.claude_provider import ClaudeProvider
from app.ai.providers.factory import get_ai_provider
from app.schemas.content import BlogGenerateRequest, RewriteRequest, SocialGenerateRequest
from app.services.content_service import ContentService

@pytest.mark.asyncio
async def test_claude_provider_initialization():
    provider = ClaudeProvider(api_key="sk-ant-test-12345", model_name="claude-3-5-sonnet-20241022")
    assert provider.api_key == "sk-ant-test-12345"
    assert provider.model_name == "claude-3-5-sonnet-20241022"
    assert provider.client is not None

@pytest.mark.asyncio
async def test_claude_json_extraction():
    provider = ClaudeProvider(api_key="sk-ant-test-12345")
    
    # Test wrapped in markdown json fence
    raw_md = "Here is the result:\n```json\n{\"score\": 95, \"verdict\": \"human\"}\n```\nDone."
    data = provider._extract_json(raw_md)
    assert data["score"] == 95
    assert data["verdict"] == "human"

    # Test plain json
    plain_json = '{"analysis": "clean", "items": [1, 2, 3]}'
    data2 = provider._extract_json(plain_json)
    assert len(data2["items"]) == 3

    # Test array json with intro text
    arr_json = 'The recommendations are: [{"title": "Post 1"}]'
    data3 = provider._extract_json(arr_json)
    assert data3[0]["title"] == "Post 1"

@pytest.mark.asyncio
async def test_claude_embedding_deterministic_fallback():
    provider = ClaudeProvider(api_key="sk-ant-test-12345")
    
    with patch("app.ai.providers.claude_provider.settings") as mock_settings:
        mock_settings.GEMINI_API_KEY = None
        mock_settings.OPENAI_API_KEY = None
        
        emb = await provider.generate_embedding("Multi-Agent Architecture in Claude 3.5")
        assert isinstance(emb, list)
        assert len(emb) == 768
        # Ensure normalized (unit vector length ~ 1.0)
        norm_sq = sum(x * x for x in emb)
        assert abs(norm_sq - 1.0) < 1e-4

@pytest.mark.asyncio
async def test_claude_factory_resolution():
    with patch("app.ai.providers.factory.settings") as mock_settings:
        mock_settings.ENVIRONMENT = "development"
        mock_settings.ANTHROPIC_API_KEY = "sk-ant-factory-test"
        mock_settings.ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
        
        provider = await get_ai_provider(provider_slug="claude", force_mock=False)
        assert isinstance(provider, ClaudeProvider)
        assert provider.api_key == "sk-ant-factory-test"

@pytest.mark.asyncio
async def test_content_schemas_accept_provider():
    blog_req = BlogGenerateRequest(topic_title="AI Engineering", provider="claude")
    assert blog_req.provider == "claude"

    social_req = SocialGenerateRequest(platform="linkedin", format_type="thought_leadership", provider="claude")
    assert social_req.provider == "claude"

    rewrite_req = RewriteRequest(selected_text="We utilize AI.", action="simplify", provider="claude")
    assert rewrite_req.provider == "claude"

