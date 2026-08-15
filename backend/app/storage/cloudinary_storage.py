import hashlib
import re
from datetime import datetime

from app.config import Settings
from app.utils.time import utc_now


class StorageConfigurationError(RuntimeError):
    pass


class StorageUploadError(RuntimeError):
    pass


def _safe_public_id(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", value).strip("-")


def _resource_type(content_type: str) -> str:
    if content_type == "application/pdf":
        return "raw"
    return "image"


def _file_format(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "application/pdf": "pdf",
    }[content_type]


def _folder_for(settings: Settings, uploaded_at: datetime) -> str:
    return f"{settings.cloudinary_bill_folder_root}/{uploaded_at.year}/{uploaded_at.month:02d}"


async def upload_bill_to_cloudinary(
    *,
    settings: Settings,
    reference: str,
    filename: str | None,
    content_type: str,
    content: bytes,
) -> dict[str, object]:
    if not settings.cloudinary_configured:
        raise StorageConfigurationError(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY "
            "and CLOUDINARY_API_SECRET in the backend environment."
        )

    try:
        import cloudinary
        import cloudinary.uploader
    except ModuleNotFoundError as exc:
        raise StorageConfigurationError("Cloudinary Python package is not installed.") from exc

    uploaded_at = utc_now()
    folder = _folder_for(settings, uploaded_at)
    public_id = f"{_safe_public_id(reference)}-{uploaded_at.strftime('%H%M%S')}"
    resource_type = _resource_type(content_type)
    file_format = _file_format(content_type)

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    try:
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            public_id=public_id,
            resource_type=resource_type,
            type="authenticated",
            overwrite=False,
            use_filename=False,
            unique_filename=False,
            format=file_format,
        )
    except Exception as exc:
        raise StorageUploadError("Bill upload to Cloudinary failed. Please try again.") from exc

    return {
        "provider": "cloudinary",
        "asset_id": result.get("asset_id"),
        "public_id": result["public_id"],
        "resource_type": resource_type,
        "type": "authenticated",
        "folder": folder,
        "filename": filename,
        "content_type": content_type,
        "format": file_format,
        "bytes": result.get("bytes") or len(content),
        "checksum_sha256": hashlib.sha256(content).hexdigest(),
        "uploaded_at": uploaded_at,
    }


def build_cloudinary_bill_access(settings: Settings, asset: dict[str, object]) -> dict[str, str]:
    if not settings.cloudinary_configured:
        raise StorageConfigurationError("Cloudinary is not configured.")
    try:
        import cloudinary
        from cloudinary.utils import cloudinary_url
    except ModuleNotFoundError as exc:
        raise StorageConfigurationError("Cloudinary Python package is not installed.") from exc

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    url, _ = cloudinary_url(
        str(asset["public_id"]),
        resource_type=str(asset["resource_type"]),
        type="authenticated",
        sign_url=True,
        secure=True,
        expires_at=int(utc_now().timestamp()) + 300,
    )
    return {
        "filename": str(asset.get("filename") or "bill"),
        "content_type": str(asset["content_type"]),
        "url": url,
    }
