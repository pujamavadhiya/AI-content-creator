from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class ReferenceCollection(TimeStampedModel):
    __tablename__ = "reference_collections"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reference_count = Column(Integer, default=0, nullable=False)

    organization = relationship("Organization", back_populates="collections")
    brand = relationship("Brand", back_populates="collections")
    documents = relationship("ReferenceDocument", back_populates="collection", cascade="all, delete-orphan")

class ReferenceDocument(TimeStampedModel):
    __tablename__ = "reference_documents"

    collection_id = Column(String(36), ForeignKey("reference_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt, md, excel, url, text, youtube
    source_url = Column(String(1000), nullable=True)
    file_path = Column(String(1000), nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    word_count = Column(Integer, default=0, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)

    collection = relationship("ReferenceCollection", back_populates="documents")
    chunks = relationship("ReferenceChunk", back_populates="document", cascade="all, delete-orphan")
    analysis = relationship("ReferenceAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan", lazy="selectin")

class ReferenceChunk(TimeStampedModel):
    __tablename__ = "reference_chunks"

    document_id = Column(String(36), ForeignKey("reference_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    collection_id = Column(String(36), ForeignKey("reference_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    vector_id = Column(String(100), nullable=True, index=True)
    token_count = Column(Integer, default=0, nullable=False)

    document = relationship("ReferenceDocument", back_populates="chunks")

class ReferenceAnalysis(TimeStampedModel):
    __tablename__ = "reference_analysis"

    document_id = Column(String(36), ForeignKey("reference_documents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    main_subject = Column(String(500), nullable=False)
    key_themes = Column(JSON, default=list, nullable=False)
    main_arguments = Column(JSON, default=list, nullable=False)
    important_facts = Column(JSON, default=list, nullable=False)
    important_entities = Column(JSON, default=list, nullable=False)
    industry_terminology = Column(JSON, default=list, nullable=False)
    primary_keywords = Column(JSON, default=list, nullable=False)
    secondary_keywords = Column(JSON, default=list, nullable=False)
    search_intent = Column(String(100), nullable=True)
    target_audience = Column(String(255), nullable=True)
    writing_tone = Column(String(100), nullable=True)
    content_structure = Column(JSON, default=list, nullable=False)
    recurring_topics = Column(JSON, default=list, nullable=False)
    knowledge_gaps = Column(JSON, default=list, nullable=False)
    content_opportunities = Column(JSON, default=list, nullable=False)

    document = relationship("ReferenceDocument", back_populates="analysis")
