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
    serial_numbers = payload.component_serial_numbers()
    existing_products: list[tuple[str, dict[str, Any] | None]] = []
    reserved_products: list[dict[str, Any]] = []
    reserved_serials: list[str] = []
    for serial_number in serial_numbers:
        existing_product = await product_repository.get_by_serial(serial_number)
        if not existing_product:
            existing_products.append((serial_number, None))
            continue
        product_status = existing_product.get("status")
        if product_status == ProductStatus.REGISTERED:
            raise RegistrationSerialError(f"Warranty is already assigned for serial number {serial_number}.")
        if product_status == ProductStatus.REGISTRATION_PENDING:
            raise RegistrationSerialError(
                f"A warranty registration request is already open for serial number {serial_number}."
            )
        if product_status != ProductStatus.AVAILABLE:
            raise RegistrationSerialError(f"Serial number {serial_number} is not eligible for warranty registration.")
        existing_products.append((serial_number, existing_product))

    try:
        for serial_number, existing_product in existing_products:
            if not existing_product:
                continue
            reserved_product = await product_repository.reserve_for_registration(serial_number)
            if not reserved_product:
                raise RegistrationSerialError(
                    f"A warranty registration request is already open for serial number {serial_number}."
                )
            reserved_products.append(reserved_product)
            reserved_serials.append(serial_number)
    except Exception:
        for serial_number in reserved_serials:
            await product_repository.release_pending_registration(serial_number)
        raise

    reserved_by_serial = {
        normalize_serial(str(product.get("serial_number"))): product
        for product in reserved_products
    }
    validation_components = [
        {
            "serial_number": serial_number,
            "serial_normalized": normalize_serial(serial_number),
            "matched_product_id": (
                str(reserved_by_serial[normalize_serial(serial_number)].get("_id"))
                if normalize_serial(serial_number) in reserved_by_serial
                else None
            ),
        }
        for serial_number in serial_numbers
    ]

    try:
        document = await repository.create_pending(
            payload,
            idempotency_key=idempotency_key,
            serial_validation_snapshot={
                "result": None,
                "checked_at": None,
                "serial_normalized": normalize_serial(serial_numbers[0]),
                "matched_product_id": validation_components[0].get("matched_product_id")
                if validation_components
                else None,
                "existing_warranty_id": None,
                "components": validation_components,
            },
        )
    except Exception:
        for serial_number in reserved_serials:
            await product_repository.release_pending_registration(serial_number)
        raise
    if reserved_products:
        for serial_number in reserved_serials:
            await product_repository.attach_pending_registration(
                serial_number,
                document["registration_number"],
            )
    return WarrantyRegistrationCreated(
        registration_number=document["registration_number"],
        status=RegistrationStatus(document["status"]),
        submitted_at=document["submitted_at"],
    )


def registration_component_serials(document: dict[str, Any]) -> list[str]:
    product = document.get("product") or {}
    components = product.get("components") or []
    serials = [
        str(component.get("serial_number"))
        for component in components
        if isinstance(component, dict) and component.get("serial_number")
    ]
    if serials:
        return serials
    serial_number = product.get("serial_number")
    return [str(serial_number)] if serial_number else []


async def release_registration_components(
    product_repository: ProductRepository,
    document: dict[str, Any],
) -> None:
    for serial_number in registration_component_serials(document):
        await product_repository.release_pending_registration(
            serial_number,
            document.get("registration_number"),
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
        and normalize_serial(payload.serial_number)
        in {normalize_serial(serial_number) for serial_number in registration_component_serials(document)}
    )
    if not mobile_matches and not serial_matches:
        return None

    return StatusLookupResponse(
        registration_reference=document["registration_number"],
        status=RegistrationStatus(document["status"]),
        submitted_at=document.get("submitted_at"),
        masked_mobile=mask_mobile(customer.get("mobile_number", "")),
        masked_serial=mask_serial(payload.serial_number or product.get("serial_number", "")),
        warranty_number=document.get("warranty_number"),
        message=_status_message(document),
    )


def _status_message(document: dict[str, Any]) -> str | None:
    history = document.get("decision_history") or []
    if not history:
        return None
    latest = history[-1]
    return latest.get("reason") or latest.get("message")
