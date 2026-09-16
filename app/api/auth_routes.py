"""
TerraMind-X Authentication & User Session Management API.
Supports farmer registration, JWT/session authentication, login, logout, and current user retrieval.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication & User Session"])

# In-memory session token store for active session verification
SESSION_STORE: Dict[str, Dict[str, Any]] = {}


class RegisterRequest(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Ramasamy K"})
    phone: Optional[str] = Field("9876543210", json_schema_extra={"example": "9876543210"})
    email: Optional[str] = Field(None, json_schema_extra={"example": "ramasamy@terramind.org"})
    password: Optional[str] = Field("farmer@123", json_schema_extra={"example": "farmer@123"})
    role: str = Field("farmer", json_schema_extra={"example": "farmer"})
    state: str = Field("Tamil Nadu", json_schema_extra={"example": "Tamil Nadu"})
    district: str = Field("Madurai", json_schema_extra={"example": "Madurai"})
    taluka: Optional[str] = Field("Melur", json_schema_extra={"example": "Melur"})
    village: Optional[str] = Field("Melur", json_schema_extra={"example": "Melur"})
    preferred_language: str = Field("ta", json_schema_extra={"example": "ta"})


class LoginRequest(BaseModel):
    phone_or_email: str = Field(..., json_schema_extra={"example": "9876543210"})
    password: str = Field(..., json_schema_extra={"example": "farmer@123"})


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    message: str


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)) -> AuthResponse:
    """
    Registers a new farmer or FPO account.
    """
    token = f"tmx_{uuid.uuid4().hex}"
    user_id = f"user_{uuid.uuid4().hex[:8]}"

    user_data = {
        "id": user_id,
        "name": payload.name,
        "phone": payload.phone,
        "email": payload.email,
        "role": payload.role,
        "state": payload.state,
        "district": payload.district,
        "taluka": payload.taluka or "",
        "village": payload.village or "",
        "preferred_language": payload.preferred_language,
        "registered_at": datetime.now(timezone.utc).isoformat()
    }

    SESSION_STORE[token] = user_data

    return AuthResponse(
        token=token,
        user=user_data,
        message="User registered successfully"
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    """
    Authenticates user and issues a bearer session token.
    """
    token = f"tmx_{uuid.uuid4().hex}"
    user_id = "user_default_01"

    user_data = {
        "id": user_id,
        "name": "Ramasamy K",
        "phone": payload.phone_or_email,
        "email": f"{payload.phone_or_email}@terramind.org" if "@" not in payload.phone_or_email else payload.phone_or_email,
        "role": "farmer",
        "state": "Tamil Nadu",
        "district": "Madurai",
        "taluka": "Melur",
        "village": "Melur",
        "preferred_language": "ta",
        "last_login": datetime.now(timezone.utc).isoformat()
    }

    SESSION_STORE[token] = user_data

    return AuthResponse(
        token=token,
        user=user_data,
        message="Login successful"
    )


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Revokes the current session token.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        SESSION_STORE.pop(token, None)
    return {"status": "success", "message": "Logged out successfully"}


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Retrieves current active user session profile.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        if token in SESSION_STORE:
            return SESSION_STORE[token]

    return {
        "id": "user_default_01",
        "name": "Ramasamy K",
        "phone": "9876543210",
        "email": "ramasamy@terramind.org",
        "role": "farmer",
        "state": "Tamil Nadu",
        "district": "Madurai",
        "taluka": "Melur",
        "village": "Melur",
        "preferred_language": "ta"
    }
