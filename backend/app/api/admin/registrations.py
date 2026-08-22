import csv
import io
import json
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.database import db_dependency
from app.models.enums import ProductStatus, RegistrationStatus, SerialValidationResult
from app.repositories.products import ProductRepository
from app.repositories.registrations import RegistrationRepository
from app.security.admin_auth import require_admin, require_super_admin
from app.services.registrations import registration_component_serials, release_registration_components
from app.storage.cloudinary_storage import (
    StorageConfigurationError,
    StorageDownloadError,
    build_cloudinary_bill_access,
    download_bill_from_cloudinary,
)
from app.utils.time import utc_now

router = APIRouter(prefix="/registrations", tags=["admin-registrations"])


class StatusUpdateRequest(BaseModel):
    status: RegistrationStatus
    reason: str | None = None
    warranty_expiry_date: date | None = None


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


@router.get("/export.csv")
async def export_registrations_csv(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_super_admin),
) -> StreamingResponse:
    rows = await RegistrationRepository(db).list_export_documents(
        status=status_filter,
        search=search,
    )
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_EXPORT_FIELDS, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(_registration_csv_row(row))
    output.seek(0)
    filename = f"limac-warranty-registrations-{utc_now().strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{registration_id}")
async def get_registration(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_admin),
) -> dict[str, Any]:
    document = await RegistrationRepository(db).get_by_id(registration_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    detail = RegistrationRepository(db).serialize_admin_detail(document)
    serial_numbers = registration_component_serials(document)
    serial_validation = detail.get("serial_validation") or {}
    component_validations = []
    for serial_number in serial_numbers:
        product = await ProductRepository(db).get_by_serial(str(serial_number))
        if product:
            result = (
                SerialValidationResult.FOUND_ALREADY_REGISTERED
                if product.get("status") == ProductStatus.REGISTERED
                else SerialValidationResult.FOUND_UNREGISTERED
            )
            component_validations.append({
                "serial_number": serial_number,
                "serial_normalized": product.get("serial_normalized"),
                "result": result,
                "matched_product_id": str(product.get("_id")),
                "product_model": product.get("product_model"),
                "product_status": product.get("status"),
            })
        else:
            component_validations.append({
                "serial_number": serial_number,
                "serial_normalized": None,
                "result": SerialValidationResult.NOT_FOUND,
                "matched_product_id": None,
                "product_model": None,
                "product_status": None,
            })
    serial_validation["components"] = component_validations
    if component_validations:
        serial_validation["result"] = _component_validation_summary(component_validations)
        serial_validation["matched_product_id"] = component_validations[0].get("matched_product_id")
        serial_validation["product_model"] = component_validations[0].get("product_model")
        serial_validation["product_status"] = component_validations[0].get("product_status")
    detail["serial_validation"] = serial_validation
    return detail


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
    if payload.status == RegistrationStatus.APPROVED and not payload.warranty_expiry_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Warranty expiry date is required for approval.",
        )
    repository = RegistrationRepository(db)
    product_repository = ProductRepository(db)
    registration = None
    if payload.status == RegistrationStatus.APPROVED:
        registration = await repository.get_by_id(registration_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
        serial_numbers = registration_component_serials(registration)
        purchase_date = _coerce_date((registration.get("purchase") or {}).get("purchase_date"))
        if isinstance(purchase_date, date) and payload.warranty_expiry_date < purchase_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Warranty expiry date cannot be earlier than purchase date.",
            )
        products = []
        missing_serials = []
        for serial_number in serial_numbers:
            product = await product_repository.get_by_serial(str(serial_number))
            if product:
                products.append((serial_number, product))
            else:
                missing_serials.append(serial_number)
        if missing_serials:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Serial number is not recorded in Limac database: "
                    f"{', '.join(missing_serials)}. Cross check the serial number in Limac database "
                    "and add it to proceed."
                ),
            )
        for serial_number, product in products:
            if product.get("status") == ProductStatus.REGISTERED:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Warranty is already assigned for serial number {serial_number}.",
                )
            if product.get("status") in {ProductStatus.BLOCKED, ProductStatus.REPLACED}:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Serial number {serial_number} is not eligible for warranty approval.",
                )
            pending_registration_number = product.get("pending_registration_number")
            if (
                product.get("status") == ProductStatus.REGISTRATION_PENDING
                and pending_registration_number
                and pending_registration_number != registration.get("registration_number")
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "A warranty registration request is already open for serial number "
                        f"{serial_number}."
                    ),
                )
    updated = await repository.update_status(
        registration_id=registration_id,
        next_status=payload.status,
        admin_id=str(admin["_id"]),
        reason=payload.reason,
        warranty_expiry_date=payload.warranty_expiry_date,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    serial_numbers = registration_component_serials(updated)
    if payload.status == RegistrationStatus.APPROVED and serial_numbers:
        for serial_number in serial_numbers:
            registered = await product_repository.mark_registered(str(serial_number))
            if not registered:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "Unable to assign warranty because serial number "
                        f"{serial_number} is not eligible."
                    ),
                )
    if payload.status in {RegistrationStatus.REJECTED, RegistrationStatus.CANCELLED}:
        await release_registration_components(product_repository, updated)
    return {"id": registration_id, "status": updated["status"]}


@router.delete("/{registration_id}")
async def delete_registration(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    admin: dict[str, Any] = Depends(require_super_admin),
) -> dict[str, str]:
    repository = RegistrationRepository(db)
    document = await repository.get_by_id(registration_id)
    deleted = await repository.delete_by_id(registration_id, admin_id=str(admin["_id"]))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    if document:
        await release_registration_components(ProductRepository(db), document)
    return {"id": registration_id, "status": "deleted"}


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
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Unsupported bill storage provider. Bills must be stored in Cloudinary, not MongoDB.",
    )


@router.get("/{registration_id}/bill-file")
async def bill_file(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    settings: Settings = Depends(get_settings),
    _: dict[str, Any] = Depends(require_admin),
) -> Response:
    document = await RegistrationRepository(db).get_by_id(registration_id)
    if not document or not document.get("bill_asset"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found.")
    asset = document["bill_asset"]
    if asset.get("provider") != "cloudinary":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported bill storage provider. Bills must be stored in Cloudinary, not MongoDB.",
        )
    try:
        content, content_type, filename = await download_bill_from_cloudinary(settings, asset)
    except StorageConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except StorageDownloadError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    safe_filename = str(filename).replace('"', "")
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{safe_filename}"'},
    )


CSV_EXPORT_FIELDS = [
    "registration_number",
    "status",
    "submitted_at",
    "review_started_at",
    "reviewed_at",
    "customer_name",
    "customer_mobile",
    "customer_address_line",
    "customer_city",
    "customer_state",
    "customer_pin_code",
    "serial_number",
    "component_serial_numbers",
    "serial_normalized",
    "product_model_customer",
    "serial_validation_result",
    "serial_validation_normalized",
    "purchase_date",
    "warranty_expiry_date",
    "invoice_number",
    "dealer_name",
    "dealer_code",
    "bill_provider",
    "bill_filename",
    "bill_content_type",
    "bill_public_id",
    "bill_folder",
    "bill_uploaded_at",
    "decision_history",
]


def _registration_csv_row(row: dict[str, Any]) -> dict[str, str]:
    customer = row.get("customer") or {}
    product = row.get("product") or {}
    purchase = row.get("purchase") or {}
    bill_asset = row.get("bill_asset") or {}
    serial_validation = row.get("serial_validation") or {}
    component_serials = registration_component_serials(row)
    return {
        "registration_number": _csv_value(row.get("registration_number")),
        "status": _csv_value(row.get("status")),
        "submitted_at": _csv_value(row.get("submitted_at")),
        "review_started_at": _csv_value(row.get("review_started_at")),
        "reviewed_at": _csv_value(row.get("reviewed_at")),
        "customer_name": _csv_value(customer.get("name")),
        "customer_mobile": _csv_value(customer.get("mobile_number")),
        "customer_address_line": _csv_value(customer.get("address_line")),
        "customer_city": _csv_value(customer.get("city")),
        "customer_state": _csv_value(customer.get("state")),
        "customer_pin_code": _csv_value(customer.get("pin_code")),
        "serial_number": _csv_value(product.get("serial_number")),
        "component_serial_numbers": "; ".join(component_serials),
        "serial_normalized": _csv_value(product.get("serial_normalized")),
        "product_model_customer": _csv_value(product.get("product_model_customer")),
        "serial_validation_result": _csv_value(serial_validation.get("result")),
        "serial_validation_normalized": _csv_value(serial_validation.get("serial_normalized")),
        "purchase_date": _csv_value(purchase.get("purchase_date")),
        "warranty_expiry_date": _csv_value(purchase.get("warranty_expiry_date")),
        "invoice_number": _csv_value(purchase.get("invoice_number")),
        "dealer_name": _csv_value(purchase.get("dealer_name")),
        "dealer_code": _csv_value(purchase.get("dealer_code")),
        "bill_provider": _csv_value(bill_asset.get("provider")),
        "bill_filename": _csv_value(bill_asset.get("filename")),
        "bill_content_type": _csv_value(bill_asset.get("content_type")),
        "bill_public_id": _csv_value(bill_asset.get("public_id")),
        "bill_folder": _csv_value(bill_asset.get("folder")),
        "bill_uploaded_at": _csv_value(bill_asset.get("uploaded_at")),
        "decision_history": json.dumps(row.get("decision_history") or [], ensure_ascii=True),
    }


def _csv_value(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def _component_validation_summary(components: list[dict[str, Any]]) -> SerialValidationResult:
    results = {component.get("result") for component in components}
    if SerialValidationResult.NOT_FOUND in results:
        return SerialValidationResult.NOT_FOUND
    if SerialValidationResult.FOUND_ALREADY_REGISTERED in results:
        return SerialValidationResult.FOUND_ALREADY_REGISTERED
    if SerialValidationResult.VALIDATION_NOT_AVAILABLE in results:
        return SerialValidationResult.VALIDATION_NOT_AVAILABLE
    return SerialValidationResult.FOUND_UNREGISTERED


def _coerce_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None

