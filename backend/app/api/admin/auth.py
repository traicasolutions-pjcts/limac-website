from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr

from app.config import Settings, get_settings
from app.database import db_dependency
from app.repositories.admin_users import AdminUserRepository
from app.security.passwords import verify_password
from app.security.tokens import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["admin-auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    repository = AdminUserRepository(db)
    admin = await repository.get_active_by_email(payload.email)
    if not admin or not verify_password(payload.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin email or password.",
        )

    refresh_token, refresh_token_hash = create_refresh_token()
    await repository.record_login(admin["_id"], refresh_token_hash)
    access_token = create_access_token(
        settings,
        subject=str(admin["_id"]),
        role=str(admin["role"]),
    )
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=str(admin["role"]),
    )


@router.post("/refresh")
async def refresh() -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Refresh is not implemented yet.")


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"status": "ok"}
