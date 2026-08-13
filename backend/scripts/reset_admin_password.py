import argparse
import asyncio
import getpass

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.security.passwords import hash_password
from app.utils.time import utc_now


async def main() -> None:
    parser = argparse.ArgumentParser(description="Reset a Limac warranty admin password.")
    parser.add_argument("--email", required=True)
    args = parser.parse_args()

    password = getpass.getpass("New password: ")
    confirm = getpass.getpass("Confirm new password: ")
    if password != confirm:
        raise SystemExit("Passwords did not match.")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")
    try:
        result = await client[settings.mongodb_database].admin_users.update_one(
            {"email_normalized": args.email.strip().lower(), "disabled_at": None},
            {"$set": {"password_hash": hash_password(password), "updated_at": utc_now()}},
        )
    finally:
        client.close()

    if result.matched_count != 1:
        raise SystemExit("No active admin user found for that email.")
    print("Admin password reset.")


if __name__ == "__main__":
    asyncio.run(main())
