from typing import Any

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import Settings, get_settings
from app.database import db_dependency
from app.models.enums import RegistrationStatus
from app.repositories.registrations import RegistrationRepository
from app.security.admin_auth import require_admin
from app.storage.cloudinary_storage import StorageConfigurationError, build_cloudinary_bill_access

router = APIRouter(prefix="/registrations", tags=["admin-registrations"])


class StatusUpdateRequest(BaseModel):
    status: RegistrationStatus
    reason: str | None = None


@router.get("")
async def list_registrations(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_admin),
) -> dict[str, object]:
    rows = await RegistrationRepository(db).list_for_admin(
        status=status_filter,
        search=search,
        limit=limit,
        skip=skip,
    )
    return {"items": rows, "limit": limit, "skip": skip}


@router.get("/{registration_id}")
async def get_registration(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_admin),
) -> dict[str, Any]:
    document = await RegistrationRepository(db).get_by_id(registration_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    return RegistrationRepository(db).serialize_admin_detail(document)


@router.post("/{registration_id}/status")
async def update_registration_status(
    registration_id: str,
    payload: StatusUpdateRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    admin: dict[str, Any] = Depends(require_admin),
) -> dict[str, Any]:
    if payload.status in {
        RegistrationStatus.REJECTED,
        RegistrationStatus.MORE_INFORMATION_REQUIRED,
    } and not payload.reason:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Reason is required.")
    updated = await RegistrationRepository(db).update_status(
        registration_id=registration_id,
        next_status=payload.status,
        admin_id=str(admin["_id"]),
        reason=payload.reason,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    return {"id": registration_id, "status": updated["status"]}


@router.post("/{registration_id}/start-review")
async def start_review(registration_id: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Not implemented: {registration_id}")


@router.post("/{registration_id}/approve")
async def approve(registration_id: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Not implemented: {registration_id}")


@router.post("/{registration_id}/reject")
async def reject(registration_id: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Not implemented: {registration_id}")


@router.post("/{registration_id}/request-information")
async def request_information(registration_id: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=f"Not implemented: {registration_id}")


@router.get("/{registration_id}/bill-access")
async def bill_access(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
    _: dict[str, Any] = Depends(require_admin),
) -> dict[str, str]:
    document = await RegistrationRepository(db).get_by_id(registration_id)
    if not document or not document.get("bill_asset"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found.")
    asset = document["bill_asset"]
    if asset.get("provider") == "cloudinary":
        try:
            return build_cloudinary_bill_access(settings, asset)
        except StorageConfigurationError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    if asset.get("data_base64") and asset.get("content_type"):
        return {
            "filename": asset.get("filename") or "bill",
            "content_type": asset["content_type"],
            "url": f"data:{asset['content_type']};base64,{asset['data_base64']}",
        }
    raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported bill storage provider.")
