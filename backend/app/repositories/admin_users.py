from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.models.enums import AdminRole
from app.security.passwords import hash_password
from app.utils.time import utc_now


class AdminUserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db.admin_users

    async def count_active_or_disabled(self) -> int:
        return await self.collection.count_documents({})

    async def get_active_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.collection.find_one(
            {
                "email_normalized": email.strip().lower(),
                "disabled_at": None,
            }
        )

    async def get_active_by_id(self, admin_id: object) -> dict[str, Any] | None:
        return await self.collection.find_one({"_id": admin_id, "disabled_at": None})

    async def create_admin(self, *, email: str, password: str, role: AdminRole) -> dict[str, Any]:
        now = utc_now()
        document = {
            "email": email.strip(),
            "email_normalized": email.strip().lower(),
            "password_hash": hash_password(password),
            "role": role,
            "created_at": now,
            "updated_at": now,
            "disabled_at": None,
            "last_login_at": None,
            "refresh_tokens": [],
        }
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return document

    async def record_login(self, admin_id: object, refresh_token_hash: str) -> dict[str, Any] | None:
        now = utc_now()
        return await self.collection.find_one_and_update(
            {"_id": admin_id, "disabled_at": None},
            {
                "$set": {
                    "last_login_at": now,
                    "updated_at": now,
                },
                "$push": {
                    "refresh_tokens": {
                        "$each": [
                            {
                                "hash": refresh_token_hash,
                                "created_at": now,
                                "revoked_at": None,
                            }
                        ],
                        "$slice": -5,
                    }
                },
            },
            return_document=ReturnDocument.AFTER,
        )
