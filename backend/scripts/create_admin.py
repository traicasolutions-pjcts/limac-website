import argparse
import asyncio
import getpass

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.models.enums import AdminRole
from app.security.passwords import hash_password
from app.utils.time import utc_now


async def main() -> None:
    parser = argparse.ArgumentParser(description="Create a Limac warranty admin user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--role", choices=[role.value for role in AdminRole], default=AdminRole.REVIEWER.value)
    args = parser.parse_args()

    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        raise SystemExit("Passwords did not match.")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")
    try:
        db = client[settings.mongodb_database]
        now = utc_now()
        result = await db.admin_users.insert_one(
            {
                "email": args.email,
                "email_normalized": args.email.strip().lower(),
                "password_hash": hash_password(password),
                "role": args.role,
                "created_at": now,
                "updated_at": now,
                "disabled_at": None,
            }
        )
    finally:
        client.close()

    print(f"Created admin user {result.inserted_id}")


if __name__ == "__main__":
    asyncio.run(main())
