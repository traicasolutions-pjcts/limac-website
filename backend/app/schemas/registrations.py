from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import RegistrationStatus


class CustomerSnapshot(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    address_line: str = Field(min_length=5, max_length=240)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    pin_code: str = Field(pattern=r"^\d{6}$")
    mobile_number: str = Field(pattern=r"^\+?[0-9 ]{10,16}$")


class PurchaseSnapshot(BaseModel):
    purchase_date: date
    invoice_number: str = Field(min_length=1, max_length=80)
    dealer_name: str = Field(min_length=2, max_length=160)
    dealer_code: str | None = Field(default=None, max_length=80)


class WarrantyRegistrationCreate(BaseModel):
    customer: CustomerSnapshot
    serial_number: str = Field(min_length=1, max_length=80)
    product_model: str | None = Field(default=None, max_length=120)
    purchase: PurchaseSnapshot
    warranty_terms_consent: bool
    privacy_policy_consent: bool
    turnstile_token: str = Field(min_length=1)


class WarrantyRegistrationCreated(BaseModel):
    registration_number: str
    status: RegistrationStatus
    submitted_at: datetime


class StatusLookupRequest(BaseModel):
    registration_reference: str = Field(min_length=6, max_length=40)
    mobile_number: str | None = Field(default=None, max_length=20)
    serial_number: str | None = Field(default=None, max_length=80)


class StatusLookupResponse(BaseModel):
    registration_reference: str
    status: RegistrationStatus
    submitted_at: datetime | None = None
    masked_mobile: str | None = None
    masked_serial: str | None = None
    warranty_number: str | None = None
    message: str | None = None
