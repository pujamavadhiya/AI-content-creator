import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.schemas.content import SocialChatRefineRequest, SocialGenerateRequest
from app.services.content_service import ContentService
from app.models.content import GeneratedContent, ContentVersion

@pytest.mark.asyncio
async def test_social_chat_refine_logic():
    # Test SocialChatRefineRequest schema
    req = SocialChatRefineRequest(
        platform="linkedin",
        current_content="Initial LinkedIn post about AI pipelines.",
        instruction="Make it punchier with 3 bullet points.",
        conversation_history=[{"role": "assistant", "content": "Initial LinkedIn post about AI pipelines."}]
    )
    assert req.platform == "linkedin"
    assert "punchier" in req.instruction

    # Mock DB session and AI provider
    mock_db = MagicMock()
    mock_db.execute = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    mock_provider = MagicMock()
    mock_provider.generate_text = AsyncMock(return_value="Punchy LinkedIn post:\n- Point 1\n- Point 2\n- Point 3\n\nWhat do you think?")

    with patch("app.services.content_service.get_ai_provider", return_value=mock_provider):
        result = await ContentService.social_chat_refine(
            data=req,
            org_id="org-123",
            user_id="user-123",
            db=mock_db
        )

        assert result["success"] is True
        assert "Punchy LinkedIn post" in result["refined_content"]
        assert result["word_count"] > 0
        assert result["version_number"] == 2
        assert result["change_summary"] == "Make it punchier with 3 bullet points."

@pytest.mark.asyncio
async def test_restore_version_schema_and_call():
    mock_content = GeneratedContent(
        id="content-abc",
        organization_id="org-123",
        title="LinkedIn: AI Pipelines",
        platform="LinkedIn",
        content_type="social_linkedin",
        body="Active Version 3 content",
        word_count=4,
        character_count=24
    )

    mock_version = ContentVersion(
        id="v-1",
        content_id="content-abc",
        version_number=1,
        title="LinkedIn: AI Pipelines",
        body="Original Version 1 content",
        change_summary="Initial Generation"
    )

    mock_res_content = MagicMock()
    mock_res_content.scalar_one_or_none.return_value = mock_content

    mock_res_version = MagicMock()
    mock_res_version.scalar_one_or_none.return_value = mock_version

    mock_res_latest = MagicMock()
    mock_res_latest.scalar_one_or_none.return_value = ContentVersion(
        id="v-3", content_id="content-abc", version_number=3, title="LinkedIn", body="v3"
    )

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(side_effect=[mock_res_content, mock_res_version, mock_res_latest])
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    res = await ContentService.restore_version(
        content_id="content-abc",
        version_number=1,
        org_id="org-123",
        user_id="user-123",
        db=mock_db
    )

    assert res["success"] is True
    assert res["restored_version_number"] == 1
    assert res["new_version_number"] == 4
    assert res["active_body"] == "Original Version 1 content"
