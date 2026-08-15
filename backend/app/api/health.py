from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import db_dependency

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(db: AsyncIOMotorDatabase = Depends(db_dependency)) -> dict[str, str]:
    await db.command("ping")
    return {"status": "ready"}
