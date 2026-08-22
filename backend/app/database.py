from collections.abc import AsyncIterator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import OperationFailure, ServerSelectionTimeoutError
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.config import Settings


class Mongo:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongo = Mongo()


async def connect_to_mongo(settings: Settings) -> None:
    mongo.client = AsyncIOMotorClient(
        settings.mongodb_uri,
        uuidRepresentation="standard",
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
    )
    mongo.db = mongo.client[settings.mongodb_database]
    try:
        await mongo.db.command("ping")
        await ensure_indexes(mongo.db)
    except OperationFailure as exc:
        if exc.code == 13:
            raise RuntimeError(
                "MongoDB authentication succeeded insufficiently or failed for this database. "
                "Check MONGODB_URI credentials and make sure the user has readWrite access "
                f"to the '{settings.mongodb_database}' database."
            ) from exc
        raise
    except ServerSelectionTimeoutError as exc:
        raise RuntimeError(
            "MongoDB is not reachable. Start local MongoDB on localhost:27017 or set "
            "MONGODB_URI to your MongoDB Atlas connection string."
        ) from exc


async def close_mongo_connection() -> None:
    if mongo.client:
        mongo.client.close()
        mongo.client = None
        mongo.db = None


def get_database() -> AsyncIOMotorDatabase:
    if mongo.db is None:
        raise RuntimeError("MongoDB has not been initialized")
    return mongo.db


async def db_dependency() -> AsyncIterator[AsyncIOMotorDatabase]:
    yield get_database()


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.products.create_indexes(
        [
            IndexModel([("serial_normalized", ASCENDING)], unique=True, name="uniq_product_serial"),
            IndexModel([("status", ASCENDING), ("updated_at", DESCENDING)], name="product_status_updated"),
            IndexModel(
                [("source_system", ASCENDING), ("source_record_id", ASCENDING)],
                name="product_source_record",
            ),
        ]
    )
    await db.warranty_registrations.create_indexes(
        [
            IndexModel(
                [("registration_number", ASCENDING)],
                unique=True,
                name="uniq_registration_number",
            ),
            IndexModel([("status", ASCENDING), ("submitted_at", DESCENDING)], name="queue_status"),
            IndexModel([("serial_normalized", ASCENDING), ("submitted_at", DESCENDING)], name="serial_queue"),
            IndexModel(
                [("product.components.serial_normalized", ASCENDING), ("submitted_at", DESCENDING)],
                name="component_serial_queue",
            ),
            IndexModel([("purchase.invoice_number", ASCENDING)], name="invoice_lookup"),
            IndexModel([("anti_abuse.idempotency_hash", ASCENDING)], name="idempotency_lookup"),
        ]
    )
    await db.warranty_registration_backups.create_indexes(
        [
            IndexModel([("registration_number", ASCENDING), ("created_at", DESCENDING)], name="backup_registration"),
            IndexModel([("action", ASCENDING), ("created_at", DESCENDING)], name="backup_action"),
            IndexModel([("created_at", DESCENDING)], name="backup_created"),
        ]
    )
    await db.warranties.create_indexes(
        [
            IndexModel([("warranty_number", ASCENDING)], unique=True, name="uniq_warranty_number"),
            IndexModel([("serial_normalized", ASCENDING)], unique=True, name="uniq_warranty_serial"),
            IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="warranty_status"),
        ]
    )
    await db.admin_users.create_indexes(
        [
            IndexModel([("email_normalized", ASCENDING)], unique=True, name="uniq_admin_email"),
            IndexModel([("role", ASCENDING), ("disabled_at", ASCENDING)], name="admin_role_state"),
        ]
    )
    await db.audit_logs.create_indexes(
        [
            IndexModel([("entity_type", ASCENDING), ("entity_id", ASCENDING)], name="audit_entity"),
            IndexModel([("created_at", DESCENDING)], name="audit_created"),
        ]
    )
    await db.serial_import_jobs.create_indexes(
        [
            IndexModel([("checksum_sha256", ASCENDING)], name="serial_import_checksum"),
            IndexModel([("created_at", DESCENDING)], name="serial_import_created"),
        ]
    )
    await db.sync_runs.create_indexes(
        [
            IndexModel([("batch_id", ASCENDING)], unique=True, name="uniq_sync_batch"),
            IndexModel([("source_system", ASCENDING), ("created_at", DESCENDING)], name="sync_source_created"),
        ]
    )
    await db.submission_rate_limits.create_indexes(
        [
            IndexModel([("key", ASCENDING), ("window", ASCENDING)], unique=True, name="uniq_rate_key_window"),
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="rate_limit_ttl"),
        ]
    )
