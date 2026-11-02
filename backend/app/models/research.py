from sqlalchemy import Column, String, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class Keyword(TimeStampedModel):
    __tablename__ = "keywords"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    collection_id = Column(String(36), ForeignKey("reference_collections.id", ondelete="SET NULL"), nullable=True, index=True)
    
    keyword = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # primary, secondary, long-tail, semantic, related, question, commercial, informational, transactional, navigational
    search_intent = Column(String(50), nullable=False)  # informational, navigational, commercial, transactional
    relevance_score = Column(Float, default=1.0, nullable=False)
    related_topic = Column(String(255), nullable=True)
    suggested_content_type = Column(String(100), nullable=True)
    supporting_reference = Column(Text, nullable=True)
    search_volume = Column(String(50), default="Unavailable", nullable=False)  # Unfabricated
    difficulty = Column(String(50), default="Unavailable", nullable=False)     # Unfabricated

class Topic(TimeStampedModel):
    __tablename__ = "topics"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    collection_id = Column(String(36), ForeignKey("reference_collections.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    primary_keyword = Column(String(255), nullable=False)
    secondary_keywords = Column(JSON, default=list, nullable=False)
    search_intent = Column(String(100), nullable=False)
    target_audience = Column(String(255), nullable=True)
    content_angle = Column(String(255), nullable=True)
    content_format = Column(String(100), nullable=False)  # how-to, listicle, tutorial, comparison, case-study, insights, educational, opinion, thought-leadership, news-analysis, product, faq
    suggested_cta = Column(String(255), nullable=True)
    relevance_score = Column(Float, default=1.0, nullable=False)
    supporting_reference_info = Column(Text, nullable=True)
    recommended_platform = Column(String(100), default="Blog", nullable=False)
    status = Column(String(50), default="suggested", nullable=False)  # suggested, approved, rejected, in_outline, completed

    outlines = relationship("ContentOutline", back_populates="topic", cascade="all, delete-orphan")

class TopicCluster(TimeStampedModel):
    __tablename__ = "topic_clusters"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    pillar_topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_name = Column(String(255), nullable=False)
    supporting_topic_ids = Column(JSON, default=list, nullable=False)
    related_keywords = Column(JSON, default=list, nullable=False)
    internal_linking_strategy = Column(Text, nullable=True)

    pillar_topic = relationship("Topic")

class ContentOutline(TimeStampedModel):
    __tablename__ = "content_outlines"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(500), nullable=False)
    seo_title_suggestions = Column(JSON, default=list, nullable=False)
    primary_keyword = Column(String(255), nullable=False)
    secondary_keywords = Column(JSON, default=list, nullable=False)
    search_intent = Column(String(100), nullable=False)
    target_audience = Column(String(255), nullable=True)
    content_objective = Column(Text, nullable=True)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(String(500), nullable=True)
    url_slug_suggestion = Column(String(255), nullable=True)
    introduction_structure = Column(Text, nullable=True)
    h1_heading = Column(String(500), nullable=False)
    headings_hierarchy = Column(JSON, default=list, nullable=False)  # [{"h2": "...", "h3": ["..."], "points": ["..."]}]
    suggested_examples = Column(JSON, default=list, nullable=False)
    faqs = Column(JSON, default=list, nullable=False)  # [{"q": "...", "a_outline": "..."}]
    conclusion_structure = Column(Text, nullable=True)
    cta = Column(String(500), nullable=True)
    internal_links_suggested = Column(JSON, default=list, nullable=False)
    supporting_references = Column(JSON, default=list, nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # draft, approved, rejected, used

    topic = relationship("Topic", back_populates="outlines")
    contents = relationship("GeneratedContent", back_populates="outline")
