import os
import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.training import TrainingExample, TrainingDataset
from app.schemas.training import TrainingExampleCreate, DatasetCreateRequest
from app.config import settings

class TrainingService:
    @staticmethod
    async def create_example(
        data: TrainingExampleCreate,
        org_id: str,
        db: AsyncSession
    ) -> TrainingExample:
        example = TrainingExample(
            organization_id=org_id,
            prompt=data.prompt,
            reference_context=data.reference_context,
            task_type=data.task_type,
            expected_output=data.expected_output,
            platform=data.platform,
            writing_tone=data.writing_tone,
            brand_id=data.brand_id,
            human_approved=data.human_approved,
            quality_score=data.quality_score
        )
        db.add(example)
        await db.commit()
        await db.refresh(example)
        return example

    @staticmethod
    async def get_examples(org_id: str, db: AsyncSession) -> List[TrainingExample]:
        stmt = select(TrainingExample).where(TrainingExample.organization_id == org_id).order_by(TrainingExample.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create_dataset_and_export_jsonl(
        data: DatasetCreateRequest,
        org_id: str,
        db: AsyncSession
    ) -> TrainingDataset:
        stmt = select(TrainingExample).where(
            TrainingExample.organization_id == org_id,
            TrainingExample.quality_score >= data.min_quality_score
        )
        if data.require_human_approved:
            stmt = stmt.where(TrainingExample.human_approved == True)

        res = await db.execute(stmt)
        examples = list(res.scalars().all())

        if not examples:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No approved training examples found with quality score >= {data.min_quality_score}"
            )

        export_dir = os.path.join(settings.EXPORT_DIR, "datasets")
        os.makedirs(export_dir, exist_ok=True)
        filename = f"sft_dataset_{org_id[:8]}_{data.name.lower().replace(' ', '_')}_v{data.version}.jsonl"
        filepath = os.path.join(export_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            for ex in examples:
                sys_prompt = f"You are an AI Content Specialist producing {ex.platform or 'general'} content with a {ex.writing_tone or 'professional'} tone."
                user_msg = ex.prompt
                if ex.reference_context:
                    user_msg += f"\n\nContext:\n{ex.reference_context}"
                
                record = {
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": user_msg},
                        {"role": "assistant", "content": ex.expected_output}
                    ]
                }
                f.write(json.dumps(record) + "\n")

        dataset = TrainingDataset(
            organization_id=org_id,
            name=data.name,
            version=data.version,
            description=data.description,
            example_count=len(examples),
            jsonl_file_path=filepath,
            status="exported"
        )
        db.add(dataset)
        await db.commit()
        await db.refresh(dataset)
        return dataset

    @staticmethod
    async def get_datasets(org_id: str, db: AsyncSession) -> List[TrainingDataset]:
        stmt = select(TrainingDataset).where(TrainingDataset.organization_id == org_id).order_by(TrainingDataset.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())
