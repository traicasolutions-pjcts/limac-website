from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import db_dependency
from app.schemas.products import SafeSerialValidationResponse
from app.services.serial_validation import validate_serial_advisory

router = APIRouter(tags=["public-products"])


@router.get("/products/{serial}/validation", response_model=SafeSerialValidationResponse)
async def validate_product_serial(
    serial: str,
    db: AsyncIOMotorDatabase = Depends(db_dependency),
) -> SafeSerialValidationResponse:
    return await validate_serial_advisory(db, serial)
