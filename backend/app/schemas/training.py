from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TrainingExampleCreate(BaseModel):
    prompt: str
    reference_context: Optional[str] = None
    task_type: str
    expected_output: str
    platform: Optional[str] = None
    writing_tone: Optional[str] = None
    brand_id: Optional[str] = None
    quality_score: float = 9.0
    human_approved: bool = True

class TrainingExampleResponse(BaseModel):
    id: str
    organization_id: str
    prompt: str
    reference_context: Optional[str] = None
    task_type: str
    expected_output: str
    platform: Optional[str] = None
    writing_tone: Optional[str] = None
    brand_id: Optional[str] = None
    human_approved: bool
    quality_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetCreateRequest(BaseModel):
    name: str
    version: str = "1.0.0"
    description: Optional[str] = None
    min_quality_score: float = 8.0
    require_human_approved: bool = True

class DatasetResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    version: str
    description: Optional[str] = None
    example_count: int
    jsonl_file_path: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
