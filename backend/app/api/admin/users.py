from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.database import db_dependency
from app.models.enums import AdminRole
from app.repositories.admin_users import AdminUserRepository
from app.security.admin_auth import require_super_admin

router = APIRouter(prefix="/users", tags=["admin-users"])


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: AdminRole


class AdminUserPasswordResetRequest(BaseModel):
    password: str = Field(min_length=8)


class AdminUserResponse(BaseModel):
    id: str
    email: str
    role: str
    disabled_at: str | None = None
    last_login_at: str | None = None
    created_at: str | None = None


@router.get("", response_model=list[AdminUserResponse])
async def list_admin_users(
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_super_admin),
) -> list[AdminUserResponse]:
    users = await AdminUserRepository(db).list_users()
    return [_user_response(user) for user in users]


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    payload: AdminUserCreateRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_super_admin),
) -> AdminUserResponse:
    if payload.role not in {AdminRole.SUPER_ADMIN, AdminRole.APPROVER}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only SUPER_ADMIN and APPROVER manager users can be created from the admin UI.",
        )
    try:
        user = await AdminUserRepository(db).create_admin(
            email=payload.email,
            password=payload.password,
            role=payload.role,
        )
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An admin user with this email already exists.",
        ) from exc
    return _user_response(AdminUserRepository(db)._serialize_user(user))


@router.post("/{admin_user_id}/password", response_model=AdminUserResponse)
async def reset_admin_user_password(
    admin_user_id: str,
    payload: AdminUserPasswordResetRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    current_admin: dict[str, Any] = Depends(require_super_admin),
) -> AdminUserResponse:
    if str(current_admin["_id"]) == admin_user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Use a separate password change flow for your own account.",
        )
    user = await AdminUserRepository(db).reset_password(
        admin_id=admin_user_id,
        password=payload.password,
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found.")
    return _user_response(user)


def _user_response(user: dict[str, Any]) -> AdminUserResponse:
    return AdminUserResponse(
        id=str(user.get("_id")),
        email=str(user.get("email")),
        role=str(user.get("role")),
        disabled_at=user.get("disabled_at"),
        last_login_at=user.get("last_login_at"),
        created_at=user.get("created_at"),
    )
