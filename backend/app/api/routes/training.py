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
from app.services.dataset_trainer_service import dataset_trainer_service
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

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

# --- PAWS Paraphrase Dataset & LLM Training Endpoints ---

class PawsExportRequest(BaseModel):
    provider: str = Field(default="openai", description="Target fine-tuning provider: 'openai' or 'gemini'")
    train_limit: int = Field(default=3000, description="Number of positive paraphrase pairs to export")
    val_limit: int = Field(default=400, description="Number of validation pairs")

class PawsFineTuneRequest(BaseModel):
    model: str = Field(default="gpt-4o-mini-2024-07-18", description="Base model to fine-tune")
    api_key: Optional[str] = Field(default=None, description="OpenAI API key (optional if saved in settings)")

@router.get("/paws/overview")
async def get_paws_overview(current_user: User = Depends(get_current_user)):
    """Returns real-time statistics and row counts of datasets in 'LLM Model/Datasets/'."""
    return dataset_trainer_service.get_dataset_overview()

@router.post("/paws/process-exemplars")
async def process_paws_exemplars(current_user: User = Depends(require_role(["super_admin", "admin", "editor"]))):
    """
    Extracts high-diversity positive paraphrase pairs and creates the in-context learning store
    'LLM Model/Processed/paws_exemplar_store.json'.
    """
    try:
        return dataset_trainer_service.build_paws_exemplar_store(limit=400)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/paws/export-finetune")
async def export_paws_finetune_dataset(
    body: PawsExportRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"]))
):
    """Exports production-ready Supervised Fine-Tuning JSONL datasets for OpenAI or Gemini."""
    try:
        return dataset_trainer_service.export_finetuning_jsonl(
            provider=body.provider,
            train_limit=body.train_limit,
            val_limit=body.val_limit
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/paws/start-finetune")
async def start_paws_model_finetune(
    body: PawsFineTuneRequest,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """Initiates an OpenAI Fine-Tuning job using the generated PAWS SFT dataset."""
    result = await dataset_trainer_service.start_openai_finetune_job(
        model=body.model,
        openai_api_key=body.api_key
    )
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("error"))
    return result

# --- WordNet Dictionary & Thesaurus Endpoints (576,000+ Records) ---

class WordNetExportRequest(BaseModel):
    provider: str = Field(default="openai", description="Target fine-tuning provider: 'openai' or 'gemini'")
    train_limit: int = Field(default=3000, description="Number of WordNet training records")
    val_limit: int = Field(default=400, description="Number of WordNet validation records")

class CombinedExportRequest(BaseModel):
    provider: str = Field(default="openai", description="Target fine-tuning provider: 'openai' or 'gemini'")
    paws_limit: int = Field(default=2500, description="Number of PAWS syntactic records")
    wordnet_limit: int = Field(default=1500, description="Number of WordNet lexical records")

@router.get("/wordnet/overview")
async def get_wordnet_overview(current_user: User = Depends(get_current_user)):
    """Returns real-time statistics and row counts of all 8 files in 'LLM Model/WordNet-DictionaryThesaurus/'."""
    return dataset_trainer_service.get_wordnet_overview()

@router.post("/wordnet/process-lexicon")
async def process_wordnet_lexicon(current_user: User = Depends(require_role(["super_admin", "admin", "editor"]))):
    """
    Extracts high-utility WordNet synonyms and AI-cliché replacements, creating
    'LLM Model/Processed/wordnet_lexicon_store.json'.
    """
    try:
        return dataset_trainer_service.build_wordnet_lexicon_store(limit=2500)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/wordnet/export-finetune")
async def export_wordnet_finetune_dataset(
    body: WordNetExportRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"]))
):
    """Exports lexical fine-tuning JSONL datasets for OpenAI or Gemini from WordNet."""
    try:
        return dataset_trainer_service.export_wordnet_finetuning_jsonl(
            provider=body.provider,
            train_limit=body.train_limit,
            val_limit=body.val_limit
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/combined/export-finetune")
async def export_combined_finetune_dataset(
    body: CombinedExportRequest,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor"]))
):
    """Combines PAWS (syntactic inversion) + WordNet (lexical diversity) into a master training set."""
    try:
        return dataset_trainer_service.export_combined_finetuning_jsonl(
            provider=body.provider,
            paws_train_limit=body.paws_limit,
            wordnet_train_limit=body.wordnet_limit
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/combined/overview")
async def get_combined_overview(current_user: User = Depends(get_current_user)):
    """Returns unified overview across both PAWS and WordNet datasets (681,000+ total records)."""
    return dataset_trainer_service.get_combined_overview()



