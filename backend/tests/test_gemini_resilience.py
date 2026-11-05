import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.ai.providers.gemini_provider import GeminiProvider

@pytest.mark.asyncio
async def test_gemini_rate_limit_detection():
    provider = GeminiProvider(api_key="test-key")
    
    err429 = Exception("429 You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 15")
    assert provider._is_rate_limit_error(err429) is True

    normal_err = Exception("Syntax error in input prompt")
    assert provider._is_rate_limit_error(normal_err) is False

@pytest.mark.asyncio
async def test_gemini_robust_json_extraction():
    provider = GeminiProvider(api_key="test-key")
    
    # Code fence wrapped
    raw_md = "Here is the response:\n```json\n{\"overall_score\": 92, \"checks\": {}}\n```\nHope this helps."
    extracted = provider._extract_json(raw_md)
    assert extracted["overall_score"] == 92

    # Array response with text
    raw_arr = "Findings are: [{\"claim\": \"test\", \"status\": \"Verified\"}]"
    extracted_arr = provider._extract_json(raw_arr)
    assert isinstance(extracted_arr, list)
    assert extracted_arr[0]["status"] == "Verified"

@pytest.mark.asyncio
async def test_gemini_model_rotation_on_429():
    provider = GeminiProvider(api_key="test-key", model_name="gemini-3.5-flash-lite")
    
    # Mock model generation where first model throws 429, second succeeds
    mock_resp = MagicMock()
    mock_resp.text = '{"success": true, "source": "rotated_model"}'
    
    call_counts = {"count": 0}
    
    def side_effect(*args, **kwargs):
        call_counts["count"] += 1
        if call_counts["count"] == 1:
            raise Exception("429 ResourceExhausted: limit 15 RPM exceeded")
        return mock_resp

    with patch("google.generativeai.GenerativeModel") as mock_model_cls:
        instance = MagicMock()
        instance.generate_content_async = AsyncMock(side_effect=side_effect)
        mock_model_cls.return_value = instance
        
        result = await provider.generate_structured("test prompt")
        assert result["success"] is True
        assert call_counts["count"] == 2
