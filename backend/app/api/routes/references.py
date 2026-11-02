import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, AsyncSessionLocal
from app.models.auth import User
from app.models.reference import ReferenceCollection, ReferenceDocument, ReferenceAnalysis
from app.schemas.reference import (
    CollectionCreate, CollectionResponse, DocumentResponse, IngestUrlRequest,
    ManualTextInput, ReferenceAnalysisResponse
)
from app.core.dependencies import get_current_user, require_role
from app.services.reference_service import ReferenceService
from app.ai.rag.vector_store import vector_store
from app.config import settings

router = APIRouter(prefix="/api/references", tags=["Reference Library"])

# Background task runner that creates its own db session
async def _run_doc_pipeline(document_id: str, org_id: str):
    async with AsyncSessionLocal() as session:
        await ReferenceService.process_document_pipeline(document_id, session, org_id)

@router.post("/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    col = ReferenceCollection(
        organization_id=current_user.organization_id,
        brand_id=data.brand_id,
        name=data.name,
        description=data.description
    )
    db.add(col)
    await db.commit()
    await db.refresh(col)
    return CollectionResponse.model_validate(col)

@router.get("/collections", response_model=List[CollectionResponse])
async def list_collections(
    brand_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ReferenceCollection).where(ReferenceCollection.organization_id == current_user.organization_id)
    if brand_id:
        stmt = stmt.where(ReferenceCollection.brand_id == brand_id)
    stmt = stmt.order_by(ReferenceCollection.created_at.desc())
    res = await db.execute(stmt)
    return [CollectionResponse.model_validate(c) for c in res.scalars().all()]

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    collection_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    col_stmt = select(ReferenceCollection).where(
        ReferenceCollection.id == collection_id,
        ReferenceCollection.organization_id == current_user.organization_id
    )
    res = await db.execute(col_stmt)
    col = res.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    allowed_exts = {"pdf", "docx", "doc", "txt", "md", "xlsx", "xls"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(allowed_exts)}"
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = ReferenceDocument(
        collection_id=collection_id,
        organization_id=current_user.organization_id,
        filename=file.filename,
        file_type=ext,
        file_path=file_path,
        status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    if settings.ENVIRONMENT == "test":
        await ReferenceService.process_document_pipeline(doc.id, db, current_user.organization_id)
    else:
        background_tasks.add_task(_run_doc_pipeline, doc.id, current_user.organization_id)

    return DocumentResponse.model_validate(doc)

@router.post("/ingest-url", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_url(
    data: IngestUrlRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    col_stmt = select(ReferenceCollection).where(
        ReferenceCollection.id == data.collection_id,
        ReferenceCollection.organization_id == current_user.organization_id
    )
    col = (await db.execute(col_stmt)).scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    doc = ReferenceDocument(
        collection_id=data.collection_id,
        organization_id=current_user.organization_id,
        filename=data.title or data.url,
        file_type="url",
        source_url=data.url,
        status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    if settings.ENVIRONMENT == "test":
        await ReferenceService.process_document_pipeline(doc.id, db, current_user.organization_id)
    else:
        background_tasks.add_task(_run_doc_pipeline, doc.id, current_user.organization_id)

    return DocumentResponse.model_validate(doc)

@router.post("/text", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_text(
    data: ManualTextInput,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(["super_admin", "admin", "editor", "writer"])),
    db: AsyncSession = Depends(get_db)
):
    col_stmt = select(ReferenceCollection).where(
        ReferenceCollection.id == data.collection_id,
        ReferenceCollection.organization_id == current_user.organization_id
    )
    col = (await db.execute(col_stmt)).scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4()}_{data.title[:30]}.txt"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(data.text)

    doc = ReferenceDocument(
        collection_id=data.collection_id,
        organization_id=current_user.organization_id,
        filename=data.title,
        file_type="txt",
        file_path=file_path,
        status="pending"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    if settings.ENVIRONMENT == "test":
        await ReferenceService.process_document_pipeline(doc.id, db, current_user.organization_id)
    else:
        background_tasks.add_task(_run_doc_pipeline, doc.id, current_user.organization_id)

    return DocumentResponse.model_validate(doc)

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    collection_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ReferenceDocument).where(ReferenceDocument.organization_id == current_user.organization_id)
    if collection_id:
        stmt = stmt.where(ReferenceDocument.collection_id == collection_id)
    stmt = stmt.order_by(ReferenceDocument.created_at.desc())
    res = await db.execute(stmt)
    return [DocumentResponse.model_validate(d) for d in res.scalars().all()]

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ReferenceDocument).where(
        ReferenceDocument.id == document_id,
        ReferenceDocument.organization_id == current_user.organization_id
    )
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    an_stmt = select(ReferenceAnalysis).where(ReferenceAnalysis.document_id == doc.id)
    doc.analysis = (await db.execute(an_stmt)).scalar_one_or_none()
    
    return DocumentResponse.model_validate(doc)

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ReferenceDocument).where(
        ReferenceDocument.id == document_id,
        ReferenceDocument.organization_id == current_user.organization_id
    )
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await vector_store.delete_document_chunks(doc.id, current_user.organization_id)

    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
