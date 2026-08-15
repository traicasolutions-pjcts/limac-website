from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import ProductStatus, SerialValidationResult
from app.utils.serials import normalize_serial


class ProductMasterIn(BaseModel):
    serial_number: str = Field(min_length=1, max_length=80)
    product_model: str = Field(min_length=1, max_length=120)
    product_category: str = Field(min_length=1, max_length=80)
    warranty_months: int = Field(ge=1, le=240)
    manufactured_at: date | None = None
    sold_at: date | None = None
    dealer_code: str | None = Field(default=None, max_length=80)
    source_system: str = "INITIAL_EXPORT"
    source_record_id: str | None = None
    source_updated_at: datetime | None = None

    @field_validator("serial_number")
    @classmethod
    def serial_must_normalize(cls, value: str) -> str:
        normalized = normalize_serial(value)
        if not normalized:
            raise ValueError("serial_number is required")
        return value


class ProductMaster(ProductMasterIn):
    id: str | None = None
    serial_normalized: str
    status: ProductStatus = ProductStatus.AVAILABLE
    sync_version: int = 1
    created_at: datetime
    updated_at: datetime


class SafeSerialValidationResponse(BaseModel):
    result: SerialValidationResult
    serial_normalized: str
    advisory_message: str
