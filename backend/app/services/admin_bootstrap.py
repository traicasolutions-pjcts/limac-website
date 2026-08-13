from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import Settings
from app.models.enums import AdminRole
from app.repositories.admin_users import AdminUserRepository


async def bootstrap_initial_admin(db: AsyncIOMotorDatabase, settings: Settings) -> None:
    if not settings.initial_admin_email or not settings.initial_admin_password:
        return

    repository = AdminUserRepository(db)
    if await repository.count_active_or_disabled() > 0:
        return

    await repository.create_admin(
        email=settings.initial_admin_email,
        password=settings.initial_admin_password,
        role=AdminRole.SUPER_ADMIN,
    )
