from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON
from app.models.base import TimeStampedModel

class UsageLog(TimeStampedModel):
    __tablename__ = "usage_logs"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    task_type = Column(String(100), nullable=False)  # reference_analysis, keywords, topics, outline, blog, social, quality
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)

class ActivityLog(TimeStampedModel):
    __tablename__ = "activity_logs"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # created_brand, ingested_document, generated_blog, etc.
    entity_type = Column(String(100), nullable=False)  # brand, document, content, calendar, etc.
    entity_id = Column(String(36), nullable=True)
    details = Column(JSON, default=dict, nullable=False)

