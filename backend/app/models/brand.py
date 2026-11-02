from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class Brand(TimeStampedModel):
    __tablename__ = "brands"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=False)
    business_description = Column(Text, nullable=True)
    website_url = Column(String(500), nullable=True)
    target_audience = Column(Text, nullable=True)
    target_geographical_market = Column(String(255), nullable=True)
    preferred_language = Column(String(50), default="English", nullable=False)
    brand_voice = Column(String(100), default="Professional & Insightful", nullable=False)
    writing_tone = Column(String(100), default="Professional", nullable=False)
    communication_style = Column(String(100), default="Clear & Authoritative", nullable=False)
    content_objectives = Column(Text, nullable=True)
    preferred_cta_style = Column(String(255), default="Learn more with us", nullable=False)
    custom_instructions = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="brands")
    guidelines = relationship("BrandGuideline", back_populates="brand", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    collections = relationship("ReferenceCollection", back_populates="brand")
    contents = relationship("GeneratedContent", back_populates="brand")

class BrandGuideline(TimeStampedModel):
    __tablename__ = "brand_guidelines"

    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    restricted_words = Column(JSON, default=list, nullable=False)  # list of strings
    preferred_keywords = Column(JSON, default=list, nullable=False)  # list of strings
    competitors = Column(JSON, default=list, nullable=False)  # list of strings
    products_services = Column(JSON, default=list, nullable=False)  # list of dicts/strings

    brand = relationship("Brand", back_populates="guidelines")
