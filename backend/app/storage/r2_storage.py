import asyncio
import hashlib
import re
from datetime import datetime

from app.config import Settings
from app.utils.time import utc_now


class R2ConfigurationError(RuntimeError):
    pass


class R2UploadError(RuntimeError):
    pass


class R2DownloadError(RuntimeError):
    pass


def _safe_object_part(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-")


def _file_format(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "application/pdf": "pdf",
    }[content_type]


def _key_for(settings: Settings, reference: str, uploaded_at: datetime, file_format: str) -> str:
    prefix = settings.r2_bill_key_prefix.strip("/")
    safe_reference = _safe_object_part(reference)
    filename = f"{safe_reference}-{uploaded_at.strftime('%H%M%S')}.{file_format}"
    return f"{prefix}/{uploaded_at.year}/{uploaded_at.month:02d}/{filename}"


def _client(settings: Settings):
    if not settings.r2_configured or not settings.r2_endpoint_url:
        raise R2ConfigurationError(
            "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME in the backend environment."
        )
    try:
        import boto3
        from botocore.config import Config
    except ModuleNotFoundError as exc:
        raise R2ConfigurationError("boto3 Python package is not installed.") from exc

    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


async def upload_bill_to_r2(
    *,
    settings: Settings,
    reference: str,
    filename: str | None,
    content_type: str,
    content: bytes,
) -> dict[str, object]:
    uploaded_at = utc_now()
    file_format = _file_format(content_type)
    object_key = _key_for(settings, reference, uploaded_at, file_format)
    checksum = hashlib.sha256(content).hexdigest()
    client = _client(settings)

    try:
        response = await asyncio.to_thread(
            client.put_object,
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=content,
            ContentType=content_type,
            Metadata={
                "filename": filename or "bill",
                "checksum_sha256": checksum,
                "registration_reference": reference,
            },
        )
    except Exception as exc:
        raise R2UploadError("Bill upload to Cloudflare R2 failed. Please try again.") from exc

    return {
        "provider": "r2",
        "bucket": settings.r2_bucket_name,
        "object_key": object_key,
        "filename": filename,
        "content_type": content_type,
        "format": file_format,
        "bytes": len(content),
        "checksum_sha256": checksum,
        "etag": str(response.get("ETag") or "").strip('"') or None,
        "uploaded_at": uploaded_at,
    }


async def download_bill_from_r2(
    settings: Settings,
    asset: dict[str, object],
) -> tuple[bytes, str, str]:
    bucket = str(asset.get("bucket") or settings.r2_bucket_name or "")
    object_key = str(asset.get("object_key") or "")
    if not bucket or not object_key:
        raise R2DownloadError("Cloudflare R2 bucket or object key is missing for this bill.")
    client = _client(settings)

    try:
        response = await asyncio.to_thread(client.get_object, Bucket=bucket, Key=object_key)
        content = await asyncio.to_thread(response["Body"].read)
    except Exception as exc:
        raise R2DownloadError("Bill download from Cloudflare R2 failed. Please try again.") from exc

    return (
        content,
        str(response.get("ContentType") or asset.get("content_type") or "application/octet-stream"),
        str(asset.get("filename") or object_key.rsplit("/", 1)[-1] or "bill"),
    )


def build_r2_bill_access(settings: Settings, asset: dict[str, object]) -> dict[str, str]:
    bucket = str(asset.get("bucket") or settings.r2_bucket_name or "")
    object_key = str(asset.get("object_key") or "")
    if not bucket or not object_key:
        raise R2DownloadError("Cloudflare R2 bucket or object key is missing for this bill.")
    client = _client(settings)
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": object_key},
            ExpiresIn=300,
        )
    except Exception as exc:
        raise R2DownloadError("Unable to create Cloudflare R2 bill access URL.") from exc
    return {
        "filename": str(asset.get("filename") or object_key.rsplit("/", 1)[-1] or "bill"),
        "content_type": str(asset.get("content_type") or "application/octet-stream"),
        "url": url,
    }
