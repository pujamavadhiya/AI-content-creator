import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.main import app
from app.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.models.auth import Organization, User
from app.ai.providers.factory import get_ai_provider

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=engine_test, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def auth_headers(db_session):
    # Create test org & user
    org = Organization(name="Acme Corp", slug="acme-corp", plan="enterprise")
    db_session.add(org)
    await db_session.flush()

    user = User(
        email="architect@acme.com",
        hashed_password=hash_password("SuperSecret123!"),
        full_name="Chief Architect",
        role="super_admin",
        organization_id=org.id
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token({"sub": user.id, "org_id": org.id, "role": user.role})
    return {"Authorization": f"Bearer {token}", "X-User-ID": user.id, "X-Org-ID": org.id}
