from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import RegistrationStatus
from app.utils.serials import normalize_serial


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

    @field_validator("purchase_date")
    @classmethod
    def purchase_date_must_not_be_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Purchase date cannot be greater than today.")
        return value


class WarrantyRegistrationCreate(BaseModel):
    customer: CustomerSnapshot
    serial_number: str | None = Field(default=None, max_length=80)
    serial_numbers: list[str] | None = Field(default=None, min_length=1, max_length=20)
    product_model: str | None = Field(default=None, max_length=120)
    purchase: PurchaseSnapshot
    warranty_terms_consent: bool
    privacy_policy_consent: bool
    turnstile_token: str = Field(min_length=1)

    @model_validator(mode="after")
    def serial_numbers_are_required_and_unique(self) -> "WarrantyRegistrationCreate":
        serials = self.component_serial_numbers()
        if not serials:
            raise ValueError("At least one product serial number is required.")
        if any(len(serial) > 80 for serial in serials):
            raise ValueError("Each product serial number must be 80 characters or fewer.")
        normalized = [normalize_serial(serial) for serial in serials]
        if len(set(normalized)) != len(normalized):
            raise ValueError("Product serial numbers must be unique.")
        return self

    def component_serial_numbers(self) -> list[str]:
        serials = self.serial_numbers if self.serial_numbers is not None else (
            [self.serial_number] if self.serial_number else []
        )
        return [serial.strip() for serial in serials if serial and serial.strip()]


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
