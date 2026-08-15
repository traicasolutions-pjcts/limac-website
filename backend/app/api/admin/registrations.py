import csv
import io
import json
from typing import Any

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import Settings, get_settings
from app.database import db_dependency
from app.models.enums import ProductStatus, RegistrationStatus, SerialValidationResult
from app.repositories.products import ProductRepository
from app.repositories.registrations import RegistrationRepository
from app.security.admin_auth import require_admin, require_super_admin
from app.storage.cloudinary_storage import StorageConfigurationError, build_cloudinary_bill_access
from app.utils.time import utc_now

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
    serial_number = ((document.get("product") or {}).get("serial_number")) or ""
    product = await ProductRepository(db).get_by_serial(str(serial_number))
    serial_validation = detail.get("serial_validation") or {}
    if product:
        serial_validation["result"] = (
            SerialValidationResult.FOUND_ALREADY_REGISTERED
            if product.get("status") == ProductStatus.REGISTERED
            else SerialValidationResult.FOUND_UNREGISTERED
        )
        serial_validation["matched_product_id"] = str(product.get("_id"))
        serial_validation["product_model"] = product.get("product_model")
        serial_validation["product_status"] = product.get("status")
    else:
        serial_validation["result"] = SerialValidationResult.NOT_FOUND
        serial_validation["matched_product_id"] = None
        serial_validation["product_model"] = None
        serial_validation["product_status"] = None
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
    repository = RegistrationRepository(db)
    if payload.status == RegistrationStatus.APPROVED:
        registration = await repository.get_by_id(registration_id)
        if not registration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
        serial_number = (registration.get("product") or {}).get("serial_number")
        product = await ProductRepository(db).get_by_serial(str(serial_number or ""))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Serial number is not recorded in Limac database. "
                    "Cross check the serial number in Limac database and add it to proceed."
                ),
            )
    updated = await repository.update_status(
        registration_id=registration_id,
        next_status=payload.status,
        admin_id=str(admin["_id"]),
        reason=payload.reason,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
    return {"id": registration_id, "status": updated["status"]}


@router.delete("/{registration_id}")
async def delete_registration(
    registration_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    admin: dict[str, Any] = Depends(require_super_admin),
) -> dict[str, str]:
    deleted = await RegistrationRepository(db).delete_by_id(registration_id, admin_id=str(admin["_id"]))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found.")
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
        "serial_normalized": _csv_value(product.get("serial_normalized")),
        "product_model_customer": _csv_value(product.get("product_model_customer")),
        "serial_validation_result": _csv_value(serial_validation.get("result")),
        "serial_validation_normalized": _csv_value(serial_validation.get("serial_normalized")),
        "purchase_date": _csv_value(purchase.get("purchase_date")),
        "warranty_expiry_date": _warranty_expiry_date(purchase.get("purchase_date")),
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


def _warranty_expiry_date(purchase_date: Any) -> str:
    if not purchase_date:
        return ""
    try:
        year, month, day = str(purchase_date).split("-")[:3]
        return f"{int(year) + 5:04d}-{month}-{day}"
    except (TypeError, ValueError):
        return ""
