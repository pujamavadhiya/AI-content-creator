import os
from typing import List
from fastapi import APIRouter, Depends, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.auth import User
from app.core.dependencies import get_current_user, require_role
from app.schemas.training import (
    TrainingExampleCreate, TrainingExampleResponse,
    DatasetCreateRequest, DatasetResponse
)
from app.services.training_service import TrainingService

router = APIRouter(prefix="/api/training", tags=["Fine-Tuning Readiness"])

@router.post("/examples", response_model=TrainingExampleResponse, status_code=status.HTTP_201_CREATED)
async def create_training_example(
    data: TrainingExampleCreate,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"])),
    db: AsyncSession = Depends(get_db)
):
    ex = await TrainingService.create_example(data, current_user.organization_id, db)
    return TrainingExampleResponse.model_validate(ex)

@router.get("/examples", response_model=List[TrainingExampleResponse])
async def list_training_examples(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    examples = await TrainingService.get_examples(current_user.organization_id, db)
    return [TrainingExampleResponse.model_validate(e) for e in examples]

@router.post("/datasets", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    data: DatasetCreateRequest,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    dataset = await TrainingService.create_dataset_and_export_jsonl(data, current_user.organization_id, db)
    return DatasetResponse.model_validate(dataset)

@router.get("/datasets", response_model=List[DatasetResponse])
async def list_datasets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    datasets = await TrainingService.get_datasets(current_user.organization_id, db)
    return [DatasetResponse.model_validate(d) for d in datasets]

@router.get("/datasets/{dataset_id}/download")
async def download_dataset_jsonl(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    datasets = await TrainingService.get_datasets(current_user.organization_id, db)
    target = next((d for d in datasets if d.id == dataset_id), None)
    if not target or not target.jsonl_file_path or not os.path.exists(target.jsonl_file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset file not found")

    with open(target.jsonl_file_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(target.jsonl_file_path)
    return Response(
        content=file_bytes,
        media_type="application/jsonl",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

