from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field, field_validator

from app.database import db_dependency
from app.models.enums import AdminRole
from app.repositories.products import ProductRepository
from app.security.admin_auth import require_role
from app.utils.serials import normalize_serial

router = APIRouter(prefix="/products", tags=["admin-products"])

require_product_manager = require_role(AdminRole.APPROVER, AdminRole.SUPER_ADMIN)


class AdminProductCreateRequest(BaseModel):
    serial_number: str = Field(min_length=1, max_length=80)
    product_model: str = Field(min_length=1, max_length=120)
    sold_at: date | None = None

    @field_validator("serial_number")
    @classmethod
    def serial_must_normalize(cls, value: str) -> str:
        if not normalize_serial(value):
            raise ValueError("serial_number is required")
        return value

    @field_validator("sold_at")
    @classmethod
    def sold_date_must_not_be_future(cls, value: date | None) -> date | None:
        if value and value > date.today():
            raise ValueError("Sold date cannot be greater than today.")
        return value


class AdminProductResponse(BaseModel):
    id: str
    serial_number: str
    serial_normalized: str
    product_model: str
    sold_at: str | None = None
    status: str
    source_system: str | None = None
    updated_at: str | None = None


@router.get("", response_model=list[AdminProductResponse])
async def list_admin_products(
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_product_manager),
) -> list[AdminProductResponse]:
    products = await ProductRepository(db).list_products(search=search, limit=limit)
    return [_product_response(product) for product in products]


@router.post("", response_model=AdminProductResponse)
async def upsert_admin_product(
    payload: AdminProductCreateRequest,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict[str, Any] = Depends(require_product_manager),
) -> AdminProductResponse:
    product = await ProductRepository(db).upsert_manual(
        serial_number=payload.serial_number,
        product_model=payload.product_model,
        sold_at=payload.sold_at,
    )
    return _product_response(product)


def _product_response(product: dict[str, Any]) -> AdminProductResponse:
    return AdminProductResponse(
        id=str(product.get("id") or product.get("_id")),
        serial_number=str(product.get("serial_number")),
        serial_normalized=str(product.get("serial_normalized")),
        product_model=str(product.get("product_model")),
        sold_at=product.get("sold_at"),
        status=str(product.get("status")),
        source_system=product.get("source_system"),
        updated_at=product.get("updated_at"),
    )
