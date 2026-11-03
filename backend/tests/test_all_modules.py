import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient):
    # 1. Register
    reg_payload = {
        "email": "writer@sevencore.ai",
        "password": "StrongPassword!456",
        "full_name": "Senior Writer",
        "organization_name": "Sevencore Media"
    }
    res = await client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "writer@sevencore.ai"

    # 2. Login
    login_payload = {
        "email": "writer@sevencore.ai",
        "password": "StrongPassword!456"
    }
    res_log = await client.post("/api/auth/login", json=login_payload)
    assert res_log.status_code == 200
    token = res_log.json()["access_token"]

    # 3. Me
    res_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["full_name"] == "Senior Writer"

@pytest.mark.asyncio
async def test_brand_management(client: AsyncClient, auth_headers: dict):
    brand_payload = {
        "name": "CloudScale AI",
        "company_name": "CloudScale Inc",
        "industry": "Cloud Computing & AI",
        "website_url": "https://cloudscale.ai",
        "brand_voice": "Technical, Visionary, Practical",
        "writing_tone": "Thought leadership",
        "communication_style": "Data-backed & authoritative",
        "preferred_cta_style": "Start your 14-day free enterprise trial",
        "guidelines": {
            "restricted_words": ["synergy", "paradigm shift", "game-changer"],
            "preferred_keywords": ["latency", "inference cost", "distributed training"],
            "competitors": ["Competitor A", "Competitor B"]
        }
    }
    # Create
    res = await client.post("/api/brands", json=brand_payload, headers=auth_headers)
    assert res.status_code == 201, res.text
    brand = res.json()
    assert brand["name"] == "CloudScale AI"
    brand_id = brand["id"]

    # List
    res_list = await client.get("/api/brands", headers=auth_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # Update
    res_up = await client.put(f"/api/brands/{brand_id}", json={"company_name": "CloudScale Global Inc"}, headers=auth_headers)
    assert res_up.status_code == 200
    assert res_up.json()["company_name"] == "CloudScale Global Inc"

@pytest.mark.asyncio
async def test_reference_library_and_ingestion(client: AsyncClient, auth_headers: dict):
    # 1. Create collection
    col_payload = {"name": "AI Benchmark Studies 2026", "description": "Verified whitepapers"}
    res_col = await client.post("/api/references/collections", json=col_payload, headers=auth_headers)
    assert res_col.status_code == 201
    col_id = res_col.json()["id"]

    # 2. Ingest manual text reference
    doc_payload = {
        "collection_id": col_id,
        "title": "GPU Cluster Latency Optimization Guide",
        "text": "Retrieval Augmented Generation reduces AI hallucinations by 82% across technical documentation workflows. Implementing hybrid sparse-dense retrieval further increases recall precision."
    }
    res_doc = await client.post("/api/references/text", json=doc_payload, headers=auth_headers)
    assert res_doc.status_code == 202
    doc_id = res_doc.json()["id"]

    # 3. List documents
    res_docs = await client.get(f"/api/references/documents?collection_id={col_id}", headers=auth_headers)
    assert res_docs.status_code == 200
    assert len(res_docs.json()) >= 1

@pytest.mark.asyncio
async def test_content_intelligence_pipeline(client: AsyncClient, auth_headers: dict):
    # 1. Keywords
    kw_req = {
        "topic": "Retrieval Augmented Generation in Enterprise",
        "industry": "Artificial Intelligence",
        "target_audience": "CTOs and VP of Engineering"
    }
    res_kw = await client.post("/api/research/keywords", json=kw_req, headers=auth_headers)
    assert res_kw.status_code == 200, res_kw.text
    keywords = res_kw.json()
    assert len(keywords) >= 1
    assert "keyword" in keywords[0]

    # 2. Topics
    top_req = {
        "primary_keyword": "Retrieval Augmented Generation",
        "secondary_keywords": ["Vector Search", "Enterprise RAG"],
        "industry": "Enterprise Software"
    }
    res_top = await client.post("/api/research/topics", json=top_req, headers=auth_headers)
    assert res_top.status_code == 200
    topics = res_top.json()
    assert len(topics) >= 1
    topic_id = topics[0]["id"]

    # 3. Outline
    out_req = {"topic_id": topic_id}
    res_out = await client.post("/api/research/outlines", json=out_req, headers=auth_headers)
    assert res_out.status_code == 201, res_out.text
    outline = res_out.json()
    assert "headings_hierarchy" in outline
    assert "faqs" in outline
    outline_id = outline["id"]

    # 4. Blog Writer
    blog_req = {
        "outline_id": outline_id,
        "desired_word_count": 1000,
        "writing_tone": "Thought leadership"
    }
    res_blog = await client.post("/api/content/generate-blog", json=blog_req, headers=auth_headers)
    assert res_blog.status_code == 201, res_blog.text
    blog = res_blog.json()
    assert blog["platform"] == "Blog"
    assert blog["word_count"] > 20
    content_id = blog["id"]

    # 5. Social Media - LinkedIn
    soc_req = {
        "topic_title": "Why Grounded AI Outperforms Raw LLMs",
        "platform": "linkedin",
        "format_type": "thought_leadership"
    }
    res_soc = await client.post("/api/content/generate-social", json=soc_req, headers=auth_headers)
    assert res_soc.status_code == 201
    soc = res_soc.json()
    assert soc["platform"] == "Linkedin"

    # 6. Quality Audit
    res_eval = await client.post(f"/api/content/{content_id}/evaluate", headers=auth_headers)
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert "overall_score" in eval_data
    assert "dimension_scores" in eval_data

    # 7. Content Calendar Scheduling
    cal_req = {
        "content_id": content_id,
        "scheduled_date": "2026-11-15T10:00:00Z",
        "platform": "Blog",
        "notes": "Feature piece for Q4 product launch"
    }
    res_cal = await client.post("/api/calendar", json=cal_req, headers=auth_headers)
    assert res_cal.status_code == 201

    # 8. Content Exports
    res_md = await client.get(f"/api/content/{content_id}/export/md", headers=auth_headers)
    assert res_md.status_code == 200
    assert len(res_md.content) > 0

    res_pdf = await client.get(f"/api/content/{content_id}/export/pdf", headers=auth_headers)
    assert res_pdf.status_code == 200
    assert len(res_pdf.content) > 0

    # 9. Analytics Summary
    res_ana = await client.get("/api/analytics/summary", headers=auth_headers)
    assert res_ana.status_code == 200
    ana = res_ana.json()
    assert ana["total_blogs"] >= 1

@pytest.mark.asyncio
async def test_ai_model_settings_and_credentials(client: AsyncClient, auth_headers: dict):
    # 1. List Providers
    res_p = await client.get("/api/ai/providers", headers=auth_headers)
    assert res_p.status_code == 200
    providers = res_p.json()
    assert len(providers) >= 3

    # 2. Save encrypted credential
    cred_req = {
        "provider_slug": "gemini",
        "api_key": "AIzaSySampleKeyTesting12345678"
    }
    res_save = await client.post("/api/ai/credentials", json=cred_req, headers=auth_headers)
    assert res_save.status_code == 200

    # 3. Connection Test
    test_req = {"provider_slug": "mock"}
    res_test = await client.post("/api/ai/test-connection", json=test_req, headers=auth_headers)
    assert res_test.status_code == 200
    assert res_test.json()["success"] is True

