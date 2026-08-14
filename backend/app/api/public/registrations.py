from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import Settings, get_settings
from app.models.enums import RegistrationStatus
from app.database import db_dependency
from app.repositories.registrations import RegistrationRepository
from app.schemas.registrations import (
    StatusLookupRequest,
    StatusLookupResponse,
    WarrantyRegistrationCreate,
    WarrantyRegistrationCreated,
)
from app.services.captcha import CaptchaVerificationError, verify_turnstile_token
from app.services.registrations import create_warranty_registration, lookup_registration_status
from app.storage.cloudinary_storage import (
    StorageConfigurationError,
    StorageUploadError,
    upload_bill_to_cloudinary,
)
from app.utils.time import utc_now

router = APIRouter(prefix="/warranty-registrations", tags=["public-registrations"])


@router.post("", response_model=WarrantyRegistrationCreated, status_code=status.HTTP_202_ACCEPTED)
async def create_registration(
    payload: WarrantyRegistrationCreate,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
) -> WarrantyRegistrationCreated:
    if not payload.warranty_terms_consent or not payload.privacy_policy_consent:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Warranty terms and privacy policy consent are required.",
        )
    try:
        await verify_turnstile_token(
            settings,
            payload.turnstile_token,
            request.client.host if request.client else None,
        )
    except CaptchaVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return await create_warranty_registration(
        db,
        payload,
        idempotency_key=idempotency_key,
    )


@router.post("/status-lookup", response_model=StatusLookupResponse)
async def status_lookup(
    payload: StatusLookupRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
) -> StatusLookupResponse:
    if not payload.mobile_number and not payload.serial_number:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either registered mobile number or product serial number.",
        )
    result = await lookup_registration_status(db, payload)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registration matched the provided details.",
        )
    return result


@router.post("/{reference}/documents")
async def upload_registration_document(
    reference: str,
    bill: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    allowed_types = {"image/jpeg", "image/png", "application/pdf"}
    if bill.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPG, PNG or PDF bill.",
        )
    content = await bill.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded bill file is empty.")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Maximum file size allowed is 2 MB.",
        )
    signature_ok = (
        content.startswith(b"\xff\xd8\xff")
        or content.startswith(b"\x89PNG\r\n\x1a\n")
        or content.startswith(b"%PDF-")
    )
    if not signature_ok:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Uploaded bill file does not match JPG, PNG or PDF content.",
        )

    try:
        bill_asset = await upload_bill_to_cloudinary(
            settings=settings,
            reference=reference,
            filename=bill.filename,
            content_type=bill.content_type,
            content=content,
        )
    except StorageConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except StorageUploadError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    updated = await RegistrationRepository(db).attach_bill(reference, bill_asset)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration reference not found.")
    return {
        "reference": reference,
        "status": RegistrationStatus.PENDING,
        "received_at": utc_now().isoformat(),
        "message": "Bill uploaded.",
    }
