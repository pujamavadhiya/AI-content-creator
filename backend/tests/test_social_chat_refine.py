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
async def test_social_chat_refine_multiple_existing_versions():
    """
    Ensure that when multiple historical versions exist in the database,
    it does NOT throw MultipleResultsFound (the bug where scalar_one_or_none was used on ordered list).
    """
    req = SocialChatRefineRequest(
        content_id="content-multi",
        platform="twitter",
        current_content="Active Twitter thread",
        instruction="Add hashtags",
    )

    mock_content = GeneratedContent(
        id="content-multi",
        organization_id="org-123",
        title="Twitter Thread",
        platform="Twitter",
        content_type="social_twitter",
        body="Active Twitter thread",
        word_count=3,
        character_count=21
    )

    # Mock execute for content lookup
    mock_content_res = MagicMock()
    mock_content_res.scalar_one_or_none.return_value = mock_content

    # Mock execute for version lookup returning multiple versions (e.g. v2 and v1)
    mock_v_res = MagicMock()
    v2 = ContentVersion(id="v2", content_id="content-multi", version_number=2, title="T", body="B2")
    # scalars().first() should return v2
    mock_v_res.scalars.return_value.first.return_value = v2

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(side_effect=[mock_content_res, mock_v_res])
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    mock_provider = MagicMock()
    mock_provider.generate_text = AsyncMock(return_value="Active Twitter thread #AI #Tech")

    with patch("app.services.content_service.get_ai_provider", return_value=mock_provider):
        result = await ContentService.social_chat_refine(
            data=req,
            org_id="org-123",
            user_id="user-123",
            db=mock_db
        )

        assert result["success"] is True
        assert result["version_number"] == 3
        assert result["refined_content"] == "Active Twitter thread #AI #Tech"

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
    v3 = ContentVersion(id="v-3", content_id="content-abc", version_number=3, title="LinkedIn", body="v3")
    mock_res_latest.scalars.return_value.first.return_value = v3

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
