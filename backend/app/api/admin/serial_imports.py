from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import db_dependency
from app.schemas.imports import SerialImportResult
from app.security.admin_auth import require_super_admin
from app.services.serial_import import checksum_bytes, import_serial_rows, parse_import_file, validate_headers

router = APIRouter(prefix="/serial-imports", tags=["admin-serial-imports"])


@router.post("", response_model=SerialImportResult)
async def upload_serial_import(
    file: UploadFile = File(...),
    dry_run: bool = Form(default=True),
    db: AsyncIOMotorDatabase = Depends(db_dependency),
    _: dict = Depends(require_super_admin),
) -> SerialImportResult:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Import file is empty.")
    try:
        rows = parse_import_file(file.filename or "serial-import.csv", content)
        validate_headers(rows)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return await import_serial_rows(
        db,
        rows,
        dry_run=dry_run,
        checksum_sha256=checksum_bytes(content),
    )


@router.get("/{job_id}")
async def get_serial_import(
    job_id: str,
    _: dict = Depends(require_super_admin),
) -> dict[str, str]:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Serial import job lookup is not persisted yet: {job_id}",
    )
