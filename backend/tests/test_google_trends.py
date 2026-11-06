import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from app.schemas.research import GoogleTrendsRequest, SaveTrendingKeywordsRequest
from app.services.trends_service import TrendsService, detect_search_intent
from app.models.research import Keyword
from sqlalchemy import select


def test_detect_search_intent():
    assert detect_search_intent("best AI tools for marketing") == "commercial"
    assert detect_search_intent("top python frameworks vs node") == "commercial"
    assert detect_search_intent("buy enterprise cloud subscription") == "transactional"
    assert detect_search_intent("how to configure docker compose") == "informational"
    assert detect_search_intent("what is retrieval augmented generation") == "informational"


@pytest.mark.asyncio
async def test_resolve_serpapi_key_explicit():
    key = await TrendsService.resolve_serpapi_key("custom_serpapi_12345", "org_1", None)
    assert key == "custom_serpapi_12345"


@pytest.mark.asyncio
async def test_search_google_trends_mocked_serpapi(db_session, auth_headers):
    mock_queries_response = {
        "search_parameters": {"engine": "google_trends", "q": "agentic ai"},
        "related_queries": {
            "rising": [
                {"query": "deepseek coder v2", "value": "Breakout", "extracted_value": None},
                {"query": "langgraph tutorial python", "value": "+450%", "extracted_value": 450}
            ],
            "top": [
                {"query": "what is agentic ai", "value": "100", "extracted_value": 100},
                {"query": "autonomous ai agents", "value": "85", "extracted_value": 85}
            ]
        }
    }
    mock_topics_response = {
        "related_topics": {
            "rising": [
                {"topic": {"title": "CrewAI", "type": "Software"}, "value": "+600%"}
            ],
            "top": [
                {"topic": {"title": "Artificial Intelligence", "type": "Field"}, "value": "100"}
            ]
        }
    }

    req = GoogleTrendsRequest(
        topic="agentic ai",
        geo="US",
        date="today 12-m",
        serpapi_key="mock_serp_key"
    )

    with patch.object(TrendsService, "fetch_serpapi_trends", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = {
            "queries": mock_queries_response,
            "topics": mock_topics_response
        }

        # Mock AI provider for topic synthesis
        with patch("app.services.trends_service.get_ai_provider", new_callable=AsyncMock) as mock_get_provider:
            mock_provider = MagicMock()
            mock_provider.generate_structured = AsyncMock(return_value=[
                {
                    "title": "Mastering LangGraph in 2026: The Rise of Agentic AI",
                    "angle": "Architectural breakdown of stateful agents",
                    "description": "Learn how LangGraph and autonomous agents are redefining software.",
                    "target_audience": "Senior Software Engineers",
                    "content_format": "How-To Guide",
                    "recommended_platform": "Blog",
                    "matched_keywords": ["langgraph tutorial python", "agentic ai"],
                    "why_trending": "Surging developer demand for orchestration tools."
                }
            ])
            mock_get_provider.return_value = mock_provider

            res = await TrendsService.search_google_trends(
                data=req,
                org_id="test_org_id",
                user_id="test_user_id",
                db=db_session
            )

            assert res.topic == "agentic ai"
            assert res.source == "serpapi_google_trends"
            assert len(res.rising_keywords) == 2
            assert res.rising_keywords[0].keyword == "deepseek coder v2"
            assert res.rising_keywords[0].category == "breakout"
            assert res.rising_keywords[1].keyword == "langgraph tutorial python"
            assert res.rising_keywords[1].growth_rate == "+450%"
            assert len(res.top_keywords) == 2
            assert res.top_keywords[0].keyword == "what is agentic ai"
            assert len(res.suggested_topics) >= 1
            assert res.suggested_topics[0].title.startswith("Mastering LangGraph")


@pytest.mark.asyncio
async def test_search_google_trends_fallback(db_session):
    req = GoogleTrendsRequest(
        topic="quantum computing",
        geo="GLOBAL",
        date="today 12-m",
        serpapi_key=""
    )

    with patch.object(TrendsService, "fetch_live_autocomplete_fallback", new_callable=AsyncMock) as mock_auto:
        mock_auto.return_value = ["quantum computing algorithms", "quantum supremacy 2026"]

        with patch("app.services.trends_service.get_ai_provider", new_callable=AsyncMock) as mock_get_provider:
            mock_provider = MagicMock()
            mock_provider.generate_structured = AsyncMock(return_value={
                "rising_queries": [
                    {"query": "quantum error correction chips", "value": "+750%", "is_breakout": True, "intent": "informational"}
                ],
                "top_queries": [
                    {"query": "how quantum computing works", "value": "95", "intent": "informational"}
                ],
                "related_topics": [
                    {"title": "Qubits", "type": "Physics", "growth": "+400%"}
                ]
            })
            mock_get_provider.return_value = mock_provider

            res = await TrendsService.search_google_trends(
                data=req,
                org_id="test_org_id",
                user_id="test_user_id",
                db=db_session
            )

            assert res.topic == "quantum computing"
            assert res.source == "trends_intelligence_engine"
            assert len(res.rising_keywords) >= 1
            assert res.rising_keywords[0].keyword == "quantum error correction chips"
            assert res.rising_keywords[0].category == "breakout"


@pytest.mark.asyncio
async def test_save_trending_keywords(db_session):
    data = SaveTrendingKeywordsRequest(
        keywords=["cursor ai workflows", "mcp protocols 2026"],
        category="trending",
        search_intent="commercial"
    )

    saved = await TrendsService.save_trending_keywords(
        data=data,
        org_id="test_org_id",
        user_id="test_user_id",
        db=db_session
    )

    assert len(saved) == 2
    assert saved[0].keyword == "cursor ai workflows"
    assert saved[0].category == "trending"
    assert saved[0].search_intent == "commercial"

    stmt = select(Keyword).where(Keyword.organization_id == "test_org_id")
    res = await db_session.execute(stmt)
    db_items = res.scalars().all()
    assert len(db_items) == 2


@pytest.mark.asyncio
async def test_google_trends_api_endpoints(client, auth_headers):
    # Test POST /api/research/google-trends
    with patch.object(TrendsService, "fetch_live_autocomplete_fallback", new_callable=AsyncMock) as mock_auto:
        mock_auto.return_value = ["ai video generator", "sora alternatives"]
        with patch("app.services.trends_service.get_ai_provider", new_callable=AsyncMock) as mock_get_provider:
            mock_provider = MagicMock()
            mock_provider.generate_structured = AsyncMock(return_value={
                "rising_queries": [
                    {"query": "open source ai video tools", "value": "+500%", "is_breakout": True, "intent": "commercial"}
                ],
                "top_queries": [
                    {"query": "best ai video tools", "value": "90", "intent": "commercial"}
                ],
                "related_topics": []
            })
            mock_get_provider.return_value = mock_provider

            response = await client.post(
                "/api/research/google-trends",
                json={"topic": "ai video generator", "geo": "US"},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["topic"] == "ai video generator"
            assert len(data["rising_keywords"]) >= 1

    # Test POST /api/research/google-trends/save
    save_response = await client.post(
        "/api/research/google-trends/save",
        json={"keywords": ["sora video generator", "runway gen 3"]},
        headers=auth_headers
    )
    assert save_response.status_code == 200
    saved_data = save_response.json()
    assert len(saved_data) == 2
    assert saved_data[0]["keyword"] == "sora video generator"
