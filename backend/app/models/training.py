from sqlalchemy import Column, String, Text, Boolean, Float, Integer, ForeignKey
from app.models.base import TimeStampedModel

class TrainingExample(TimeStampedModel):
    __tablename__ = "training_examples"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    reference_context = Column(Text, nullable=True)
    task_type = Column(String(100), nullable=False)  # blog, linkedin, twitter, outline, keywords, summary
    expected_output = Column(Text, nullable=False)
    platform = Column(String(50), nullable=True)
    writing_tone = Column(String(50), nullable=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    human_approved = Column(Boolean, default=False, nullable=False)
    quality_score = Column(Float, default=0.0, nullable=False)

class TrainingDataset(TimeStampedModel):
    __tablename__ = "training_datasets"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0.0", nullable=False)
    description = Column(Text, nullable=True)
    example_count = Column(Integer, default=0, nullable=False)
    jsonl_file_path = Column(String(1000), nullable=True)
    status = Column(String(50), default="ready", nullable=False)  # ready, exporting, exported, archived
