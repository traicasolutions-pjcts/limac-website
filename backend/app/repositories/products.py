from datetime import date, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.models.enums import ProductStatus
from app.schemas.products import ProductMasterIn
from app.utils.serials import normalize_serial
from app.utils.time import utc_now

PROTECTED_PRODUCT_STATUSES = {
    ProductStatus.REGISTERED,
    ProductStatus.REGISTRATION_PENDING,
    ProductStatus.BLOCKED,
    ProductStatus.REPLACED,
}


def _serialize_date(value: date | datetime | None) -> str | None:
    return value.isoformat() if value else None


def product_input_to_document(product: ProductMasterIn) -> dict[str, Any]:
    now = utc_now()
    serial_normalized = normalize_serial(product.serial_number)
    source_record_id = product.source_record_id or f"initial:{serial_normalized}"
    return {
        "serial_number": product.serial_number.strip(),
        "serial_normalized": serial_normalized,
        "product_model": product.product_model.strip(),
        "product_category": product.product_category.strip(),
        "warranty_months": product.warranty_months,
        "manufactured_at": _serialize_date(product.manufactured_at),
        "sold_at": _serialize_date(product.sold_at),
        "dealer_code": product.dealer_code.strip() if product.dealer_code else None,
        "status": ProductStatus.AVAILABLE,
        "source_system": product.source_system,
        "source_record_id": source_record_id,
        "source_updated_at": _serialize_date(product.source_updated_at),
        "sync_version": 1,
        "created_at": now,
        "updated_at": now,
    }


class ProductRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db.products

    async def get_by_serial(self, serial_number: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"serial_normalized": normalize_serial(serial_number)})

    async def list_products(self, *, search: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        query: dict[str, Any] = {}
        if search and search.strip():
            import re

            escaped = re.escape(search.strip())
            query["$or"] = [
                {"serial_number": {"$regex": escaped, "$options": "i"}},
                {"serial_normalized": {"$regex": escaped, "$options": "i"}},
                {"product_model": {"$regex": escaped, "$options": "i"}},
                {"dealer_code": {"$regex": escaped, "$options": "i"}},
            ]
        cursor = self.collection.find(query).sort("updated_at", -1).limit(min(max(limit, 1), 100))
        return [self._serialize_product(product) async for product in cursor]

    async def upsert_manual(
        self,
        *,
        serial_number: str,
        product_model: str,
        sold_at: date | None,
    ) -> dict[str, Any]:
        now = utc_now()
        serial_normalized = normalize_serial(serial_number)
        update = {
            "$set": {
                "serial_number": serial_number.strip(),
                "serial_normalized": serial_normalized,
                "product_model": product_model.strip(),
                "sold_at": _serialize_date(sold_at),
                "source_system": "MANUAL_ADMIN",
                "source_updated_at": now,
                "updated_at": now,
            },
            "$setOnInsert": {
                "product_category": "MANUAL",
                "warranty_months": 60,
                "manufactured_at": None,
                "dealer_code": None,
                "status": ProductStatus.AVAILABLE,
                "source_record_id": f"manual:{serial_normalized}",
                "sync_version": 1,
                "created_at": now,
            },
        }
        product = await self.collection.find_one_and_update(
            {"serial_normalized": serial_normalized},
            update,
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return self._serialize_product(product)

    async def reserve_for_registration(self, serial_number: str) -> dict[str, Any] | None:
        return await self.collection.find_one_and_update(
            {
                "serial_normalized": normalize_serial(serial_number),
                "status": ProductStatus.AVAILABLE,
            },
            {
                "$set": {
                    "status": ProductStatus.REGISTRATION_PENDING,
                    "pending_registration_number": None,
                    "updated_at": utc_now(),
                },
            },
            return_document=ReturnDocument.AFTER,
        )

    async def attach_pending_registration(self, serial_number: str, registration_number: str) -> None:
        await self.collection.update_one(
            {
                "serial_normalized": normalize_serial(serial_number),
                "status": ProductStatus.REGISTRATION_PENDING,
            },
            {
                "$set": {
                    "pending_registration_number": registration_number,
                    "updated_at": utc_now(),
                },
            },
        )

    async def release_pending_registration(self, serial_number: str, registration_number: str | None = None) -> None:
        query: dict[str, Any] = {
            "serial_normalized": normalize_serial(serial_number),
            "status": ProductStatus.REGISTRATION_PENDING,
        }
        if registration_number:
            query["$or"] = [
                {"pending_registration_number": registration_number},
                {"pending_registration_number": None},
                {"pending_registration_number": {"$exists": False}},
            ]
        await self.collection.update_one(
            query,
            {
                "$set": {
                    "status": ProductStatus.AVAILABLE,
                    "updated_at": utc_now(),
                },
                "$unset": {"pending_registration_number": ""},
            },
        )

    async def upsert_from_import(self, product: ProductMasterIn, dry_run: bool) -> tuple[str, str | None]:
        doc = product_input_to_document(product)
        existing = await self.collection.find_one({"serial_normalized": doc["serial_normalized"]})
        if existing and existing.get("status") in PROTECTED_PRODUCT_STATUSES:
            return "SKIPPED", f"Existing product is {existing['status']} and was not overwritten."

        comparable = {
            key: value
            for key, value in doc.items()
            if key not in {"created_at", "updated_at", "status", "sync_version"}
        }
        if existing:
            existing_comparable = {
                key: existing.get(key)
                for key in comparable
            }
            if existing_comparable == comparable:
                return "UNCHANGED", None
            if dry_run:
                return "UPDATED", "Dry run only; no database changes were written."
            await self.collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        **comparable,
                        "updated_at": utc_now(),
                    },
                    "$inc": {"sync_version": 1},
                },
            )
            return "UPDATED", None

        if dry_run:
            return "INSERTED", "Dry run only; no database changes were written."
        await self.collection.insert_one(doc)
        return "INSERTED", None

    async def mark_registered(self, serial_number: str) -> dict[str, Any] | None:
        return await self.collection.find_one_and_update(
            {
                "serial_normalized": normalize_serial(serial_number),
                "status": {"$nin": [ProductStatus.BLOCKED, ProductStatus.REPLACED]},
            },
            {
                "$set": {"status": ProductStatus.REGISTERED, "updated_at": utc_now()},
                "$unset": {"pending_registration_number": ""},
            },
            return_document=ReturnDocument.AFTER,
        )

    async def delete_by_id(self, product_id: str) -> bool:
        if not ObjectId.is_valid(product_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(product_id)})
        return result.deleted_count == 1

    def _serialize_product(self, product: dict[str, Any]) -> dict[str, Any]:
        serialized = dict(product)
        serialized["id"] = str(serialized.get("_id"))
        serialized["_id"] = str(serialized.get("_id"))
        for field in ("manufactured_at", "sold_at", "source_updated_at", "created_at", "updated_at"):
            if isinstance(serialized.get(field), (date, datetime)):
                serialized[field] = serialized[field].isoformat()
        return serialized
