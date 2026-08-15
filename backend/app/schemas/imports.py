from pydantic import BaseModel, Field

from app.models.enums import ImportRowStatus
from app.schemas.products import ProductMasterIn


class SerialImportDryRunRequest(BaseModel):
    rows: list[ProductMasterIn]
    dry_run: bool = True


class SerialImportRowResult(BaseModel):
    row_number: int
    serial_number: str | None = None
    serial_normalized: str | None = None
    status: ImportRowStatus
    reason: str | None = None


class SerialImportSummary(BaseModel):
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0
    skipped: int = 0
    failed: int = 0


class SerialImportResult(BaseModel):
    dry_run: bool
    checksum_sha256: str
    summary: SerialImportSummary
    rows: list[SerialImportRowResult] = Field(default_factory=list)
