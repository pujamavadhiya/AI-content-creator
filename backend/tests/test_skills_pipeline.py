import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.skills.skill_registry import skill_registry
from app.services.router_service import router_service
from app.services.pipeline_service import pipeline_service

def test_skill_registry_all_skills_and_assembly():
    skills = skill_registry.list_skills()
    assert len(skills) >= 19
    
    # Check shared rules
    shared_rules = skill_registry.get_shared_rules()
    assert "Shared Rules" in shared_rules
    assert "Voice" in shared_rules

    # Check brief and draft
    brief = skill_registry.get_skill("brief")
    assert brief["canonical_name"] == "content-brief-generator"
    assert brief["output_format"] == "markdown"

    qa = skill_registry.get_skill("qa")
    assert qa["canonical_name"] == "editor-qa-scorer"
    assert qa["output_format"] == "json"

    # Test prompt assembly layout (all 6 blocks)
    sys_prompt = skill_registry.assemble_system_prompt(
        skill_name_or_alias="draft",
        brand_voice="Sharp, opinionated, analytical",
        project_context={
            "brand_name": "Sevencore",
            "author_name": "Ashok Rathod",
            "primary_keyword": "Agentic Workflows"
        },
        word_count=1000
    )

    assert "<role>" in sys_prompt
    assert "<core_principles>" in sys_prompt
    assert "<shared_rules>" in sys_prompt
    assert '<active_skill name="human-tone-writer">' in sys_prompt
    assert "<brand_voice>" in sys_prompt
    assert "<project_context>" in sys_prompt
    assert "<output_contract>" in sys_prompt

    # Test user message layout
    user_msg = skill_registry.assemble_user_message(
        request="Write about agent architecture",
        inputs="Competitor gaps: lacking benchmarks",
        previous_step_summary="Completed SERP Gap analysis"
    )
    assert "<request>" in user_msg
    assert "<inputs>" in user_msg
    assert "<previous_step_summary>" in user_msg

@pytest.mark.asyncio
async def test_router_classification_scenarios():
    # 1. New content / topic
    plan1 = await router_service.route_request("Write a complete guide on enterprise AI agents")
    assert plan1["request_type"] in ("new_content", "compressed")
    assert "draft" in plan1["steps"]
    assert "qa" in plan1["steps"]

    # 2. Live URL rewrite
    plan2 = await router_service.route_request("Rewrite this live page: https://sevencore.ai/platform")
    assert plan2["request_type"] == "rewrite_url"
    assert "rewrite_url" in plan2["steps"]

    # 3. Content calendar
    plan3 = await router_service.route_request("Create a monthly content calendar and topic cluster for cybersecurity")
    assert plan3["request_type"] == "plan"
    assert "topic_cluster" in plan3["steps"]

    # 4. Short copy / format playbook
    plan4 = await router_service.route_request("Generate 5 ad copy variants and cold outreach email")
    assert plan4["request_type"] == "short_copy"
    assert "format_playbook" in plan4["steps"]

@pytest.mark.asyncio
async def test_pipeline_chaining_execution():
    # Test step execution
    res = await pipeline_service.execute_pipeline(
        request="Explain the core difference between monolithic and modular agent architectures",
        steps=["brief", "draft", "qa"],
        project_context={"word_count": 250, "brand_name": "Sevencore"}
    )

    assert res["success"] is True
    assert len(res["step_logs"]) == 3
    assert len(res["final_content"]) >= 50
    assert "checklist" in res
    assert "qa_scorecard" in res or "scores" in str(res.get("step_results", {}))

def test_pipeline_api_routes():
    with TestClient(app) as client:
        # 1. Skills catalog
        skills_res = client.get("/api/pipeline/skills")
        assert skills_res.status_code == 200
        data = skills_res.json()
        assert "skills" in data
        assert data["total"] >= 19

        # 2. Route endpoint
        route_res = client.post("/api/pipeline/route", json={
            "request": "Write an educational blog on RAG chunking strategies",
            "project_context": {"word_count": 1500}
        })
        assert route_res.status_code == 200
        plan = route_res.json()
        assert "steps" in plan
        assert len(plan["steps"]) >= 2
