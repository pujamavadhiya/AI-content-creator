from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class GeneratedContent(TimeStampedModel):
    __tablename__ = "generated_contents"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    outline_id = Column(String(36), ForeignKey("content_outlines.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(500), nullable=False)
    content_type = Column(String(50), nullable=False)  # blog, linkedin, instagram, facebook, twitter_thread, multi
    platform = Column(String(50), nullable=False)      # Blog, LinkedIn, Instagram, Facebook, Twitter, Multi
    body = Column(Text, nullable=False)
    word_count = Column(Integer, default=0, nullable=False)
    character_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # idea, researching, outline_approved, draft, under_review, approved, scheduled, published
    is_archived = Column(Integer, default=0, nullable=False)
    
    # Platform-specific or multi-output structured metadata (slides, threads, hashtags, visual concept)
    metadata_json = Column(JSON, default=dict, nullable=False)

    organization = relationship("Organization", back_populates="contents")
    brand = relationship("Brand", back_populates="contents")
    outline = relationship("ContentOutline", back_populates="contents")
    versions = relationship("ContentVersion", back_populates="content", cascade="all, delete-orphan", order_by="desc(ContentVersion.version_number)")
    evaluations = relationship("ContentEvaluation", back_populates="content", cascade="all, delete-orphan", order_by="desc(ContentEvaluation.created_at)")
    calendar_entries = relationship("ContentCalendar", back_populates="content", cascade="all, delete-orphan")

class ContentVersion(TimeStampedModel):
    __tablename__ = "content_versions"

    content_id = Column(String(36), ForeignKey("generated_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    change_summary = Column(String(500), nullable=True)
    created_by = Column(String(255), nullable=True)

    content = relationship("GeneratedContent", back_populates="versions")

class ContentEvaluation(TimeStampedModel):
    __tablename__ = "content_evaluations"

    content_id = Column(String(36), ForeignKey("generated_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Float, nullable=False)
    dimension_scores = Column(JSON, default=dict, nullable=False)
    issues_identified = Column(JSON, default=list, nullable=False)
    suggested_improvements = Column(JSON, default=list, nullable=False)
    unsupported_claims = Column(JSON, default=list, nullable=False)
    missing_information = Column(JSON, default=list, nullable=False)

    content = relationship("GeneratedContent", back_populates="evaluations")

class ContentCalendar(TimeStampedModel):
    __tablename__ = "content_calendar"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    content_id = Column(String(36), ForeignKey("generated_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    platform = Column(String(50), nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)  # draft, scheduled, published
    notes = Column(Text, nullable=True)

    content = relationship("GeneratedContent", back_populates="calendar_entries")
