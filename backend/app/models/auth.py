from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class Organization(TimeStampedModel):
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    plan = Column(String(50), default="pro", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    brands = relationship("Brand", back_populates="organization", cascade="all, delete-orphan")
    collections = relationship("ReferenceCollection", back_populates="organization", cascade="all, delete-orphan")
    contents = relationship("GeneratedContent", back_populates="organization", cascade="all, delete-orphan")

class User(TimeStampedModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="writer", nullable=False)  # super_admin, admin, editor, writer, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    organization = relationship("Organization", back_populates="users")

class OrganizationMember(TimeStampedModel):
    __tablename__ = "organization_members"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="writer", nullable=False)
