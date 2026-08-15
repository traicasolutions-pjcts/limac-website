from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.config import Settings, get_settings
from app.database import db_dependency
from app.repositories.admin_users import AdminUserRepository
from app.security.tokens import decode_access_token
from app.models.enums import AdminRole

bearer_scheme = HTTPBearer(auto_error=False)


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin login is required.")

    try:
        payload = decode_access_token(settings, credentials.credentials)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.") from exc

    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin session.")

    admin = await AdminUserRepository(db).get_active_by_id(ObjectId(payload["sub"]))
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin account is disabled.")
    return admin


def require_role(*allowed_roles: AdminRole):
    async def dependency(admin: dict[str, Any] = Depends(require_admin)) -> dict[str, Any]:
        if str(admin.get("role")) not in {str(role) for role in allowed_roles}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This action requires super admin access.",
            )
        return admin

    return dependency


require_super_admin = require_role(AdminRole.SUPER_ADMIN)
