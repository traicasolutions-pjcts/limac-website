from app.config import Settings
from app.storage.cloudinary_storage import (
    StorageConfigurationError,
    StorageDownloadError,
    StorageUploadError,
    download_bill_from_cloudinary,
    upload_bill_to_cloudinary,
)
from app.storage.r2_storage import (
    R2ConfigurationError,
    R2DownloadError,
    R2UploadError,
    download_bill_from_r2,
    upload_bill_to_r2,
)


async def upload_bill(
    *,
    settings: Settings,
    reference: str,
    filename: str | None,
    content_type: str,
    content: bytes,
) -> dict[str, object]:
    if settings.bill_storage_provider == "r2":
        try:
            return await upload_bill_to_r2(
                settings=settings,
                reference=reference,
                filename=filename,
                content_type=content_type,
                content=content,
            )
        except R2ConfigurationError as exc:
            raise StorageConfigurationError(str(exc)) from exc
        except R2UploadError as exc:
            raise StorageUploadError(str(exc)) from exc

    return await upload_bill_to_cloudinary(
        settings=settings,
        reference=reference,
        filename=filename,
        content_type=content_type,
        content=content,
    )


async def download_bill(settings: Settings, asset: dict[str, object]) -> tuple[bytes, str, str]:
    provider = asset.get("provider")
    if provider == "cloudinary":
        return await download_bill_from_cloudinary(settings, asset)
    if provider == "r2":
        try:
            return await download_bill_from_r2(settings, asset)
        except R2ConfigurationError as exc:
            raise StorageConfigurationError(str(exc)) from exc
        except R2DownloadError as exc:
            raise StorageDownloadError(str(exc)) from exc
    raise StorageDownloadError(f"Unsupported bill storage provider: {provider or 'missing'}.")
