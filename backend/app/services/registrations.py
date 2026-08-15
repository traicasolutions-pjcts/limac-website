from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.enums import RegistrationStatus
from app.models.enums import ProductStatus
from app.repositories.products import ProductRepository
from app.repositories.registrations import RegistrationRepository
from app.schemas.registrations import (
    StatusLookupRequest,
    StatusLookupResponse,
    WarrantyRegistrationCreate,
    WarrantyRegistrationCreated,
)
from app.utils.masking import mask_mobile, mask_serial, normalize_mobile
from app.utils.serials import normalize_serial


class RegistrationSerialError(RuntimeError):
    pass


async def create_warranty_registration(
    db: AsyncIOMotorDatabase,
    payload: WarrantyRegistrationCreate,
    *,
    idempotency_key: str | None,
) -> WarrantyRegistrationCreated:
    repository = RegistrationRepository(db)
    product_repository = ProductRepository(db)
    existing_product = await product_repository.get_by_serial(payload.serial_number)
    reserved_product = None
    if existing_product:
        product_status = existing_product.get("status")
        if product_status == ProductStatus.REGISTERED:
            raise RegistrationSerialError("Warranty is already assigned for this serial number.")
        if product_status == ProductStatus.REGISTRATION_PENDING:
            raise RegistrationSerialError("A warranty registration request is already open for this serial number.")
        if product_status != ProductStatus.AVAILABLE:
            raise RegistrationSerialError("This serial number is not eligible for warranty registration.")
        reserved_product = await product_repository.reserve_for_registration(payload.serial_number)
        if not reserved_product:
            raise RegistrationSerialError("A warranty registration request is already open for this serial number.")

    try:
        document = await repository.create_pending(
            payload,
            idempotency_key=idempotency_key,
            serial_validation_snapshot={
                "result": None,
                "checked_at": None,
                "serial_normalized": normalize_serial(payload.serial_number),
                "matched_product_id": str(reserved_product.get("_id")) if reserved_product else None,
                "existing_warranty_id": None,
            },
        )
    except Exception:
        if reserved_product:
            await product_repository.release_pending_registration(payload.serial_number)
        raise
    if reserved_product:
        await product_repository.attach_pending_registration(
            payload.serial_number,
            document["registration_number"],
        )
    return WarrantyRegistrationCreated(
        registration_number=document["registration_number"],
        status=RegistrationStatus(document["status"]),
        submitted_at=document["submitted_at"],
    )


async def lookup_registration_status(
    db: AsyncIOMotorDatabase,
    payload: StatusLookupRequest,
) -> StatusLookupResponse | None:
    document = await RegistrationRepository(db).get_status_candidate(payload.registration_reference)
    if not document:
        return None

    customer = document.get("customer", {})
    product = document.get("product", {})
    mobile_matches = (
        payload.mobile_number
        and normalize_mobile(payload.mobile_number) == customer.get("mobile_normalized")
    )
    serial_matches = (
        payload.serial_number
        and normalize_serial(payload.serial_number) == product.get("serial_normalized")
    )
    if not mobile_matches and not serial_matches:
        return None

    return StatusLookupResponse(
        registration_reference=document["registration_number"],
        status=RegistrationStatus(document["status"]),
        submitted_at=document.get("submitted_at"),
        masked_mobile=mask_mobile(customer.get("mobile_number", "")),
        masked_serial=mask_serial(product.get("serial_number", "")),
        warranty_number=document.get("warranty_number"),
        message=_status_message(document),
    )


def _status_message(document: dict[str, Any]) -> str | None:
    history = document.get("decision_history") or []
    if not history:
        return None
    latest = history[-1]
    return latest.get("reason") or latest.get("message")
