from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.config import get_settings
from app.schemas.products import ProductMasterIn

router = APIRouter(tags=["integration-tally"])


class TallyBatchUpsertRequest(BaseModel):
    source_company: str = Field(min_length=1, max_length=80)
    batch_id: str = Field(min_length=1, max_length=120)
    cursor: str | None = None
    items: list[ProductMasterIn]


@router.post("/serials:batch-upsert")
async def batch_upsert_serials(
    payload: TallyBatchUpsertRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> dict[str, object]:
    settings = get_settings()
    if not settings.integration_tally_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration is not enabled.")
    if not idempotency_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Idempotency-Key is required.")
    if len(payload.items) > settings.integration_max_batch_items:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Maximum {settings.integration_max_batch_items} serials per batch.",
        )
    return {
        "batch_id": payload.batch_id,
        "status": "ACCEPTED",
        "item_count": len(payload.items),
        "checkpoint": payload.cursor,
    }


@router.get("/sync-runs/{batch_id}")
async def get_sync_run(batch_id: str) -> dict[str, str]:
    settings = get_settings()
    if not settings.integration_tally_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration is not enabled.")
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Sync run persistence is not implemented yet: {batch_id}",
    )
