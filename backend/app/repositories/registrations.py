import re
from copy import deepcopy
from datetime import date, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.models.enums import RegistrationStatus
from app.schemas.registrations import WarrantyRegistrationCreate
from app.utils.masking import normalize_mobile
from app.utils.serials import normalize_serial
from app.utils.time import utc_now


class RegistrationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.collection = db.warranty_registrations

    async def next_registration_number(self) -> str:
        now = utc_now()
        counter = await self.db.counters.find_one_and_update(
            {"_id": f"registration:{now.year}"},
            {"$inc": {"sequence": 1}, "$setOnInsert": {"created_at": now}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return f"LIMAC-REG-{now.year}-{counter['sequence']:06d}"

    async def create_pending(
        self,
        payload: WarrantyRegistrationCreate,
        *,
        idempotency_key: str | None,
        serial_validation_snapshot: dict[str, Any],
    ) -> dict[str, Any]:
        now = utc_now()
        registration_number = await self.next_registration_number()
        serial_numbers = payload.component_serial_numbers()
        primary_serial = serial_numbers[0]
        serial_normalized = normalize_serial(primary_serial)
        components = [
            {
                "serial_number": serial_number,
                "serial_normalized": normalize_serial(serial_number),
            }
            for serial_number in serial_numbers
        ]
        mobile_normalized = normalize_mobile(payload.customer.mobile_number)
        document = {
            "registration_number": registration_number,
            "customer": {
                **payload.customer.model_dump(),
                "mobile_normalized": mobile_normalized,
            },
            "product": {
                "serial_number": primary_serial,
                "serial_normalized": serial_normalized,
                "product_model_customer": payload.product_model,
                "components": components,
            },
            "serial_normalized": serial_normalized,
            "purchase": {
                **payload.purchase.model_dump(mode="json"),
            },
            "bill_asset": None,
            "status": RegistrationStatus.PENDING,
            "submitted_at": now,
            "review_started_at": None,
            "reviewed_at": None,
            "reviewer_ids": [],
            "decision_history": [],
            "consent": {
                "warranty_terms_accepted": payload.warranty_terms_consent,
                "privacy_policy_accepted": payload.privacy_policy_consent,
                "warranty_terms_version": "v1",
                "privacy_policy_version": "v1",
                "accepted_at": now,
            },
            "anti_abuse": {
                "idempotency_key": idempotency_key,
            },
            "serial_validation": serial_validation_snapshot,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        await self._write_backup_snapshot(action="CREATED", snapshot=document)
        return document

    async def get_status_candidate(self, registration_reference: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"registration_number": registration_reference.strip()})

    async def get_by_id(self, registration_id: str) -> dict[str, Any] | None:
        if ObjectId.is_valid(registration_id):
            document = await self.collection.find_one({"_id": ObjectId(registration_id)})
            if document:
                return document
        return await self.collection.find_one({"registration_number": registration_id.strip()})

    async def get_by_reference(self, reference: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"registration_number": reference.strip()})

    async def attach_bill(self, reference: str, bill_asset: dict[str, Any]) -> dict[str, Any] | None:
        safe_bill_asset = self._storage_safe_bill_asset(bill_asset)
        updated = await self.collection.find_one_and_update(
            {"registration_number": reference.strip()},
            {"$set": {"bill_asset": safe_bill_asset, "updated_at": utc_now()}},
            return_document=ReturnDocument.AFTER,
        )
        if updated:
            await self._write_backup_snapshot(action="BILL_ATTACHED", snapshot=updated)
        return updated

    async def update_status(
        self,
        *,
        registration_id: str,
        next_status: RegistrationStatus,
        admin_id: str,
        reason: str | None,
        warranty_expiry_date: date | None = None,
    ) -> dict[str, Any] | None:
        query: dict[str, Any]
        if ObjectId.is_valid(registration_id):
            query = {"_id": ObjectId(registration_id)}
        else:
            query = {"registration_number": registration_id.strip()}
        now = utc_now()
        event = {
            "status": next_status,
            "admin_id": admin_id,
            "reason": reason,
            "created_at": now,
        }
        update_set: dict[str, Any] = {"status": next_status, "updated_at": now, "reviewed_at": now}
        if warranty_expiry_date:
            warranty_expiry_value = warranty_expiry_date.isoformat()
            update_set["purchase.warranty_expiry_date"] = warranty_expiry_value
            event["warranty_expiry_date"] = warranty_expiry_value
        updated = await self.collection.find_one_and_update(
            query,
            {
                "$set": update_set,
                "$push": {"decision_history": event},
            },
            return_document=ReturnDocument.AFTER,
        )
        if updated:
            await self._write_backup_snapshot(action="STATUS_UPDATED", snapshot=updated, admin_id=admin_id)
        return updated

    async def delete_by_id(self, registration_id: str, *, admin_id: str | None = None) -> bool:
        query: dict[str, Any]
        if ObjectId.is_valid(registration_id):
            query = {"_id": ObjectId(registration_id)}
        else:
            query = {"registration_number": registration_id.strip()}
        document = await self.collection.find_one(query)
        if not document:
            return False
        await self._write_backup_snapshot(action="DELETED", snapshot=document, admin_id=admin_id)
        result = await self.collection.delete_one(query)
        return result.deleted_count == 1

    async def list_for_admin(
        self,
        *,
        status: str | None = None,
        search: str | None = None,
        limit: int = 50,
        skip: int = 0,
    ) -> list[dict[str, Any]]:
        query = self._admin_query(status=status, search=search)
        cursor = (
            self.collection.find(query)
            .sort("submitted_at", -1)
            .skip(max(skip, 0))
            .limit(min(max(limit, 1), 100))
        )
        return [self._serialize_admin_row(row) async for row in cursor]

    async def list_export_documents(
        self,
        *,
        status: str | None = None,
        search: str | None = None,
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        if status != "DELETED":
            query = self._admin_query(status=status, search=search)
            cursor = self.collection.find(query).sort("submitted_at", -1)
            rows.extend([self.serialize_admin_detail(row) async for row in cursor])

        if status in {None, "DELETED"}:
            backup_query = self._deleted_backup_query(search=search)
            backup_cursor = self.db.warranty_registration_backups.find(backup_query).sort("snapshot.submitted_at", -1)
            async for backup in backup_cursor:
                snapshot = self.serialize_admin_detail(backup.get("snapshot") or {})
                snapshot["status"] = "DELETED"
                rows.append(snapshot)

        return sorted(rows, key=lambda row: row.get("submitted_at") or "", reverse=True)

    def _admin_query(self, *, status: str | None = None, search: str | None = None) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if status:
            query["status"] = status
        if search and search.strip():
            term = search.strip()
            escaped = re.escape(term)
            search_clauses: list[dict[str, Any]] = [
                {"customer.name": {"$regex": escaped, "$options": "i"}},
                {"customer.mobile_number": {"$regex": escaped, "$options": "i"}},
                {"registration_number": {"$regex": escaped, "$options": "i"}},
                {"product.serial_normalized": {"$regex": escaped, "$options": "i"}},
                {"product.components.serial_normalized": {"$regex": escaped, "$options": "i"}},
            ]
            digits = re.sub(r"\D+", "", term)
            if digits:
                search_clauses.append({"customer.mobile_normalized": {"$regex": re.escape(digits)}})
            query["$or"] = search_clauses
        return query

    def _deleted_backup_query(self, *, search: str | None = None) -> dict[str, Any]:
        query: dict[str, Any] = {"action": "DELETED"}
        if search and search.strip():
            term = search.strip()
            escaped = re.escape(term)
            search_clauses: list[dict[str, Any]] = [
                {"snapshot.customer.name": {"$regex": escaped, "$options": "i"}},
                {"snapshot.customer.mobile_number": {"$regex": escaped, "$options": "i"}},
                {"snapshot.registration_number": {"$regex": escaped, "$options": "i"}},
                {"snapshot.product.serial_normalized": {"$regex": escaped, "$options": "i"}},
                {"snapshot.product.components.serial_normalized": {"$regex": escaped, "$options": "i"}},
            ]
            digits = re.sub(r"\D+", "", term)
            if digits:
                search_clauses.append({"snapshot.customer.mobile_normalized": {"$regex": re.escape(digits)}})
            query["$or"] = search_clauses
        return query

    async def _write_backup_snapshot(
        self,
        *,
        action: str,
        snapshot: dict[str, Any],
        admin_id: str | None = None,
    ) -> None:
        backup = {
            "registration_id": snapshot.get("_id"),
            "registration_number": snapshot.get("registration_number"),
            "action": action,
            "admin_id": admin_id,
            "snapshot": self._backup_safe_snapshot(snapshot),
            "created_at": utc_now(),
        }
        await self.db.warranty_registration_backups.insert_one(backup)

    def _backup_safe_snapshot(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        safe_snapshot = deepcopy(snapshot)
        bill_asset = safe_snapshot.get("bill_asset")
        if isinstance(bill_asset, dict):
            safe_snapshot["bill_asset"] = self._storage_safe_bill_asset(bill_asset)
        return safe_snapshot

    def _storage_safe_bill_asset(self, bill_asset: dict[str, Any]) -> dict[str, Any]:
        safe_bill_asset = deepcopy(bill_asset)
        for field in ("data_base64", "content", "bytes_content", "file_bytes", "raw"):
            safe_bill_asset.pop(field, None)
        return safe_bill_asset

    def serialize_admin_detail(self, row: dict[str, Any]) -> dict[str, Any]:
        serialized = self._serialize_value(row)
        if isinstance(serialized, dict):
            serialized["_id"] = str(row.get("_id"))
            bill_asset = serialized.get("bill_asset")
            if isinstance(bill_asset, dict):
                bill_asset.pop("data_base64", None)
        return serialized

    def _serialize_value(self, value: Any) -> Any:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, dict):
            return {key: self._serialize_value(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        return value

    def _serialize_admin_row(self, row: dict[str, Any]) -> dict[str, Any]:
        customer = row.get("customer", {})
        product = row.get("product", {})
        purchase = row.get("purchase", {})
        components = product.get("components") or []
        component_serials = [
            component.get("serial_number")
            for component in components
            if isinstance(component, dict) and component.get("serial_number")
        ]
        if not component_serials and product.get("serial_number"):
            component_serials = [product.get("serial_number")]
        submitted_at = row.get("submitted_at")
        return {
            "id": str(row["_id"]) if isinstance(row.get("_id"), ObjectId) else str(row.get("_id")),
            "_id": str(row["_id"]) if isinstance(row.get("_id"), ObjectId) else str(row.get("_id")),
            "registration_number": row.get("registration_number"),
            "status": row.get("status"),
            "customer_name": customer.get("name"),
            "mobile_number": customer.get("mobile_number"),
            "serial_number": ", ".join(component_serials),
            "serial_normalized": product.get("serial_normalized"),
            "component_serial_numbers": component_serials,
            "invoice_number": purchase.get("invoice_number"),
            "dealer_name": purchase.get("dealer_name"),
            "purchase_date": self._serialize_value(purchase.get("purchase_date")),
            "warranty_expiry_date": self._serialize_value(purchase.get("warranty_expiry_date")),
            "submitted_at": submitted_at.isoformat() if submitted_at else None,
            "serial_validation_result": (row.get("serial_validation") or {}).get("result"),
            "has_bill": bool(row.get("bill_asset")),
        }
