from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.admin.auth import router as admin_auth_router
from app.api.admin.registrations import router as admin_registrations_router
from app.api.public.products import router as public_products_router
from app.api.public.registrations import router as public_registrations_router
from app.api.admin.serial_imports import router as admin_serial_imports_router
from app.api.integrations.tally import router as tally_router
from app.config import get_settings
from app.database import close_mongo_connection, connect_to_mongo, get_database
from app.middleware import request_id_middleware
from app.services.admin_bootstrap import bootstrap_initial_admin


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    await connect_to_mongo(settings)
    await bootstrap_initial_admin(get_database(), settings)
    try:
        yield
    finally:
        await close_mongo_connection()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )
    app.middleware("http")(request_id_middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    )
    app.include_router(health_router)
    app.include_router(public_products_router, prefix=f"{settings.api_v1_prefix}/public")
    app.include_router(public_registrations_router, prefix=f"{settings.api_v1_prefix}/public")
    app.include_router(admin_auth_router, prefix=f"{settings.api_v1_prefix}/admin")
    app.include_router(admin_registrations_router, prefix=f"{settings.api_v1_prefix}/admin")
    app.include_router(admin_serial_imports_router, prefix=f"{settings.api_v1_prefix}/admin")
    app.include_router(tally_router, prefix=f"{settings.api_v1_prefix}/integrations/tally")
    return app


app = create_app()
