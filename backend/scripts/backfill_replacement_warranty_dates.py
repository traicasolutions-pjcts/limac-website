import argparse
import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.utils.time import utc_now


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill replacement warranty dates from the legacy warranty_expiry_date field."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Count matching registrations without updating MongoDB.",
    )
    args = parser.parse_args()

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")
    try:
        collection = client[settings.mongodb_database].warranty_registrations
        query = {
            "purchase.warranty_expiry_date": {"$exists": True, "$nin": [None, ""]},
            "$or": [
                {"purchase.replacement_warranty_expiry_date": {"$exists": False}},
                {"purchase.replacement_warranty_expiry_date": None},
                {"purchase.replacement_warranty_expiry_date": ""},
            ],
        }
        count = await collection.count_documents(query)
        if args.dry_run:
            print(f"Matched {count} registration(s).")
            return
        result = await collection.update_many(
            query,
            [
                {
                    "$set": {
                        "purchase.replacement_warranty_expiry_date": "$purchase.warranty_expiry_date",
                        "updated_at": utc_now(),
                    }
                }
            ],
        )
    finally:
        client.close()

    print(f"Matched {result.matched_count}; updated {result.modified_count}.")


if __name__ == "__main__":
    asyncio.run(main())
