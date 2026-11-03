from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user, require_role
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse
from app.services.brand_service import BrandService

router = APIRouter(prefix="/api/brands", tags=["Brand Profiles"])

@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    data: BrandCreate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"])),
    db: AsyncSession = Depends(get_db)
):
    brand = await BrandService.create_brand(data, current_user.organization_id, db)
    return BrandResponse.model_validate(brand)

@router.get("", response_model=List[BrandResponse])
async def list_brands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    brands = await BrandService.get_brands(current_user.organization_id, db)
    return [BrandResponse.model_validate(b) for b in brands]

@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    brand = await BrandService.get_brand(brand_id, current_user.organization_id, db)
    return BrandResponse.model_validate(brand)

@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: str,
    data: BrandUpdate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"])),
    db: AsyncSession = Depends(get_db)
):
    brand = await BrandService.update_brand(brand_id, data, current_user.organization_id, db)
    return BrandResponse.model_validate(brand)

@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    await BrandService.delete_brand(brand_id, current_user.organization_id, db)

