import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user
from app.models.auth import User
from app.services.pipeline_service import pipeline_service

@pytest.fixture
def mock_user():
    return User(
        id="test-user-id",
        email="test@sevencore.ai",
        full_name="Tester",
        is_active=True,
        role="admin",
        organization_id="test-org-id"
    )

@pytest.mark.asyncio
async def test_pipeline_service_generate_outline():
    res = await pipeline_service.generate_pipeline_outline(
        request="Explain multi-agent swarm orchestration",
        project_context={
            "primary_keyword": "Multi-Agent Swarm",
            "compulsory_keywords": "Deterministic Fallbacks\nReal-World Latency",
            "word_count": 800
        }
    )
    assert res["success"] is True
    assert "outline" in res
    assert len(res["outline"]) > 0
    assert res.get("primary_keyword") == "Multi-Agent Swarm"
    assert "compulsory_keywords_audit" in res

@pytest.mark.asyncio
async def test_pipeline_service_generate_draft():
    test_outline = (
        "# Multi-Agent Swarm Orchestration\n\n"
        "## 1. Architecture\n"
        "- Implementing Deterministic Fallbacks\n"
        "- Minimizing Real-World Latency"
    )
    res = await pipeline_service.generate_pipeline_draft(
        request="Write draft for multi-agent swarm orchestration",
        outline=test_outline,
        project_context={
            "compulsory_keywords": "Deterministic Fallbacks\nReal-World Latency",
            "word_count": 500
        }
    )
    assert res["success"] is True
    assert "draft" in res
    assert len(res["draft"]) > 0
    assert res["word_count"] > 0
    assert "compulsory_keywords_audit" in res

def test_pipeline_phases_api_endpoints(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        with TestClient(app) as client:
            # Test Outline endpoint
            outline_res = client.post(
                "/api/pipeline/generate-outline",
                json={
                    "request": "Technical guide on Microservices to Event-Driven Migration",
                    "compulsory_keywords": "Message Queues\nEvent Bus",
                    "project_context": {"word_count": 600}
                }
            )
            assert outline_res.status_code == 200
            outline_data = outline_res.json()
            assert outline_data.get("success") is True
            assert "outline" in outline_data

            # Test Draft endpoint using the outline
            draft_res = client.post(
                "/api/pipeline/generate-draft",
                json={
                    "request": "Technical guide on Microservices to Event-Driven Migration",
                    "outline": outline_data["outline"],
                    "compulsory_keywords": "Message Queues\nEvent Bus",
                    "project_context": {"word_count": 600}
                }
            )
            assert draft_res.status_code == 200
            draft_data = draft_res.json()
            assert draft_data.get("success") is True
            assert "draft" in draft_data
            assert draft_data["word_count"] > 0
    finally:
        app.dependency_overrides.clear()
