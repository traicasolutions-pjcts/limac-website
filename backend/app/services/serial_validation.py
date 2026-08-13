from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.enums import ProductStatus, SerialValidationResult
from app.repositories.products import ProductRepository
from app.schemas.products import SafeSerialValidationResponse
from app.utils.serials import normalize_serial


async def validate_serial_advisory(
    db: AsyncIOMotorDatabase,
    serial_number: str,
) -> SafeSerialValidationResponse:
    serial_normalized = normalize_serial(serial_number)
    try:
        product = await ProductRepository(db).get_by_serial(serial_number)
    except Exception:
        return SafeSerialValidationResponse(
            result=SerialValidationResult.VALIDATION_NOT_AVAILABLE,
            serial_normalized=serial_normalized,
            advisory_message="Serial validation is temporarily unavailable. You can still submit for manual review.",
        )

    if not product:
        return SafeSerialValidationResponse(
            result=SerialValidationResult.NOT_FOUND,
            serial_normalized=serial_normalized,
            advisory_message="Serial was not found in the current product master. Submission is still allowed.",
        )

    if product.get("status") == ProductStatus.REGISTERED:
        result = SerialValidationResult.FOUND_ALREADY_REGISTERED
        message = "Serial exists and appears already registered. An admin will make the final decision."
    else:
        result = SerialValidationResult.FOUND_UNREGISTERED
        message = "Serial exists in the product master and appears available. This result is advisory."

    return SafeSerialValidationResponse(
        result=result,
        serial_normalized=serial_normalized,
        advisory_message=message,
    )
