from datetime import datetime

import pytest

from app.storage import bill_storage, r2_storage


class FakeBody:
    def __init__(self, content: bytes) -> None:
        self.content = content

    def read(self) -> bytes:
        return self.content


class FakeR2Client:
    def __init__(self) -> None:
        self.put_kwargs = None
        self.get_kwargs = None

    def put_object(self, **kwargs):
        self.put_kwargs = kwargs
        return {"ETag": '"etag-value"'}

    def get_object(self, **kwargs):
        self.get_kwargs = kwargs
        return {"Body": FakeBody(b"pdf-bytes"), "ContentType": "application/pdf"}

    def generate_presigned_url(self, operation, Params, ExpiresIn):
        return f"https://r2.example.test/{operation}/{Params['Bucket']}/{Params['Key']}?ttl={ExpiresIn}"


def fake_settings(**overrides):
    values = {
        "bill_storage_provider": "r2",
        "r2_configured": True,
        "r2_endpoint_url": "https://account.r2.cloudflarestorage.com",
        "r2_account_id": "account",
        "r2_access_key_id": "access",
        "r2_secret_access_key": "secret",
        "r2_bucket_name": "limac-warranty-bills",
        "r2_bill_key_prefix": "limac/warranty-bills",
    }
    values.update(overrides)
    return type("Settings", (), values)()


@pytest.mark.asyncio
async def test_r2_upload_returns_bill_asset_metadata(monkeypatch) -> None:
    client = FakeR2Client()
    monkeypatch.setattr(r2_storage, "_client", lambda _settings: client)
    monkeypatch.setattr(
        r2_storage,
        "utc_now",
        lambda: datetime(2026, 8, 26, 10, 30, 45),
    )

    asset = await r2_storage.upload_bill_to_r2(
        settings=fake_settings(),
        reference="LIMAC-REG-2026-000120",
        filename="invoice.pdf",
        content_type="application/pdf",
        content=b"%PDF-example",
    )

    assert asset["provider"] == "r2"
    assert asset["bucket"] == "limac-warranty-bills"
    assert asset["object_key"] == "limac/warranty-bills/2026/08/LIMAC-REG-2026-000120-103045.pdf"
    assert asset["filename"] == "invoice.pdf"
    assert asset["content_type"] == "application/pdf"
    assert asset["format"] == "pdf"
    assert asset["bytes"] == len(b"%PDF-example")
    assert asset["etag"] == "etag-value"
    assert client.put_kwargs["ContentType"] == "application/pdf"


@pytest.mark.asyncio
async def test_download_bill_routes_r2_assets(monkeypatch) -> None:
    client = FakeR2Client()
    monkeypatch.setattr(r2_storage, "_client", lambda _settings: client)

    content, content_type, filename = await bill_storage.download_bill(
        fake_settings(),
        {
            "provider": "r2",
            "bucket": "limac-warranty-bills",
            "object_key": "limac/warranty-bills/2026/08/example.pdf",
            "filename": "example.pdf",
        },
    )

    assert content == b"pdf-bytes"
    assert content_type == "application/pdf"
    assert filename == "example.pdf"
    assert client.get_kwargs == {
        "Bucket": "limac-warranty-bills",
        "Key": "limac/warranty-bills/2026/08/example.pdf",
    }


@pytest.mark.asyncio
async def test_upload_bill_uses_configured_r2_provider(monkeypatch) -> None:
    async def fake_r2_upload(**kwargs):
        return {"provider": "r2", "filename": kwargs["filename"]}

    monkeypatch.setattr(bill_storage, "upload_bill_to_r2", fake_r2_upload)

    asset = await bill_storage.upload_bill(
        settings=fake_settings(bill_storage_provider="r2"),
        reference="LIMAC-REG-2026-000120",
        filename="invoice.png",
        content_type="image/png",
        content=b"png",
    )

    assert asset == {"provider": "r2", "filename": "invoice.png"}


def test_r2_bill_access_returns_presigned_url(monkeypatch) -> None:
    client = FakeR2Client()
    monkeypatch.setattr(r2_storage, "_client", lambda _settings: client)

    result = r2_storage.build_r2_bill_access(
        fake_settings(),
        {
            "provider": "r2",
            "bucket": "limac-warranty-bills",
            "object_key": "limac/warranty-bills/2026/08/example.pdf",
            "filename": "example.pdf",
            "content_type": "application/pdf",
        },
    )

    assert result["filename"] == "example.pdf"
    assert result["content_type"] == "application/pdf"
    assert result["url"].endswith("example.pdf?ttl=300")
