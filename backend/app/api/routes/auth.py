import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.auth import User, Organization
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.core.security import verify_password, hash_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create slug for organization
    base_slug = re.sub(r"[^a-zA-Z0-9]+", "-", data.organization_name.lower()).strip("-")
    slug = base_slug or "org"
    
    # Ensure unique slug
    slug_stmt = select(Organization).where(Organization.slug == slug)
    if (await db.execute(slug_stmt)).scalar_one_or_none():
        import uuid
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"

    org = Organization(
        name=data.organization_name,
        slug=slug,
        plan="pro"
    )
    db.add(org)
    await db.flush()

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="super_admin",
        organization_id=org.id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "org_id": org.id, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has been deactivated."
        )

    token = create_access_token({"sub": user.id, "org_id": user.organization_id, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
