from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.brand import Brand, BrandGuideline
from app.schemas.brand import BrandCreate, BrandUpdate
from app.models.analytics import ActivityLog

class BrandService:
    @staticmethod
    async def create_brand(data: BrandCreate, org_id: str, db: AsyncSession) -> Brand:
        brand = Brand(
            organization_id=org_id,
            name=data.name,
            company_name=data.company_name,
            industry=data.industry,
            business_description=data.business_description,
            website_url=data.website_url,
            target_audience=data.target_audience,
            target_geographical_market=data.target_geographical_market,
            preferred_language=data.preferred_language,
            brand_voice=data.brand_voice,
            writing_tone=data.writing_tone,
            communication_style=data.communication_style,
            content_objectives=data.content_objectives,
            preferred_cta_style=data.preferred_cta_style,
            custom_instructions=data.custom_instructions
        )
        db.add(brand)
        await db.flush()

        guidelines_data = data.guidelines
        guideline = BrandGuideline(
            brand_id=brand.id,
            restricted_words=guidelines_data.restricted_words if guidelines_data else [],
            preferred_keywords=guidelines_data.preferred_keywords if guidelines_data else [],
            competitors=guidelines_data.competitors if guidelines_data else [],
            products_services=guidelines_data.products_services if guidelines_data else []
        )
        db.add(guideline)

        db.add(ActivityLog(
            organization_id=org_id,
            action="created_brand",
            entity_type="brand",
            entity_id=brand.id,
            details={"name": brand.name, "industry": brand.industry}
        ))

        await db.commit()
        
        # Reload with eager loaded guidelines
        stmt = select(Brand).options(selectinload(Brand.guidelines)).where(Brand.id == brand.id)
        res = await db.execute(stmt)
        return res.scalar_one()

    @staticmethod
    async def get_brands(org_id: str, db: AsyncSession) -> List[Brand]:
        stmt = (
            select(Brand)
            .options(selectinload(Brand.guidelines))
            .where(Brand.organization_id == org_id)
            .order_by(Brand.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_brand(brand_id: str, org_id: str, db: AsyncSession) -> Brand:
        stmt = (
            select(Brand)
            .options(selectinload(Brand.guidelines))
            .where(Brand.id == brand_id, Brand.organization_id == org_id)
        )
        res = await db.execute(stmt)
        brand = res.scalar_one_or_none()
        if not brand:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand profile not found")
        return brand

    @staticmethod
    async def update_brand(brand_id: str, data: BrandUpdate, org_id: str, db: AsyncSession) -> Brand:
        brand = await BrandService.get_brand(brand_id, org_id, db)
        
        update_data = data.model_dump(exclude_unset=True, exclude={"guidelines"})
        for k, v in update_data.items():
            setattr(brand, k, v)

        if data.guidelines is not None:
            stmt = select(BrandGuideline).where(BrandGuideline.brand_id == brand.id)
            res = await db.execute(stmt)
            gl = res.scalar_one_or_none()
            if gl:
                gl.restricted_words = data.guidelines.restricted_words
                gl.preferred_keywords = data.guidelines.preferred_keywords
                gl.competitors = data.guidelines.competitors
                gl.products_services = data.guidelines.products_services
            else:
                new_gl = BrandGuideline(
                    brand_id=brand.id,
                    restricted_words=data.guidelines.restricted_words,
                    preferred_keywords=data.guidelines.preferred_keywords,
                    competitors=data.guidelines.competitors,
                    products_services=data.guidelines.products_services
                )
                db.add(new_gl)

        await db.commit()
        
        stmt = select(Brand).options(selectinload(Brand.guidelines)).where(Brand.id == brand_id)
        res = await db.execute(stmt)
        return res.scalar_one()

    @staticmethod
    async def delete_brand(brand_id: str, org_id: str, db: AsyncSession):
        brand = await BrandService.get_brand(brand_id, org_id, db)
        await db.delete(brand)
        await db.commit()
