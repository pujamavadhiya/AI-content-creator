from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    created_at: datetime

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
