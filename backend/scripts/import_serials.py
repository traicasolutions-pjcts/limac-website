import argparse
import asyncio
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.services.serial_import import checksum_bytes, import_serial_rows, parse_import_file, validate_headers


async def main() -> None:
    parser = argparse.ArgumentParser(description="Import Limac product serial master data.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--apply", action="store_true", help="Write changes. Default is dry run.")
    args = parser.parse_args()

    content = args.path.read_bytes()
    rows = parse_import_file(args.path.name, content)
    validate_headers(rows)

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, uuidRepresentation="standard")
    try:
        result = await import_serial_rows(
            client[settings.mongodb_database],
            rows,
            dry_run=not args.apply,
            checksum_sha256=checksum_bytes(content),
        )
    finally:
        client.close()

    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
