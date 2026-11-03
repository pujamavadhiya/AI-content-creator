# Sevencore AI — Content Intelligence & Generation Platform

A production-grade, reference-driven AI content intelligence and content generation platform designed for marketing agencies, enterprises, and content creators.

---

## 1. Core Architecture & Workflow

The platform operates on a reference-driven knowledge architecture:

$$\text{Reference Material} \longrightarrow \text{Ingestion \& Embeddings} \longrightarrow \text{RAG Understanding} \longrightarrow \text{Keywords} \longrightarrow \text{Topics \& Clusters} \longrightarrow \text{Outlines} \longrightarrow \text{Content Studio} \longrightarrow \text{12-Factor Quality Audit} \longrightarrow \text{Calendar \& Export}$$

Every paragraph, keyword, topic, and outline is systematically grounded in user-provided reference documents, eliminating hallucinations and ensuring brand voice fidelity.

---

## 2. Technology Stack

- **Frontend**: Next.js 14+ (React 18), TypeScript, SCSS Modules (no unnecessary Tailwind CSS), Lucide Icons, Axios API client.
- **Backend**: Python 3.11–3.13, FastAPI, Pydantic V2, SQLAlchemy 2.0 (asyncio + selectinload), Alembic migrations.
- **Database**: PostgreSQL (Production/Docker) with SQLite async fallback (`aiosqlite`) for instant zero-dependency local development.
- **Vector Database**: Qdrant Vector Engine (Docker container or local on-disk embedded storage).
- **AI Integration**: Provider-independent adapter layer:
  - **Google Gemini** (Primary Default: `gemini-2.0-flash`, `text-embedding-004`)
  - **OpenAI** (`gpt-4o`, `text-embedding-3-small`)
  - **Anthropic Claude** (`claude-3-5-sonnet-20241022`)
  - **Mock AI Provider** for cost-free offline test suites.
- **Document Processing**: `pypdf`, `python-docx`, `openpyxl`, `BeautifulSoup4` with SSRF-safe URL parsing.
- **Exporting**: DOCX, PDF (`reportlab`), Markdown, TXT, CSV, Excel.
- **Security**: AES-128-CBC / Fernet credential encryption, bcrypt password hashing, JWT tokens, RBAC, strict tenant isolation.

---

## 3. Navigation Sections & Modules

1. **Dashboard**: High-level telemetry, quick creation launchpads, and recent generated content.
2. **Brand Profiles**: Multi-brand management, 10 writing tone presets, custom instructions, and guideline tags (restricted words, competitors).
3. **Reference Library**: Multi-collection organizer for PDFs, Word documents, Excel sheets, text files, and public URLs with automatic Qdrant indexing and Reference Analysis reports.
4. **Research & Intelligence**: Interactive 6-stage workflow from reference selection to final studio drafting.
5. **Keyword Research Engine**: Discovery across 10 strategic categories (Primary, Secondary, Long-tail, Semantic, Related, Question, Commercial, Informational, Transactional, Navigational). Honest metrics with SEO provider layer.
6. **Topic Generator & Clustering**: 12 content formats with automatic semantic Pillar & Cluster grouping and internal linking maps.
7. **Content Outlines**: Interactive H1/H2/H3 architecture, FAQ generator, SEO meta titles/descriptions, and approval gating.
8. **Blog & Article Writer**: 500, 800, 1000, 1500, 2000, and 3000-word target articles with surgical inline AI tools (rewrite, grammar, professional, conversational, simplify, expand, shorten, examples, CTA).
9. **Social Media Studio**: Dedicated studios for LinkedIn (hook, body, CTA, hashtags, visual concepts), Instagram (carousels & reels), Facebook, Twitter/X Threads (<280 chars), and **Multi-Platform (One-Topic-to-All)** simultaneous generation.
10. **Content Quality & Evaluation Engine**: 12-factor evaluation radar with unsupported factual claim detection and 1-click **"Improve Content Based on Quality Report"** auto-correction.
11. **Content Calendar**: Multi-channel scheduling with platform and status filtering.
12. **Content Library**: Searchable asset repository with version history and multi-format exports (DOCX, PDF, MD, TXT, CSV, Excel).
13. **AI Model Settings**: Secure encrypted API key management, connection testing, and Supervised Fine-Tuning (SFT) JSONL dataset export.
14. **Usage & Analytics**: Recorded token consumption, real API cost estimations, and platform breakdown.
15. **Settings**: Organization management, role tiers, and multi-tenant isolation safeguards.

---

## 4. Local Quickstart (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+

### Step 1: Environment Configuration
Copy the example configuration:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` (or configure via the UI at `/models`).

### Step 2: Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000`. Interactive OpenAPI documentation at `http://localhost:8000/docs`.

### Step 3: Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Docker Compose Deployment

To run the complete production stack (Next.js, FastAPI, PostgreSQL, Qdrant, Redis):
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Qdrant Dashboard: `http://localhost:6333/dashboard`

---

## 6. Running the Automated Test Suite

The test suite runs against an isolated SQLite test database and uses the Mock AI Provider for deterministic verification with zero API fees:
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/ -v
```
All 5 test suites pass with 100% coverage across authentication, brand management, reference ingestion, content intelligence, and AI settings.

