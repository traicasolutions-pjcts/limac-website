from datetime import date

import pytest
from pydantic import ValidationError

from app.models.enums import RegistrationStatus
from app.repositories.registrations import RegistrationRepository
from app.schemas.registrations import WarrantyRegistrationCreate
from app.services.registrations import registration_component_serials


def registration_payload(**overrides):
    payload = {
        "customer": {
            "name": "Test Customer",
            "address_line": "Example address",
            "city": "Kochi",
            "state": "Kerala",
            "pin_code": "682001",
            "mobile_number": "9876543210",
        },
        "serial_numbers": [" MAIN-001 ", "BMS-002"],
        "product_model": "LIMAC Pack",
        "purchase": {
            "purchase_date": date.today().isoformat(),
            "invoice_number": "INV-1",
            "dealer_name": "Limac Dealer",
        },
        "warranty_terms_consent": True,
        "privacy_policy_consent": True,
        "turnstile_token": "token",
    }
    payload.update(overrides)
    return payload


def test_registration_accepts_multiple_component_serial_numbers() -> None:
    payload = WarrantyRegistrationCreate(**registration_payload())

    assert payload.component_serial_numbers() == ["MAIN-001", "BMS-002"]


def test_registration_rejects_duplicate_component_serial_numbers() -> None:
    with pytest.raises(ValidationError):
        WarrantyRegistrationCreate(**registration_payload(serial_numbers=["MAIN 001", "main001"]))


def test_component_serial_helper_falls_back_to_legacy_serial() -> None:
    assert registration_component_serials({"product": {"serial_number": "LEGACY-1"}}) == ["LEGACY-1"]


async def test_status_update_serializes_replacement_and_service_warranty_dates_for_mongo() -> None:
    class FakeCollection:
        def __init__(self) -> None:
            self.update = None

        async def find_one_and_update(self, _query, update, **_kwargs):
            self.update = update
            return {"_id": "registration-id", "status": RegistrationStatus.APPROVED}

    class FakeBackups:
        async def insert_one(self, _backup):
            return None

    class FakeDb:
        def __init__(self) -> None:
            self.warranty_registrations = FakeCollection()
            self.warranty_registration_backups = FakeBackups()

    db = FakeDb()

    await RegistrationRepository(db).update_status(
        registration_id="LIMAC-REG-2026-000001",
        next_status=RegistrationStatus.APPROVED,
        admin_id="admin-id",
        reason=None,
        replacement_warranty_expiry_date=date(2027, 9, 17),
        service_warranty_expiry_date=date(2028, 9, 17),
    )

    update = db.warranty_registrations.update
    assert "purchase.warranty_expiry_date" not in update["$set"]
    assert update["$set"]["purchase.replacement_warranty_expiry_date"] == "2027-09-17"
    assert update["$set"]["purchase.service_warranty_expiry_date"] == "2028-09-17"
    assert update["$push"]["decision_history"]["replacement_warranty_expiry_date"] == "2027-09-17"
    assert update["$push"]["decision_history"]["service_warranty_expiry_date"] == "2028-09-17"
