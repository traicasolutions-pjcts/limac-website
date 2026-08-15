from app.models.enums import ProductStatus, SerialValidationResult
from app.services import serial_validation


class FakeRepository:
    product = None
    raises = False

    def __init__(self, _db: object) -> None:
        pass

    async def get_by_serial(self, _serial_number: str):
        if self.raises:
            raise RuntimeError("db unavailable")
        return self.product


async def test_advisory_validation_allows_not_found(monkeypatch) -> None:
    FakeRepository.product = None
    FakeRepository.raises = False
    monkeypatch.setattr(serial_validation, "ProductRepository", FakeRepository)

    response = await serial_validation.validate_serial_advisory(object(), " lmc1 ")

    assert response.result == SerialValidationResult.NOT_FOUND
    assert "before approval" in response.advisory_message


async def test_advisory_validation_found_registered(monkeypatch) -> None:
    FakeRepository.product = {"status": ProductStatus.REGISTERED}
    FakeRepository.raises = False
    monkeypatch.setattr(serial_validation, "ProductRepository", FakeRepository)

    response = await serial_validation.validate_serial_advisory(object(), "LMC1")

    assert response.result == SerialValidationResult.FOUND_ALREADY_REGISTERED


async def test_advisory_validation_unavailable(monkeypatch) -> None:
    FakeRepository.product = None
    FakeRepository.raises = True
    monkeypatch.setattr(serial_validation, "ProductRepository", FakeRepository)

    response = await serial_validation.validate_serial_advisory(object(), "LMC1")

    assert response.result == SerialValidationResult.VALIDATION_NOT_AVAILABLE
    assert "still submit" in response.advisory_message
