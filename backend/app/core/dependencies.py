from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.core.security import decode_access_token
from app.models.auth import User, Organization
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def _get_or_create_dev_user(db: AsyncSession) -> User:
    """Provides a seamless default workspace user in development mode."""
    stmt = select(User).where(User.email == "admin@sevencore.ai")
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        return user
    
    # Check or create default organization
    stmt_org = select(Organization).where(Organization.slug == "sevencore-default")
    res_org = await db.execute(stmt_org)
    org = res_org.scalar_one_or_none()
    if not org:
        org = Organization(
            name="Sevencore AI Workspace",
            slug="sevencore-default",
            plan="enterprise"
        )
        db.add(org)
        await db.flush()
    
    user = User(
        email="admin@sevencore.ai",
        full_name="Workspace Admin",
        hashed_password="development_mode_auto_auth",
        role="admin",
        is_active=True,
        organization_id=org.id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            return await _get_or_create_dev_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload:
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            return await _get_or_create_dev_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if not user_id:
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            return await _get_or_create_dev_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identifier missing in token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    stmt = select(User).where(User.id == user_id, User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            return await _get_or_create_dev_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_org(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Organization:
    stmt = select(Organization).where(Organization.id == current_user.organization_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # super_admin can do everything
        if current_user.role == "super_admin":
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker

